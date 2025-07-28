// Game State Constants
const dangerIndicatorcolors = [
  "#4caf50",  // Tier 0  (Peaceful)
  "#ffc107",  // Tier 1  (Cautious)
  "#ff9800",  // Tier 2  (Wary)
  "#f44336",  // Tier 3  (Imminent Danger)
  "#6a0dad"   // Tier 4  (Critical)
];

const dangerIndicatorEmojis = ["😇","⚠️","👀","🚨","💀"];
const dangerIndicatorLabels = ["Peaceful", "Cautious", "Wary", "Imminent Danger", "Critical"];

const timeOfDayLabels = [
  "Just Before Sunrise",
  "Sunrise",
  "Early Morning",
  "Late Morning",
  "Noonish",
  "Early Afternoon",
  "Late Afternoon",
  "Evening",
  "Sunset",
  "Dusk",
  "Nightfall",
  "Night (Moonlit)",
  "Night (Cloudy)",
  "Unknown"
];

const timeOfDaySymbols = [
  "🌙",
  "🌅",
  "🌅",
  "☀️",
  "☀️",
  "☀️",
  "☀️",
  "🌇",
  "🌇",
  "🌆",
  "🌙",
  "🌕",
  "🌑",
  "❓"
];

const timeOfDayColors = [
  "#980c8e",
  "#4c8892",
  "#a94fe6",
  "#ef76ff",
  "#2d5d93",
  "#19ef80",
  "#4045d7",
  "#0b8bd8",
  "#d0e1dc",
  "#ecafa7",
  "#841f1f",
  "#c4b2b5",
  "#3a4f20",
  "#666666"
];

const environmentAccuracyModConditions = [
  "Clear skies",
  "Light clouds",
  "Heavy overcast",
  "Rain",
  "Snow",
  "Indoors/Dark"
];

const environmentAccuracyModAccuracyImpact = [
  "+++ Accurate",
  "++ Moderate",
  "-- Inaccurate",
  "--- Poor",
  "--- Poor",
  "??? Unknown"
];

const environmentAccuracyModSymbols = [
  "☀️",
  "⛅",
  "☁️",
  "🌧️",
  "🌨️",
  "❓"
];

const environmentAccuracyModColors = [
  "#71aff3",
  "#cef38f",
  "#730f70",
  "#de4eda",
  "#b46d3c",
  "#666666"
];

const locationTerrainLabels = [
  "Urban/Settlement",
  "Palace/Temple",
  "Farmland",
  "Wilderness/Forest",
  "Grassland/Steppe",
  "Desert",
  "Mountainous",
  "Riverbank/Lakeside",
  "Swamp/Marsh",
  "Coastal/Beach",
  "Seafaring",
  "Cave/Underground",
  "Indoors/Enclosed",
  "Battlefield",
  "Ruins/Abandoned Site",
  "Nomadic Encampment",
  "Quarry/Mine",
  "Arctic/Tundra",
  "Marketplace",
  "Unknown/Obscured",
  "Cliffside/High Ridge",
  "Burial Ground/Necropolis",
  "Caravan Route/Trade Path",
  "Fortress/Citadel",
  "Field Camp/Military Camp",
  "Workshop/Smithy",
  "Monastery/Scholarly Site",
  "Agricultural Terrace",
  "Bridge/Crossing Point",
  "Festival Grounds",
  "Waterfall/Cascade",
  "Jungle/Rainforest",
  "Volcanic Region",
  "Salt Flat/Desert Basin",
  "Cave Shrine/Hidden Temple",
  "River Delta/Estuary"
];

const locationTerrainSymbols = [
  "🏘️", "🏯", "🌾", "🌲", "🌿", "🏜️", "🏔️", "🚣", "🐊", "🌊",
  "⛵", "⛏️", "🏛️", "⚔️", "🏚️", "🏕️", "🪨", "❄️", "🏷️", "❓",
  "🪨", "⚱️", "🐪", "🏰", "🛡️", "🔨", "📜", "🌱", "🌉", "🎪",
  "💧", "🐒", "🌋", "🧂", "🛕", "🐟"
];

