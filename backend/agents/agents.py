import os
import json
import re
import requests
from typing import List, Dict, Any, Optional

LLM_CONFIG_FILE_PATH = "static/json/llm_config.json"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

from backend.database.db_manager import ConversationManager
from prompts import HISTORY_VALIDATOR_SYS, HISTORY_VALIDATOR_USER

# Heuristic mapping of keywords -> earliest plausible year (CE). If estimated year is earlier, treat as likely anachronism.
_ANACHRONISM_THRESHOLDS = {
    "airplane": 1903,
    "radio": 1895,
    "tank": 1915,
    "rifle": 1600,
    "pistol": 1500,
    "musket": 1500,
    "machine gun": 1880,
    "telephone": 1876,
    "gun": 1300,
    "cannon": 1300,
    "clock": 1300,  # mechanical clocks ~13th century
    "zipper": 1893,
    "jeans": 1870,
    "denim": 1700,
    "steam engine": 1712,
    "photograph": 1826,
    "compass": 1100,  # rough; compass existed earlier in China but this is conservative
    "paper money": 800,
    # armor/armor types - conservative earliest plausible centuries
    "plate armor": 1300,
    "full plate": 1400,
    "chainmail": -1000,  # ancient, always ok
    "steel sword": -1000,  # ancient
}

# Suggestions for replacements when anachronistic term is found
_ALTERNATIVE_SUGGESTIONS = {
    "pistol": "describe a hand cannon or early arquebus, or avoid explicit firearm terminology",
    "musket": "describe an arquebus or hand-cannon depending on century, or avoid firearms",
    "rifle": "use matchlock/arquebus-like wording appropriate for the period",
    "airplane": "replace with birds, balloons, or omit",
    "radio": "describe messengers, signal fires, or early semaphore/telegraph (19thC+)",
    "tank": "describe siege engines or armored war wagons depending on period",
    "jeans": "use coarse woolen or linen trousers appropriate to the era",
    "zipper": "use buttons, laces, or toggles",
    "photograph": "replace with painted portraits or descriptions of artists"
}


