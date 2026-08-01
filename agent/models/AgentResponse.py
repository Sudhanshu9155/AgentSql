from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class AgentResponse:
    answer: str = ''
    sql: str = ''
    metadata: Dict[str, Any] = field(default_factory=dict)
