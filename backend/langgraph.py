import requests
import json
import os
import secrets
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
    Generate the second system message: each character's modern background.
    Expects game_config_data dictionary read from static/json/game_config.json.

    Returns a system message dict with role/content suitable for LangGraph.
    """
    if not isinstance(game_config_data, dict):
        return {"role": "system", "content": "Character background unavailable (invalid game config)."}

    # Helper to safely extract fields
    def safe(v, key, default=""):
        return v.get(key, default) if isinstance(v, dict) else default

    messages = []
    user = safe(game_config_data, "user", None)
    players = safe(game_config_data, "players", [])

    # Describe user first
    if user:
        name = safe(user, "name", "Unknown")
        age = safe(user, "age", "")
        gender = safe(user, "gender", "")
        eth = safe(user, "ethnicity", "")
        prof = safe(user, "profession", "")
        langs = safe(user, "native_languages", [])
        items = safe(user, "items_carried", "")
        phys = safe(user, "physical_description", "")
        mbti = safe(user, "personality_traits", {}).get("mbti", "")

        user_desc = f"First, there was {name}."
        # Age/profession/personality
        details = []
        if age:
            details.append(f"{age} years old")
        if gender:
            details.append(gender)
        if eth:
            details.append(f"({eth})")
        if prof:
            details.append(f"works as {prof}")
        if mbti:
            details.append(f"personality: {mbti}")

        if details:
            user_desc += " " + ", ".join(details) + "."
        # Languages
        if langs:
            user_desc += f" They speak {', '.join(langs)}."
        # Items and physical
        if items:
            user_desc += f" On an ordinary day they carry: {items}."
        if phys:
            user_desc += f" Physically: {phys}."
        messages.append(user_desc)
    else:
        messages.append("First, there was an unnamed protagonist whose modern life is not recorded.")

    # Then other players
    if players and isinstance(players, list):
        for idx, p in enumerate(players):
            # Skip if this entry is actually the user (some clients include user as first)
            name = safe(p, "name", f"Player {idx+1}")
            age = safe(p, "age", "")
            gender = safe(p, "gender", "")
            eth = safe(p, "ethnicity", "")
            prof = safe(p, "profession", "")
            langs = safe(p, "native_languages", [])
            items = safe(p, "items_carried", "")
            phys = safe(p, "physical_description", "")
            mbti = safe(p, "personality_traits", {}).get("mbti", "")
            relation = safe(p, "relationship", "")

            part = f"Then there was {name}."
            details = []
            if age:
                details.append(f"{age} years old")
            if gender:
                details.append(gender)
            if eth:
                details.append(f"({eth})")
            if prof:
                details.append(f"works as {prof}")
            if mbti:
                details.append(f"personality: {mbti}")

            if details:
                part += " " + ", ".join(details) + "."

            if relation:
                part += f" Relationship to the protagonist: {relation}."

            if langs:
                part += f" They speak {', '.join(langs)}."
            if items:
                part += f" Their everyday items include: {items}."
            if phys:
                part += f" Physically: {phys}."

            messages.append(part)
    else:
        # No additional players
        pass

    # Join into a flowing system message
    content = " ".join(messages)
    header = (
        "You are initializing character backgrounds for a newly-arrived time-travel scenario. "
        "Describe each person's ordinary modern life in a natural, immersive way, integrating profession, "
        "personality, items they carry, and physical appearance as context for how they might behave and be perceived."
    )
    final = header + "\n\n" + content
    return {"role": "system", "content": final}


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
    Generate the third system message: arrival event, immediate setting, and cliffhanger.
    Requires civilization data from civ_catalog_filtered.json and the resolved year.
    """
    # Attempt to load civilization entry
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
            print(f"Error loading civ catalog for arrival scenario: {e}")
            civ_entry = None

    # Build narrative
    header = "You are now presented with the sudden arrival scenario."
    parts = [header]

    # Posthuman intervention framing
    parts.append(
        "Without warning, the world as you know it collapses into a pinpoint of sensation. "
        "A cold, impossible clarity — the handiwork of intelligences beyond human comprehension — "
        "presses the present thin and threads of reality unwind."
    )

    # Location / civ description
    if civ_entry:
        region = civ_entry.get("region", "an unspecified region")
        notes = civ_entry.get("notes", "")
        start_year = civ_entry.get("start_year")
        end_year = civ_entry.get("end_year")
        parts.append(
            f"You find yourselves deposited within the bounds of {civ_name}, in {region}. "
            f"Historical records indicate this civilization spanned approximately {start_year} to {end_year}."
        )
        if notes:
            parts.append(f"Local notes: {notes}")
    else:
        parts.append("You find yourselves in a place whose historical background is unclear from available records.")

    # Characters and items integration
    # Reuse character backgrounds for phrasing
    char_msg = generate_character_backgrounds(game_config_data).get("content", "")
    if char_msg:
        parts.append("Moments before, each of you had been living your modern life. " + 
                     "In your pockets and bags were the ordinary items of that life. These objects are now anomalies in the new time.")
    else:
        parts.append("Your modern identities and belongings blur into the scene; details are sketchy.")

    # Immediate setting detail using resolved_year
    if resolved_year:
        parts.append(f"The year is approximately {resolved_year}. The surroundings bear the hallmarks of a time not your own.")
    else:
        parts.append("The exact year is unclear; records and the environment send mixed signals.")

    # Describe locals' likely perception using physical descriptions
    # Pull physical descriptions from game_config_data
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
        parts.append("How you appear:\n" + " ".join(visible_notes))

    # Incorporate items as plot hooks
    item_notes = []
    for idx, c in enumerate(all_chars):
        name = c.get("name", f"Character{idx+1}")
        items = c.get("items_carried", "")
        if items:
            # keep it brief
            sample = items.split(",")[0] if "," in items else (items.split(".")[0] if "." in items else items)
            item_notes.append(f"{name} still has {sample.strip()} on them.")
    if item_notes:
        parts.append("Notable items (now conspicuous): " + " ".join(item_notes))

    # Cliffhanger ending ~compelling, invites user response
    cliff = (
        "A thin, insectile voice seems to come from everywhere and nowhere: 'Observation logged. Continue.' "
        "Before you can reply, a distant bell — metallic, not of this world — tolls. "
        "Shouts and the sound of hurried footsteps are coming from beyond a low stone wall nearby. "
        "Something runs past you into the crowd and the locals suddenly turn. You have seconds to choose: "
        "move toward shelter, try to communicate, or investigate the disturbance. The decision is yours."
    )
    parts.append(cliff)

    # Combine and constrain length to ~300-400 words: we'll allow the text to be verbose but keep it reasonably sized
    content = "\n\n".join(parts)

    # Final system message
    return {"role": "system", "content": content}


