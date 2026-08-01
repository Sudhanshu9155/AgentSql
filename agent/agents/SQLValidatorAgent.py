from engine.BaseAgent import BaseAgent
from tools.DatabaseTool import DatabaseTool


class SQLValidatorAgent(BaseAgent):
    """
    Validates the generated SQL before execution.
    Blocks all non-SELECT queries and SQL injection patterns.
    """

    def __init__(self):
        super().__init__('SQLValidatorAgent')
        self.db_tool = DatabaseTool()

    def run(self, context):
        sql = context.metadata.get('sql')

        # Nothing to validate if SQL was skipped
        if sql is None:
            context.metadata['sql_valid'] = True
            return context

        is_valid, error_msg = self.db_tool.validate_sql(sql)
        context.metadata['sql_valid'] = is_valid
        context.metadata['sql_error'] = error_msg if not is_valid else None

        return context
