from enum import Enum


class DecisionType(str, Enum):
    RULE_BASED = 'rule_based'
    LOCAL_LLM = 'local_llm'


class DecisionLogic:
    def decide(self, question: str) -> DecisionType:
        lowered = question.lower()
        if any(keyword in lowered for keyword in ['join', 'group by', 'window', 'cte']):
            return DecisionType.LOCAL_LLM
        return DecisionType.RULE_BASED
