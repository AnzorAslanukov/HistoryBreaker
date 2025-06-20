let gameConfig = null;
let configExists = false; // This will become true if config file exists, even if empty.

/* ===== Busy-overlay helpers ===== */
const overlay = document.getElementById("loading-overlay");

function showOverlay()  { overlay?.removeAttribute("hidden"); }
function hideOverlay()  { overlay?.setAttribute("hidden", ""); }

document.addEventListener("DOMContentLoaded", () => {
    updatePlayerCount(document.getElementById("player-count").value);
    loadSavedGameConfig(); // Load config on page load
    updateClearButtonsState(); // Initial update of clear buttons state
});

const continueBtn = document.getElementById('continue-btn');
const autofillBtn = document.getElementById('autofill-btn'); // Added for autofill button
const clearOthersBtn = document.getElementById('clear-others-btn'); // Added for clear others button
const autofillMeBtn = document.getElementById('autofill-me-btn'); // Added for autofill me button
const clearMeBtn = document.getElementById('clear-me-btn'); // Added for clear me button
const clearAllBtn = document.getElementById('clear-all-data'); // Added for clear all data button
const clearUserDataBtn = document.getElementById('clear-user-data');
const clearPlayersDataBtn = document.getElementById('clear-players-data');

// --- START PATTERN 1: Add two globals and a helper ---
const saveBtn   = document.getElementById('save-all-data');
const msgBox    = document.getElementById('save-msg') || null; // optional

function updateSaveBtn(){
    // The button should be enabled if:
    // 1. The form is valid (all required fields filled, no LLM validation errors)
    // 2. AND the current form data is different from the saved data in game_config.json
    // 3. AND there is existing 'user' or 'players' data in game_config.json (as per latest requirement)
    // This means the button is disabled if game_config.json is empty (no user/players keys),
    // preventing saving when there's no existing data to update.
    // const hasUserOrPlayersDataInConfig = gameConfig && (gameConfig.user || (gameConfig.players && gameConfig.players.length > 0)); // Removed as per new requirement
    const ready = isFormValid() && !comparePlayerData(); // Enabled if form is valid and differs from saved config
    saveBtn.disabled = !ready;
}

function showMsg(txt, ok){
    if(!msgBox) return;
    msgBox.textContent = txt;
    msgBox.style.color = ok ? '#28a745' : '#dc3545';
    clearTimeout(showMsg.timer);
    showMsg.timer = setTimeout(()=> msgBox.textContent = '', 6000);
}
// --- END PATTERN 1 ---

/* ---------- Config Loading & Saving ---------- */
function loadSavedGameConfig() {
    showOverlay();  // ← always display while we work

    fetch('/api/get_game_config')
        .then(response => response.json())
        .then(data => {
            // Always assign a new object to gameConfig to ensure no stale references
            gameConfig = {};
            if (data) {
                // Copy all properties from fetched data to gameConfig
                Object.assign(gameConfig, data);
            }

            // Determine configExists based on whether user or players data is present
            configExists = (gameConfig.user && Object.keys(gameConfig.user).length > 0) ||
                           (gameConfig.players && gameConfig.players.length > 0);

            /* merge user + players for the UI */
            const merged = [
                ...(gameConfig.user    ? [gameConfig.user]    : []),
                ...(gameConfig.players ?  gameConfig.players : [])
            ];

            const playerCount = merged.length;
            if (playerCount > 0) {
                document.getElementById("player-count").value = playerCount;
                updatePlayerCount(playerCount);

                // Let the DOM finish inserting the blocks, then fill them.
                setTimeout(() => {
                    try {
                        fillFormWithConfig({ players: merged });
                    } finally {
                        hideOverlay();
                    }
                }, 100);
            } else {
                hideOverlay();
            }

            enableContinue();
            updateSaveBtn();
            updateClearButtonsState();
        })
        .catch(error => {
            console.error('Error loading game config:', error);
            configExists = false;
            gameConfig = null; // On fetch error, gameConfig should be null
            hideOverlay();
            enableContinue();
            updateSaveBtn();
            updateClearButtonsState();
        });
}

function fillFormWithConfig(config) {
    const players = config.players;
    const playerCount = document.getElementById("player-count").value;
    
    for (let i = 0; i < playerCount; i++) {
        const playerData = players[i];
        if (!playerData) continue;
        
        // Set scalar values
        setInputValue(`player_${i}_name`, playerData.name);
        setInputValue(`player_${i}_age_slider`, playerData.age);
        setInputValue(`player_${i}_profession`, playerData.profession);
        
        // Set age display
        const ageDisplay = document.getElementById(`player_${i}_age_display`);
        if (ageDisplay) ageDisplay.textContent = playerData.age;
        updateAgeLabel(i);
        
        // Set select elements (TomSelect)
        setSelectValue(`player_${i}_gender`, playerData.gender);
        setSelectValue(`player_${i}_ethnicity`, playerData.ethnicity);
        
        // Set languages (TomSelect)
        const langSel = document.getElementById(`player_${i}_native_languages`);
        if (langSel && langSel.tomselect && playerData.native_languages) {
            langSel.tomselect.setValue(playerData.native_languages);
        }
        
        // Set textareas
        setTextAreaValue(`player_${i}_items`, playerData.items_carried);
        updateCharCount(
            document.getElementById(`player_${i}_items`),
            document.getElementById(`items_counter_${i}`)
        );
        autoExpandTextarea(document.getElementById(`player_${i}_items`));

        setTextAreaValue(`player_${i}_phys`, playerData.physical_description);
        updateCharCount(
            document.getElementById(`player_${i}_phys`),
            document.getElementById(`phys_counter_${i}`)
        );
        autoExpandTextarea(document.getElementById(`player_${i}_phys`));
        
        // Set MBTI
        if (playerData.personality_traits && playerData.personality_traits.mbti) {
            const mbti = playerData.personality_traits.mbti;
            setInputValue(`player_${i}_mbti_ie`, mbti[0] || '');
            setInputValue(`player_${i}_mbti_sn`, mbti[1] || '');
            setInputValue(`player_${i}_mbti_tf`, mbti[2] || '');
            setInputValue(`player_${i}_mbti_jp`, mbti[3] || '');
            updateMBTILabel(i);
        }
    }
    validateForm();
    // --- PATTERN 2a: After validateForm() ---
    updateSaveBtn();
    // --- END PATTERN 2a ---
    updateClearButtonsState(); // Update clear buttons state after filling form
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) element.value = value;
}

function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value && element.tomselect) {
        element.tomselect.setValue(value, true);
    }
}

function setTextAreaValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.value = Array.isArray(value) ? value.join(", ") : value;
    }
}

