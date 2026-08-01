from engine.AgentContext import AgentContext
from agents.IntentAgent import IntentAgent
from agents.SchemaAgent import SchemaAgent
from agents.PlannerAgent import PlannerAgent
from agents.SQLGeneratorAgent import SQLGeneratorAgent
from agents.SQLValidatorAgent import SQLValidatorAgent
from agents.SQLExecutorAgent import SQLExecutorAgent
from agents.AnalysisAgent import AnalysisAgent
from agents.VisualizationAgent import VisualizationAgent
from agents.RecommendationAgent import RecommendationAgent
from agents.FollowUpAgent import FollowUpAgent


class AgentEngine:
    """
    Orchestrates the full multi-agent pipeline.
    Agents are instantiated once and reused across requests (they are stateless).
    Each agent receives the shared AgentContext and enriches it with its output.
    """

    def __init__(self):
        self.agents = [
            IntentAgent(),          # 1. Classify the user's intent
            SchemaAgent(),          # 2. Discover / load schema from MySQL
            PlannerAgent(),         # 3. Decide query type and strategy
            SQLGeneratorAgent(),    # 4. Generate SQL via Ollama or rule-based
            SQLValidatorAgent(),    # 5. Validate SQL for safety
            SQLExecutorAgent(),     # 6. Execute SQL on user's MySQL database
            AnalysisAgent(),        # 7. Generate business insight summary
            VisualizationAgent(),   # 8. Choose chart type and build chart config
            RecommendationAgent(),  # 9. Suggest business actions
            FollowUpAgent(),        # 10. Suggest follow-up questions
        ]

    def run(self, question: str, connection: dict = None) -> AgentContext:
        """
        Run the full pipeline for a given question and database connection.

        Args:
            question: User's natural language question
            connection: MySQL connection dict {host, port, user, password, database}

        Returns:
            Fully populated AgentContext with all agent results in metadata
        """
        context = AgentContext(
            user_question=question,
            connection=connection or {},
        )

        for agent in self.agents:
            try:
                context = agent.run(context)
            except Exception as e:
                # Log error but continue pipeline — agents should be resilient
                agent_name = getattr(agent, 'name', type(agent).__name__)
                context.metadata[f'{agent_name}_error'] = str(e)

        return context
