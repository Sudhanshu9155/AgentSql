from engine.BaseAgent import BaseAgent
from tools.SchemaReader import SchemaReader
from memory.SchemaMemory import SchemaMemory

# Single shared cache across all requests (module-level singleton)
_schema_memory = SchemaMemory(ttl_seconds=3600)


class SchemaAgent(BaseAgent):
    """
    Discovers and caches the database schema from the user's MySQL connection.
    Uses SchemaMemory to avoid redundant SHOW TABLES calls.
    """

    def __init__(self):
        super().__init__('SchemaAgent')
        self.schema_reader = SchemaReader()

    def run(self, context):
        connection = context.connection

        if not connection or not connection.get('database'):
            context.metadata['schema_error'] = 'No database connection provided'
            context.schema = {}
            return context

        # Check cache first
        cached = _schema_memory.get(connection)
        if cached:
            context.schema = cached
            context.metadata['schema_source'] = 'cache'
            return context

        # Discover schema from MySQL
        try:
            full_schema = self.schema_reader.read(connection)
            _schema_memory.add(connection, full_schema)
            context.schema = full_schema
            context.metadata['schema_source'] = 'live'
        except ConnectionError as e:
            context.metadata['schema_error'] = str(e)
            context.schema = {}

        return context
