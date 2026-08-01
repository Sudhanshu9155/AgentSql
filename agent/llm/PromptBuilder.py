class PromptBuilder:
    """
    Builds structured prompts for the LLM that include the database schema
    and the user question, formatted for SQL generation.
    """

    def build_sql_prompt(self, question: str, schema: dict) -> str:
        """
        Build a prompt that gives the LLM full schema context.
        Returns a string ready to send to OllamaClient.generate().
        """
        schema_block = self._format_schema(schema)

        prompt = f"""You are AgentSQL, an expert SQL assistant.

TASK: Convert the user's natural language question into a valid MySQL SELECT query.

RULES:
- Only generate SELECT statements. Never use INSERT, UPDATE, DELETE, DROP, ALTER, or TRUNCATE.
- Always use proper table and column names EXACTLY as they appear in the schema provided.
- Add a LIMIT clause (default LIMIT 100) unless the user specifies otherwise.
- Return ONLY the SQL query — no explanation, no markdown, no code fences.
- If the question cannot be answered with the schema, return: SELECT 'Unable to answer this question with the available schema' AS message;
- IMPORTANT: The user may refer to a table using its singular form (e.g. "lost_person", "customer", "order").
  Always match to the correct table from the schema even if the user's word differs by a trailing 's'.
  For example, if the user says "lost_person" and the schema has "lost_persons", use "lost_persons".

DATABASE SCHEMA:
{schema_block}

USER QUESTION:
{question}

SQL QUERY:"""

        return prompt

    def build_analysis_prompt(self, question: str, sql: str, rows: list, columns: list) -> str:
        """Build a prompt for generating business insights from query results."""
        sample = rows[:5] if rows else []
        return f"""You are a business analyst. A user asked: "{question}"

The SQL query executed was:
{sql}

Results ({len(rows)} rows total, showing first {len(sample)}):
Columns: {columns}
Sample rows: {sample}

Provide a concise business insight (2-3 sentences) that:
1. Directly answers the user's question
2. Highlights the most important finding
3. Notes any trend or anomaly if visible

Business Insight:"""

    def build_followup_prompt(self, question: str, analysis: str) -> str:
        """Build a prompt to generate follow-up question suggestions."""
        return f"""A user asked: "{question}"
The analysis result was: "{analysis}"

Suggest exactly 3 natural follow-up questions the user might want to ask next.
Format: Return only the 3 questions, one per line, no numbering or bullets.

Follow-up Questions:"""

    def _format_schema(self, schema: dict) -> str:
        """Convert schema dict to a readable SQL-style table definition string."""
        if not schema:
            return '(No schema available — please connect a database first)'

        lines = []
        for table_name, columns in schema.items():
            col_list = ', '.join(columns) if isinstance(columns, list) else str(columns)
            lines.append(f'  Table `{table_name}`: ({col_list})')

        return '\n'.join(lines)