const locationTerrainColors = [
  "#8e9aaf", "#d4a373", "#c9cba3", "#6a994e", "#a3b18a", "#e5989b",
  "#7f4f24", "#74c69d", "#6c757d", "#468faf", "#5fa8d3", "#4d4d4d",
  "#d9bf77", "#b02a30", "#7f8c8d", "#c2c5aa", "#939597", "#aad9e6",
  "#ffc107", "#6c757d", "#b3a580", "#a0937d", "#ccb59c", "#7a7f83",
  "#ad9d8f", "#c97b63", "#918c8c", "#aecb92", "#90caf9", "#f7c59f",
  "#67b5d1", "#1e5631", "#a33c3c", "#dcdcdc", "#9d8570", "#66cdaa"
];

const temperatureTierNames = [
  "Frigid",
  "Freezing",
  "Cold",
  "Cool",
  "Mild",
  "Warm",
  "Hot",
  "Scorching"
];

const temperatureSymbols = [
  "🧊",
  "❄️",
  "❄️",
  "💧",
  "💧",
  "♨️",
  "♨️",
  "🔥"
];

const temperatureColors = [
  "#c5d933",
  "#64a54c",
  "#1a3c2e",
  "#22ba03",
  "#d14fbc",
  "#182971",
  "#419472",
  "#35b2d0"
];

// DOM State Controller Class
class GameStateController {
    constructor() {
        // Cache DOM elements
        this.elements = {
            // Danger indicator elements
            dangerEmoji: document.getElementById("danger-emoji"),
            dangerLabel: document.getElementById("danger-label"),
            dangerGlow: document.getElementById("danger-glow"),
            
            // Time of day elements
            timeOfDayEmoji: document.getElementById("time-of-day-emoji"),
            timeOfDayGlow: document.getElementById("time-of-day-glow"),
            gridItem2: document.querySelector(".grid-item-2"),
            hoverText: document.getElementById("hover-text"),
            
            // Environment elements
            gridItem3Right: document.querySelector(".grid-item-3-right"),
            environmentGlow: document.getElementById("environment-glow"),
            gridItem3: document.querySelector(".grid-item-3"),
            hoverText3: document.getElementById("hover-text-3"),
            
            // Location/terrain elements
            locationTerrainGlow: document.getElementById("location-terrain-glow"),
            gridItem10Right: document.querySelector(".grid-item-10-right"),
            gridItem10: document.querySelector(".grid-item-10"),
            hoverText10: document.getElementById("hover-text-10"),
            
            // Temperature elements
            temperatureEmoji: document.getElementById("temperature-emoji"),
            temperatureGlow: document.getElementById("temperature-glow"),
            gridItem11: document.querySelector(".grid-item-11"),
            hoverText11: document.getElementById("hover-text-11"),
            
            // TESA elements
            perceivedTime: document.getElementById("perceived-time"),
            temporalDrift: document.getElementById("temporal-drift"),
            
            // Other UI elements
            gridItem5Right: document.querySelector(".grid-item-5-right"),
            gridItem13Right: document.querySelector(".grid-item-13-right"),
            gridItem6Right: document.querySelector(".grid-item-6-right"),
            gridItem14Right: document.querySelector(".grid-item-14-right"),
            
            // Chat elements
            chatInput: document.getElementById("chat-input"),
            chatWindow: document.querySelector(".chat-window")
        };
        
        // Organize constants
        this.constants = {
            danger: {
                colors: dangerIndicatorcolors,
                emojis: dangerIndicatorEmojis,
                labels: dangerIndicatorLabels
            },
            timeOfDay: {
                labels: timeOfDayLabels,
                symbols: timeOfDaySymbols,
                colors: timeOfDayColors
            },
            environment: {
                conditions: environmentAccuracyModConditions,
                accuracyImpact: environmentAccuracyModAccuracyImpact,
                symbols: environmentAccuracyModSymbols,
                colors: environmentAccuracyModColors
            },
            location: {
                labels: locationTerrainLabels,
                symbols: locationTerrainSymbols,
                colors: locationTerrainColors
            },
            temperature: {
                names: temperatureTierNames,
                symbols: temperatureSymbols,
                colors: temperatureColors
            }
        };
        
        this.setupHoverEvents();
    }
    
    // Danger Indicator Methods
    setDangerIndex(index) {
        if (index < 0 || index >= this.constants.danger.emojis.length) {
            console.error(`Invalid danger index: ${index}`);
            return false;
        }
        
        this.elements.dangerEmoji.textContent = this.constants.danger.emojis[index];
        this.elements.dangerLabel.textContent = this.constants.danger.labels[index];
        this.elements.dangerGlow.style.setProperty('--glow-color', this.constants.danger.colors[index]);
        sessionStorage.setItem('dangerIndex', index);
        return true;
    }
    
