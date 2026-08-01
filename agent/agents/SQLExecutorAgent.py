from engine.BaseAgent import BaseAgent
from tools.DatabaseTool import DatabaseTool


class SQLExecutorAgent(BaseAgent):
    """
    Executes the validated SQL query on the user's MySQL database.
    Stores column names and rows into the shared context for downstream agents.
    """

    def __init__(self):
        super().__init__('SQLExecutorAgent')
        self.db_tool = DatabaseTool()

    def run(self, context):
        sql = context.metadata.get('sql')
        is_valid = context.metadata.get('sql_valid', False)

        # Skip if SQL was not generated or failed validation
        if sql is None:
            context.metadata['rows'] = []
            context.metadata['columns'] = []
            return context

        if not is_valid:
            context.metadata['rows'] = []
            context.metadata['columns'] = []
            context.metadata['execution_error'] = context.metadata.get(
                'sql_error', 'SQL validation failed'
            )
            return context

        connection = context.connection
        if not connection:
            context.metadata['execution_error'] = 'No database connection in context'
            context.metadata['rows'] = []
            context.metadata['columns'] = []
            return context

        try:
            result = self.db_tool.run_query(sql, connection)
            context.metadata['rows'] = result['rows']
            context.metadata['columns'] = result['columns']
            context.metadata['row_count'] = result['row_count']
            context.metadata['truncated'] = result['truncated']
            context.metadata['executed'] = True
        except (ValueError, RuntimeError) as e:
            context.metadata['execution_error'] = str(e)
            context.metadata['rows'] = []
            context.metadata['columns'] = []
            context.metadata['executed'] = False

        return context