function saveGameConfig() {
    const playerCount = +document.getElementById("player-count").value;
    const all = Array.from({ length: playerCount }, (_, i) => getPlayerData(i));

    const payload = {
        user: all[0],              // first block = “you”
        players: all.slice(1)      // everyone else
    };

    fetch('/api/save_game_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    // --- PATTERN 2c: After saveGameConfig() ---
    .then(data => {
        if (data.saved) {
            showMsg('Data saved!', true);
            loadSavedGameConfig(); // Re-load config from server to ensure consistency and update all button states
        } else {
            showMsg('Failed to save data', false);
            enableContinue();
            updateSaveBtn();
            updateClearButtonsState();
        }
    })
    // --- END PATTERN 2c ---
    .catch(error => {
        console.error('Error saving game config:', error);
        alert('Error saving player data'); // Keep original alert in catch
        // Update button states even on error
        enableContinue();
        updateSaveBtn();
    });
    // Removed: setTimeout(enableContinue, 100); - now handled in the .then() block
}

function clearSavedGameConfig() {
    fetch('/api/clear_game_config', { method: 'POST' })
        .then(response => {
            // --- PATTERN 2d: After clear handlers succeed ---
            if (response.ok) {
                showMsg('All player data cleared!', true);
                // Explicitly clear gameConfig client-side before reloading
                gameConfig = {};
                configExists = false; // Also explicitly set configExists to false
                loadSavedGameConfig(); // Re-load config from server to ensure consistency and update all button states
            } else {
                showMsg('Failed to clear all data', false); // Added specific message for failure
                enableContinue();
                updateSaveBtn();
                updateClearButtonsState();
            }
            // --- END PATTERN 2d ---
        })
        .catch(() => {
            showMsg('Error clearing data', false); // Changed alert to showMsg
            enableContinue();
            updateSaveBtn();
            updateClearButtonsState(); // Ensure clear buttons state is updated even on error
        });
}

function clearUserData() {
    fetch('/api/clear_user_data', { method: 'POST' })
        .then(response => {
            // --- PATTERN 2d: After clear handlers succeed ---
            if (response.ok) {
                if (gameConfig) {
                    delete gameConfig.user; // Correctly remove the user key from client-side config
                }
                // Re-evaluate configExists based on the updated gameConfig
                configExists = !!(gameConfig && ((gameConfig.user && Object.keys(gameConfig.user).length > 0) || (gameConfig.players && gameConfig.players.length > 0)));

                showMsg('User data cleared!', true);
                clearPlayer(0); // Clear the form for player 0. This will internally call update/enable functions.
            } else {
                showMsg('Failed to clear user data', false); // Added specific message for failure
            }
            enableContinue();
            updateSaveBtn();
            // --- END PATTERN 2d ---
        })
        .catch(() => {
            showMsg('Error clearing user data', false); // Changed alert to showMsg
            enableContinue();
            updateSaveBtn();
        });
}

function clearPlayersData() {
    fetch('/api/clear_players_data', { method: 'POST' })
        .then(response => {
            // --- PATTERN 2d: After clear handlers succeed ---
            if (response.ok) {
                // Removed configExists = false; gameConfig = null;
                gameConfig = gameConfig || {}; // Ensure gameConfig is not null
                gameConfig.players = []; // Explicitly update players data in config
                const playerCount = parseInt(document.getElementById("player-count").value, 10);
                for (let i = 1; i < playerCount; i++) {
                    clearPlayer(i);
                }
                showMsg('Other players cleared!', true);
            } else {
                showMsg('Failed to clear other players data', false); // Added specific message for failure
            }
            enableContinue();
            updateSaveBtn();
            // --- END PATTERN 2d ---
        })
        .catch(() => {
            showMsg('Error clearing other players data', false); // Changed alert to showMsg
            enableContinue();
            updateSaveBtn();
        });
}

function getPlayerData(index) {
    const base = `player_${index}_`;
    return {
        name: document.getElementById(`${base}name`)?.value || '',
        age: document.getElementById(`${base}age_slider`)?.value || '25',
        gender: document.getElementById(`${base}gender`)?.value || '',
        ethnicity: document.getElementById(`${base}ethnicity`)?.value || '',
        profession: document.getElementById(`${base}profession`)?.value || '',
        native_languages: getSelectedLanguages(index),
        items_carried: document.getElementById(`${base}items`)?.value || '',
        physical_description: document.getElementById(`${base}phys`)?.value || '',
        personality_traits: {
            mbti: (
                document.querySelector(`[name="${base}mbti_ie"]`)?.value +
                document.querySelector(`[name="${base}mbti_sn"]`)?.value +
                document.querySelector(`[name="${base}mbti_tf"]`)?.value +
                document.querySelector(`[name="${base}mbti_jp"]`)?.value
            ) || '',
        }
    };
}

function getSelectedLanguages(index) {
    try {
        const sel = document.getElementById(`player_${index}_native_languages`);
        if (sel?.tomselect) {
            return sel.tomselect.getValue();
        }
    } catch(e) {}
    return [];
}

function clearForm() {
    const playerCount = parseInt(document.getElementById("player-count").value, 10);
    for (let i = 0; i < playerCount; i++) {
        clearPlayer(i);
    }
}

function clearPlayer(index) {
    const block = document.querySelectorAll(".player-block")[index];
    if (!block) return;
    
    // Clear inputs and textareas
    block.querySelectorAll("input[type=text]").forEach(el => el.value = "");
    block.querySelectorAll("textarea").forEach(el => el.value = "");
    
    // Reset range input
    const slider = block.querySelector('input[type="range"]');
    if (slider) { 
        slider.value = "25";
        const display = block.querySelector('span[id$="_age_display"]');
        if (display) display.textContent = "25";
    }
    
    // Clear selects
    block.querySelectorAll("select").forEach(sel => {
        if (sel.tomselect) {
            sel.tomselect.clear();
        } else {
            sel.value = "";
        }
    });
    
    // Clear MBTI
    block.querySelectorAll(`[name^="player_${index}_mbti_"]`).forEach(sel => sel.value = "");
    const lbl = document.getElementById(`mbti-label-${index}`);
    if (lbl) lbl.textContent = "";
    
    // Reset validation indicators
    block.querySelectorAll(".status-icon").forEach(icon => {
        icon.className = "status-icon";
        icon.textContent = "";
    });
    
    block.querySelectorAll(".char-counter").forEach(cc => {
        cc.textContent = "0/2000";
        cc.classList.remove("invalid");
    });
    
    validateForm();
    updateSaveBtn();
    updateClearButtonsState(); // Update clear buttons state after clearing a player
}

function comparePlayerData() {
    if (!gameConfig || Object.keys(gameConfig).length === 0) { // If gameConfig is null or empty object (cleared state)
        // Check if the form is also empty
        const playerCount = +document.getElementById("player-count").value;
        if (playerCount === 0) return true; // Empty form, empty config -> match
        
        let allFormFieldsEmpty = true;
        for (let i = 0; i < playerCount; i++) {
            const player = getPlayerData(i);
            const props = ["name", "gender", "ethnicity", "profession", "items_carried", "physical_description"];
            for (const prop of props) {
                if (player[prop] && player[prop].toString().trim() !== '') {
                    allFormFieldsEmpty = false;
                    break;
                }
            }
            if (player.age !== '25') allFormFieldsEmpty = false; // Default age 25
            if (player.native_languages?.length > 0) allFormFieldsEmpty = false;
            // MBTI comparison: if all MBTI fields are empty string
            if (player.personality_traits?.mbti && player.personality_traits.mbti.trim() !== '') allFormFieldsEmpty = false;

            if (!allFormFieldsEmpty) break;
        }
        
        return allFormFieldsEmpty; // If config is empty, form matches if it's also empty
    }

    const savedPlayers = [
        ...(gameConfig.user ? [gameConfig.user] : []),
        ...(gameConfig.players ?  gameConfig.players : [])
    ];

    const playerCount = +document.getElementById("player-count").value;

    // Handle case where user reduces player count below saved players
    // This implies data has changed, so they should save
    // Or if count is different after an autofill/clear; let the comparison decide.
    // If the saved data for a player at an index doesn't exist, it's considered changed
    if (playerCount !== savedPlayers.length) {
        // If the current form has fewer players, it probably doesn't match
        // Unless the excess players in savedPlayers are empty.
        // It's safer to just return false here for different counts
        // unless the 'missing' players in savedPlayers are truly empty.
        // For simplicity, different player count means data differs.
        return false;
    }


    for (let i = 0; i < playerCount; i++) {
        const savedPlayer = savedPlayers[i];
        const currentPlayer = getPlayerData(i);

        // Compare simple properties
        const props = ["name", "age", "gender", "ethnicity", "profession", "items_carried", "physical_description"];
        for (const prop of props) {
            // Handle null/undefined savedPlayer properties implicitly by checking if currentPlayer property is also empty
            const savedVal = savedPlayer ? (savedPlayer[prop] || '') : '';
            const currentVal = currentPlayer[prop] || '';

            // This comparison needs to be robust for various types (string, number, array).
            // For example, age "25" vs 25 should be true.
            if (savedVal.toString() !== currentVal.toString()) {
                return false;
            }
        }

        // Compare arrays (languages)
        const savedLangs = savedPlayer?.native_languages || [];
        const currentLangs = currentPlayer.native_languages || [];
        if (savedLangs.length !== currentLangs.length) return false;
        // Check if all elements in currentLangs are present in savedLangs, and vice versa
        if (!savedLangs.every(lang => currentLangs.includes(lang)) || !currentLangs.every(lang => savedLangs.includes(lang))) return false;

        // Compare MBTI
        const savedMbti = savedPlayer?.personality_traits?.mbti || "";
        const currentMbti = currentPlayer.personality_traits?.mbti || "";
        if (savedMbti !== currentMbti) return false;
    }

    return true;
}


function isFormValid() {
    const form = document.getElementById('players-form');
    if (!form) return false;
    
    // Check if all required fields are filled
    let isValid = true;
    form.querySelectorAll('input, select, textarea').forEach(el => {
        // Exclude elements that are children of a player-block that's greater than current player count
        const playerCount = parseInt(document.getElementById("player-count").value, 10);
        const playerBlock = el.closest('.player-block');
        if (playerBlock) {
            const playerBlocks = Array.from(document.querySelectorAll('.player-block'));
            const playerIndex = playerBlocks.indexOf(playerBlock);
            if (playerIndex >= playerCount) {
                // This element is part of a block beyond the current player count, skip validation
                return;
            }
        }

        if (el.required && !el.value.trim()) {
            isValid = false;
        }
    });
    
    // Check validation indicators from LLM API
    form.querySelectorAll('.name-invalid, .textarea-invalid').forEach(el => {
        if (el.offsetParent !== null) { // Only consider visible elements
            const playerBlock = el.closest('.player-block');
            if (playerBlock) {
                const playerBlocks = Array.from(document.querySelectorAll('.player-block'));
                const playerIndex = playerBlocks.indexOf(playerBlock);
                const playerCount = parseInt(document.getElementById("player-count").value, 10);
                if (playerIndex < playerCount) { // Only for active players
                    isValid = false;
                }
            } else {
                isValid = false;
            }
        }
    });
    
    return isValid;
}

function enableContinue() {
    if (!continueBtn) return;
    
    // New logic: Continue button is enabled if 'user' key is present in gameConfig.
    // Optionally 'players' key can be present, but 'user' is mandatory.
    const userExistsInConfig = gameConfig && gameConfig.user && Object.keys(gameConfig.user).length > 0;
    continueBtn.disabled = !userExistsInConfig;
}

// Event registration for new buttons
function registerNewEvents() {
    const save = document.getElementById('save-all-data');
    save?.removeEventListener('click', saveGameConfig);
    save?.addEventListener('click', saveGameConfig, { once: true });

    const clearAll = document.getElementById('clear-all-data');
    clearAll?.removeEventListener('click', clearSavedGameConfig);
    clearAll?.addEventListener('click', clearSavedGameConfig, { once: true });

    const clearUser = document.getElementById('clear-user-data');
    clearUser?.removeEventListener('click', clearUserData);
    clearUser?.addEventListener('click', clearUserData, { once: true });

    const clearPlayers = document.getElementById('clear-players-data');
    clearPlayers?.removeEventListener('click', clearPlayersData);
    clearPlayers?.addEventListener('click', clearPlayersData, { once: true });
}

/* enable / disable every time the form changes */
document.getElementById('players-form')
        .addEventListener('input', () => {
            validateForm();
            // --- PATTERN 2a: After validateForm() ---
            updateSaveBtn();
            // --- END PATTERN 2a ---
            enableContinue(); // As per instruction: "Event listeners already invoke enableContinue() right after validateForm(), so no changes are needed there."
            updateClearButtonsState(); // Update clear buttons state on input
        });
        
document.getElementById('players-form')
        .addEventListener('change', () => {
            validateForm();
            // --- PATTERN 2a: After validateForm() ---
            updateSaveBtn();
            // --- END PATTERN 2a ---
            enableContinue(); // As per instruction: "Event listeners already invoke enableContinue() right after validateForm(), so no changes are needed there."
            updateClearButtonsState(); // Update clear buttons state on change
        });

/* ----------  CANONICAL ETHNICITY LIST ---------- */
const ETHNICITIES = [
  { value: "White", text: "White" },
  { value: "Black or African American", text: "Black or African American" },
  { value: "Asian", text: "Asian" },
  { value: "American Indian or Alaska Native", text: "American Indian or Alaska Native" },
  { value: "Native Hawaiian or Other Pacific Islander",
            text: "Native Hawaiian or Other Pacific Islander" },
  { value: "Hispanic or Latino", text: "Hispanic or Latino" }
];

/* ----------  CANONICAL GENDER LIST  ----------- */
const GENDERS = [
  { value: "Male",   text: "Male",   rank: 0 },
  { value: "Female", text: "Female", rank: 0 },
  { value: "Bi-gendered",  text: "Bi-gendered" },
  { value: "Cross-dresser", text: "Cross-dresser" },
  { value: "Drag King",     text: "Drag King" },
  { value: "Drag Queen",    text: "Drag Queen" },
  { value: "Femme Queen",   text: "Femme Queen" },
  { value: "Female-to-Male",text: "Female-to-Male" },
  { value: "FTM",           text: "FTM" },
  { value: "Gender Bender", text: "Gender Bender" },
  { value: "Genderqueer",   text: "Genderqueer" },
  { value: "Male-to-Female",text: "Male-to-Female" },
  { value: "MTF",           text: "MTF" },
  { value: "Non-Op",        text: "Non-Op" },
  { value: "Hijra",         text: "Hijra" },
  { value: "Pangender",     text: "Pangender" },
  { value: "Transexual/Transsexual", text: "Transexual / Transsexual" },
  { value: "Trans Person",  text: "Trans Person" },
  { value: "Butch",         text: "Butch" },
  { value: "Two-Spirit",    text: "Two-Spirit" },
  { value: "Trans",         text: "Trans" },
  { value: "Agender",       text: "Agender" },
  { value: "Third Sex",     text: "Third Sex" },
  { value: "Gender Fluid",  text: "Gender Fluid" },
  { value: "Non-Binary Transgender", text: "Non-Binary Transgender" },
  { value: "Androgyne",     text: "Androgyne" },
  { value: "Gender Gifted", text: "Gender Gifted" },
  { value: "Gender Blender",text: "Gender Blender" },
  { value: "Femme",         text: "Femme" },
  { value: "Person of Transgender Experience",
                       text: "Person of Transgender Experience" },
  { value: "Androgynous",   text: "Androgynous" }
];

/* ----------  MBTI population share (USA, %) ---------- */
const MBTI_DISTRIBUTION = {
    "ISFJ": 13.8,  "ESFJ": 12.3,  "ISTJ": 11.6,  "ISFP":  8.8,
    "ESTJ":  8.7,  "ESFP":  8.5,  "ENFP":  8.1,  "ISTP":  5.4,
    "INFP":  4.4,  "ESTP":  4.3,  "INTP":  3.3,  "ENFJ":  2.5,
    "ENTP":  2.4,  "INTJ":  2.1,  "INFJ":  1.5,  "ENTJ":  1.3
};

/* ----------  Weighted UN age-distribution ---------- */
let AGE_DIST = [];                         
fetch("/static/json/age_pop_dist.json")         
    .then(r => r.json())
    .then(data => { AGE_DIST = data; })
    .catch(() => console.error("Age-distribution file missing"));

/* ----------  Weighted USA ethnicity distribution ---------- */
let ETH_DIST = [];                         
fetch("/static/json/usa_ethnicity.json")        
    .then(r => r.json())
    .then(data => { ETH_DIST = data; })
    .catch(() => console.error("Ethnicity file missing"));

/* ----------  Job-role lookup ---------- */
let JOB_ROLES = {};
fetch("/static/json/job_roles.json")
    .then(r => r.json())
    .then(d => { JOB_ROLES = d; })
    .catch(() => console.error("job_roles.json missing"));

/* -----------------------------------------------------------
   Helper: add ONE player block (used whenever slider goes up)
   ----------------------------------------------------------- */
function buildPlayerBlock(i, wrapper) {
    const label = i === 0 ? "You (Player 1)" : `Player ${i + 1}`;

    const block = document.createElement("div");
    block.className = "player-block";
    block.innerHTML = `
        <h2>${label}</h2>
        ${i > 0 ? `
            <div class="player-tools">
                <button type="button"
                        class="autofill-player-btn btn-info"
                        id="autofill-player-${i}">
                    Auto-Fill Player ${i + 1}
                </button>
                <button type="button"
                        class="clear-player-btn btn-danger"
                        id="clear-player-${i}">
                    Clear Player ${i + 1}
                </button>
            </div>
        ` : ""}
        <label>Name:
            <input type="text" name="player_${i}_name" id="player_${i}_name" required>
            <span class="status-icon" id="name_status_${i}"></span>
        </label>
        <label>Age:
            <input type="range" name="player_${i}_age" id="player_${i}_age_slider"
                   min="7" max="122" value="25" oninput="updateAgeLabel(${i})">
            <span id="player_${i}_age_display">25</span> years old
        </label>
        <label>Gender:
            <select name="player_${i}_gender"
                    id="player_${i}_gender"
                    class="gender-select"
                    required></select>
        </label>
        <label>Ethnicity:
            <select name="player_${i}_ethnicity"
                    id="player_${i}_ethnicity"
                    class="ethnicity-select"
                    required></select>
        </label>
        <label>Native Languages:
            <select id="player_${i}_native_languages"
                    name="player_${i}_native_languages"
                    multiple required></select>
        </label>
        <label>Profession:
            <input type="text" name="player_${i}_profession"
                id="player_${i}_profession" required>
            <span class="status-icon" id="prof_status_${i}"></span>
        </label>
        <label>
            <div class="label-header">
                Items Carried (add “FLAG” to allow fantasy items):
                <span class="char-counter" id="items_counter_${i}">0/2000</span>
            </div>
            <textarea name="player_${i}_items_carried"
                    id="player_${i}_items"
                    maxlength="2000" required></textarea>
            <span class="status-icon" id="items_status_${i}"></span>
        </label>
        <label>
            <div class="label-header">
                Physical Description (realistic; explain body mods if desired):
                <span class="char-counter" id="phys_counter_${i}">0/2000</span>
            </div>
            <textarea name="player_${i}_physical_description"
                    id="player_${i}_phys"
                    maxlength="2000" required></textarea>
            <span class="status-icon" id="phys_status_${i}"></span>
        </label>
        <label>Personality Type (MBTI Dichotomies):<br>
            I/E:
            <select id="player_${i}_mbti_ie" 
                    name="player_${i}_mbti_ie"
                    onchange="updateMBTILabel(${i})" required>
                <option value="">--</option>
                <option value="I">I – Introversion</option>
                <option value="E">E – Extraversion</option>
            </select><br>
            S/N:
            <select id="player_${i}_mbti_sn" 
                    name="player_${i}_mbti_sn" 
                    onchange="updateMBTILabel(${i})" required>
                <option value="">--</option>
                <option value="S">S – Sensing</option>
                <option value="N">N – Intuition</option>
            </select><br>
            T/F:
            <select id="player_${i}_mbti_tf" 
                    name="player_${i}_mbti_tf" 
                    onchange="updateMBTILabel(${i})" required>
                <option value="">--</option>
                <option value="T">T – Thinking</option>
                <option value="F">F – Feeling</option>
            </select><br>
            J/P:
            <select id="player_${i}_mbti_jp" 
                    name="player_${i}_mbti_jp" 
                    onchange="updateMBTILabel(${i})" required>
                <option value="">--</option>
                <option value="J">J – Judging</option>
                <option value="P">P – Perceiving</option>
            </select>
        </label>
        <div id="mbti-label-${i}" class="mbti-label"></div>
        <hr>
    `;
    wrapper.appendChild(block);

    const nameInp  = document.getElementById(`player_${i}_name`);
    const nameStat = document.getElementById(`name_status_${i}`);
    nameInp.addEventListener("blur", () => validateNameLLM(nameInp, nameStat));

    const profInp  = document.getElementById(`player_${i}_profession`);
    const profStat = document.getElementById(`prof_status_${i}`);
    profInp.addEventListener("blur", () => validateProfessionLLM(profInp, profStat));

    const itemsInp  = document.getElementById(`player_${i}_items`);
    const itemsStat = document.getElementById(`items_status_${i}`);
    itemsInp.addEventListener("blur", () => validateItemsLLM(itemsInp, itemsStat));
    const itemsCount = document.getElementById(`items_counter_${i}`);
    itemsInp.addEventListener("input", () => {
        updateCharCount(itemsInp, itemsCount);
        autoExpandTextarea(itemsInp);
    });
    updateCharCount(itemsInp, itemsCount);        // initialise
    autoExpandTextarea(itemsInp); // Initial auto-expand

    const physInp  = document.getElementById(`player_${i}_phys`);
    const physStat = document.getElementById(`phys_status_${i}`);
    physInp.addEventListener("blur", () => validateDescriptionLLM(physInp, physStat));
    const physCount = document.getElementById(`phys_counter_${i}`);
    physInp.addEventListener("input", () => {
        updateCharCount(physInp, physCount);
        autoExpandTextarea(physInp);
    });
    physInp.addEventListener("blur",  () => validateDescriptionLLM(physInp, physStat));
    updateCharCount(physInp, physCount);
    autoExpandTextarea(physInp); // Initial auto-expand

    if (i > 0) {
        const autofillBtn = block.querySelector(`#autofill-player-${i}`);
        const clearBtn = block.querySelector(`#clear-player-${i}`);
        autofillBtn.addEventListener("click", async () => {
            showOverlay();
            try {
                await autofillPlayer(i);
            } finally {
                // Defer updateClearButtonsState to ensure DOM is fully updated
                setTimeout(() => {
                    updateClearButtonsState();
                    hideOverlay();
                }, 0);
            }
        });
        clearBtn.addEventListener("click", async () => {
            showOverlay();
            // Add a small delay to allow the overlay to render
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
            try {
                clearAndUnlockPlayer(i);
            } finally {
                setTimeout(() => {
                    hideOverlay();
                }, 0);
            }
        });
    }

    /* ---------- Tom-Select wiring (unchanged) ---------- */
    setTimeout(() => {
        const langSel = document.getElementById(`player_${i}_native_languages`);
        if (langSel && window.languageOptions) {
            for (const lang of window.languageOptions) {
                const opt = document.createElement("option");
                opt.value = lang;
                opt.textContent = lang;
                langSel.appendChild(opt);
            }
            const tsLang = new TomSelect(langSel, {
                placeholder: "Search or select languages",
                maxItems: null,
                create: false,
                closeAfterSelect: true,
                plugins: {
                    remove_button: { title: "×" },
                    dropdown_input: {}
                },
                sortField: { field: "text", direction: "asc" }
            });
            tsLang.on("change", validateForm);
        }

        const genderSel = document.getElementById(`player_${i}_gender`);
        if (genderSel && !genderSel.dataset.populated) {

            const ph = document.createElement("option");
            ph.value = "";
            ph.textContent = "Choose your gender";
            ph.disabled = true;
            ph.selected = true;
            genderSel.appendChild(ph);

            GENDERS.forEach(opt => {
                const o = document.createElement("option");
                o.value = opt.value;
                o.textContent = opt.text;
                if (opt.rank === 0) o.dataset.rank = "0";
                genderSel.appendChild(o);
            });
            genderSel.dataset.populated = "true";

            const tsGender = new TomSelect(genderSel, {
                placeholder: "Select gender...",
                create: false,
                maxItems: 1,
                closeAfterSelect: true,
                plugins: { dropdown_input: {} },
                sortField: [
                    { field: "rank", direction: "asc" },
                    { field: "text", direction: "asc" },
                ],
                score(search) {
                    const base = this.getScoreFunction(search);
                    return item => {
                        let s = base(item);
                        if (item.rank === 0) s += 2;
                        return s;
                    };
                },
            });
            tsGender.on("change", validateForm);
        }

        const ethnicitySel = document.getElementById(`player_${i}_ethnicity`);
        if (ethnicitySel && !ethnicitySel.dataset.populated) {
            const ph = document.createElement("option");
            ph.value = "";
            ph.textContent = "Select ethnicity...";
            ph.disabled = true;
            ph.selected = true;
            ethnicitySel.appendChild(ph);

            ETHNICITIES.forEach(opt => {
                const o = document.createElement("option");
                o.value = opt.value;
                o.textContent = opt.text;
                ethnicitySel.appendChild(o);
            });
            ethnicitySel.dataset.populated = "true";

            const tsEth = new TomSelect(ethnicitySel, {
                placeholder: "Select ethnicity...",
                create: false,
                maxItems: 1,
                closeAfterSelect: true,
                plugins: { dropdown_input: {} },
                sortField: { field: "text", direction: "asc" },
            });
            tsEth.on("change", validateForm);
        }
    }, 0);
}

/* -----------------------------------------------------------
   Main: adjust number of blocks without erasing existing data
   ----------------------------------------------------------- */
function updatePlayerCount(count) {
    const wrapper = document.getElementById("players-wrapper");
    const display = document.getElementById("player-count-display");
    display.textContent = count;

    const current = wrapper.querySelectorAll(".player-block").length;

    /* 1.  Add blocks if slider increased */
    for (let i = current; i < count; i++) {
        buildPlayerBlock(i, wrapper);
    }

    /* 2.  Remove blocks from the end if slider decreased */
    for (let i = current; i > count; i--) {
        const last = wrapper.lastElementChild;
        if (last) wrapper.removeChild(last);
    }

    /* Register events for new buttons when creating blocks */
    registerNewEvents();
    
    /* 4.  Re-validate form so Continue button updates */
    validateForm();
    // --- PATTERN 2a: After validateForm() ---
    updateSaveBtn();
    // --- END PATTERN 2a ---
    // enableContinue() is now called by validateForm(), so no explicit call needed here

    // Disable autofill button if player count is 1
    if (autofillBtn) {
        autofillBtn.disabled = (count <= 1);
    }
    // Disable clear others button if player count is 1
    if (clearOthersBtn) {
        clearOthersBtn.disabled = (count <= 1);
    }
    updateClearButtonsState(); // Update clear buttons state after player count changes
}

function validateForm() {
    /* keep any other checks you need, then… */
    enableContinue();          // always recalc final state
}

const mbtiDescriptions = {
    "INTJ": "INTJ – Architect",
    "INTP": "INTP – Logician",
    "ENTJ": "ENTJ – Commander",
    "ENTP": "ENTP – Debater",
    "INFJ": "INFJ – Advocate",
    "INFP": "INFP – Mediator",
    "ENFJ": "ENFJ – Protagonist",
    "ENFP": "ENFP – Campaigner",
    "ISTJ": "ISTJ – Logistician",
    "ISFJ": "ISFJ – Defender",
    "ESTJ": "ESTJ – Executive",
    "ESFJ": "ESFJ – Consul",
    "ISTP": "ISTP – Virtuoso",
    "ISFP": "ISFP – Adventurer",
    "ESTP": "ESTP – Entrepreneur",
    "ESFP": "ESFP – Entertainer"
};

function updateMBTILabel(index) {
    const ie = document.querySelector(`[name="player_${index}_mbti_ie"]`).value;
    const sn = document.querySelector(`[name="player_${index}_mbti_sn"]`).value;
    const tf = document.querySelector(`[name="player_${index}_mbti_tf"]`).value;
    const jp = document.querySelector(`[name="player_${index}_mbti_jp"]`).value;

    const labelDiv = document.getElementById(`mbti-label-${index}`);

    if (ie && sn && tf && jp) {
        const mbti = ie + sn + tf + jp;
        labelDiv.textContent = mbtiDescriptions[mbti] || `Unknown type: ${mbti}`;
    } else {
        labelDiv.textContent = "";
    }
}

function updateAgeLabel(index) {
    const slider = document.getElementById(`player_${index}_age_slider`);
    const display = document.getElementById(`player_${index}_age_display`);
    display.textContent = slider.value;
}

async function validateNameLLM(inputEl, iconEl) {
    const name = inputEl.value.trim();
    if (!name) {                       // empty => invalid
        iconEl.className = "status-icon";
        iconEl.textContent = "";  
        inputEl.classList.remove("name-valid", "name-invalid");
        inputEl.setCustomValidity("");
        validateForm(); 
        enableContinue(); // ← NEW: Always recalc final state after validation
        updateSaveBtn();
        return;
    }
    iconEl.textContent = "...";
    try {
        const r = await fetch("/api/validate_name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        const { valid } = await r.json();
        if (valid) {
            iconEl.className = "status-icon valid";
            iconEl.innerHTML = "✓ <span class='status-msg'>Name accepted</span>";
            inputEl.classList.add("name-valid");
            inputEl.classList.remove("name-invalid");
            inputEl.setCustomValidity("");
        } else {
            iconEl.className = "status-icon invalid";
            iconEl.innerHTML = "✗ <span class='status-msg'>Name rejected</span>";
            inputEl.classList.add("name-invalid");
            inputEl.classList.remove("name-valid");
            inputEl.setCustomValidity("Name rejected by validator");
        }
    } catch {
        iconEl.className = "status-icon invalid";
        iconEl.textContent = "✗";
        inputEl.classList.add("name-invalid");
        inputEl.classList.remove("name-valid");
        inputEl.setCustomValidity("LLM error");
    }
    validateForm();                    // updates indicators
    enableContinue();                  // ← NEW
    updateSaveBtn();
}

async function validateProfessionLLM(inputEl, iconEl) {
    const profession = inputEl.value.trim();
    if (!profession) {
        iconEl.className = "status-icon";
        iconEl.innerHTML = "";
        inputEl.classList.remove("name-valid", "name-invalid");
        inputEl.setCustomValidity("");
        validateForm(); 
        enableContinue(); // ← NEW: Always recalc final state after validation
        updateSaveBtn();
        return;
    }
    iconEl.innerHTML = "...";
    try {
        const r = await fetch("/api/validate_profession", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profession })
        });
        const { valid } = await r.json();
        if (valid) {
            iconEl.className = "status-icon valid";
            iconEl.innerHTML = "✓ <span class='status-msg'>Profession accepted</span>";
            inputEl.classList.add("name-valid");
            inputEl.classList.remove("name-invalid");
            inputEl.setCustomValidity("");
        } else {
            iconEl.className = "status-icon invalid";
            iconEl.innerHTML = "✗ <span class='status-msg'>Profession rejected</span>";
            inputEl.classList.add("name-invalid");
            inputEl.classList.remove("name-valid");
            inputEl.setCustomValidity("Profession rejected");
        }
    } catch {
        iconEl.className = "status-icon invalid";
        iconEl.innerHTML = "✗";
        inputEl.classList.add("name-invalid");
        inputEl.setCustomValidity("LLM error");
    }
    validateForm();
    enableContinue(); // ← NEW
    updateSaveBtn();
}

