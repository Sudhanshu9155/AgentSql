from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AgentContext:
    # The user's natural language question
    user_question: str = ''

    # MySQL connection details provided by the user
    connection: Dict[str, Any] = field(default_factory=dict)
    # e.g. { host, port, user, password, database }

    # Discovered database schema — populated by SchemaAgent
    schema: Dict[str, Any] = field(default_factory=dict)
    # e.g. { "users": ["id", "name", "email"], "orders": ["id", "user_id", "total"] }

    # Conversation history for multi-turn context
    history: List[Dict[str, Any]] = field(default_factory=list)

    # Shared scratchpad for all agents to read/write results
    metadata: Dict[str, Any] = field(default_factory=dict)
    # Keys written by each agent:
    # intent          -> IntentAgent
    # plan            -> PlannerAgent
    # sql             -> SQLGeneratorAgent
    # sql_valid       -> SQLValidatorAgent
    # sql_error       -> SQLValidatorAgent
    # rows            -> SQLExecutorAgent
    # columns         -> SQLExecutorAgent
    # analysis        -> AnalysisAgent
    # chart_config    -> VisualizationAgent
    # recommendations -> RecommendationAgent
    # followups       -> FollowUpAgent
    # decision        -> SQLGeneratorAgent (rule_based | local_llm)
