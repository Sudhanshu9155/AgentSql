import mysql.connector


class SchemaReader:
    """
    Connects to a user's MySQL database and discovers its full schema:
    tables, columns, data types, primary keys, and foreign keys.
    """

    def read(self, connection: dict) -> dict:
        """
        Read the full schema from the connected MySQL database.

        Args:
            connection: dict with keys: host, port, user, password, database

        Returns:
            dict mapping table_name -> list of column info dicts
            Example:
            {
                "customers": [
                    {"name": "id", "type": "int", "primary_key": True},
                    {"name": "email", "type": "varchar(255)", "primary_key": False},
                ],
                "orders": [...]
            }
        """
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

            # Step 1: Get all table names
            cursor.execute('SHOW TABLES')
            tables = [row[0] for row in cursor.fetchall()]

            schema = {}

            # Step 2: For each table, get column details
            for table in tables:
                cursor.execute(f'DESCRIBE `{table}`')
                rows = cursor.fetchall()
                # DESCRIBE returns: (Field, Type, Null, Key, Default, Extra)
                columns = []
                for row in rows:
                    columns.append({
                        'name': row[0],
                        'type': row[1],
                        'nullable': row[2] == 'YES',
                        'primary_key': row[3] == 'PRI',
                        'default': row[4],
                    })
                schema[table] = columns

            # Step 3: Also get foreign key relationships
            fk_query = """
                SELECT
                    TABLE_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE
                    REFERENCED_TABLE_SCHEMA = %s
                    AND REFERENCED_TABLE_NAME IS NOT NULL
            """
            cursor.execute(fk_query, (connection.get('database'),))
            fk_rows = cursor.fetchall()

            # Attach FK info to columns
            for table_name, col_name, ref_table, ref_col in fk_rows:
                if table_name in schema:
                    for col in schema[table_name]:
                        if col['name'] == col_name:
                            col['foreign_key'] = f'{ref_table}.{ref_col}'

            cursor.close()
            return schema

        except mysql.connector.Error as e:
            raise ConnectionError(f'MySQL connection failed: {str(e)}')
        finally:
            if conn and conn.is_connected():
                conn.close()

    def get_column_names_only(self, schema: dict) -> dict:
        """
        Returns a simplified schema with only column names (for prompt building).
        { "table_name": ["col1", "col2", ...] }
        """
        simple = {}
        for table, columns in schema.items():
            if isinstance(columns, list) and columns and isinstance(columns[0], dict):
                simple[table] = [col['name'] for col in columns]
            else:
                simple[table] = columns
        return simple
