from engine.BaseAgent import BaseAgent


INTENT_KEYWORDS = {
    'sql_generation': [
        'show', 'list', 'find', 'get', 'fetch', 'display', 'give me',
        'what', 'which', 'how many', 'count', 'total', 'sum', 'average',
        'top', 'bottom', 'highest', 'lowest', 'most', 'least',
        'between', 'where', 'filter', 'group', 'sort', 'order',
        'compare', 'revenue', 'sales', 'customers', 'orders', 'products',
    ],
    'schema_info': [
        'tables', 'columns', 'schema', 'structure', 'fields',
        'what tables', 'describe', 'database structure',
    ],
    'greeting': [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'help', 'start',
    ],
}


class IntentAgent(BaseAgent):
    """
    Detects the user's intent from their question.
    Classifies into: sql_generation | schema_info | greeting | unknown
    """

    def __init__(self):
        super().__init__('IntentAgent')

    def run(self, context):
        question = context.user_question.lower().strip()
        intent = self._classify(question)
        context.metadata['intent'] = intent
        return context

    def _classify(self, question: str) -> str:
        for intent, keywords in INTENT_KEYWORDS.items():
            if any(kw in question for kw in keywords):
                return intent
        # Default: assume they want SQL (most common case)
        return 'sql_generation'