    getDangerIndex() {
        return parseInt(sessionStorage.getItem('dangerIndex')) || 0;
    }
    
    getDangerData() {
        const index = this.getDangerIndex();
        return {
            index: index,
            emoji: this.constants.danger.emojis[index],
            label: this.constants.danger.labels[index],
            color: this.constants.danger.colors[index]
        };
    }
    
    // Time of Day Methods
    setTimeOfDayIndex(index) {
        if (index < 0 || index >= this.constants.timeOfDay.symbols.length) {
            console.error(`Invalid time of day index: ${index}`);
            return false;
        }
        
        this.elements.timeOfDayEmoji.textContent = this.constants.timeOfDay.symbols[index];
        this.elements.timeOfDayGlow.style.setProperty('--time-glow-color', this.constants.timeOfDay.colors[index]);
        sessionStorage.setItem('timeOfDayIndex', index);
        return true;
    }
    
    getTimeOfDayIndex() {
        return parseInt(sessionStorage.getItem('timeOfDayIndex')) || 0;
    }
    
    getTimeOfDayData() {
        const index = this.getTimeOfDayIndex();
        return {
            index: index,
            label: this.constants.timeOfDay.labels[index],
            symbol: this.constants.timeOfDay.symbols[index],
            color: this.constants.timeOfDay.colors[index]
        };
    }
    
    // Environment Methods
    setEnvironmentIndex(index) {
        if (index < 0 || index >= this.constants.environment.symbols.length) {
            console.error(`Invalid environment index: ${index}`);
            return false;
        }
        
        this.elements.gridItem3Right.textContent = this.constants.environment.symbols[index];
        this.elements.environmentGlow.style.setProperty('--environment-glow-color', this.constants.environment.colors[index]);
        sessionStorage.setItem('envModIndex', index);
        return true;
    }
    
    getEnvironmentIndex() {
        return parseInt(sessionStorage.getItem('envModIndex')) || 0;
    }
    
    getEnvironmentData() {
        const index = this.getEnvironmentIndex();
        return {
            index: index,
            condition: this.constants.environment.conditions[index],
            accuracyImpact: this.constants.environment.accuracyImpact[index],
            symbol: this.constants.environment.symbols[index],
            color: this.constants.environment.colors[index]
        };
    }
    
    // Location/Terrain Methods
    setLocationIndex(index) {
        if (index < 0 || index >= this.constants.location.symbols.length) {
            console.error(`Invalid location index: ${index}`);
            return false;
        }
        
        this.elements.gridItem10Right.textContent = this.constants.location.symbols[index];
        this.elements.locationTerrainGlow.style.setProperty('--location-terrain-glow-color', this.constants.location.colors[index]);
        sessionStorage.setItem('locationTerrainIndex', index);
        return true;
    }
    
    getLocationIndex() {
        return parseInt(sessionStorage.getItem('locationTerrainIndex')) || 0;
    }
    
    getLocationData() {
        const index = this.getLocationIndex();
        return {
            index: index,
            label: this.constants.location.labels[index],
            symbol: this.constants.location.symbols[index],
            color: this.constants.location.colors[index]
        };
    }
    
    // Temperature Methods
    setTemperatureIndex(index) {
        if (index < 0 || index >= this.constants.temperature.symbols.length) {
            console.error(`Invalid temperature index: ${index}`);
            return false;
        }
        
        this.elements.temperatureEmoji.textContent = this.constants.temperature.symbols[index];
        this.elements.temperatureGlow.style.setProperty('--temperature-glow-color', this.constants.temperature.colors[index]);
        sessionStorage.setItem('temperatureIndex', index);
        return true;
    }
    
    getTemperatureIndex() {
        return parseInt(sessionStorage.getItem('temperatureIndex')) || 0;
    }
    
    getTemperatureData() {
        const index = this.getTemperatureIndex();
        return {
            index: index,
            name: this.constants.temperature.names[index],
            symbol: this.constants.temperature.symbols[index],
            color: this.constants.temperature.colors[index]
        };
    }
    
