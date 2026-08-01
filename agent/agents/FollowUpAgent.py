from engine.BaseAgent import BaseAgent
from llm.OllamaClient import OllamaClient
from llm.PromptBuilder import PromptBuilder


class FollowUpAgent(BaseAgent):
    """
    Suggests 3 intelligent follow-up questions the user might want to ask next.
    """

    def __init__(self):
        super().__init__('FollowUpAgent')
        self.llm_client = OllamaClient()
        self.prompt_builder = PromptBuilder()

    def run(self, context):
        rows = context.metadata.get('rows', [])
        analysis = context.metadata.get('analysis', '')
        question = context.user_question

        if not rows:
            context.metadata['followups'] = []
            return context

        if self.llm_client.is_available():
            try:
                prompt = self.prompt_builder.build_followup_prompt(question, analysis)
                response = self.llm_client.generate(prompt)
                followups = [q.strip() for q in response.strip().split('\n') if q.strip()][:3]
                context.metadata['followups'] = followups
                return context
            except Exception:
                pass

        # Fallback: generate follow-ups based on question keywords
        context.metadata['followups'] = self._default_followups(question)
        return context

    def _default_followups(self, question: str) -> list:
        question_lower = question.lower()
        if 'top' in question_lower or 'highest' in question_lower:
            return [
                'What are the bottom performers in the same category?',
                'How does this compare to the previous period?',
                'What factors contributed to the top results?',
            ]
        if 'revenue' in question_lower or 'sales' in question_lower:
            return [
                'Which product category generates the most revenue?',
                'What is the monthly revenue trend for this year?',
                'Which region has the highest sales volume?',
            ]
        if 'customer' in question_lower:
            return [
                'Which customers have placed the most orders?',
                'What is the average order value per customer?',
                'Which customers have been inactive for 30+ days?',
            ]
        return [
            'Can you show me a trend over time for this data?',
            'What are the top 5 results in this category?',
            'How does this compare to the overall average?',
        ]
