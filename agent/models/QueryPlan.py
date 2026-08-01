from dataclasses import dataclass


@dataclass
class QueryPlan:
    sql: str
    explanation: str = ''