async function validateItemsLLM(inputEl, iconEl) {
    const raw = inputEl.value.trim();
    if (!raw) {
        iconEl.className = "status-icon";
        iconEl.innerHTML = "";
        inputEl.classList.remove("name-valid", "name-invalid");
        inputEl.setCustomValidity("");
        validateForm(); 
        enableContinue(); // ← NEW: Always recalc final state after validation
        updateSaveBtn();
        return;
    }
    iconEl.innerHTML = "...";
    try {
        const r = await fetch("/api/validate_items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: raw })
        });
        const { valid } = await r.json();
        if (valid) {
            iconEl.className = "status-icon valid";
            iconEl.innerHTML = "✓ <span class='status-msg'>Items accepted</span>";
            inputEl.classList.add("name-valid");
            inputEl.setCustomValidity("");
        } else {
            iconEl.className = "status-icon invalid";
            iconEl.innerHTML = "✗ <span class='status-msg'>Items rejected</span>";
            inputEl.classList.add("name-invalid");
            inputEl.setCustomValidity("Items rejected");
        }
    } catch {
        iconEl.className = "status-icon invalid";
        iconEl.innerHTML = "✗";
        inputEl.classList.add("name-invalid");
        inputEl.setCustomValidity("LLM error");
    }
    validateForm();
    enableContinue(); // ← NEW
    updateSaveBtn();
}

