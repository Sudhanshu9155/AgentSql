from engine.BaseAgent import BaseAgent
from llm.OllamaClient import OllamaClient
from llm.PromptBuilder import PromptBuilder


class RecommendationAgent(BaseAgent):
    """
    Generates business recommendations based on query results and analysis.
    """

    def __init__(self):
        super().__init__('RecommendationAgent')
        self.llm_client = OllamaClient()
        self.prompt_builder = PromptBuilder()

    def run(self, context):
        rows = context.metadata.get('rows', [])
        analysis = context.metadata.get('analysis', '')
        question = context.user_question

        if not rows:
            context.metadata['recommendations'] = []
            return context

        if self.llm_client.is_available():
            try:
                prompt = (
                    f'Based on the user question: "{question}"\n'
                    f'And the analysis: "{analysis}"\n\n'
                    f'Provide exactly 3 short, actionable business recommendations (one per line, no numbering).'
                )
                response = self.llm_client.generate(prompt)
                recs = [r.strip() for r in response.strip().split('\n') if r.strip()][:3]
                context.metadata['recommendations'] = recs
                return context
            except Exception:
                pass

        # Fallback rule-based recommendations
        context.metadata['recommendations'] = self._default_recommendations(question)
        return context

    def _default_recommendations(self, question: str) -> list:
        question_lower = question.lower()
        if 'revenue' in question_lower or 'sales' in question_lower:
            return [
                'Focus on top-performing products to maximize revenue growth.',
                'Investigate underperforming segments for improvement opportunities.',
                'Consider seasonal trends when planning inventory and promotions.',
            ]
        if 'customer' in question_lower:
            return [
                'Prioritize retention strategies for your highest-value customers.',
                'Investigate churn patterns among low-activity customers.',
                'Use segmentation to personalize marketing campaigns.',
            ]
        return [
            'Review the results for any unexpected patterns or outliers.',
            'Compare current data with historical trends for context.',
            'Share these insights with relevant stakeholders for action planning.',
        ]
