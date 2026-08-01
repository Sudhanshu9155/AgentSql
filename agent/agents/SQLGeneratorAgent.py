import re
from engine.BaseAgent import BaseAgent
from engine.DecisionLogic import DecisionLogic, DecisionType
from llm.OllamaClient import OllamaClient
from llm.PromptBuilder import PromptBuilder
from tools.SchemaReader import SchemaReader


class SQLGeneratorAgent(BaseAgent):
    """
    Converts a natural language question into a SQL SELECT query.
    Uses the PromptBuilder to create a context-aware prompt with schema,
    then calls Ollama to generate the SQL.
    Falls back to a safe default if Ollama is unavailable.
    """

    def __init__(self):
        super().__init__('SQLGeneratorAgent')
        self.decision_logic = DecisionLogic()
        self.llm_client = OllamaClient()
        self.prompt_builder = PromptBuilder()
        self.schema_reader = SchemaReader()

    def run(self, context):
        # Skip SQL generation if planner says not needed
        if context.metadata.get('skip_sql'):
            context.metadata['sql'] = None
            return context

        question = context.user_question
        schema = context.schema

        # Build simplified schema for prompt (column names only)
        simple_schema = self.schema_reader.get_column_names_only(schema) if schema else {}

        # Check if Ollama is available
        if not self.llm_client.is_available():
            # Fallback: use rule-based simple query
            sql = self._rule_based_fallback(question, simple_schema)
            context.metadata['sql'] = sql
            context.metadata['decision'] = DecisionType.RULE_BASED
            return context

        # Build the prompt and call Ollama
        try:
            prompt = self.prompt_builder.build_sql_prompt(question, simple_schema)
            raw_response = self.llm_client.generate(prompt)
            sql = self._extract_sql(raw_response)
            context.metadata['sql'] = sql
            context.metadata['decision'] = DecisionType.LOCAL_LLM
        except RuntimeError as e:
            # Ollama call failed — fall back to rule-based
            sql = self._rule_based_fallback(question, simple_schema)
            context.metadata['sql'] = sql
            context.metadata['decision'] = DecisionType.RULE_BASED
            context.metadata['llm_error'] = str(e)

        return context

    def _extract_sql(self, raw: str) -> str:
        """
        Extract the SQL query from the LLM response.
        Handles markdown code fences and extra explanation text.
        """
        raw = raw.strip()

        # Remove markdown code fences: ```sql ... ``` or ``` ... ```
        raw = re.sub(r'```(?:sql)?\s*', '', raw, flags=re.IGNORECASE)
        raw = re.sub(r'```', '', raw)

        # Try to find the SELECT statement
        match = re.search(r'(SELECT\s.+?;?)\s*$', raw, re.IGNORECASE | re.DOTALL)
        if match:
            sql = match.group(1).strip()
            if not sql.endswith(';'):
                sql += ';'
            return sql

        # Return cleaned text as-is if no SELECT found
        return raw.strip() or 'SELECT 1;'

    def _find_best_table(self, question_lower: str, schema: dict) -> str | None:
        """
        Find the best matching table for the question using fuzzy singular/plural matching.
        Priority:
          1. Exact match  (lost_persons  in question)
          2. Singular match  (lost_person → lost_persons)
          3. Plural match  (lost_persons → lost_person)
          4. Partial word match  (person → lost_persons)
        """
        # 1. Exact table name in question
        for table in schema:
            if table.lower() in question_lower:
                return table

        # 2 & 3. Singular ↔ plural variants
        for table in schema:
            tl = table.lower()
            # question has singular form of the table (e.g. "lost_person" for "lost_persons")
            singular = tl.rstrip('s')           # lost_persons → lost_person
            if singular and singular in question_lower:
                return table
            # question has plural form but table is singular
            plural = tl + 's'                   # lost_person → lost_persons
            if plural in question_lower:
                return table

        # 4. Any word in the question matches any part of a table name
        question_words = re.split(r'[\s_]+', question_lower)
        for table in schema:
            tl = table.lower()
            for word in question_words:
                if len(word) >= 4 and (word in tl or tl in word):
                    return table

        return None

    def _rule_based_fallback(self, question: str, schema: dict) -> str:
        """Generate a basic SQL query without LLM when Ollama is unavailable."""
        question_lower = question.lower()

        # Find the most relevant table using fuzzy matching
        target_table = self._find_best_table(question_lower, schema)

        if not target_table and schema:
            target_table = next(iter(schema))  # First table as default

        if not target_table:
            return "SELECT 'No database schema available' AS message;"

        # Build a reasonable query based on keywords
        if 'count' in question_lower or 'how many' in question_lower:
            return f'SELECT COUNT(*) AS total FROM `{target_table}` LIMIT 1;'

        cols = schema.get(target_table, [])
        
        # Check if specific columns were requested
        requested_cols = []
        for col in cols:
            if col.lower() in question_lower:
                requested_cols.append(f"`{col}`")
        
        select_clause = ", ".join(requested_cols) if requested_cols else "*"

        if 'top' in question_lower or 'highest' in question_lower or 'most' in question_lower:
            order_col = next((c for c in cols if any(
                k in c.lower() for k in ['amount', 'total', 'price', 'revenue', 'salary', 'value']
            )), cols[-1] if cols else '1')
            return f'SELECT {select_clause} FROM `{target_table}` ORDER BY `{order_col}` DESC LIMIT 10;'

        return f'SELECT {select_clause} FROM `{target_table}` LIMIT 50;'