    // TESA Methods
    async _syncTESADataWithServer() {
        try {
            const response = await fetch('/api/set_tesa_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    perceived_time: this.getPerceivedTime(),
                    temporal_drift: this.getTemporalDrift()
                })
            });
            if (!response.ok) {
                console.error("Failed to sync TESA data with server:", response.statusText);
                return;
            }
            const result = await response.json();
            if (result.success) {
                console.log("TESA data successfully synced with server.");
            } else {
                console.error("Server failed to save TESA data.");
            }
        } catch (error) {
            console.error("Error syncing TESA data with server:", error);
        }
    }

    // Internal UI-only update methods
    _updatePerceivedTimeUI(timeString) {
        this.elements.perceivedTime.textContent = timeString;
        sessionStorage.setItem('perceivedTime', timeString);
    }

    _updateTemporalDriftUI(driftString) {
        this.elements.temporalDrift.textContent = driftString; 
        sessionStorage.setItem('temporalDrift', driftString); 
    }

    // Public methods that also sync with the server
    setPerceivedTime(timeString) {
        this._updatePerceivedTimeUI(timeString);
        this._syncTESADataWithServer();
        return true;
    }
    
    getPerceivedTime() {
        return sessionStorage.getItem('perceivedTime') || this.elements.perceivedTime.textContent;
    }
    
    setTemporalDrift(driftString) {
        this._updateTemporalDriftUI(driftString);
        this._syncTESADataWithServer();
        return true;
    }
    
    getTemporalDrift() {
        return sessionStorage.getItem('temporalDrift') || this.elements.temporalDrift.textContent;
    }
    
    setTESAData(perceivedTime, temporalDrift) {
        this._updatePerceivedTimeUI(perceivedTime);
        this._updateTemporalDriftUI(temporalDrift);
        this._syncTESADataWithServer(); // Sync with server
        return true;
    }
    
    getTESAData() {
        return {
            perceivedTime: this.getPerceivedTime(),
            temporalDrift: this.getTemporalDrift()
        };
    }
    
    // Batch Operations
    updateAllNodes(nodeData) {
        let success = true;
        
        if (nodeData.danger !== undefined) {
            success &= this.setDangerIndex(nodeData.danger);
        }
        if (nodeData.timeOfDay !== undefined) {
            success &= this.setTimeOfDayIndex(nodeData.timeOfDay);
        }
        if (nodeData.environment !== undefined) {
            success &= this.setEnvironmentIndex(nodeData.environment);
        }
        if (nodeData.location !== undefined) {
            success &= this.setLocationIndex(nodeData.location);
        }
        if (nodeData.temperature !== undefined) {
            success &= this.setTemperatureIndex(nodeData.temperature);
        }
        if (nodeData.tesa) {
            if (nodeData.tesa.perceivedTime !== undefined) {
                success &= this.setPerceivedTime(nodeData.tesa.perceivedTime);
            }
            if (nodeData.tesa.temporalDrift !== undefined) {
                success &= this.setTemporalDrift(nodeData.tesa.temporalDrift);
            }
        }
        
        return success;
    }
    
    getAllNodeData() {
        return {
            danger: this.getDangerData(),
            timeOfDay: this.getTimeOfDayData(),
            environment: this.getEnvironmentData(),
            location: this.getLocationData(),
            temperature: this.getTemperatureData(),
            tesa: this.getTESAData()
        };
    }
    
    resetAllNodes() {
        this.setDangerIndex(0);
        this.setTimeOfDayIndex(0);
        this.setEnvironmentIndex(0);
        this.setLocationIndex(0);
        this.setTemperatureIndex(0);
        this.setPerceivedTime("0.0d");
        this.setTemporalDrift("±0.0d");
        return true;
    }
    
    // Setup hover events
    setupHoverEvents() {
        // Time of day hover
        this.elements.gridItem2.addEventListener('mouseover', () => {
            const timeData = this.getTimeOfDayData();
            this.elements.hoverText.textContent = timeData.label;
        });
        
        this.elements.gridItem2.addEventListener('mouseout', () => {
            this.elements.hoverText.textContent = '';
        });
        
        // Environment hover
        this.elements.gridItem3.addEventListener('mouseover', () => {
            const envData = this.getEnvironmentData();
            this.elements.hoverText3.innerHTML = envData.condition + "<br>" + envData.accuracyImpact;
        });
        
        this.elements.gridItem3.addEventListener('mouseout', () => {
            this.elements.hoverText3.textContent = '';
        });
        
        // Location hover
        this.elements.gridItem10.addEventListener('mouseover', () => {
            const locationData = this.getLocationData();
            this.elements.hoverText10.textContent = locationData.label;
        });
        
        this.elements.gridItem10.addEventListener('mouseout', () => {
            this.elements.hoverText10.textContent = '';
        });
        
        // Temperature hover
        this.elements.gridItem11.addEventListener('mouseover', () => {
            const tempData = this.getTemperatureData();
            this.elements.hoverText11.textContent = tempData.name;
        });
        
        this.elements.gridItem11.addEventListener('mouseout', () => {
            this.elements.hoverText11.textContent = '';
        });
    }
    
    // Utility methods for random generation (for testing)
    generateRandomTime() {
        const units = [
            { name: "m", max: 60 }, // minutes
            { name: "h", max: 24 }, // hours
            { name: "d", max: 7 },  // days
            { name: "w", max: 4 },  // weeks
            { name: "M", max: 12 }, // months
            { name: "y", max: 100 } // years
        ];
        const unit = units[Math.floor(Math.random() * units.length)];
        const value = (Math.random() * unit.max).toFixed(1);
        return `${value}${unit.name}`;
    }
    
    generateRandomTemporalDrift() {
        const units = [
            { name: "m", max: 60 }, // minutes
            { name: "h", max: 24 }, // hours
            { name: "d", max: 7 },  // days
            { name: "w", max: 4 },  // weeks
            { name: "M", max: 12 }, // months
            { name: "y", max: 100 } // years
        ];
        const unit = units[Math.floor(Math.random() * units.length)];
        const value = (Math.random() * unit.max).toFixed(1);
        return `±${value}${unit.name}`;
    }
    
    generateRandomDollarAmount() {
        const min = 1.00;
        const max = 20.00;
        const randomValue = Math.random() * (max - min) + min;
        return randomValue.toFixed(2);
    }
    
    generateRandomTokenAmount() {
        const min = 1000; // 1K
        const max = 2000000; // 2M
        const randomValue = Math.random() * (max - min) + min;
        if (randomValue >= 1000000) {
            return `${(randomValue / 1000000).toFixed(2)}M`;
        } else if (randomValue >= 1000) {
            return `${(randomValue / 1000).toFixed(2)}K`;
        } else {
            return randomValue.toFixed(2);
        }
    }

    // Chat Input Methods
    setChatInput(message) {
        this.elements.chatInput.value = message;
        this.elements.chatInput.style.height = 'auto'; // Reset height to recalculate
        this.elements.chatInput.style.height = this.elements.chatInput.scrollHeight + 'px'; // Set height to scrollHeight
        return true;
    }

    getChatInput() {
        return this.elements.chatInput.value;
    }

    // Chat Window Methods
    _addMessageToChatWindow(message, type, timestamp = new Date()) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.classList.add(`${type}-message`);
        
        // Create message content container
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = message;
        
        // Create timestamp
        const timestampElement = document.createElement("div");
        timestampElement.classList.add("message-timestamp");
        
        // Format timestamp as HH:MM MM/DD/YYYY
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
        const day = timestamp.getDate().toString().padStart(2, '0');
        const year = timestamp.getFullYear();
        
        timestampElement.textContent = `${hours}:${minutes} ${month}/${day}/${year}`;
        
        // Append content and timestamp to message element
        messageElement.appendChild(messageContent);
        messageElement.appendChild(timestampElement);
        
        this.elements.chatWindow.appendChild(messageElement);
        // Scroll to the bottom of the chat window
        this.elements.chatWindow.scrollTop = this.elements.chatWindow.scrollHeight;
        return true;
    }

    addMessageAsUser(message, timestamp = new Date()) {
        return this._addMessageToChatWindow(message, "user", timestamp);
    }

    addMessageAsResponse(message, timestamp = new Date()) {
        return this._addMessageToChatWindow(message, "response", timestamp);
    }
}

