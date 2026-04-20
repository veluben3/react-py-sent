"""LangChain wrapper around Azure OpenAI.

Uses `AzureChatOpenAI` to send the user's content to an Azure-hosted chat
model and returns a reply capped at `settings.max_response_words` words.
"""

import os
from functools import lru_cache

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import AzureChatOpenAI

from .config import settings

_CONFLICTING_ENV_VARS = (
    "OPENAI_API_BASE",
    "OPENAI_BASE_URL",
    "AZURE_OPENAI_API_BASE",
    "OPENAI_API_TYPE",
)


def _strip_conflicting_env_vars() -> None:
    """Remove env vars that clash with `azure_endpoint` in langchain-openai.

    When any of these are present, AzureChatOpenAI's validator raises:
        "Azure endpoints should be specified via the `azure_endpoint` param
         not `openai_api_base`".
    We unset them so our explicit kwargs always win.
    """
    for var in _CONFLICTING_ENV_VARS:
        os.environ.pop(var, None)


@lru_cache(maxsize=1)
def _get_client() -> AzureChatOpenAI:
    if not settings.azure_openai_configured:
        raise RuntimeError(
            "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, "
            "AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT in Backend/.env."
        )

    _strip_conflicting_env_vars()

    return AzureChatOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        azure_deployment=settings.azure_openai_deployment,
        api_version=settings.azure_openai_api_version,
        temperature=0.3,
        max_tokens=600,
        timeout=60,
    )


def _trim_to_word_limit(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words]).rstrip(",.;:") + "…"


def generate_reply(content: str) -> str:
    """Send ``content`` to Azure OpenAI and return a reply ≤ max_response_words."""
    client = _get_client()
    max_words = settings.max_response_words

    system_prompt = (
        "You are a helpful assistant. Read the user's content, detect its "
        "overall sentiment (positive, negative, neutral, mixed, excited, sad, "
        "angry, hopeful, etc.), and write a clear, useful response.\n\n"
        "Emoji rules (MANDATORY):\n"
        "- Weave in emojis that match the detected sentiment and subject.\n"
        "- Positive/excited → 😊🎉✨🙌💪🌟 | Negative/sad → 😔💔😢🥀 | "
        "Angry/frustrated → 😠😤🔥 | Neutral/informational → 🙂📘💡🧭 | "
        "Hopeful → 🌱🌤️🤞 | Success → ✅🏆 | Warning/risk → ⚠️🚧.\n"
        "- Begin the reply with ONE emoji that captures the overall sentiment.\n"
        "- Sprinkle 2–5 additional, contextually relevant emojis through the "
        "reply. Do not overuse them and never repeat the same emoji back-to-back.\n"
        "- Emojis must reinforce meaning, not replace words.\n\n"
        f"Your reply MUST be at most {max_words} words (emojis count as words). "
        "Do not exceed this limit under any circumstance. Prefer concise prose "
        "over lists unless a list is clearly more useful."
    )

    response = client.invoke(
        [
            SystemMessage(content=system_prompt),
            HumanMessage(content=content),
        ]
    )

    reply = response.content if isinstance(response.content, str) else str(response.content)
    return _trim_to_word_limit(reply, max_words)


def count_words(text: str) -> int:
    return len(text.split())