async function validateDescriptionLLM(inputEl, iconEl) {
    const txt = inputEl.value.trim();
    if (!txt) {
        iconEl.className = "status-icon";
        iconEl.innerHTML = "";
        inputEl.classList.remove("name-valid", "name-invalid");
        inputEl.setCustomValidity("");
        validateForm(); 
        enableContinue(); // ← NEW: Always recalc final state after validation
        updateSaveBtn();
        return;
    }
    iconEl.innerHTML = "...";
    try {
        const r = await fetch("/api/validate_description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: txt })
        });
        const { valid } = await r.json();
        if (valid) {
            iconEl.className = "status-icon valid";
            iconEl.innerHTML = "✓ <span class='status-msg'>Description accepted</span>";
            inputEl.classList.add("name-valid");
            inputEl.setCustomValidity("");
        } else {
            iconEl.className = "status-icon invalid";
            iconEl.innerHTML = "✗ <span class='status-msg'>Description rejected</span>";
            inputEl.classList.add("name-invalid");
            inputEl.setCustomValidity("Description rejected");
        }
    } catch {
        iconEl.className = "status-icon invalid";
        iconEl.innerHTML = "✗";
        inputEl.classList.add("name-invalid");
        inputEl.setCustomValidity("LLM error");
    }
    validateForm();
    enableContinue(); // ← NEW
    updateSaveBtn();
}