def _load_llm_config() -> Dict[str, Any]:
    try:
        with open(LLM_CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _call_small_llm(messages: List[Dict[str, str]], max_tokens: int = 300, temperature: float = 0.0) -> Optional[str]:
    """
    Calls the configured small_model via OpenRouter-compatible API.
    Returns the assistant text on success, or None on failure.
    """
    cfg = _load_llm_config()
    api_key = cfg.get("api_key")
    small_model = cfg.get("small_model")
    if not api_key or not small_model:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": small_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }

    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def _search_duckduckgo_langchain(query: str) -> List[str]:
    """
    Attempt to use LangChain's DuckDuckGo search utility if available.
    Returns a list of text snippets (strings). If LangChain isn't available, returns empty list.
    """
    try:
        # LangChain wrapper name may vary by version; try common imports.
        try:
            from langchain.utilities import DuckDuckGoSearchAPIWrapper as DDGWrapper  # type: ignore
            ddg = DDGWrapper()
            res = ddg.run(query)  # typically returns text
            if isinstance(res, str):
                return [res]
            return []
        except Exception:
            # older/newer versions
            from langchain.utilities import DuckDuckGoSearch as DDG  # type: ignore
            ddg = DDG()
            res = ddg.run(query)
            if isinstance(res, str):
                return [res]
            return []
    except Exception:
        return []


def _search_duckduckgo_ddg_package(query: str, max_results: int = 3) -> List[str]:
    """
    Attempt to use duckduckgo_search.ddg if installed.
    Returns list of snippet strings.
    """
    try:
        from duckduckgo_search import ddg  # type: ignore
        results = ddg(query, max_results=max_results)
        snippets: List[str] = []
        if isinstance(results, list):
            for r in results[:max_results]:
                snippet_parts = []
                if isinstance(r, dict):
                    if r.get("title"):
                        snippet_parts.append(r.get("title"))
                    if r.get("body"):
                        snippet_parts.append(r.get("body"))
                    if r.get("snippet"):
                        snippet_parts.append(r.get("snippet"))
                else:
                    snippet_parts.append(str(r))
                snippets.append(" — ".join([p for p in snippet_parts if p]))
        return snippets
    except Exception:
        return []


def duckduckgo_search(query: str, max_results: int = 3) -> List[str]:
    """
    Unified search helper: try langchain first, then ddg package. Returns list of snippets (may be empty).
    """
    snippets = _search_duckduckgo_langchain(query)
    if snippets:
        return snippets
    snippets = _search_duckduckgo_ddg_package(query, max_results=max_results)
    return snippets


def _extract_candidate_terms(text: str) -> List[str]:
    """
    Lightweight heuristic to find candidate factual terms in narrative output:
    - look for known anachronism keywords
    - extract capitalized words (possible place names)
    - extract armor/clothing/weapon keywords
    """
    text_l = text.lower()
    candidates = set()

    # Check known anachronism keywords
    for kw in _ANACHRONISM_THRESHOLDS.keys():
        if kw in text_l:
            candidates.add(kw)

    # Weapon/clothing keywords
    extras = ["sword", "shield", "armor", "armor.", "helmet", "tunic", "cloak", "jeans", "boots"]
    for kw in extras:
        if kw in text_l:
            candidates.add(kw)

    # Place-name heuristics: find capitalized words of reasonable length
    caps = re.findall(r"\b([A-Z][a-z]{3,})\b", text)
    for c in caps:
        # filter out sentence-start words that are common (This, The, It, Long, Within, You, Having)
        if c.lower() in {"this", "the", "it", "long", "within", "you", "having", "return", "Ensure"}:
            continue
        candidates.add(c)

    return list(candidates)


def _year_from_iso_like(iso_str: str) -> Optional[int]:
    """
    Parse ISO-like estimated_date string; handles BCE negative years like '-0120-05-20'.
    Returns integer year (can be <= 0) or None.
    """
    if not iso_str:
        return None
    try:
        if iso_str.startswith("-"):
            year = int(iso_str[1:5])  # e.g., "-0120-05-20" -> 0120 -> -120
            return -year
        else:
            year = int(iso_str[0:4])
            return year
    except Exception:
        return None


def history_validator_agent(session_id: str, narrative_output: str, debug: bool = False) -> Dict[str, Any]:
    """
    Main entry for the historical accuracy agent.

    - Reads conversation history (ignores the first 3 records)
    - If fewer than 3 records present (after ignoring first 3), returns intervene: false
    - Gathers up to last 6 messages (excluding intros)
    - Extracts estimated_date from latest row
    - Performs targeted DuckDuckGo searches for candidate factual terms
    - Calls the configured small_model with HISTORY_VALIDATOR_SYS + HISTORY_VALIDATOR_USER including search snippets
    - Returns parsed JSON from LLM if available; otherwise returns heuristic JSON.

    Debug toggle:
    - When debug=True, the function appends a debug record to "test/debug.txt" containing:
      session id, narrative_output, the exact messages sent to the history-validator LLM,
      the validator LLM raw response, executed queries, and search snippets.
    """
    manager = ConversationManager()
    full_history = manager.load_conversation(session_id) or []

    # Must wait until at least 4 rows total exist (first 3 are canonical intro rows)
    if len(full_history) <= 3:
        return {"intervene": False, "suggestions": [], "reason": "", "queries": []}

    # Exclude the first three records
    non_intro = full_history[3:]
    last_six = non_intro[-6:]

    # Latest estimated_date: prefer the latest DB row overall if present
    latest_estimated_date = None
    if full_history:
        latest_estimated_date = full_history[-1].get("estimated_date")

    est_year = _year_from_iso_like(latest_estimated_date) if latest_estimated_date else None

    # Build candidate queries from narrative output
    terms = _extract_candidate_terms(narrative_output)
    queries = []
    snippets_accum: List[str] = []

    # For each term, craft a concise query
    for t in terms[:8]:  # limit queries to avoid too many searches
        # If term looks like a capitalized place name, craft a founded/existence query
        if re.match(r"^[A-Z][a-z]+$", t):
            q = f"Was {t} a settlement or did it exist in {est_year if est_year else ''}".strip()
        else:
            q = f"{t} historical use {est_year if est_year else ''}".strip()
        queries.append(q)
        snippets = duckduckgo_search(q, max_results=3)
        if snippets:
            # include top snippet as evidence
            snippets_accum.append(f"Query: {q}\nTop snippet: {snippets[0]}")
        else:
            snippets_accum.append(f"Query: {q}\nTop snippet: (no results)")

    # If no candidate queries were produced, add a generic one to gather context
    if not queries:
        q = f"Historical context {est_year if est_year else ''} clothing armor technology"
        queries.append(q)
        snippets = duckduckgo_search(q, max_results=3)
        if snippets:
            snippets_accum.append(f"Query: {q}\nTop snippet: {snippets[0]}")
        else:
            snippets_accum.append(f"Query: {q}\nTop snippet: (no results)")

    # Compose the LLM user prompt using prompts.HISTORY_VALIDATOR_USER
    conversation_formatted = "\n".join([f"{m['role']}: {m['content']}" for m in last_six])
    search_snippets_text = "\n\n".join(snippets_accum) if snippets_accum else ""

    user_prompt = HISTORY_VALIDATOR_USER.format(
        conversation_history=conversation_formatted,
        narrative_output=narrative_output,
        estimated_date=latest_estimated_date or "",
        search_snippets=search_snippets_text
    )

    # Call small-model LLM
    messages = [
        {"role": "system", "content": HISTORY_VALIDATOR_SYS},
        {"role": "user", "content": user_prompt}
    ]

    llm_response = _call_small_llm(messages, max_tokens=300, temperature=0.0)

    # If debugging is enabled, log the interaction to test/debug.txt
    if debug:
        try:
            os.makedirs("test", exist_ok=True)
            dbg_path = os.path.join("test", "debug.txt")
            with open(dbg_path, "a", encoding="utf-8") as df:
                df.write("=== HISTORY VALIDATOR INTERACTION ===\n")
                df.write(f"Session: {session_id}\n")
                df.write("NARRATIVE OUTPUT:\n")
                df.write(narrative_output + "\n\n")
                df.write("MESSAGES SENT TO HISTORY VALIDATOR LLM:\n")
                for m in messages:
                    role = m.get("role", "")
                    content = m.get("content", "")
                    # Truncate very long contents to keep debug file reasonable
                    if len(content) > 2000:
                        content = content[:2000] + "...[truncated]"
                    df.write(f"{role.upper()}:\n{content}\n\n")
                df.write("LLM RAW RESPONSE:\n")
                df.write((llm_response or "") + "\n\n")
                df.write("QUERIES EXECUTED:\n")
                for q in queries:
                    df.write(q + "\n")
                df.write("\nSEARCH SNIPPETS:\n")
                df.write(search_snippets_text + "\n")
                df.write("=== END ===\n\n")
        except Exception:
            # Do not let debug logging break the agent; ignore errors
            pass

    if llm_response:
        # Try to extract JSON from response
        try:
            # If the model wrapped the JSON in a code block, strip it
            cleaned = llm_response.strip()
            if cleaned.startswith("```"):
                # remove markdown fence
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            parsed = json.loads(cleaned)
            # Ensure schema keys exist
            parsed.setdefault("intervene", False)
            parsed.setdefault("suggestions", [])
            parsed.setdefault("reason", "")
            parsed.setdefault("queries", queries)
            return parsed
        except Exception:
            # Fall through to heuristic fallback
            pass

    # Heuristic fallback: if simple known anachronisms present, suggest replacements
    suggestions = []
    reason = ""
    intervene = False
    found_queries = []

    narrative_l = narrative_output.lower()
    for kw, threshold in _ANACHRONISM_THRESHOLDS.items():
        if kw in narrative_l and est_year is not None:
            # If estimated year is earlier (smaller) than threshold, flag it
            if est_year < threshold:
                intervene = True
                alt = _ALTERNATIVE_SUGGESTIONS.get(kw, f"Consider avoiding '{kw}' or reword to an earlier-appropriate equivalent.")
                suggestions.append(f"Replace or reword '{kw}': {alt}")
                found_queries.append(f"{kw} historical earliest use")
    if intervene:
        reason = "Found terms in narrative that are likely anachronistic for the estimated date."
    else:
        # If no clear anachronism found, return no intervention
        return {"intervene": False, "suggestions": [], "reason": "", "queries": queries}

    # Return heuristic JSON including the queries we executed
    return {
        "intervene": True,
        "suggestions": suggestions,
        "reason": reason,
        "queries": queries
    }
