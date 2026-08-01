class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, context):
        raise NotImplementedError
