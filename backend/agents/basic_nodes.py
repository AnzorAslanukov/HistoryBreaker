import requests
import json
import tiktoken # Import tiktoken

# --- Global Constants for Flask and API interactions ---
FLASK_UPDATE_URL = "http://127.0.0.1:5000/update_label"
FLASK_HEADERS = {'Content-Type': 'application/json'}
OPENROUTER_API_CREDITS_URL = "https://openrouter.ai/api/v1/credits"
LLM_CONFIG_FILE_PATH = "static/json/llm_config.json"

def count_tokens(text: str, model_name: str) -> int:
    """
    Counts the number of tokens in a text string using tiktoken.
    Assumes the model_name is compatible with OpenAI's tiktoken encodings.
    """
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except KeyError:
        # Fallback for models not directly supported by tiktoken's model mapping
        # Use a common encoding like 'cl100k_base' which is used by gpt-4, gpt-3.5-turbo
        encoding = tiktoken.get_encoding("cl100k_base")
    
    return len(encoding.encode(text))


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
    # If there is no history, the safety level is unknown.
    if not conversation_history:
        return 5 # Return Unknown

    from prompts import SAFETY_INDICATOR_SYS, SAFETY_INDICATOR_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 5 # Default to unknown if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 5

    # Use all available messages, up to the last 6
    formatted_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history[-6:]])

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
        return max(0, min(5, threat_level)) # Clamp the value between 0 and 5
    except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
        print(f"Error getting safety level: {e}")
        return 5 # Default to unknown on error

if __name__ == "__main__":
    balance = display_openrouter_balance()
    if balance is not None:
        print(f"Fetched OpenRouter balance: ${balance:.2f}")
    else:
        print("Could not retrieve OpenRouter balance.")