function updateCharCount(textarea, counterSpan) {
    const len = textarea.value.length;
    counterSpan.textContent = `${len}/2000`;

    // Remove all classes first to ensure clean state
    counterSpan.classList.remove("invalid", "valid");
    textarea.classList.remove("textarea-invalid", "textarea-valid");
    textarea.setCustomValidity(""); // Clear any previous custom validity

    if (len === 0) {
        // Explicitly set default styles for empty state
        textarea.style.borderColor = '#ccc'; // Set to a neutral grey
        textarea.style.color = '#000'; // Set text color to black
        if (counterSpan) { // Ensure counterSpan exists before setting style
            counterSpan.style.color = '#000'; // Set counter text color to black
        }
    } else if (len > 0 && len < 20) {
        // Invalid: less than 20 characters (but not empty)
        counterSpan.classList.add("invalid");
        textarea.classList.add("textarea-invalid");
        textarea.setCustomValidity("Minimum 20 characters required.");
        textarea.style.borderColor = ''; // Revert to CSS for invalid
        textarea.style.color = ''; // Revert to CSS for invalid
        if (counterSpan) {
            counterSpan.style.color = ''; // Revert to CSS for invalid
        }
    } else if (len >= 20 && len <= 2000) {
        // Valid: between 20 and 2000 characters
        counterSpan.classList.add("valid");
        textarea.classList.add("textarea-valid");
        textarea.style.borderColor = ''; // Revert to CSS for valid
        textarea.style.color = ''; // Revert to CSS for valid
        if (counterSpan) {
            counterSpan.style.color = ''; // Revert to CSS for valid
        }
    } else if (len > 2000) {
        // Invalid: exceeds 2000 characters
        counterSpan.classList.add("invalid");
        textarea.classList.add("textarea-invalid");
        textarea.setCustomValidity("Maximum 2000 characters allowed.");
        textarea.style.borderColor = ''; // Revert to CSS for invalid
        textarea.style.color = ''; // Revert to CSS for invalid
        if (counterSpan) {
            counterSpan.style.color = ''; // Revert to CSS for invalid
        }
    }
}

