import requests
import json
import os

# Define the path to the LLM configuration file
LLM_CONFIG_FILE_PATH = os.path.join(os.getcwd(), "static/json/llm_config.json")

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

def query_llm(messages: list[dict]) -> str | None:
    """
    Queries the OpenRouter LLM with the given conversation history using the main model.
    Messages should be in the format: [{"role": "user", "content": "..."}]
    """
    config = load_llm_config()
    if not config:
        return "Error: LLM configuration not loaded."

    api_key = config.get("api_key")
    main_model = config.get("main_model")

    if not api_key or not main_model:
        return "Error: API key or main model not found in LLM config."

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Ensure messages are in the correct format for the API
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({"role": msg["role"], "content": msg["content"]})

    payload = {
        "model": main_model,
        "messages": formatted_messages,
        "max_tokens": 500 # Limit response length for basic Q&A
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
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
    print("Testing stateful question-answering with OpenRouter LLM...")
    
    # Simulate a conversation history
    test_messages = [
        {"role": "user", "content": "Hello, who are you?"},
        {"role": "assistant", "content": "I am an AI assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ]
    answer = query_llm(test_messages)
    print(f"Conversation: {test_messages}")
    print(f"Answer: {answer}")

    print("\nTesting with a new conversation...")
    test_messages_2 = [
        {"role": "user", "content": "Explain the concept of photosynthesis in a few sentences."}
    ]
    answer_2 = query_llm(test_messages_2)
    print(f"Conversation: {test_messages_2}")
    print(f"Answer: {answer_2}")
