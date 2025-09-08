import requests
import json

# --- Global Constants for Flask and API interactions ---
FLASK_UPDATE_URL = "http://127.0.0.1:5000/update_label"
FLASK_HEADERS = {'Content-Type': 'application/json'}
OPENROUTER_API_CREDITS_URL = "https://openrouter.ai/api/v1/credits"
LLM_CONFIG_FILE_PATH = "static/json/llm_config.json"

def load_api_key(config_path):
    """Loads the API key from the specified JSON config file."""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config.get("api_key")
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred while loading API key: {e}")
        return None

def display_openrouter_balance():
    """
    Fetches the OpenRouter credit balance and returns it as a float.
    """
    api_key = load_api_key(LLM_CONFIG_FILE_PATH)
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    try:
        response = requests.get(OPENROUTER_API_CREDITS_URL, headers=headers)
        response.raise_for_status()
        credits_data = response.json().get("data", {})
        
        total_credits = credits_data.get("total_credits", 0.0)
        total_usage = credits_data.get("total_usage", 0.0)
        
        balance = total_credits - total_usage
        return round(balance, 2)
    except Exception:
        return None

def get_safety_level(conversation_history: list[dict]) -> int:
    """
    Analyzes the conversation history to determine the threat level.
    """
    from prompts import SAFETY_INDICATOR_SYS, SAFETY_INDICATOR_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 0 # Default to peaceful if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 0

    # Get the last 6 messages
    last_messages = conversation_history[-6:]
    
    # Format the conversation history for the prompt
    formatted_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in last_messages])

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": small_model,
        "messages": [
            {"role": "system", "content": SAFETY_INDICATOR_SYS},
            {"role": "user", "content": SAFETY_INDICATOR_USER.format(conversation_history=formatted_history)}
        ],
        "max_tokens": 1
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        response.raise_for_status()
        result = response.json()
        threat_level = int(result["choices"][0]["message"]["content"].strip())
        return max(0, min(4, threat_level)) # Clamp the value between 0 and 4
    except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
        print(f"Error getting safety level: {e}")
        return 0 # Default to peaceful on error

if __name__ == "__main__":
    balance = display_openrouter_balance()
    if balance is not None:
        print(f"Fetched OpenRouter balance: ${balance:.2f}")
    else:
        print("Could not retrieve OpenRouter balance.")