function weightedPick(list, weightField, rand = Math.random()) {
    let acc = 0;
    for (const row of list) {
        acc += row[weightField];
        if (rand <= acc) return row;
    }
    return list[list.length - 1];          // fallback
}

document.getElementById("autofill-btn").addEventListener("click", async () => {
    showOverlay(); // Always show overlay when autofill is clicked
    const count = +document.getElementById("player-count").value;
    const promises = [];
    for (let i = 1; i < count; i++) promises.push(autofillPlayer(i));

    try { await Promise.all(promises); }
    finally {
        updateClearButtonsState(); // Update clear buttons state after autofill
        hideOverlay(); // Hide overlay after all autofill operations complete
    }
});

document.getElementById("clear-others-btn").addEventListener("click", async () => {
    showOverlay(); // Always show overlay when clear others is clicked
    // Add a small delay to allow the overlay to render
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay

    const count = parseInt(document.getElementById("player-count").value, 10);
    // Clear all players except player 0 (index 0)
    for (let i = 1; i < count; i++) {
        clearAndUnlockPlayer(i); // Call synchronous clear function
    }
    setTimeout(() => hideOverlay(), 0); // Defer hideOverlay to allow UI to update
});

document.getElementById("autofill-me-btn")
    ?.addEventListener("click", async () => {
        showOverlay(); // Always show overlay when autofill me is clicked
        // Add a small delay to allow the overlay to render
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        try { await autofillPlayer(0); } // Await the autofill operation
        finally {
            updateClearButtonsState(); // Update clear buttons state after autofill
            hideOverlay(); // Hide overlay after autofill operation completes
        }
    });

document.getElementById("clear-me-btn")
        ?.addEventListener("click", async () => {
            showOverlay(); // Always show overlay when clear me is clicked
            // Add a small delay to allow the overlay to render
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
            clearAndUnlockPlayer(0); // Call synchronous clear function
            setTimeout(() => hideOverlay(), 0); // Defer hideOverlay to allow UI to update
        });

function autofillPlayer(playerIndex) {
    return new Promise(resolve => {
        const age = pickAge();
        if (age === null) return;

        updateAgeUI(playerIndex, age);

        const gender = pickGender();
        updateGenderUI(playerIndex, gender);

        const ethRow = pickEthnicity();
        if (!ethRow) return;

        updateEthnicityUI(playerIndex, ethRow.ethnicity);
        const languages = pickLanguages(ethRow.ethnicity, ethRow);
        updateLanguagesUI(playerIndex, languages);

        const mbtiType = pickMBTIType();
        updateMBTIUI(playerIndex, mbtiType);

        // resolve once the last async piece finishes
        handleProfessionAutofill(playerIndex, age, gender, ethRow)
            .finally(resolve);
    });
}

/* ---------- Utility Functions ---------- */

function pickAge() {
    if (!AGE_DIST.length) {
        alert("Age data not loaded.");
        return null;
    }
    const r = Math.random();
    let acc = 0;
    for (const row of AGE_DIST) {
        acc += row.Probability;
        if (r <= acc) return row.Age;
    }
    return 25; // default fallback
}

function updateAgeUI(index, age) {
    const slider = document.getElementById(`player_${index}_age_slider`);
    const display = document.getElementById(`player_${index}_age_display`);
    slider.value = age;
    display.textContent = age;
}

