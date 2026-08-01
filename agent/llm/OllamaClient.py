import requests
import json


class OllamaClient:
    """
    HTTP client for the local Ollama LLM server.
    Ollama must be running at the configured base_url.
    Default model: codellama (good for SQL generation).
    """

    def __init__(
        self,
        base_url: str = 'http://localhost:11434',
        model: str = 'codellama',
        timeout: int = 120,
    ):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.timeout = timeout

    def generate(self, prompt: str) -> str:
        """
        Send a prompt to Ollama and return the generated text.
        Uses the /api/generate endpoint with streaming disabled.
        """
        url = f'{self.base_url}/api/generate'
        payload = {
            'model': self.model,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': 0.1,    # Low temperature = more deterministic SQL
                'num_predict': 512,    # Max tokens in response
            },
        }

        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data.get('response', '').strip()
        except requests.exceptions.ConnectionError:
            raise RuntimeError(
                'Cannot connect to Ollama. Make sure Ollama is running: '
                'https://ollama.ai — then run: ollama pull codellama'
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f'Ollama request timed out after {self.timeout}s. '
                'Try a smaller model or increase timeout.'
            )
        except Exception as e:
            raise RuntimeError(f'Ollama error: {str(e)}')

    def is_available(self) -> bool:
        """Check if Ollama server is reachable."""
        try:
            response = requests.get(f'{self.base_url}/api/tags', timeout=3)
            return response.status_code == 200
        except Exception:
            return False
