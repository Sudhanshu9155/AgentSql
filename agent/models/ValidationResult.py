from dataclasses import dataclass


@dataclass
class ValidationResult:
    is_valid: bool = True
    message: str = 'ok'
