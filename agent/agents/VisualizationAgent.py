from engine.BaseAgent import BaseAgent


class VisualizationAgent(BaseAgent):
    """
    Decides the best chart type for the query results and returns a
    chart configuration object that the frontend can render directly.
    """

    def __init__(self):
        super().__init__('VisualizationAgent')

    def run(self, context):
        rows = context.metadata.get('rows', [])
        columns = context.metadata.get('columns', [])

        if not rows or not columns:
            context.metadata['chart_config'] = None
            return context

        chart_config = self._decide_chart(rows, columns)
        context.metadata['chart_config'] = chart_config
        return context

    def _decide_chart(self, rows: list, columns: list) -> dict:
        """
        Decides the chart type based on data shape and column types.
        Returns a chart config that maps to Recharts component props.
        """
        num_cols = len(columns)
        num_rows = len(rows)

        # Categorize columns into label/numeric
        label_cols, numeric_cols = self._categorize_columns(rows, columns)

        if not label_cols or not numeric_cols:
            return self._table_only_config(rows, columns)

        label_col = label_cols[0]
        value_col = numeric_cols[0]

        # Labels (X-axis) — use first 20 rows for readability
        labels = [str(row[columns.index(label_col)]) for row in rows[:20]]
        values = []
        for row in rows[:20]:
            try:
                values.append(float(row[columns.index(value_col)]))
            except (ValueError, TypeError):
                values.append(0)

        # Decision rules for chart type
        if num_rows <= 6 and len(numeric_cols) == 1:
            chart_type = 'pie'
        elif any(kw in label_col.lower() for kw in ['date', 'month', 'year', 'time', 'week', 'day']):
            chart_type = 'line'
        elif len(numeric_cols) > 1:
            chart_type = 'bar'
        elif num_rows <= 15:
            chart_type = 'bar'
        else:
            chart_type = 'line'

        return {
            'type': chart_type,
            'title': f'{value_col} by {label_col}',
            'x_key': label_col,
            'y_key': value_col,
            'labels': labels,
            'values': values,
            'all_numeric_cols': numeric_cols,
            'data': [
                {col: row[columns.index(col)] if columns.index(col) < len(row) else None
                 for col in columns}
                for row in rows[:20]
            ],
        }

    def _categorize_columns(self, rows: list, columns: list):
        """Split columns into label (string) and numeric (number) groups."""
        label_cols = []
        numeric_cols = []
        for i, col in enumerate(columns):
            numeric_count = 0
            for row in rows[:10]:
                try:
                    float(row[i])
                    numeric_count += 1
                except (ValueError, TypeError, IndexError):
                    pass
            if numeric_count > len(rows[:10]) / 2:
                numeric_cols.append(col)
            else:
                label_cols.append(col)
        return label_cols, numeric_cols

    def _table_only_config(self, rows: list, columns: list) -> dict:
        """When chart isn't appropriate, return table-only config."""
        return {
            'type': 'table',
            'columns': columns,
            'data': rows[:50],
        }
