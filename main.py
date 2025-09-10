from flask import (Flask, 
                   render_template, 
                   request, 
                   redirect, 
                   url_for, 
                   session, 
                   jsonify)
from flask_socketio import SocketIO, send
from datetime import date as dt_date
import psycopg2
from psycopg2.extras import RealDictCursor 
import requests
import os
import pycountry
import json
from pathlib import Path  # Import Path from pathlib

from prompts import *
from backend.agents.basic_nodes import display_openrouter_balance, get_safety_level, get_perceived_time_of_day, get_environment_accuracy_modifier, get_location_terrain_category, get_temperature, count_tokens, get_total_input_tokens, get_total_output_tokens, get_tesa_indicator # Import token counters and TESA
from backend.langgraph import query_llm # Import query_llm
from backend.database.db_manager import ConversationManager # Import ConversationManager
import uuid # Import uuid for session IDs

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)
app.secret_key = 'your_super_secret_key'  # Required for session management
socketio = SocketIO(app)
CONFIG_FILE = os.path.join(os.getcwd(), "static/json/llm_config.json")
GAME_CONFIG_FILE = Path(os.path.join(os.getcwd(), "static/json/game_config.json"))  # New config file (changed to Path object)

SAVES_DIR = os.path.join(os.getcwd(), "saves")

PG = dict(dbname="roleplay_db", user="rp_user", password="rp_pass",
          host="localhost", port=5432)

# ---------------------------------------------------
#  Validate an OpenRouter API key once and cache later
# ---------------------------------------------------
@app.post("/api/test_key")
def api_test_key():
    """
    Body  { api_key: str }
    Returns { valid: bool }
    """
    api_key = (request.get_json(silent=True) or {}).get("api_key", "").strip()
    if not api_key:
        return jsonify({"valid": False}), 400
    try:
        	# quick validity probe
            meta = requests.get(
                "https://openrouter.ai/api/v1/key",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=8,
            )
            if meta.status_code != 200:
                return jsonify({"valid": False})

            # fetch balance
            bal = requests.get(
                "https://openrouter.ai/api/v1/credits",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=8,
            )
            credits = None
            if bal.status_code == 200:
                d = bal.json().get("data", {})
                credits = round(d.get("total_credits", 0.0) - d.get("total_usage", 0.0), 2)
                return jsonify({"valid": True, "balance": credits})
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)})

@app.post("/api/test_model")
def api_test_model():
    """
    Body  { api_key: str, model: str }
    Returns { valid: bool }
    """
    data = request.get_json(silent=True) or {}
    api_key = data.get("api_key", "").strip()
    model   = data.get("model", "").strip()

    if not api_key or not model:
        return jsonify({"valid": False}), 400

    try:
        resp = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        models = {m["id"] for m in resp.json().get("data", [])}
        return jsonify({"valid": model in models})
    except Exception:
        return jsonify({"valid": False})
    
@app.post("/api/validate_name")
def api_validate_name():
    """
    Body  { "name": "<user text>" }
    Uses the helper model to answer 'accept' or 'reject'.
    Returns { valid: bool }
    """
    name = (request.get_json(silent=True) or {}).get("name", "").strip()
    if not name:
        return jsonify({"valid": False}), 400

    # ---- load key + helper model ----
    cfg = load_llm_config() or {}
    api_key     = cfg.get("api_key", "").strip()
    helper_model= cfg.get("small_model", "").strip()
    if not api_key or not helper_model:
        return jsonify({"valid": False, "error": "LLM config missing"}), 500

    sys_prompt = NAME_VALIDATOR_SYS

    user_prompt = NAME_VALIDATOR_USER.format(name=name)

    # ---- call OpenRouter ----
    import requests, time
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": helper_model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        "max_tokens": 1
    }

    for _ in range(3):                 # retry up to 3×
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=20
            )
            r.raise_for_status()
            answer = r.json()["choices"][0]["message"]["content"].strip().lower()
            answer = answer.replace("\n", "").replace(" ", "")
            if answer in ("accept", "reject"):
                return jsonify({"valid": answer == "accept"})
        except Exception:
            time.sleep(1)

    return jsonify({"valid": False})

