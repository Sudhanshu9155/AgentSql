import mysql.connector
import sqlparse
from sqlparse.sql import Statement


# SQL keywords that are forbidden to prevent destructive operations
DANGEROUS_KEYWORDS = {
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
    'TRUNCATE', 'CREATE', 'REPLACE', 'GRANT', 'REVOKE',
    'EXEC', 'EXECUTE', 'CALL',
}


class DatabaseTool:
    """
    Executes validated SQL SELECT queries against a user's MySQL database.
    All non-SELECT queries are blocked before execution.
    """

    def validate_sql(self, sql: str) -> tuple[bool, str]:
        """
        Validates SQL for safety before execution.

        Returns:
            (is_valid: bool, error_message: str)
        """
        if not sql or not sql.strip():
            return False, 'SQL query is empty'

        try:
            parsed = sqlparse.parse(sql.strip())
            if not parsed:
                return False, 'Failed to parse SQL'

            statement: Statement = parsed[0]
            stmt_type = statement.get_type()

            # Only allow SELECT statements
            if stmt_type != 'SELECT':
                return False, (
                    f'Only SELECT queries are allowed. '
                    f'Got: {stmt_type or "unknown"}. '
                    f'AgentSQL does not allow data modification.'
                )

            # Secondary check — scan for dangerous keywords in raw SQL
            upper_sql = sql.upper()
            for keyword in DANGEROUS_KEYWORDS:
                if f' {keyword} ' in f' {upper_sql} ':
                    return False, f'Forbidden keyword detected: {keyword}'

            return True, ''

        except Exception as e:
            return False, f'SQL validation error: {str(e)}'

    def run_query(self, sql: str, connection: dict, max_rows: int = 1000) -> dict:
        """
        Executes a validated SQL SELECT query on the user's MySQL database.

        Args:
            sql: The SQL SELECT query to run
            connection: dict with keys: host, port, user, password, database
            max_rows: Maximum number of rows to return (safety limit)

        Returns:
            {
                'sql': str,
                'columns': list[str],
                'rows': list[list],
                'row_count': int,
                'truncated': bool,
            }
        """
        # Validate before executing
        is_valid, error_msg = self.validate_sql(sql)
        if not is_valid:
            raise ValueError(f'SQL validation failed: {error_msg}')

        conn = None
        try:
            conn = mysql.connector.connect(
                host=connection.get('host', 'localhost'),
                port=int(connection.get('port', 3306)),
                user=connection.get('user', ''),
                password=connection.get('password', ''),
                database=connection.get('database', ''),
                connect_timeout=10,
            )
            cursor = conn.cursor()

            # Execute query with row limit injection for safety
            safe_sql = self._inject_limit(sql, max_rows)
            cursor.execute(safe_sql)

            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            all_rows = cursor.fetchall()

            # Convert to serializable lists (handles Decimal, datetime, etc.)
            serialized_rows = [
                [self._serialize(cell) for cell in row]
                for row in all_rows
            ]

            cursor.close()

            return {
                'sql': sql,
                'columns': columns,
                'rows': serialized_rows,
                'row_count': len(serialized_rows),
                'truncated': len(all_rows) >= max_rows,
            }

        except mysql.connector.Error as e:
            raise RuntimeError(f'Query execution failed: {str(e)}')
        finally:
            if conn and conn.is_connected():
                conn.close()

    def _inject_limit(self, sql: str, max_rows: int) -> str:
        """Add LIMIT clause if not already present."""
        stripped = sql.strip().rstrip(';')
        if 'LIMIT' not in stripped.upper():
            return f'{stripped} LIMIT {max_rows}'
        return stripped

    def _serialize(self, value):
        """Convert non-JSON-serializable types to strings."""
        import decimal
        import datetime
        if isinstance(value, decimal.Decimal):
            return float(value)
        if isinstance(value, (datetime.date, datetime.datetime)):
            return str(value)
        if isinstance(value, bytes):
            return value.decode('utf-8', errors='replace')
        return value