function pickGender() {
    return Math.random() < 0.5 ? "Male" : "Female";
}

function updateGenderUI(index, gender) {
    const select = document.getElementById(`player_${index}_gender`);
    if (select?.tomselect) select.tomselect.setValue(gender, true);
}

function pickEthnicity() {
    if (!ETH_DIST.length) {
        alert("Ethnicity data not loaded.");
        return null;
    }
    return weightedPick(
        ETH_DIST,
        "usa_population",
        Math.random() * ETH_DIST.reduce((sum, r) => sum + r.usa_population, 0)
    );
}

function updateEthnicityUI(index, ethnicity) {
    const select = document.getElementById(`player_${index}_ethnicity`);
    if (select?.tomselect) select.tomselect.setValue(ethnicity, true);
}

function pickLanguages(ethnicity, row) {
    const langs = [row.primary_language];
    const r = Math.random();
    const threshold = (ethnicity === "White" || ethnicity === "Black or African American") ? 0.78 : 0.18;
    if (r >= threshold) {
        langs.push(row.secondary_language);
        if (r >= 0.98) langs.push(row.tertiary_language);
    }
    return langs.filter(lang => lang); // Filter out any null/undefined languages
}

function updateLanguagesUI(index, langs) {
    const sel = document.getElementById(`player_${index}_native_languages`);
    if (sel?.tomselect) {
        langs.forEach(l => {
            if (l && !sel.tomselect.options[l]) { // Only add if language exists and not already an option
                sel.tomselect.addOption({ value: l, text: l });
            }
        });
        sel.tomselect.setValue(langs.filter(Boolean), true); // Filter out any null/undefined entries before setting value
    }
}

/* ---------- Profession Handling ---------- */
function handleProfessionAutofill(index, age, gender, ethRow) {
    const input = document.getElementById(`player_${index}_profession`);

    // ---------- EARLY-EXIT PATHS ----------
    if (!JOB_ROLES || !Object.keys(JOB_ROLES).length) {
        input.value = "";
        validateForm();
        updateSaveBtn();
        return Promise.resolve();
    }

    if (age < 16) return setRoleAndValidate("CHILD");
    if (age < 22 && Math.random() < 0.5) return setRoleAndValidate("STUDENT");

    const retireChance = (age >= 80) ? 0.95 : (age >= 67) ? 0.90 : (age >= 62) ? 0.50 : 0.0;
    if (Math.random() < retireChance) return setRoleAndValidate("RETIREE");

    // ---------- NORMAL ASYNC PATH ----------
    const category = pickJobCategory(ethRow);
    const roleType = pickRandom(JOB_ROLES[category]);

    return fetch("/api/generate_job_title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, gender, role_type: roleType })
    })
    .then(r => r.json())
    .then(({ title }) => {
        const finalTitle = title || roleType;
        input.value = finalTitle;
        validateProfessionLLM(input, document.getElementById(`prof_status_${index}`));
        return generateItems(index, age, gender, finalTitle); // wait for items to complete
    })
    .then(() => {
        validateForm();
        updateSaveBtn();
    })
    .catch(error => {
        console.error("Error generating job title:", error);
        input.value = roleType; // fallback
        validateProfessionLLM(input, document.getElementById(`prof_status_${index}`));
        return generateItems(index, age, gender, roleType)  // fallback path
            .then(() => {
                validateForm();
                updateSaveBtn();
            });
    });

    // ---------- HELPER ----------
    function setRoleAndValidate(role) {
        input.value = role;
        validateProfessionLLM(input, document.getElementById(`prof_status_${index}`));
        return generateItems(index, age, gender, role).then(() => {
            validateForm();
            updateSaveBtn();
        });
    }
}