@app.post("/api/validate_profession")
def api_validate_profession():
    """
    Body  { "profession": "<user text>" }
    Returns { valid: bool }
    """
    prof = (request.get_json(silent=True) or {}).get("profession", "").strip()
    if not prof:
        return jsonify({"valid": False}), 400

    cfg = load_llm_config() or {}
    api_key     = cfg.get("api_key", "").strip()
    helper_model= cfg.get("small_model", "").strip()
    if not api_key or not helper_model:
        return jsonify({"valid": False}), 500

    sys_prompt  = PROF_VALIDATOR_SYS
    user_prompt = PROF_VALIDATOR_USER.format(profession=prof)

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": helper_model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        "max_tokens": 1
    }

    import time
    for _ in range(3):
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=20
            )
            r.raise_for_status()
            ans = r.json()["choices"][0]["message"]["content"].strip().lower()
            ans = ans.replace("\n", "").replace(" ", "")
            if ans in ("accept", "reject"):
                return jsonify({"valid": ans == "accept"})
        except Exception:
            time.sleep(1)

    return jsonify({"valid": False})

@app.post("/api/validate_items")
def api_validate_items():
    txt = (request.get_json(silent=True) or {}).get("items", "").strip()
    if not txt:
        return jsonify({"valid": False}), 400

    cfg = load_llm_config() or {}
    api_key, helper = cfg.get("api_key", ""), cfg.get("small_model", "")
    if not api_key or not helper:
        return jsonify({"valid": False}), 500

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": helper,
        "messages": [
            {"role": "system", "content": ITEMS_VALIDATOR_SYS},
            {"role": "user",   "content": ITEMS_VALIDATOR_USER.format(items=txt)}
        ],
        "max_tokens": 1
    }

    import time, requests
    for _ in range(3):
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=20
            )
            r.raise_for_status()
            ans = r.json()["choices"][0]["message"]["content"].strip().lower()
            ans = ans.replace(" ", "").replace("\n", "")
            if ans in ("accept", "reject"):
                return jsonify({"valid": ans == "accept"})
        except Exception:
            time.sleep(1)

    return jsonify({"valid": False})

@app.post("/api/validate_description")
def api_validate_description():
    txt = (request.get_json(silent=True) or {}).get("description", "").strip()
    if not txt:
        return jsonify({"valid": False}), 400

    cfg = load_llm_config() or {}
    api_key, helper = cfg.get("api_key", ""), cfg.get("small_model", "")
    if not api_key or not helper:
        return jsonify({"valid": False}), 500

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": helper,
        "messages": [
            {"role": "system", "content": DESCRIPTION_VALIDATOR_SYS},
            {"role": "user",   "content": DESCRIPTION_VALIDATOR_USER.format(description=txt)}
        ],
        "max_tokens": 1
    }

    import requests, time
    for _ in range(3):
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=20
            )
            r.raise_for_status()
            ans = r.json()["choices"][0]["message"]["content"].strip().lower()
            ans = ans.replace(" ", "").replace("\n", "")
            if ans in ("accept", "reject"):
                return jsonify({"valid": ans == "accept"})
        except Exception:
            time.sleep(1)

    return jsonify({"valid": False})

@app.route("/")
def index():
    # Check if there are any files in the saves folder
    has_saves = any(os.scandir(SAVES_DIR))
    return render_template("index.html", has_saves=has_saves)

@app.route("/start", methods=["GET"])
def start_new_game():
    """Landing-page 'New Game' button → llm_setup.html."""
    return render_template("llm_setup.html")

