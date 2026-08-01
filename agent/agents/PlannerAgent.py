from engine.BaseAgent import BaseAgent


class PlannerAgent(BaseAgent):
    """
    Creates a query execution plan based on the detected intent and schema.
    Decides whether the question needs:
    - A single table query
    - A multi-table JOIN
    - An aggregation (GROUP BY, COUNT, SUM, AVG)
    - A subquery or CTE
    - A schema description response (no SQL needed)
    """

    def __init__(self):
        super().__init__('PlannerAgent')

    def run(self, context):
        intent = context.metadata.get('intent', 'sql_generation')
        question = context.user_question.lower()
        schema = context.schema

        if intent == 'greeting':
            context.metadata['plan'] = 'greeting'
            context.metadata['skip_sql'] = True
            return context

        if intent == 'schema_info':
            context.metadata['plan'] = 'describe_schema'
            context.metadata['skip_sql'] = True
            return context

        # Determine query complexity for the SQL generator
        plan = {
            'type': 'select',
            'needs_join': self._needs_join(question, schema),
            'needs_aggregation': self._needs_aggregation(question),
            'needs_limit': self._needs_limit(question),
            'tables_mentioned': self._find_mentioned_tables(question, schema),
        }

        context.metadata['plan'] = plan
        context.metadata['skip_sql'] = False
        return context

    def _needs_join(self, question: str, schema: dict) -> bool:
        join_words = ['join', 'related', 'with their', 'and their', 'along with']
        if any(w in question for w in join_words):
            return True
        # If multiple tables are mentioned, likely needs a join
        tables_mentioned = self._find_mentioned_tables(question, schema)
        return len(tables_mentioned) > 1

    def _needs_aggregation(self, question: str) -> bool:
        agg_words = ['total', 'sum', 'count', 'average', 'avg', 'how many',
                     'maximum', 'minimum', 'max', 'min', 'group by', 'per']
        return any(w in question for w in agg_words)

    def _needs_limit(self, question: str) -> bool:
        limit_words = ['top', 'first', 'latest', 'recent', 'last', 'best', 'worst']
        return any(w in question for w in limit_words)

    def _find_mentioned_tables(self, question: str, schema: dict) -> list:
        return [table for table in schema.keys() if table.lower() in question]