def get_perceived_time_of_day(conversation_history: list[dict]) -> int:
    """
    Analyzes the conversation history to determine the perceived time of day.
    """
    from prompts import PERCEIVED_TIME_SYS, PERCEIVED_TIME_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 13 # Default to unknown if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 13

    # Use all available messages, up to the last 12
    formatted_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history[-12:]])

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": small_model,
        "messages": [
            {"role": "system", "content": PERCEIVED_TIME_SYS},
            {"role": "user", "content": PERCEIVED_TIME_USER.format(conversation_history=formatted_history)}
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
        perceived_time_index = int(result["choices"][0]["message"]["content"].strip())
        return max(0, min(13, perceived_time_index)) # Clamp the value between 0 and 13
    except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
        print(f"Error getting perceived time of day: {e}")
        return 13 # Default to unknown on error

def get_environment_accuracy_modifier(conversation_history: list[dict]) -> int:
    """
    Analyzes the conversation history to determine the environment accuracy modifier (weather).
    Searches backwards in chunks until a weather hint is found.
    """
    from prompts import ENVIRONMENT_ACCURACY_SYS, ENVIRONMENT_ACCURACY_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 5 # Default to Indoors/Dark if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 5

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Iterate backwards through conversation history in chunks of 12
    # This allows finding the *last* relevant hint
    history_length = len(conversation_history)
    for i in range(history_length, 0, -12):
        start_index = max(0, i - 12)
        chunk = conversation_history[start_index:i]
        
        if not chunk:
            continue # Skip empty chunks

        formatted_chunk = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chunk])

        payload = {
            "model": small_model,
            "messages": [
                {"role": "system", "content": ENVIRONMENT_ACCURACY_SYS},
                {"role": "user", "content": ENVIRONMENT_ACCURACY_USER.format(conversation_history=formatted_chunk)}
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
            environment_index = int(result["choices"][0]["message"]["content"].strip())
            
            # If the LLM returns a valid index (0-4), it means a hint was found in this chunk
            # If it returns 5 (Indoors/Dark), it means no hint was found in this chunk, or it's an enclosed space
            # We should only return a non-default value if a specific hint was found.
            if 0 <= environment_index <= 4:
                return environment_index
            elif environment_index == 5: # LLM explicitly returned 5 (Indoors/Dark)
                # If the context of the *current* chunk suggests indoors/dark, return 5
                # Otherwise, continue searching older chunks
                # For simplicity, we'll assume if LLM returns 5, it's a valid assessment for the chunk
                # A more complex check might involve analyzing the chunk for keywords like "cave", "indoors", etc.
                return 5
            
        except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
            print(f"Error getting environment accuracy modifier for chunk: {e}")
            # Continue to next chunk if there's an error with this one
            
    # If no specific hint is found after checking all chunks, default to 0 (Clear skies)
    # This is a fallback if the LLM consistently returns ambiguous or unknown for outdoor settings
    # or if the conversation is too short.
    return 0

def get_location_terrain_category(conversation_history: list[dict]) -> int:
    """
    Analyzes the conversation history to determine the location/terrain category.
    Searches backwards in chunks until a location/terrain hint is found.
    """
    from prompts import LOCATION_TERRAIN_SYS, LOCATION_TERRAIN_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 19 # Default to Unknown/Obscured if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 19

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Iterate backwards through conversation history in chunks of 12
    # This allows finding the *last* relevant hint
    history_length = len(conversation_history)
    for i in range(history_length, 0, -12):
        start_index = max(0, i - 12)
        chunk = conversation_history[start_index:i]
        
        if not chunk:
            continue # Skip empty chunks

        formatted_chunk = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chunk])

        payload = {
            "model": small_model,
            "messages": [
                {"role": "system", "content": LOCATION_TERRAIN_SYS},
                {"role": "user", "content": LOCATION_TERRAIN_USER.format(conversation_history=formatted_chunk)}
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
            location_index = int(result["choices"][0]["message"]["content"].strip())
            
            # If the LLM returns a valid index (0-34), it means a hint was found in this chunk
            # If it returns 19 (Unknown/Obscured), it means no hint was found in this chunk.
            if 0 <= location_index <= 18 or 20 <= location_index <= 35:
                return location_index
            elif location_index == 19: # LLM explicitly returned 19 (Unknown/Obscured)
                return 19
            
        except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
            print(f"Error getting location/terrain category for chunk: {e}")
            # Continue to next chunk if there's an error with this one
            
    # If no specific hint is found after checking all chunks, default to 19 (Unknown/Obscured)
    return 19

def get_temperature(conversation_history: list[dict]) -> int:
    """
    Analyzes the conversation history to determine the perceived temperature.
    Searches backwards in chunks until a temperature hint is found.
    """
    # If there is no history, the temperature is unknown.
    if not conversation_history:
        return 8 # Return Unknown

    from prompts import TEMPERATURE_SYS, TEMPERATURE_USER
    
    # Load LLM config to get API key and small model
    try:
        with open(LLM_CONFIG_FILE_PATH, 'r') as f:
            config = json.load(f)
        api_key = config.get("api_key")
        small_model = config.get("small_model")
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        return 8 # Default to unknown if config is missing

    if not api_key or not small_model:
        print("API key or small model not found in config.")
        return 8

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Iterate backwards through conversation history in chunks of 12
    # This allows finding the *last* relevant hint
    history_length = len(conversation_history)
    for i in range(history_length, 0, -12):
        start_index = max(0, i - 12)
        chunk = conversation_history[start_index:i]
        
        if not chunk:
            continue # Skip empty chunks

        formatted_chunk = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chunk])

        payload = {
            "model": small_model,
            "messages": [
                {"role": "system", "content": TEMPERATURE_SYS},
                {"role": "user", "content": TEMPERATURE_USER.format(conversation_history=formatted_chunk)}
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
            temperature_index = int(result["choices"][0]["message"]["content"].strip())
            
            # If the LLM returns a valid index (0-8), it means a hint was found in this chunk
            if 0 <= temperature_index <= 8:
                return temperature_index
            
        except (requests.exceptions.RequestException, KeyError, ValueError, IndexError) as e:
            print(f"Error getting temperature for chunk: {e}")
            # Continue to next chunk if there's an error with this one
            
    # If no specific hint is found after checking all chunks, default to 8 (Unknown)
    return 8

from backend.database.db_manager import ConversationManager

def get_total_input_tokens(session_id: str) -> int:
    """
    Retrieves the total input tokens for a given session ID from the database.
    """
    manager = ConversationManager()
    total_input, _ = manager.get_total_tokens(session_id)
    return total_input

def get_total_output_tokens(session_id: str) -> int:
    """
    Retrieves the total output tokens for a given session ID from the database.
    """
    manager = ConversationManager()
    _, total_output = manager.get_total_tokens(session_id)
    return total_output
