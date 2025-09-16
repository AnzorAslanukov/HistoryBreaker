import requests
import json
import os
import secrets
import re
from typing import Optional, Tuple

# File paths
LLM_CONFIG_FILE_PATH = os.path.join(os.getcwd(), "static/json/llm_config.json")
GAME_CONFIG_FILE_PATH = os.path.join(os.getcwd(), "static/json/game_config.json")
CIV_CATALOG_PATH = os.path.join(os.getcwd(), "static/json/civ_catalog_filtered.json")

def load_llm_config():
    """
    Loads the LLM configuration from llm_config.json.
    """
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: LLM configuration file not found at {LLM_CONFIG_FILE_PATH}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {LLM_CONFIG_FILE_PATH}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred while loading LLM config: {e}")
        return None

# -----------------------------
# Beginning Storyline - Section 1
# -----------------------------
def generate_posthuman_premise() -> dict:
    """
    Returns the first system message containing the posthuman backstory.
    This is a static, explanatory but ominous narrative establishing
    the involuntary nature of the time travel event.
    """
    from prompts import POSTHUMAN_PREMISE_TEXT

    # Ensure we return a message formatted for LangGraph (role + content)
    return {"role": "system", "content": POSTHUMAN_PREMISE_TEXT}


# -----------------------------
# Beginning Storyline - Section 2
# -----------------------------
def generate_character_backgrounds(game_config_data: dict) -> dict:
    """
    Generate the second system message: each character's modern background using the LLM.
    This will call the helper/small model with CHARACTER_BACKGROUND_SYS (from prompts.py)
    and a user message that contains the JSON-like character records extracted from game_config_data.

    Returns a system message dict with role/content suitable for LangGraph.
    """
    from prompts import CHARACTER_BACKGROUND_SYS

    # Validate input
    if not isinstance(game_config_data, dict):
        return {"role": "system", "content": "Character background unavailable (invalid game config)."}

    # Prepare payload data: include 'user' and 'players' keys (even if empty)
    payload_data = {
        "user": game_config_data.get("user", {}),
        "players": game_config_data.get("players", []) or []
    }

    # Load LLM config to get small/helper model and API key
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
        api_key = cfg.get("api_key")
        main_model = cfg.get("main_model")
    except Exception:
        api_key = None
        main_model = None

    # If we don't have an API key or model, fall back to local generation (safe fallback)
    if not api_key or not main_model:
        # Simple fallback: convert payload_data into readable prose (concise)
        pieces = []
        user = payload_data["user"]
        if user:
            name = user.get("name", "Unknown")
            prof = user.get("profession", "")
            items = user.get("items_carried", "")
            phys = user.get("physical_description", "")
            pieces.append(f"{name} lived a modern life; {prof or 'their work is not recorded'}. They carried {items}." if items else f"{name} lived a modern life; {prof or 'their work is not recorded'}.")
            if phys:
                pieces.append(f"Physically: {phys}.")
        for p in payload_data["players"]:
            pname = p.get("name", "Player")
            relation = p.get("relationship", "")
            prof = p.get("profession", "")
            items = p.get("items_carried", "")
            phys = p.get("physical_description", "")
            rel_text = f" Relationship: {relation}." if relation else ""
            pieces.append(f"{pname} ({prof or 'profession unknown'}){rel_text} They carried {items}." if items else f"{pname} ({prof or 'profession unknown'}).")
            if phys:
                pieces.append(f"Physically: {phys}.")
        content = " ".join(pieces).strip()
        return {"role": "system", "content": content if content else "No character data available."}

    # Build messages for OpenRouter
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # The user message will contain a compact JSON representation of the characters
    user_message = "CHARACTERS_JSON:\n" + json.dumps(payload_data, ensure_ascii=False, indent=2)

    payload = {
        "model": main_model,
        "messages": [
            {"role": "system", "content": CHARACTER_BACKGROUND_SYS},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 600
    }

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        resp.raise_for_status()
        result = resp.json()
        generated = result["choices"][0]["message"]["content"].strip()
        # Return as a single system message content (polished by LLM)
        return {"role": "system", "content": generated}
    except Exception as e:
        # On error, fallback to a compact local summary
        try:
            pieces = []
            user = payload_data["user"]
            if user:
                name = user.get("name", "Unknown")
                prof = user.get("profession", "")
                items = user.get("items_carried", "")
                phys = user.get("physical_description", "")
                pieces.append(f"{name} lived a modern life; {prof or 'their work is not recorded'}. They carried {items}." if items else f"{name} lived a modern life; {prof or 'their work is not recorded'}.")
                if phys:
                    pieces.append(f"Physically: {phys}.")
            for p in payload_data["players"]:
                pname = p.get("name", "Player")
                relation = p.get("relationship", "")
                prof = p.get("profession", "")
                items = p.get("items_carried", "")
                phys = p.get("physical_description", "")
                rel_text = f" Relationship: {relation}." if relation else ""
                pieces.append(f"{pname} ({prof or 'profession unknown'}){rel_text} They carried {items}." if items else f"{pname} ({prof or 'profession unknown'}).")
                if phys:
                    pieces.append(f"Physically: {phys}.")
            content = " ".join(pieces).strip()
            return {"role": "system", "content": content if content else "No character data available."}
        except Exception:
            return {"role": "system", "content": "Character background unavailable due to an internal error."}


# -----------------------------
# Beginning Storyline - Section 3
# -----------------------------
def resolve_selected_year(game_config_data: dict) -> Optional[int]:
    """
    Resolve the actual in-world year to use based on game_config_data.
    Uses civ_catalog_filtered.json when selected_start_year == "random".
    Returns an integer year or None on failure.
    """
    try:
        sel = game_config_data.get("selected_start_year")
    except Exception:
        return None

    # If explicit year provided (and not 'random'), attempt to parse int
    if isinstance(sel, (int, float)) or (isinstance(sel, str) and sel.isdigit()):
        try:
            return int(sel)
        except Exception:
            pass

    if sel != "random":
        # Not random and not parseable -> return None
        return None

    # For 'random' selection, load civilization info
    civ_name = game_config_data.get("civilization")
    if not civ_name:
        return None

    try:
        with open(CIV_CATALOG_PATH, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
    except Exception as e:
        print(f"Error loading civ catalog: {e}")
        return None

    # We expect catalog to be a list or dict containing entries with "name", "start_year", "end_year"
    entries = []
    if isinstance(catalog, list):
        entries = catalog
    elif isinstance(catalog, dict):
        # If it's keyed, gather values
        entries = list(catalog.values())
    else:
        return None

    # Find exact match by name
    match = None
    for e in entries:
        if not isinstance(e, dict):
            continue
        # exact string match required per spec
        if e.get("name") == civ_name:
            match = e
            break

    if not match:
        print(f"Civilization '{civ_name}' not found in catalog.")
        return None

    try:
        start = int(match.get("start_year"))
        end = int(match.get("end_year"))
    except Exception:
        # Fall back: if start/end not present, attempt to use 'year' field or notes
        try:
            year = int(match.get("year"))
            return year
        except Exception:
            return None

    if end < start:
        # swap if malformed
        start, end = end, start

    # Use secure random to pick a year between start and end inclusive.
    span = end - start + 1
    if span <= 0:
        return start
    # secrets.randbelow(span) gives 0..span-1
    offset = secrets.randbelow(span)
    return start + offset


def generate_arrival_scenario(game_config_data: dict, resolved_year: Optional[int]) -> dict:
    """
    Generate the third system message by delegating to the main LLM using ARRIVAL_SCENARIO_SYS.
    The function passes structured context (game_config, civ_entry, resolved_year) to the LLM and
    returns the LLM-crafted immersive arrival scene. Falls back to a Python-generated scene on error.
    """
    from prompts import ARRIVAL_SCENARIO_SYS

    # Locate civ_entry (same logic as before)
    civ_name = game_config_data.get("civilization") if isinstance(game_config_data, dict) else None
    civ_entry = None
    if civ_name:
        try:
            with open(CIV_CATALOG_PATH, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
            entries = catalog if isinstance(catalog, list) else list(catalog.values())
            for e in entries:
                if isinstance(e, dict) and e.get("name") == civ_name:
                    civ_entry = e
                    break
        except Exception as e:
            civ_entry = None

    # Prepare structured context for LLM
    context = {
        "game_config": game_config_data or {},
        "civilization": civ_entry or {},
        "resolved_year": resolved_year
    }

    # Load LLM config for main model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
        api_key = cfg.get("api_key")
        main_model = cfg.get("main_model")
    except Exception:
        api_key = None
        main_model = None

    if api_key and main_model:
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        user_message = "ARRIVAL_CONTEXT_JSON:\n" + json.dumps(context, ensure_ascii=False, indent=2)
        payload = {
            "model": main_model,
            "messages": [
                {"role": "system", "content": ARRIVAL_SCENARIO_SYS},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 600
        }
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions",
                              headers=headers, json=payload, timeout=45)
            r.raise_for_status()
            generated = r.json()["choices"][0]["message"]["content"].strip()
            return {"role": "system", "content": generated}
        except Exception:
            # fall through to fallback below
            pass

    # Fallback: Python-generated arrival scene (simpler)
    header = "You are now presented with the sudden arrival scenario."
    parts = [header]
    parts.append(
        "Without warning, the world as you know it collapses into a pinpoint of sensation. A cold, impossible clarity presses the present thin."
    )
    if civ_entry:
        region = civ_entry.get("region", "an unspecified region")
        start_year = civ_entry.get("start_year")
        end_year = civ_entry.get("end_year")
        parts.append(f"You find yourselves deposited within the bounds of {civ_name}, in {region}.")
        if start_year and end_year:
            parts.append(f"This civilization appears to span approximately {start_year}–{end_year}.")
    else:
        parts.append("You find yourselves in a place whose historical background is unclear from available records.")
    user = game_config_data.get("user", {}) if isinstance(game_config_data, dict) else {}
    players = game_config_data.get("players", []) if isinstance(game_config_data, dict) else []
    all_chars = [user] + players if user else players
    visible_notes = []
    for idx, c in enumerate(all_chars):
        name = c.get("name", f"Character{idx+1}")
        phys = c.get("physical_description", "")
        if phys:
            visible_notes.append(f"{name} appears {phys.split('.')[0]}.")
    if visible_notes:
        parts.append("How you appear: " + " ".join(visible_notes))
    if resolved_year:
        parts.append(f"The year is approximately {resolved_year}.")
    parts.append("Notable items stick out against unfamiliar cloth and stone; they mark you as impossible ghosts here.")
    cliff = "A distant bell tolls; someone screams; the world inclines. You must act."
    parts.append(cliff)
    content = "\n\n".join(parts)
    return {"role": "system", "content": content}


# -----------------------------
# Helper: world-state summary builder
# -----------------------------
def build_world_state_summary_from_messages(messages: list[dict]) -> str | None:
    """
    Build a concise, human-friendly one-line world-state summary from the provided
    conversation messages (prefers the arrival scenario system message when available).

    This avoids re-reading game_config.json and uses the persisted conversation history
    as the primary source of truth.
    """
    try:
        if not isinstance(messages, list):
            return None
        system_msgs = [m.get("content") for m in messages if isinstance(m, dict) and m.get("role") == "system" and isinstance(m.get("content"), str)]
        if not system_msgs:
            return None
        # Prefer the third system message (arrival scenario) if present
        arrival = system_msgs[2] if len(system_msgs) >= 3 else system_msgs[-1]
        summary = re.sub(r"\s+", " ", arrival).strip()
        # Keep it short
        return summary[:400] + ("..." if len(summary) > 400 else "")
    except Exception:
        return None

# -----------------------------
# LLM query function (integrated)
# -----------------------------
def query_llm(messages: list[dict]) -> str | None:
    """
    Queries the OpenRouter LLM with the given conversation history using the main model.

    Behavior changes:
    - For the initial conversation (convo_len <= 2) the original three system messages
      (posthuman premise, character backgrounds, arrival scenario) are still generated.
    - For ongoing conversations (convo_len > 2), do NOT re-read or pass raw game_config.json.
      Instead prepend a concise STORYLINE_CONTINUITY_SYS system prompt to guide the narrative LLM.
    - This reduces excessive repetition of raw config fields and steers the model to use
      the conversation history as the primary source of truth.
    """
    config = load_llm_config()
    if not config:
        return "Error: LLM configuration not loaded."

    api_key = config.get("api_key")
    main_model = config.get("main_model")

    if not api_key or not main_model:
        return "Error: API key or main model not found in LLM config."

    # Determine message count (count user+assistant messages)
    convo_len = len(messages) if isinstance(messages, list) else 0
    system_prepends = []
    try:
        if convo_len <= 2:
            # Beginning of conversation: preserve original three system messages
            system_prepends.append(generate_posthuman_premise())

            # Character backgrounds (requires game_config.json)
            try:
                with open(GAME_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
                    game_cfg = json.load(f)
            except Exception:
                game_cfg = {}

            system_prepends.append(generate_character_backgrounds(game_cfg))

            # Arrival scenario (requires civ catalog + game_config)
            resolved_year = resolve_selected_year(game_cfg) if isinstance(game_cfg, dict) else None
            system_prepends.append(generate_arrival_scenario(game_cfg, resolved_year))
        else:
            # Ongoing conversation: do NOT re-include raw game_config.json.
            # Instead prepend a concise continuity system prompt that instructs the narrative model
            # to use the persisted conversation history and previously established facts.
            try:
                from prompts import STORYLINE_CONTINUITY_SYS
                system_prepends.append({"role": "system", "content": STORYLINE_CONTINUITY_SYS})
            except Exception:
                # Fallback to a minimal continuity instruction if the constant isn't present.
                system_prepends.append({"role": "system", "content": "You are the game's narrative engine. Use only the conversation history and previously established in-world facts to continue the story. Do not reference internal config files or raw JSON data."})

            # Provide the narrative model with a single informational scene date (if available)
            # extracted from the provided conversation messages. This is strictly for awareness:
            # the model should not treat the date as a main storyline element, only as an indicator
            # of elapsed time since the arrival scenario.
            try:
                scene_date = None
                if isinstance(messages, list):
                    # Prefer the most recent non-empty estimated_date field from message dicts
                    for m in reversed(messages):
                        if isinstance(m, dict) and m.get("estimated_date"):
                            sd = m.get("estimated_date")
                            if isinstance(sd, str) and sd.strip() != "":
                                scene_date = sd.strip()
                                break
                if scene_date:
                    date_hint = (
                        f"SCENE_DATE (informational): {scene_date}. "
                        "This is provided only to indicate how much time has elapsed since arrival; "
                        "do not make the date a central plot element or repeat it as a focal detail."
                    )
                    system_prepends.append({"role": "system", "content": date_hint})
            except Exception:
                # If anything goes wrong extracting the date, silently continue without it.
                pass
    except Exception as e:
        # On any unexpected error, fall back to a minimal posthuman premise
        print(f"Error building system messages for query_llm: {e}")
        system_prepends = [generate_posthuman_premise()]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Format messages: prepend system messages, then the provided conversation
    formatted_messages = []
    for s in system_prepends:
        if isinstance(s, dict) and s.get("content"):
            formatted_messages.append({"role": "system", "content": s["content"]})
    # Append original messages ensuring valid shape
    for msg in messages:
        role = msg.get("role", "user") if isinstance(msg, dict) else "user"
        content = msg.get("content", "") if isinstance(msg, dict) else str(msg)
        formatted_messages.append({"role": role, "content": content})

    payload = {
        "model": main_model,
        "messages": formatted_messages,
        "max_tokens": 800  # allow longer narrative generation if needed
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status() # Raise an exception for HTTP errors

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    except requests.exceptions.RequestException as e:
        return f"Error querying LLM: {e}"
    except KeyError:
        return "Error: Unexpected response format from LLM."
    except Exception as e:
        return f"An unexpected error occurred: {e}"


if __name__ == "__main__":
    print("This module provides LangGraph helper functions and a stateful query wrapper.")
