(() => {
    const clearBtn  = document.getElementById('clear-llm-config');
    const apiKey    = document.getElementById('or-api-key');
    const smallInp  = document.getElementById('small-model');
    const mainInp   = document.getElementById('main-model');
    const apiSta    = document.getElementById('api-status');
    const apiErr    = document.getElementById('api-error');
    const balMsg    = document.getElementById('balance-msg');
    const smallSta  = document.getElementById('small-status');
    const mainSta   = document.getElementById('main-status');
    const saveBtn   = document.getElementById('save-llm-config');
    const contBtn   = document.getElementById('continue-btn');

    let savedConfig = null; // Store the last saved configuration
    let initialConfigLoadComplete = false; // Flag to ensure initial load is done before certain UI updates
    let keyIsValid   = false;
    let smallIsValid = false;
    let mainIsValid  = false;

    /* ----------  PRE-LOAD SAVED CONFIG  ---------- */
    fetch('/api/llm_config', { cache: 'no-store' })
        .then(r => {
            if (r.ok) {
                return r.json().then(cfg => {
                    savedConfig = cfg; // Store the saved config
                    apiKey.value   = cfg.api_key   || '';
                    smallInp.value = cfg.small_model || '';
                    mainInp.value  = cfg.main_model  || '';

                    // Trigger validators
                    validateApiKey().then(() => {
                        validateModel(smallInp, smallSta);
                        validateModel(mainInp, mainSta);
                    });
                    initialConfigLoadComplete = true;
                    updateButtonStates(); // Centralized function to update all buttons
                });
            } else {
                // Handle case where llm_config.json might be empty or not found initially
                savedConfig = {}; // Assume empty config
                initialConfigLoadComplete = true;
                updateButtonStates();
            }
            return null;
        })
        .catch(() => {
            savedConfig = {}; // Assume empty config on error
            initialConfigLoadComplete = true;
            updateButtonStates();
        });

    /* ------------ util helpers ------------ */
    const debounce = (fn, ms = 600) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

    const showMsg = (txt, ok=true) => {
        const m = document.getElementById('save-msg');
        m.textContent = txt;
        m.className   = 'save-msg ' + (ok ? 'save-ok' : 'save-err');
        clearTimeout(showMsg.t);
        showMsg.t = setTimeout(()=>{ m.textContent=''; m.className='save-msg'; }, 10000);
    };

    const updateSaveBtn = () => {
        if (!initialConfigLoadComplete) return; // Don't run before initial load

        const allInputsValid = keyIsValid && smallIsValid && mainIsValid;
        // Ensure all inputs have some content, not just whitespace
        const inputsAreNotEmptyAndValid = allInputsValid &&
                                          apiKey.value.trim().length > 0 &&
                                          smallInp.value.trim().length > 0 &&
                                          mainInp.value.trim().length > 0;

        if (!inputsAreNotEmptyAndValid) {
            saveBtn.disabled = true;
            return;
        }
        // Enable if all inputs are valid, not empty, AND different from savedConfig
        saveBtn.disabled = configMatches();
    };

    const updateClearBtn = () => {
        if (!initialConfigLoadComplete) return; 

        if (savedConfig && 
            savedConfig.api_key && savedConfig.api_key.length > 0 &&
            savedConfig.small_model && savedConfig.small_model.length > 0 &&
            savedConfig.main_model && savedConfig.main_model.length > 0) {
            clearBtn.disabled = false;
        } else {
            clearBtn.disabled = true;
        }
    };

    // Only disable inputs without clearing values
    const lockModelInputs = (disable) => {
        [smallInp, mainInp].forEach((inp, idx) => {
            inp.disabled = disable;
            const icon   = idx === 0 ? smallSta : mainSta;
            if (disable) {
                // Only reset validation status, not the input value
                icon.textContent = '';
                icon.className   = 'status-icon';
                if (inp === smallInp) smallIsValid = false;
                else mainIsValid = false;
            }
        });
    };

    // Check if current inputs match saved config
    const configMatches = () => {
        if (!savedConfig) return false;
        
        return (
            apiKey.value.trim() === savedConfig.api_key &&
            smallInp.value.trim() === savedConfig.small_model &&
            mainInp.value.trim() === savedConfig.main_model
        );
    };

    // Check validation status AND config match
    const updateContinueBtn = () => {
        if (!initialConfigLoadComplete) return; // Don't run before initial load

        if (savedConfig && 
            savedConfig.api_key && savedConfig.api_key.length > 0 &&
            savedConfig.small_model && savedConfig.small_model.length > 0 &&
            savedConfig.main_model && savedConfig.main_model.length > 0) {
            contBtn.disabled = false;
        } else {
            contBtn.disabled = true;
        }
    };

    const updateButtonStates = () => {
        updateSaveBtn();
        updateClearBtn();
        updateContinueBtn();
    };

    /* ---------- API‑key validation ---------- */
    async function validateApiKey() {
        const key = apiKey.value.trim();

        // Reset visuals
        apiSta.className = 'status-icon';
        apiSta.textContent = '';
        apiErr.textContent = '';
        if (balMsg) balMsg.textContent = '';
        apiKey.classList.remove('input-error');

        if (!key) {
            keyIsValid = false;
            lockModelInputs(true);
            updateButtonStates(); // Use central updater
            return;
        }

        try {
            const res = await fetch('/api/test_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: key })
            });
            const { valid, balance } = await res.json();
            keyIsValid = valid;

            apiSta.classList.add(valid ? 'valid' : 'invalid');
            apiSta.textContent = valid ? '✓' : '✗';

            lockModelInputs(!valid);
            balanceFeedback(valid, balance);
        } catch {
            keyIsValid = false;
            apiSta.classList.add('invalid');
            apiSta.textContent = '✗';
            apiErr.textContent = 'Failed to reach OpenRouter.';
            lockModelInputs(true);
        }
        updateButtonStates(); // Use central updater
    }

    const balanceFeedback = (valid, balance) => {
        if (!balMsg) return;
        balMsg.className = 'balance-text';
        if (!valid) return;
        const b = typeof balance === 'number' ? balance : null;
        if (b === null) return;
        if (b === 0) {
            balMsg.classList.add('balance-red');
            balMsg.textContent = 'Balance is $0 – add funds!';
        } else if (b < 3) {
            balMsg.classList.add('balance-orange');
            balMsg.textContent = `Low balance ($${b}) – top up soon.`;
        } else if (b < 5) {
            balMsg.classList.add('balance-yellow');
            balMsg.textContent = `Balance $${b}. Enough but a bit more is safer.`;
        } else if (b > 100) {
            balMsg.classList.add('balance-wow');
            balMsg.textContent = `Whoa, $${b}! Everything OK at home? 😅`;
        } else {
            balMsg.classList.add('balance-good');
            balMsg.textContent = `Healthy balance – $${b}`;
        }
    };

    /* ---------- Model validation ---------- */
    async function validateModel(inp, icon) {
        const model = inp.value.trim();
        icon.className   = 'status-icon';
        icon.textContent = '';

        if (!model) {
            if (inp === smallInp) smallIsValid = false; 
            else mainIsValid = false;
            updateButtonStates(); // Use central updater
            return;
        }
        if (!keyIsValid) {
            apiKey.classList.add('input-error');
            apiErr.textContent = 'Provide a valid API key first.';
            icon.classList.add('invalid');
            icon.textContent = '✗';
            if (inp === smallInp) smallIsValid = false; 
            else mainIsValid = false;
            updateButtonStates(); // Use central updater
            return;
        }

        try {
            const r = await fetch('/api/test_model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey.value.trim(), model })
            });
            const { valid } = await r.json();
            icon.classList.add(valid ? 'valid' : 'invalid');
            icon.textContent = valid ? '✓' : '✗';
            if (inp === smallInp) smallIsValid = valid; 
            else mainIsValid = valid;
        } catch {
            icon.classList.add('invalid');
            icon.textContent = '✗';
            if (inp === smallInp) smallIsValid = false; 
            else mainIsValid = false;
        }
        updateButtonStates(); // Use central updater
    }

    /* ---------- Persist to server ---------- */
    async function saveConfig(){
        if (saveBtn.disabled) return;
        const msg = document.getElementById('save-msg');
        msg.textContent = ''; 
        msg.className = 'save-msg';

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
        try{
            const configData = {
                api_key: apiKey.value.trim(),
                small_model: smallInp.value.trim(),
                main_model: mainInp.value.trim()
            };
            
            const r = await fetch('/api/save_llm_config',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(configData)
            });
            
            const { saved } = await r.json();
            if(saved){
                showMsg('LLM configuration saved!', true);
                savedConfig = configData;  // Update saved config
            } else {
                showMsg('Failed to save settings.', false);
            }
        } catch {
            showMsg('Network error while saving.', false);
        }
        saveBtn.textContent = 'Save LLM Settings';
        updateButtonStates(); // Centralized update
    }

    async function clearConfig() {
        if (clearBtn.disabled) return; // Check if button is already disabled
        if (!window.confirm('Are you sure you want to delete your saved LLM settings? This cannot be undone.')) return;
        
        const originalText = clearBtn.textContent;
        clearBtn.disabled = true;
        clearBtn.textContent = 'Clearing…';
        try {
            const response = await fetch('/api/delete_llm_config', { method: 'POST' });
            if (response.ok) {
                // Successfully cleared on server
                apiKey.value = '';
                smallInp.value = '';
                mainInp.value = '';
                
                // Clear local savedConfig and validation states
                savedConfig = {}; // Represent as an empty object, consistent with initial load failure
                keyIsValid = false;
                smallIsValid = false;
                mainIsValid = false;
                
                // Reset visual indicators for API key and model inputs
                [apiSta, smallSta, mainSta].forEach(icon => {
                    icon.className = 'status-icon';
                    icon.textContent = '';
                });
                apiErr.textContent = '';
                if (balMsg) balMsg.textContent = '';
                apiKey.classList.remove('input-error');
                
                // Model inputs should be locked as API key is now effectively invalid/empty
                lockModelInputs(true); 

                showMsg('LLM settings cleared successfully.', true);
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to clear settings on server.' }));
                showMsg(errorData.detail || 'Failed to clear settings on server.', false);
                // Do not re-enable clearBtn immediately if server operation failed,
                // as the state might be inconsistent. updateButtonStates will handle it.
            }
        } catch(e) {
            showMsg('Network error while clearing settings. Please try again.', false);
        }
        clearBtn.textContent = originalText; // Restore button text
        updateButtonStates(); // Update all button states based on new reality
    }

    /* ---------- event bindings ---------- */
    apiKey.addEventListener('input', debounce(() => {
        validateApiKey(); // This already calls updateButtonStates
    }));
    apiKey.addEventListener('blur', () => {
        validateApiKey(); // This already calls updateButtonStates
    });
    
    // Add direct input listeners to update button states for responsiveness,
    // especially for the save button when typing.
    // Debounced validation will still run for API/model checks.
    [apiKey, smallInp, mainInp].forEach(input => {
        input.addEventListener('input', updateButtonStates);
    });

    smallInp.addEventListener('input', debounce(() => { validateModel(smallInp, smallSta); updateButtonStates(); }));
    smallInp.addEventListener('blur',  () => { validateModel(smallInp, smallSta); updateButtonStates(); });

    mainInp .addEventListener('input', debounce(() => { validateModel(mainInp, mainSta); updateButtonStates(); }));
    mainInp .addEventListener('blur', () => { validateModel(mainInp, mainSta); updateButtonStates(); });

    saveBtn.addEventListener('click', saveConfig);
    clearBtn.addEventListener('click', clearConfig);
    
    // Initial setup: updateButtonStates() is called from the fetch promise chain.
})();