@app.route("/start_personal", methods=["GET", "POST"])
def start_personal():
    if request.method == "POST":
        # Parse form and store in session for later DB insertion
        players = []
        for i in range(1, 5):
            prefix = f"player_{i - 1}_name"
            if prefix in request.form:
                player = {
                    "name": request.form[f"player_{i - 1}_name"],
                    "age": int(request.form.get(f"player_{i - 1}_age", 0)),
                    "gender": request.form.get(f"player_{i - 1}_gender", ""),
                    "ethnicity": request.form.get(f"player_{i - 1}_ethnicity", ""),
                    "native_languages": request.form.getlist(f"player_{i - 1}_native_languages"),
                    "profession": request.form.get(f"player_{i - 1}_profession", ""),
                    "items_carried": [item.strip() for item in request.form.get(f"player_{i - 1}_items_carried", "").split(",") if item.strip()],
                    "physical_description": request.form.get(f"player_{i - 1}_physical_description", ""),
                    "personality_traits": {
                        "mbti": (
                            request.form.get(f"player_{i - 1}_mbti_ie", "") +
                            request.form.get(f"player_{i - 1}_mbti_sn", "") +
                            request.form.get(f"player_{i - 1}_mbti_tf", "") +
                            request.form.get(f"player_{i - 1}_mbti_jp", "")
                        )
                    }
                }
                players.append(player)
        session["players"] = players
        return redirect(url_for("start_region"))

    all_languages = sorted({lang.name for lang in pycountry.languages if hasattr(lang, "name")})
    return render_template("start_personal.html", all_languages=all_languages)

@app.route("/llm_setup", methods=["GET"])
def llm_setup():
    """Show the simple LLM-config page (no save logic yet)."""
    return render_template("llm_setup.html")

@app.route("/start_region", methods=["GET", "POST"])
def start_region():
    # Load region data
    region_data_path = os.path.join(app.static_folder, 'json/region_data.json')
    with open(region_data_path, 'r') as f:
        region_data = json.load(f)
    
    continent_data = region_data.get('continent_data_flat', {})
    
    if request.method == "POST":
        selected_region = request.form.get("selected_region")
        if selected_region:
            # Store selected region in session
            session["selected_region"] = selected_region
            # For now, just show a confirmation
            return f"<h1>Region selected: {selected_region}</h1>"
    
    return render_template("start_region.html", continent_data=continent_data)

@app.route("/civ_lookup", methods=["GET"])
def civ_lookup():
    return render_template("civ_lookup.html")

