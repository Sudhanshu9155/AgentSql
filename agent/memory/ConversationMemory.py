class ConversationMemory:
    """
    Stores recent conversation turns (question + SQL + answer) per session.
    Used to provide multi-turn context to the LLM.
    """

    def __init__(self, max_turns: int = 10):
        self._history: list = []
        self.max_turns = max_turns

    def add(self, question: str, sql: str, answer: str) -> None:
        """Add a completed question-answer turn to memory."""
        self._history.append({
            'question': question,
            'sql': sql,
            'answer': answer,
        })
        # Keep only the most recent N turns
        if len(self._history) > self.max_turns:
            self._history = self._history[-self.max_turns:]

    def get_recent(self, n: int = 3) -> list:
        """Return the last N turns as context for the next prompt."""
        return self._history[-n:]

    def format_for_prompt(self, n: int = 3) -> str:
        """Return recent history formatted as a string for LLM prompts."""
        recent = self.get_recent(n)
        if not recent:
            return ''
        lines = ['RECENT CONVERSATION HISTORY:']
        for turn in recent:
            lines.append(f"  Q: {turn['question']}")
            lines.append(f"  SQL: {turn['sql']}")
            lines.append(f"  A: {turn['answer']}")
        return '\n'.join(lines)

    def clear(self) -> None:
        self._history.clear()