# -----------------------------
# LLM query function (integrated)
# -----------------------------
def query_llm(messages: list[dict]) -> str | None:
    """
    Queries the OpenRouter LLM with the given conversation history using the main model.
    This function will prepend the three-section beginning storyline system messages when
    the conversation appears to be at the start (message count <= 2).
    Messages should be in the format: [{"role": "user", "content": "..."}]
    """
    config = load_llm_config()
    if not config:
        return "Error: LLM configuration not loaded."

    api_key = config.get("api_key")
    main_model = config.get("main_model")

    if not api_key or not main_model:
        return "Error: API key or main model not found in LLM config."

    # If beginning of conversation, add the three system messages
    # Determine message count (count user+assistant messages)
    convo_len = len(messages) if isinstance(messages, list) else 0
    system_prepends = []
    try:
        if convo_len <= 2:
            # Section 1: posthuman premise (no data needed)
            system_prepends.append(generate_posthuman_premise())

            # Section 2: character backgrounds (requires game_config.json)
            try:
                with open(GAME_CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
                    game_cfg = json.load(f)
            except Exception:
                game_cfg = {}

            system_prepends.append(generate_character_backgrounds(game_cfg))

            # Section 3: resolve year & arrival scenario (requires civ catalog + game_config)
            resolved_year = resolve_selected_year(game_cfg) if isinstance(game_cfg, dict) else None
            system_prepends.append(generate_arrival_scenario(game_cfg, resolved_year))

    except Exception as e:
        # On any error building system messages, fall back to a minimal posthuman premise
        print(f"Error generating beginning storyline messages: {e}")
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