function pickJobCategory(row) {
    const categories = [
        "management_professional",
        "sales_office",
        "service",
        "production_transportation_material_moving",
        "technology_financial"
    ];
    // Scale the random number to the total sum of all category probabilities from the row
    const totalProbability = categories.reduce((sum, cat) => sum + (row[cat] || 0), 0);
    const rand = Math.random() * totalProbability; // Use totalProbability to scale random number
    let acc = 0;
    for (const cat of categories) {
        acc += (row[cat] || 0); // Ensure no NaN issues if a category is missing
        if (rand <= acc) return cat;
    }
    return categories[0]; // fallback
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickMBTIType() {
    const rows  = Object.entries(MBTI_DISTRIBUTION)
                        .map(([t, w]) => ({ t, w }));
    const total = rows.reduce((sum, r) => sum + r.w, 0);
    // draw a random number on the *same* scale as the weights
    return weightedPick(rows, "w", Math.random() * total).t;
}

function updateMBTIUI(index, type) {
    const map = {
        ie: type[0],
        sn: type[1],
        tf: type[2],
        jp: type[3]
    };
    for (const key in map) {
        const sel = document.querySelector(
            `[name="player_${index}_mbti_${key}"]`
        );
        if (sel) sel.value = map[key];
    }
    updateMBTILabel(index);
}

/* ---------- lock / unlock helpers ---------- */
function lockPlayer(index) {
    const block = document.querySelectorAll(".player-block")[index];
    if (!block) return;
    block.querySelectorAll("input, textarea").forEach(el => {
        if (el.type !== "range") el.readOnly = true;
    });
    const rng = block.querySelector('input[type="range"]');
    if (rng) rng.disabled = true;
    block.querySelectorAll("select").forEach(el => {
        if (el.tomselect) el.tomselect.disable();
        else el.disabled = true;
    });
}

function clearAndUnlockPlayer(index) {
    console.log(`clearAndUnlockPlayer called for index: ${index}`);
    const block = document.querySelectorAll(".player-block")[index];
    if (!block) {
        console.log(`No player block found for index: ${index}`);
        return;
    }
    console.log(`Player block found for index ${index}:`, block);

    // 1) clear textual values
    block.querySelectorAll("input[type=text]").forEach(el => { 
        console.log(`Clearing input: ${el.id}, current value: "${el.value}"`);
        el.value = ""; 
        el.readOnly = false; 
        el.classList.remove("name-valid", "name-invalid");    
        console.log(`Input cleared: ${el.id}, new value: "${el.value}"`);
    });
    block.querySelectorAll("textarea").forEach(el => {
        console.log(`Clearing textarea: ${el.id}, current value: "${el.value}"`);
        el.value = ""; 
        el.readOnly = false;
        // Classes and styles will be handled by updateCharCount
        // el.classList.remove("textarea-invalid", "textarea-valid"); 
        // el.style.borderColor = ''; 
        // el.style.color = ''; 

        // Find the corresponding counter span and reset its state
        const parts = el.id.split('_'); // e.g., ["player", "0", "items"] or ["player", "0", "phys"]
        const playerIndex = parts[1];
        const type = parts[2]; // "items" or "phys"
        const counterId = `${type}_counter_${playerIndex}`; // e.g., "items_counter_0"
        const counterEl = document.getElementById(counterId);
        // if (counterEl) { // No need for this check, updateCharCount handles it
        //     console.log(`Resetting counter for ${el.id}: ${counterEl.id}`);
        //     counterEl.classList.remove("invalid", "valid"); 
        //     counterEl.style.color = ''; 
        // }
        // Explicitly call updateCharCount to reset the counter text and classes
        updateCharCount(el, counterEl);
        autoExpandTextarea(el); // Add this line to reset textarea height
        console.log(`Textarea cleared: ${el.id}, new value: "${el.value}"`);
    });


    // reset range slider to default 25
    const slider = block.querySelector('input[type="range"]');
    if (slider) { 
        console.log(`Resetting slider for ${index}: current value ${slider.value}`);
        slider.value = "25"; 
        block.querySelector('span[id$="_age_display"]').textContent = "25"; 
        slider.disabled = false;             // allow user to move it again
        console.log(`Slider reset for ${index}: new value ${slider.value}`);
    }

    // 2) unlock and clear selects (plain <select> + TomSelect)
    block.querySelectorAll("select").forEach(sel => {
        console.log(`Clearing select: ${sel.id}`);
        if (sel.tomselect) {
            sel.tomselect.enable();
            sel.tomselect.clear();
            console.log(`TomSelect cleared for ${sel.id}`);
        } else {
            sel.disabled = false;
            sel.selectedIndex = 0;
            console.log(`Standard select cleared for ${sel.id}`);
        }
    });

    // 3) wipe status icons, counters, MBTI label
    block.querySelectorAll(".status-icon").forEach(icon => { 
        console.log(`Clearing status icon: ${icon.id}`);
        icon.className = "status-icon"; 
        icon.innerHTML = ""; 
    });
    const mbtiLbl = block.querySelector(".mbti-label");
    if (mbtiLbl) {
        console.log(`Clearing MBTI label for ${index}`);
        mbtiLbl.textContent = "";
    }

    console.log(`Calling validateForm() from clearAndUnlockPlayer(${index})`);
    validateForm();
    console.log(`Calling updateSaveBtn() from clearAndUnlockPlayer(${index})`);
    updateSaveBtn();
    console.log(`Calling updateClearButtonsState() from clearAndUnlockPlayer(${index})`);
    updateClearButtonsState(); // Update clear buttons state after clearing a player
    console.log(`clearAndUnlockPlayer(${index}) finished.`);
}

function isPlayerBlockEmpty(index) {
    const player = getPlayerData(index);
    const props = ["name", "gender", "ethnicity", "profession", "items_carried", "physical_description"];
    for (const prop of props) {
        if (player[prop] && player[prop].toString().trim() !== '') {
            return false;
        }
    }
    if (player.age !== '25') return false; // Default age 25
    if (player.native_languages?.length > 0) return false;
    if (player.personality_traits?.mbti && player.personality_traits.mbti.trim() !== '') return false;
    return true;
}

function updateClearButtonsState() {
    const playerCount = parseInt(document.getElementById("player-count").value, 10);

    if (clearMeBtn) {
        // "Clear Me" button:
        // ON if any data is entered into inputs for user form (player 0).
        // OFF if every input for user form (player 0) is empty.
        clearMeBtn.disabled = isPlayerBlockEmpty(0);
    }

    if (clearOthersBtn) {
        // "Clear Other Players" button:
        // ON if player-count is 2 or more AND at least one of the "other" player forms (1 to N-1) has data.
        // OFF if player-count is 1, OR if player-count is 2 or more but all "other" player forms are empty.
        if (playerCount <= 1) {
            clearOthersBtn.disabled = true;
        } else {
            let anyOtherPlayerHasData = false;
            for (let i = 1; i < playerCount; i++) { // Iterate for players 1 to playerCount-1
                if (!isPlayerBlockEmpty(i)) {
                    anyOtherPlayerHasData = true;
                    break;
                }
            }
            clearOthersBtn.disabled = !anyOtherPlayerHasData;
        }
    }

    // Handle individual "Clear Player X" buttons (e.g., "Clear Player 2")
    // This logic remains as it was, assuming it's correct or will be addressed separately.
    // It disables "Clear Player i" if player i's form is empty.
    for (let i = 1; i < playerCount; i++) {
        const clearPlayerBtn = document.getElementById(`clear-player-${i}`);
        if (clearPlayerBtn) {
            clearPlayerBtn.disabled = isPlayerBlockEmpty(i);
        }
    }

    // Handle "Clear All Data" button
    // ON if "user" OR "players" key is present in game_config.json
    // OFF if NEITHER "user" NOR "players" key is present.
    if (clearAllBtn) {
        const hasUserDataInConfig = gameConfig && gameConfig.user && Object.keys(gameConfig.user).length > 0;
        const hasPlayersDataInConfig = gameConfig && gameConfig.players && gameConfig.players.length > 0;
        clearAllBtn.disabled = !(hasUserDataInConfig || hasPlayersDataInConfig);
    }

    // Handle "Clear User Data Only" button
    // ON if "user" key is present in game_config.json
    // OFF if "user" key is NOT present.
    if (clearUserDataBtn) {
        const hasUserDataInConfig = gameConfig && gameConfig.user && Object.keys(gameConfig.user).length > 0;
        clearUserDataBtn.disabled = !hasUserDataInConfig;
    }

    // Handle "Clear All Player Data Only" button
    // ON if "players" key is present in game_config.json
    // OFF if "players" key is NOT present.
    if (clearPlayersDataBtn) {
        const hasPlayersDataInConfig = gameConfig && gameConfig.players && gameConfig.players.length > 0;
        clearPlayersDataBtn.disabled = !hasPlayersDataInConfig;
    }
}

/* ---------- Items Handling ---------- */
function generateItems(index, age, gender, job) {
    return new Promise(resolve => {
        const input   = document.getElementById(`player_${index}_items`);
        const status  = document.getElementById(`items_status_${index}`);
        const counter = document.getElementById(`items_counter_${index}`);

        fetch("/api/generate_items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ age, gender, job })
        })
        .then(r => r.json())
        .then(data => {
            const items = data.items;
            if (items) {
                input.value = items;
            } else {
                input.value = "";
            }
            updateCharCount(input, counter);
            autoExpandTextarea(input); // Add this line
            validateItemsLLM(input, status);

            /* ---- generate physical description ---- */
            const physInp   = document.getElementById(`player_${index}_phys`);
            const physStat  = document.getElementById(`phys_status_${index}`);
            const physCount = document.getElementById(`phys_counter_${index}`);

            return fetch("/api/generate_description", {
                method : "POST",
                headers: { "Content-Type":"application/json" },
                body   : JSON.stringify({
                    age, gender,
                    ethnicity: document.getElementById(`player_${index}_ethnicity`).tomselect.getValue(),
                    job,
                    items: input.value
                })
            })
            .then(r => r.json())
            .then(({ desc }) => {
                physInp.value = desc || "";
                updateCharCount(physInp, physCount);
                autoExpandTextarea(physInp); // Add this line
                validateDescriptionLLM(physInp, physStat);
                validateForm();
                updateSaveBtn();
            })
            .catch(error => {
                console.error("Error generating description:", error);
                physInp.value = "";
                updateCharCount(physInp, physCount);
                autoExpandTextarea(physInp); // Add this line
                validateDescriptionLLM(physInp, physStat);
                validateForm();
                updateSaveBtn();
            });
        })
        .then(() => {
            /* ---- generate character name ---- */
            const nameInp  = document.getElementById(`player_${index}_name`);
            const nameStat = document.getElementById(`name_status_${index}`);
            const birthYear = new Date().getFullYear() - age;

            return fetch("/api/generate_name", {
                method : "POST",
                headers: { "Content-Type":"application/json" },
                body   : JSON.stringify({
                    gender,
                    ethnicity: document
                        .getElementById(`player_${index}_ethnicity`)
                        .tomselect.getValue(),
                    year: birthYear
                })
            })
            .then(r => r.json())
            .then(({ name }) => {
                if (name) {
                    nameInp.value = name;
                    validateNameLLM(nameInp, nameStat);
                }
                lockPlayer(index);
                validateForm();
                updateSaveBtn();
            })
            .catch(error => {
                console.error("Error generating name:", error);
                validateForm();
                updateSaveBtn();
            });
        })
        .catch(error => {
            console.error("Error generating items:", error);
            input.value = "";
            updateCharCount(input, counter);
            validateItemsLLM(input, status);
            validateForm();
            updateSaveBtn();
        })
        .finally(() => resolve());  // <- always resolve the promise
    });
}

function autoExpandTextarea(textarea) {
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = (textarea.scrollHeight) + 'px'; // Set height to scrollHeight
    // If scrollHeight exceeds max-height, overflow-y will become auto due to CSS
}

// Initial event registration
document.addEventListener("DOMContentLoaded", registerNewEvents);
