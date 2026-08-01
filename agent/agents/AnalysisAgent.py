from engine.BaseAgent import BaseAgent
from llm.OllamaClient import OllamaClient
from llm.PromptBuilder import PromptBuilder


class AnalysisAgent(BaseAgent):
    """
    Generates a plain-English business insight from query results.
    Uses Ollama if available, otherwise generates a simple statistical summary.
    """

    def __init__(self):
        super().__init__('AnalysisAgent')
        self.llm_client = OllamaClient()
        self.prompt_builder = PromptBuilder()

    def run(self, context):
        rows = context.metadata.get('rows', [])
        columns = context.metadata.get('columns', [])
        sql = context.metadata.get('sql', '')
        question = context.user_question
        intent = context.metadata.get('intent', 'sql_generation')

        if intent == 'greeting':
            context.metadata['analysis'] = "Hello! I'm AgentSQL. I can help you analyze your database using natural language. What would you like to know?"
            return context

        if intent == 'schema_info':
            tables = list(context.schema.keys()) if context.schema else []
            if tables:
                context.metadata['analysis'] = f"I found {len(tables)} table(s) in your database: {', '.join(tables)}. Feel free to ask me to analyze the data within them!"
            else:
                context.metadata['analysis'] = "I couldn't find any tables in the connected database. Please check your connection."
            return context

        if not rows:
            exec_error = context.metadata.get('execution_error')
            if exec_error:
                context.metadata['analysis'] = f'Query failed: {exec_error}'
            else:
                context.metadata['analysis'] = 'The query returned no results.'
            return context

        # Try LLM-based analysis if Ollama is available
        if self.llm_client.is_available():
            try:
                prompt = self.prompt_builder.build_analysis_prompt(question, sql, rows, columns)
                analysis = self.llm_client.generate(prompt)
                context.metadata['analysis'] = analysis.strip()
                return context
            except Exception:
                pass  # Fall through to statistical summary

        # Fallback: statistical summary
        context.metadata['analysis'] = self._statistical_summary(rows, columns, question)
        return context

    def _statistical_summary(self, rows: list, columns: list, question: str) -> str:
        """Generate a basic statistical summary without LLM."""
        row_count = len(rows)
        col_count = len(columns)

        summary_parts = [f'⚠️ Notice: AI engine (Ollama) is currently offline. Using basic rule-based fallback.\nFound {row_count} result{"s" if row_count != 1 else ""} with {col_count} column{"s" if col_count != 1 else ""}.']

        # Find numeric columns and compute basic stats
        numeric_stats = []
        for i, col in enumerate(columns):
            values = []
            for row in rows:
                try:
                    values.append(float(row[i]))
                except (ValueError, TypeError, IndexError):
                    pass
            if values:
                total = sum(values)
                avg = total / len(values)
                numeric_stats.append(f'{col}: total={total:,.2f}, avg={avg:,.2f}, max={max(values):,.2f}')

        if numeric_stats:
            summary_parts.append('Key metrics: ' + ' | '.join(numeric_stats[:3]))

        return ' '.join(summary_parts)