@app.route('/gameplay', methods=['GET', 'POST'])
def gameplay():
    # Generate a unique session ID for the game if not already present
    if 'game_session_id' not in session:
        session['game_session_id'] = str(uuid.uuid4())
    
    current_session_id = session['game_session_id']

    if request.method == 'POST':
        # Process data from civ_lookup form
        selected_civ_name = request.form.get('selected_civ_name')
        final_game_start_year = request.form.get('final_game_start_year') # actual year or 'random'
        
        # Update game_config.json
        game_config = {}
        if GAME_CONFIG_FILE.exists():
            with open(GAME_CONFIG_FILE, 'r', encoding='utf-8') as f:
                try:
                    game_config = json.load(f)
                except json.JSONDecodeError:
                    # If file is empty or malformed, start with an empty config
                    pass 
        
        game_config['civilization'] = selected_civ_name
        game_config['selected_start_year'] = final_game_start_year
        # You can add other submitted fields to game_config if needed for gameplay.html
        # For example:
        # game_config['original_civ_start_year'] = request.form.get('selected_civ_start_year')
        # game_config['original_civ_end_year'] = request.form.get('selected_civ_end_year')
        # game_config['use_custom_start_year'] = request.form.get('use_custom_start_year_toggle') == 'true'

        try:
            # Ensure the directory for game_config.json exists
            GAME_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(GAME_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(game_config, f, indent=2)
        except Exception as e:
            # Log the error and decide how to handle it (e.g., flash message, redirect)
            app.logger.error(f"Error saving game_config.json: {e}")
            # For now, we'll proceed to render gameplay.html, but you might want robust error handling
            pass

    # For both GET requests and after POST processing, render gameplay.html
    # The conversation history will be loaded dynamically via a separate API call.
    return render_template('gameplay.html', session_id=current_session_id)

@app.route('/api/get_conversation_history', methods=['GET'])
def get_conversation_history():
    """
    Fetches the conversation history for the current session ID.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    history = conversation_manager.load_conversation(session_id)
    return jsonify(history)

@app.route('/api/get_safety_level', methods=['GET'])
def api_get_safety_level():
    """
    Analyzes the conversation history and returns the current safety level.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    conversation_history = conversation_manager.load_conversation(session_id)
    
    safety_level = get_safety_level(conversation_history)
    return jsonify(safety_level=safety_level)

@app.route('/api/get_perceived_time_of_day', methods=['GET'])
def api_get_perceived_time_of_day():
    """
    Analyzes the conversation history and returns the perceived time of day.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    conversation_history = conversation_manager.load_conversation(session_id)
    
    # Ensure there's a conversation to analyze
    if not conversation_history:
        return jsonify(perceived_time_of_day=13) # Default to unknown

    perceived_time_of_day = get_perceived_time_of_day(conversation_history)
    return jsonify(perceived_time_of_day=perceived_time_of_day)

@app.route('/api/get_environment_accuracy_modifier', methods=['GET'])
def api_get_environment_accuracy_modifier():
    """
    Analyzes the conversation history and returns the environment accuracy modifier.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    conversation_history = conversation_manager.load_conversation(session_id)
    
    # Ensure there's a conversation to analyze
    if not conversation_history:
        return jsonify(environment_accuracy_modifier=5) # Default to Indoors/Dark

    environment_accuracy_modifier = get_environment_accuracy_modifier(conversation_history)
    return jsonify(environment_accuracy_modifier=environment_accuracy_modifier)

@app.route('/api/get_location_terrain_category', methods=['GET'])
def api_get_location_terrain_category():
    """
    Analyzes the conversation history and returns the location/terrain category.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    conversation_history = conversation_manager.load_conversation(session_id)
    
    # Ensure there's a conversation to analyze
    if not conversation_history:
        return jsonify(location_terrain_category=19) # Default to Unknown/Obscured

    location_terrain_category = get_location_terrain_category(conversation_history)
    return jsonify(location_terrain_category=location_terrain_category)

@app.route('/api/get_temperature', methods=['GET'])
def api_get_temperature():
    """
    Analyzes the conversation history and returns the perceived temperature.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    conversation_history = conversation_manager.load_conversation(session_id)
    
    temperature = get_temperature(conversation_history)
    return jsonify(temperature=temperature)

@app.route('/api/get_total_input_tokens', methods=['GET'])
def api_get_total_input_tokens():
    """
    Retrieves the total input tokens for the current session.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    total_input_tokens = get_total_input_tokens(session_id)
    return jsonify(total_input_tokens=total_input_tokens)

@app.route('/api/get_total_output_tokens', methods=['GET'])
def api_get_total_output_tokens():
    """
    Retrieves the total output tokens for the current session.
    """
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    total_output_tokens = get_total_output_tokens(session_id)
    return jsonify(total_output_tokens=total_output_tokens)

@app.post("/api/save_llm_config")
def api_save_llm_config():
    """
    Body  { api_key:str, small_model:str, main_model:str }
    Simply writes the JSON file on disk (no encryption for now).
    """
    data = request.get_json(silent=True) or {}
    required = ("api_key", "small_model", "main_model")
    if not all(k in data and data[k].strip() for k in required):
        return jsonify({"saved": False, "error": "Missing fields"}), 400

    # Persist to file so any later Python module can open it
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return jsonify({"saved": True})

@app.post("/api/delete_llm_config")
def api_delete_llm_config():
    """
    Deletes llm_config.json (if it exists).
    Front-end calls this when the user clicks “Clear Saved Settings”.
    """
    try:
        if os.path.exists(CONFIG_FILE):
            os.remove(CONFIG_FILE)
        return jsonify({"deleted": True})
    except Exception as exc:
        return jsonify({"deleted": False, "error": str(exc)}), 500
    
@app.post("/api/generate_job_title")
def api_generate_job_title():
    data = request.get_json(silent=True) or {}
    age     = data.get("age")
    gender  = data.get("gender", "")
    role    = data.get("role_type", "")
    if age is None or not role:
        return jsonify({"title": ""}), 400

    cfg = load_llm_config() or {}
    api_key  = cfg.get("api_key", "")
    helper   = cfg.get("small_model", "")
    if not api_key or not helper:
        return jsonify({"title": ""}), 500

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": helper,
        "messages": [
            {"role": "system", "content": JOB_TITLE_GENERATOR_SYS},
            {"role": "user",
             "content": JOB_TITLE_GENERATOR_USER.format(age=age, gender=gender, role_type=role)}
        ],
        "max_tokens": 16
    }

    import requests, time
    for _ in range(3):
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions",
                               headers=headers, json=payload, timeout=20)
            r.raise_for_status()
            title = r.json()["choices"][0]["message"]["content"].strip()
            if 0 < len(title) <= 128:
                return jsonify({"title": title})
        except Exception:
            time.sleep(1)
    return jsonify({"title": ""})

@app.post("/api/generate_items")
def api_generate_items():
    data = request.get_json(silent=True) or {}
    age, gender, job = data.get("age"), data.get("gender", ""), data.get("job", "")
    date = dt_date.today()
    cfg = load_llm_config() or {}
    api_key, model = cfg.get("api_key", ""), cfg.get("small_model", "")
    if age is None or not api_key or not model:
        return jsonify({"items": ""}), 400

    import requests, time
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    sys_prompt  = ITEMS_GENERATOR_SYS_PROMPT.format(age=age, gender=gender, job=job, date=date)
    user_prompt = ITEMS_GENERATOR_USER_PROMPT
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        "max_tokens": 400   # ~2000 characters
    }

    for _ in range(3):
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions",
                               headers=headers, json=payload, timeout=30)
            r.raise_for_status()
            text = r.json()["choices"][0]["message"]["content"].strip()
            if 20 <= len(text) <= 2000:
                return jsonify({"items": text})
        except Exception:
            time.sleep(1)

    return jsonify({"items": ""})

@app.post("/api/generate_description")
def api_generate_description():
    d = request.get_json(silent=True) or {}
    age, gender, eth, job, items = (
        d.get("age"), d.get("gender", ""), d.get("ethnicity", ""),
        d.get("job", ""), d.get("items", "")
    )
    cfg = load_llm_config() or {}
    api_key, model = cfg.get("api_key", ""), cfg.get("small_model", "")
    if age is None or not api_key or not model:
        return jsonify({"desc": ""}), 400

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": PHYS_DESC_SYS},
            {"role": "user",
             "content": PHYS_DESC_USER.format(age=age, gender=gender,
                                              ethnicity=eth, job=job, items=items)}
        ],
        "max_tokens": 160       # fits <2000 chars comfortably
    }

    import requests, time
    for _ in range(3):
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions",
                               headers=headers, json=payload, timeout=30)
            r.raise_for_status()
            text = r.json()["choices"][0]["message"]["content"].strip()
            if 20 <= len(text) <= 2000:
                return jsonify({"desc": text})
        except Exception:
            time.sleep(1)
    return jsonify({"desc": ""})

@app.post("/api/generate_name")
def api_generate_name():
    d = request.get_json(silent=True) or {}
    gender = d.get("gender", "")
    eth    = d.get("ethnicity", "")
    year   = d.get("year")
    if year is None:
        return jsonify({"name": ""}), 400

    cfg = load_llm_config() or {}
    api_key, model = cfg.get("api_key", ""), cfg.get("small_model", "")
    if not api_key or not model:
        return jsonify({"name": ""}), 500

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": NAME_SYSTEM_PROMPT},
            {"role": "user",
             "content": NAME_USER_PROMPT.format(gender=gender, ethnicity=eth, year=year)}
        ],
        "max_tokens": 8
    }

    import requests, time
    for _ in range(3):
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions",
                               headers=headers, json=payload, timeout=20)
            r.raise_for_status()
            name = r.json()["choices"][0]["message"]["content"].strip()
            if " " in name and 3 < len(name) < 128:
                return jsonify({"name": name})
        except Exception:
            time.sleep(1)

    return jsonify({"name": ""})
    
@app.get("/api/llm_config")
def api_get_llm_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify({}), 204  # no content

@app.get("/api/openrouter_balance") 
def api_get_openrouter_balance():
    """
    Get the current OpenRouter balance using the function from test_nodes.py
    Returns { balance: float } or { error: str }
    """
    try:
        balance = display_openrouter_balance()
        if balance is not None:
            return jsonify({"balance": balance})
        else:
            return jsonify({"error": "Could not retrieve balance"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================================
# NEW GAME CONFIGURATION ENDPOINTS
# =============================================

@app.get("/api/get_game_config")
def api_get_game_config():
    """Return saved game configuration if exists"""
    if GAME_CONFIG_FILE.exists(): # Using Path.exists()
        try:
            with open(GAME_CONFIG_FILE, encoding="utf-8") as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({}), 204  # no content

@app.route("/update_game_config", methods=["POST"])
def update_game_config_route():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    civilization_name = data.get("civilization")
    selected_start_year = data.get("selected_start_year")

    if not civilization_name or selected_start_year is None:
        return jsonify({"success": False, "message": "Missing civilization name or start year"}), 400

    try:
        game_config = {}
        if GAME_CONFIG_FILE.exists():
            with open(GAME_CONFIG_FILE, 'r', encoding='utf-8') as f:
                try:
                    game_config = json.load(f)
                except json.JSONDecodeError:
                    # File is empty or malformed, start with an empty config
                    pass
        
        game_config["civilization"] = civilization_name
        game_config["selected_start_year"] = selected_start_year
        # Preserve other existing keys like 'user', 'players' if they exist
        # For example, if 'user' was set in a previous step:
        # if 'user' not in game_config and session.get('user_details'):
        #     game_config['user'] = session.get('user_details')
        # if 'players' not in game_config and session.get('players'):
        #      game_config['players'] = session.get('players')


        GAME_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(GAME_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(game_config, f, indent=2)
            
        return jsonify({"success": True, "message": "Game config updated successfully."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.post("/api/save_game_config")
def api_save_game_config():
    """Save the current game configuration"""
    config_data = request.get_json(silent=True) or {}
    if not config_data:
        return jsonify({"saved": False, "error": "No data provided"}), 400
    
    try:
        os.makedirs(os.path.dirname(GAME_CONFIG_FILE), exist_ok=True)
        with open(GAME_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2)
        return jsonify({"saved": True})
    except Exception as e:
        return jsonify({"saved": False, "error": str(e)}), 500
    
@app.post("/api/clear_user_data")
def api_clear_user_data():
    """Clear only the user object"""
    if GAME_CONFIG_FILE.exists():
        with open(GAME_CONFIG_FILE, "r+", encoding="utf-8") as f:
            cfg = json.load(f)
            if "user" in cfg:
                cfg.pop("user", None)  # Remove the 'user' key
            f.seek(0); json.dump(cfg, f, indent=2); f.truncate()
        return jsonify({"cleared": True})
    return jsonify({"cleared": False, "error": "No config file"}), 404

@app.post("/api/clear_players_data")
def api_clear_players_data():
    """Remove *all* players but keep the user block intact."""
    if not GAME_CONFIG_FILE.exists():
        return jsonify({"cleared": False, "error": "No config file"}), 404

    import json
    try:
        with open(GAME_CONFIG_FILE, "r+", encoding="utf-8") as f:
            try:
                cfg = json.load(f)
            except json.JSONDecodeError:
                cfg = {}

            cfg.pop("players", None)  # Remove the 'players' key

            f.seek(0)
            json.dump(cfg, f, indent=2)
            f.truncate()

        return jsonify({"cleared": True})
    except Exception as exc:
        return jsonify({"cleared": False, "error": str(exc)}), 500

@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)
    send(message, broadcast=True)

@app.route('/update_label', methods=['POST'])
def update_label():
    data = request.get_json()
    socketio.emit('update', data)
    return jsonify({'status': 'updated'})

@app.post("/api/chat_query")
def api_chat_query():
    """
    Receives a user message, queries the LLM, and returns the response.
    Also saves the conversation to the database.
    """
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    session_id = data.get("session_id") # Get session_id from frontend

    if not user_message:
        return jsonify({"response": "No message provided."}), 400
    if not session_id:
        return jsonify({"response": "Session ID missing."}), 400

    # Load LLM config to get model names for token counting
    llm_config = load_llm_config()
    if not llm_config:
        return jsonify({"response": "LLM configuration missing."}), 500
    
    small_model_name = llm_config.get("small_model")
    main_model_name = llm_config.get("main_model")

    if not small_model_name or not main_model_name:
        return jsonify({"response": "LLM model names not configured."}), 500

    # Calculate input tokens for the user message
    user_input_tokens = count_tokens(user_message, small_model_name) # Assuming small_model for user input context

    # Get the latest objective time and increment it by 60 seconds
    latest_objective_time = conversation_manager.get_latest_objective_time(session_id)
    new_objective_time = latest_objective_time + 60

    # Save user message with input token count and new objective time
    conversation_manager.save_message(session_id, "user", user_message, input_tokens=user_input_tokens, objective_time=new_objective_time)

    # Load entire conversation history for the session
    conversation_history = conversation_manager.load_conversation(session_id)
    
    # Pass the conversation history to the LLM
    llm_response = query_llm(conversation_history)
    
    # Calculate output tokens for the LLM response
    llm_output_tokens = count_tokens(llm_response, main_model_name) # Assuming main_model for LLM response

    # Save assistant response with output token count and the same new objective time
    conversation_manager.save_message(session_id, "assistant", llm_response, output_tokens=llm_output_tokens, objective_time=new_objective_time)

    # Calculate and store TESA data
    tesa_data = get_tesa_indicator(session_id)
    game_state = session.get('game_state', {})
    game_state['tesa'] = tesa_data
    session['game_state'] = game_state

    return jsonify({"response": llm_response})

@app.post("/api/clear_game_config")
def api_clear_game_config():
    """Clear only the 'user' and 'players' sections from the game config file."""
    try:
        # Load current game config
        if GAME_CONFIG_FILE.exists():
            with GAME_CONFIG_FILE.open("r", encoding="utf-8") as f:
                config = json.load(f)
        else:
            config = {}

        # Remove only the specified keys
        config.pop("user", None)
        config.pop("players", None)

        # Save updated config
        with GAME_CONFIG_FILE.open("w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

        return jsonify({"cleared": True})
    except Exception as exc:
        return jsonify({"cleared": False, "error": str(exc)}), 500

def create_empty_player():
    """Create an empty player template"""
    return {
        "name": "",
        "age": "",
        "gender": "",
        "ethnicity": "",
        "native_languages": [],
        "profession": "",
        "items_carried": "",
        "physical_description": "",
        "personality_traits": {"mbti": ""},
    }

def reset_start_personal_session():
    """Reset session data for start_personal page"""
    session.pop("players", None)

# =============================================
# END OF NEW GAME CONFIGURATION ENDPOINTS
# =============================================

@app.route('/api/get_game_state', methods=['GET'])
def get_game_state():
    """
    Returns the current game state from the session.
    """
    game_state = session.get('game_state', {})
    return jsonify(game_state=game_state)


# tiny helper other modules can import
def load_llm_config() -> dict | None:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    return None

# Initialize ConversationManager globally
conversation_manager = ConversationManager()

if __name__ == "__main__":
    os.makedirs(SAVES_DIR, exist_ok=True)  # ensure saves folder exists
    # Use GAME_CONFIG_FILE.parent for the directory
    os.makedirs(GAME_CONFIG_FILE.parent, exist_ok=True)  # ensure config dir exists
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