// Initialize the DOM State Controller and make it globally accessible
let gameState;

// For testing purposes, cycle through indices on page refresh
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the GameStateController
    gameState = new GameStateController();
    
    // Make it globally accessible
    window.HistoryBreakerState = gameState;

    // Handle Dark/Light Mode buttons (grid-item-15)
    const darkModeButton = document.getElementById("dark-mode-button");
    const lightModeButton = document.getElementById("light-mode-button");
    const autoModeButton = document.getElementById("auto-mode-button");

    // Dark mode functionality
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        console.log("Dark mode enabled");
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        console.log("Light mode enabled");
    }

    // Auto mode functionality
    function enableAutoMode() {
        autoModeButton.classList.add('active');
        darkModeButton.disabled = true;
        lightModeButton.disabled = true;
        darkModeButton.style.opacity = '0.5';
        lightModeButton.style.opacity = '0.5';
        darkModeButton.style.cursor = 'not-allowed';
        lightModeButton.style.cursor = 'not-allowed';
        localStorage.setItem('autoMode', 'enabled');
        
        // Detect browser preference and apply it
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
        console.log("Auto mode enabled");
    }

    function disableAutoMode() {
        autoModeButton.classList.remove('active');
        darkModeButton.disabled = false;
        lightModeButton.disabled = false;
        darkModeButton.style.opacity = '1';
        lightModeButton.style.opacity = '1';
        darkModeButton.style.cursor = 'pointer';
        lightModeButton.style.cursor = 'pointer';
        localStorage.setItem('autoMode', 'disabled');
        console.log("Auto mode disabled");
    }

    // Check for saved preferences on page load
    const autoMode = localStorage.getItem('autoMode');
    const darkMode = localStorage.getItem('darkMode');
    
    if (autoMode === 'enabled') {
        enableAutoMode();
    } else {
        // Only apply manual dark mode setting if auto mode is not enabled
        if (darkMode === 'enabled') {
            enableDarkMode();
        }
    }

    // Listen for browser theme changes when auto mode is active
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('autoMode') === 'enabled') {
                if (e.matches) {
                    enableDarkMode();
                } else {
                    disableDarkMode();
                }
            }
        });
    }

    darkModeButton.addEventListener("click", () => {
        if (darkModeButton.disabled) return;
        console.log("Dark Mode button clicked!");
        enableDarkMode();
    });

    lightModeButton.addEventListener("click", () => {
        if (lightModeButton.disabled) return;
        console.log("Light Mode button clicked!");
        disableDarkMode();
    });

    autoModeButton.addEventListener("click", () => {
        console.log("Auto Mode button clicked!");
        if (autoModeButton.classList.contains('active')) {
            disableAutoMode();
        } else {
            enableAutoMode();
        }
    });

    const sendButton = document.getElementById("send-button");

    function sendMessage() {
        const message = gameState.getChatInput().trim();
        if (message) {
            gameState.addMessageAsUser(message);
            console.log("Sending message:", message);
            // Simulate a response after a short delay
            setTimeout(() => {
                gameState.addMessageAsResponse("Your query has been accepted");
            }, 500);
            gameState.setChatInput(""); // Clear input using the setter
        }
    }

    sendButton.addEventListener("click", sendMessage);

    gameState.elements.chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (new line)
            sendMessage();
        }
    });

    // Auto-resize textarea based on content
    gameState.elements.chatInput.addEventListener("input", () => {
        gameState.setChatInput(gameState.getChatInput()); // Trigger setter to resize
    });

    // --- Fast Forward Elements ---
    const ffMinutesInput = document.getElementById('ff-minutes-input');
    const ffHoursInput = document.getElementById('ff-hours-input');
    const periodButtons = document.querySelectorAll('.period-button');
    const ffDaysInput = document.getElementById('ff-days-input');
    const ffSpecialEventToggle = document.getElementById('ff-special-event-toggle');
    const fastForwardButton = document.getElementById('fast-forward-button');
    const ffSpecialEventLabelText = document.getElementById('ff-special-event-label-text');
    const unitInputWrappers = document.querySelectorAll('.unit-input-wrapper');

    const allInputs = [ffMinutesInput, ffHoursInput, ffDaysInput];
    const allGameControlElements = [ffMinutesInput, ffHoursInput, ...periodButtons, ffDaysInput, ffSpecialEventToggle];

    // Input validation functions
    function validateNumericInput(input, min, max) {
        // Remove any non-numeric characters
        let value = input.value.replace(/[^0-9]/g, '');
        
        // Convert to number and validate range
        if (value !== '') {
            let numValue = parseInt(value);
            if (numValue < min) {
                value = min.toString();
            } else if (numValue > max) {
                value = max.toString();
            }
        }
        
        input.value = value;
    }

    // Add input validation event listeners
    ffMinutesInput.addEventListener('input', () => {
        validateNumericInput(ffMinutesInput, 1, 1440);
        updateUI();
        updateWrapperStates();
    });

    ffHoursInput.addEventListener('input', () => {
        validateNumericInput(ffHoursInput, 1, 24);
        updateUI();
        updateWrapperStates();
    });

    ffDaysInput.addEventListener('input', () => {
        validateNumericInput(ffDaysInput, 1, 30);
        updateUI();
        updateFFDaysDisplay();
    });

    // Add click event listener for ff-days-input
    ffDaysInput.addEventListener('click', () => {
        updateFFDaysDisplay();
    });

    // Add focus event listener for ff-days-input
    ffDaysInput.addEventListener('focus', () => {
        updateFFDaysDisplay();
    });

    // Function to update ff-days display elements
    function updateFFDaysDisplay() {
        const ffDaysExclamation = document.getElementById('ff-days-exclamation');
        const ffDaysWarning = document.getElementById('ff-days-warning');
        
        // Show spans if input has content, hide if empty
        if (ffDaysInput.value.length > 0) {
            ffDaysExclamation.classList.add('show');
            ffDaysWarning.classList.add('show');
        } else {
            ffDaysExclamation.classList.remove('show');
            ffDaysWarning.classList.remove('show');
        }
    }

    // Function to update wrapper active states
    function updateWrapperStates() {
        const minutesWrapper = ffMinutesInput.closest('.unit-input-wrapper');
        const hoursWrapper = ffHoursInput.closest('.unit-input-wrapper');
        const ffHoursMainLabel = document.getElementById('ff-hours-main-label');
        const ffHoursExclamation = document.getElementById('ff-hours-exclamation');
        const ffHoursWarning = document.getElementById('ff-hours-warning');
        
        // Remove active class from all wrappers first
        unitInputWrappers.forEach(wrapper => wrapper.classList.remove('active'));
        
        // Hide warning elements by default
        ffHoursExclamation.style.visibility = 'hidden';
        ffHoursWarning.style.visibility = 'hidden';
        
        // Add active class to the wrapper with content and update labels
        if (ffMinutesInput.value.length > 0) {
            minutesWrapper.classList.add('active');
            ffHoursMainLabel.textContent = 'Add number of minutes to FF...';
            ffHoursExclamation.style.visibility = 'visible';
            ffHoursWarning.textContent = 'Only enter up to 1440 minutes';
            ffHoursWarning.style.visibility = 'visible';
        } else if (ffHoursInput.value.length > 0) {
            hoursWrapper.classList.add('active');
            ffHoursMainLabel.textContent = 'Add number of hours to FF...';
            ffHoursExclamation.style.visibility = 'visible';
            ffHoursWarning.textContent = 'Only enter up to 24 hours';
            ffHoursWarning.style.visibility = 'visible';
        } else {
            // Reset to default when no input
            ffHoursMainLabel.textContent = 'Add amount of time to FF...';
        }
    }

    function updateUI() {
        const minutesActive = ffMinutesInput.value.length > 0;
        const hoursActive = ffHoursInput.value.length > 0;
        const periodActive = Array.from(periodButtons).some(b => b.classList.contains('selected'));
        const daysActive = ffDaysInput.value.length > 0;
        const specialEventActive = ffSpecialEventToggle.classList.contains('active');

        const anyInputActive = minutesActive || hoursActive || periodActive || daysActive || specialEventActive;

        // Fast forward button state - disabled by default, only enabled when inputs are used
        if (fastForwardButton.disabled && anyInputActive) {
            fastForwardButton.disabled = false;
            fastForwardButton.classList.remove('disabled');
        } else if (!fastForwardButton.disabled && !anyInputActive) {
            fastForwardButton.disabled = true;
            fastForwardButton.classList.add('disabled');
        }

        // When any input is active, grey out and disable all other elements
        if (anyInputActive) {
            allGameControlElements.forEach(element => {
                const isCurrentlyActive = 
                    (element === ffMinutesInput && minutesActive) ||
                    (element === ffHoursInput && hoursActive) ||
                    (Array.from(periodButtons).includes(element) && element.classList.contains('selected')) ||
                    (element === ffDaysInput && daysActive) ||
                    (element === ffSpecialEventToggle && specialEventActive);

                if (!isCurrentlyActive) {
                    element.disabled = true;
                    element.classList.add('disabled');
                    
                    // Handle parent wrapper styling for unit inputs
                    const wrapper = element.closest('.unit-input-wrapper');
                    if (wrapper) {
                        wrapper.classList.add('disabled');
                    }
                }
            });
        } else {
            // Re-enable all elements when no inputs are active
            allGameControlElements.forEach(element => {
                element.disabled = false;
                element.classList.remove('disabled');
                
                // Handle parent wrapper styling for unit inputs
                const wrapper = element.closest('.unit-input-wrapper');
                if (wrapper) {
                    wrapper.classList.remove('disabled');
                }
            });
        }
    }

    // Event Listeners
    allInputs.forEach(input => {
        input.addEventListener('input', updateUI);
    });

    // Toggle button functionality for period selector - only one can be active at a time
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            
            const isSelected = button.classList.contains('selected');
            
            // Remove selected class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Toggle the clicked button (turn on if off, turn off if on)
            if (!isSelected) {
                button.classList.add('selected');
            }
            
            updateUI();
        });
    });

    // Special event toggle functionality
    ffSpecialEventToggle.addEventListener('click', () => {
        if (ffSpecialEventToggle.disabled) return;
        ffSpecialEventToggle.classList.toggle('active');
        updateUI();
    });

    // Fast forward button functionality
    fastForwardButton.addEventListener('click', () => {
        if (fastForwardButton.disabled) return;
        console.log("Fast Forwarding...");
        
        // Reset all inputs and states
        allInputs.forEach(input => input.value = '');
        periodButtons.forEach(btn => btn.classList.remove('selected'));
        ffSpecialEventToggle.classList.remove('active');
        
        updateUI();
        updateWrapperStates();
        updateFFDaysDisplay();
    });

    // Initial UI state - fast forward button should be disabled by default
    fastForwardButton.disabled = true;
    fastForwardButton.classList.add('disabled');
    updateUI();

    // Function to poll the server for game state updates
    async function pollGameState() {
        try {
            const response = await fetch('/api/get_game_state');
            if (!response.ok) {
                console.error('Failed to fetch game state:', response.statusText);
                return;
            }
            const serverState = await response.json();

            if (serverState && serverState.game_state) {
                const { perceived_time, temporal_drift } = serverState.game_state;

                // Use internal UI-only methods to prevent feedback loop
                if (perceived_time && gameState.getPerceivedTime() !== perceived_time) {
                    gameState._updatePerceivedTimeUI(perceived_time);
                }
                if (temporal_drift && gameState.getTemporalDrift() !== temporal_drift) {
                    gameState._updateTemporalDriftUI(temporal_drift);
                }
            }
        } catch (error) {
            console.error('Error polling game state:', error);
        }
    }

    // Poll the server every 2 seconds for updates
    setInterval(pollGameState, 2000);

    // Perform an initial poll to load the current state from the server
    pollGameState();

    // Function to fetch and update OpenRouter balance
    async function updateOpenRouterBalance() {
        try {
            const response = await fetch('/api/openrouter_balance');
            if (!response.ok) {
                console.error('Failed to fetch OpenRouter balance:', response.statusText);
                return;
            }
            const data = await response.json();
            
            const gridItem5Right = document.getElementById('gridItem5Right');
            if (gridItem5Right) {
                if (data.balance !== undefined) {
                    gridItem5Right.textContent = `$${data.balance.toFixed(2)}`;
                } else if (data.error) {
                    gridItem5Right.textContent = 'Error';
                    console.error('OpenRouter balance error:', data.error);
                } else {
                    gridItem5Right.textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Error fetching OpenRouter balance:', error);
            const gridItem5Right = document.getElementById('gridItem5Right');
            if (gridItem5Right) {
                gridItem5Right.textContent = 'Error';
            }
        }
    }

    // Update balance immediately on page load
    updateOpenRouterBalance();

    // Update balance every 30 seconds
    setInterval(updateOpenRouterBalance, 30000);

    const socket = io.connect('http://' + document.domain + ':' + location.port);

    socket.on('connect', function() {
        console.log('Websocket connected!');
    });

    socket.on('update', function(data) {
        console.log('Received update:', data);
        const gridItem5Right = document.getElementById('gridItem5Right');
        if (gridItem5Right) {
            gridItem5Right.textContent = data.text;
        }
    });
});
