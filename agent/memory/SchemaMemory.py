import time


class SchemaMemory:
    """
    In-process cache for database schemas.
    Schemas are stored by a cache key (e.g. "host:database") and
    expire after `ttl_seconds` to allow schema refresh.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self._cache: dict = {}       # key -> {'schema': dict, 'expires_at': float}
        self.ttl_seconds = ttl_seconds

    def _make_key(self, connection: dict) -> str:
        host = connection.get('host', 'localhost')
        database = connection.get('database', '')
        user = connection.get('user', '')
        return f'{user}@{host}/{database}'

    def get(self, connection: dict) -> dict | None:
        """Return cached schema if it exists and hasn't expired."""
        key = self._make_key(connection)
        entry = self._cache.get(key)
        if entry is None:
            return None
        if time.time() > entry['expires_at']:
            del self._cache[key]
            return None
        return entry['schema']

    def add(self, connection: dict, schema: dict) -> None:
        """Store a schema with an expiry timestamp."""
        key = self._make_key(connection)
        self._cache[key] = {
            'schema': schema,
            'expires_at': time.time() + self.ttl_seconds,
        }

    def invalidate(self, connection: dict) -> None:
        """Force schema refresh for a specific connection."""
        key = self._make_key(connection)
        self._cache.pop(key, None)

    def clear_all(self) -> None:
        """Clear entire cache."""
        self._cache.clear()

    # Keep backward-compatible method signature
    def add_by_name(self, name: str, schema: dict) -> None:
        self._cache[name] = {'schema': schema, 'expires_at': float('inf')}
