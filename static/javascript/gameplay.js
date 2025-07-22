const indicator = document.getElementById("danger-indicator");
const glow      = document.getElementById("danger-glow");
const emoji     = document.getElementById("danger-emoji");
const label     = document.getElementById("danger-label");
const timeOfDayEmoji = document.getElementById("time-of-day-emoji");
const timeOfDayGlow = document.getElementById("time-of-day-glow");
const gridItem2 = document.querySelector(".grid-item-2");
const hoverText = document.getElementById("hover-text");
const gridItem3Right = document.querySelector(".grid-item-3-right");
const environmentGlow = document.getElementById("environment-glow");
const gridItem3 = document.querySelector(".grid-item-3");
const hoverText3 = document.getElementById("hover-text-3");
const locationTerrainGlow = document.getElementById("location-terrain-glow");
const gridItem10Left = document.querySelector(".grid-item-10-left");
const gridItem10Right = document.querySelector(".grid-item-10-right");
const gridItem10 = document.querySelector(".grid-item-10");
const hoverText10 = document.getElementById("hover-text-10");
const temperatureEmoji = document.getElementById("temperature-emoji");
const temperatureGlow = document.getElementById("temperature-glow");
const gridItem11 = document.querySelector(".grid-item-11");
const hoverText11 = document.getElementById("hover-text-11");
const gridItem5Right = document.querySelector(".grid-item-5-right");
const gridItem13Right = document.querySelector(".grid-item-13-right");
const gridItem6Right = document.querySelector(".grid-item-6-right");
const gridItem14Right = document.querySelector(".grid-item-14-right");

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

// For testing purposes, cycle through indices on page refresh
document.addEventListener('DOMContentLoaded', () => {
    // Keep all the existing setup code for grid items 1-15, chat, etc.
    // Danger Indicator (grid-item-1)
    let dangerIndex = sessionStorage.getItem('dangerIndex');
    if (dangerIndex === null || parseInt(dangerIndex) >= dangerIndicatorEmojis.length - 1) {
        dangerIndex = 0;
    } else {
        dangerIndex = parseInt(dangerIndex) + 1;
    }
    sessionStorage.setItem('dangerIndex', dangerIndex);
    emoji.textContent = dangerIndicatorEmojis[dangerIndex];
    label.textContent = dangerIndicatorLabels[dangerIndex];
    glow.style.setProperty('--glow-color', dangerIndicatorcolors[dangerIndex]);
    
    // Time of Day (grid-item-2)
    let timeOfDayIndex = sessionStorage.getItem('timeOfDayIndex');
    if (timeOfDayIndex === null || parseInt(timeOfDayIndex) >= timeOfDaySymbols.length - 1) {
        timeOfDayIndex = 0;
    } else {
        timeOfDayIndex = parseInt(timeOfDayIndex) + 1;
    }
    sessionStorage.setItem('timeOfDayIndex', timeOfDayIndex);
    timeOfDayEmoji.textContent = timeOfDaySymbols[timeOfDayIndex];
    timeOfDayGlow.style.setProperty('--time-glow-color', timeOfDayColors[timeOfDayIndex]);

    // Environment Accuracy Modifier (grid-item-3)
    let environmentAccuracyModIndex = sessionStorage.getItem('envModIndex');
    if (environmentAccuracyModIndex === null || parseInt(environmentAccuracyModIndex) >= environmentAccuracyModSymbols.length - 1) {
        environmentAccuracyModIndex = 0;
    } else {
        environmentAccuracyModIndex = parseInt(environmentAccuracyModIndex) + 1;
    }
    sessionStorage.setItem('envModIndex', environmentAccuracyModIndex);
    gridItem3Right.textContent = environmentAccuracyModSymbols[environmentAccuracyModIndex];
    environmentGlow.style.setProperty('--environment-glow-color', environmentAccuracyModColors[environmentAccuracyModIndex]);

    // Location/Terrain Category (grid-item-10)
    let locationTerrainIndex = sessionStorage.getItem('locationTerrainIndex');
    if (locationTerrainIndex === null || parseInt(locationTerrainIndex) >= locationTerrainSymbols.length - 1) {
        locationTerrainIndex = 0;
    } else {
        locationTerrainIndex = parseInt(locationTerrainIndex) + 1;
    }
    sessionStorage.setItem('locationTerrainIndex', locationTerrainIndex);
    gridItem10Right.textContent = locationTerrainSymbols[locationTerrainIndex];
    locationTerrainGlow.style.setProperty('--location-terrain-glow-color', locationTerrainColors[locationTerrainIndex]);

    // Temperature (grid-item-11)
    let temperatureIndex = sessionStorage.getItem('temperatureIndex');
    if (temperatureIndex === null || parseInt(temperatureIndex) >= temperatureSymbols.length - 1) {
        temperatureIndex = 0;
    } else {
        temperatureIndex = parseInt(temperatureIndex) + 1;
    }
    sessionStorage.setItem('temperatureIndex', temperatureIndex);
    temperatureEmoji.textContent = temperatureSymbols[temperatureIndex];
    temperatureGlow.style.setProperty('--temperature-glow-color', temperatureColors[temperatureIndex]);

    // Set hover text for grid-item-2
    gridItem2.addEventListener('mouseover', () => {
        hoverText.textContent = timeOfDayLabels[timeOfDayIndex];
    });

    gridItem2.addEventListener('mouseout', () => {
        hoverText.textContent = '';
    });

    // Set hover text for grid-item-3
    gridItem3.addEventListener('mouseover', () => {
        hoverText3.innerHTML = environmentAccuracyModConditions[environmentAccuracyModIndex] + "<br>" + environmentAccuracyModAccuracyImpact[environmentAccuracyModIndex];
    });

    gridItem3.addEventListener('mouseout', () => {
        hoverText3.textContent = '';
    });

    // Set hover text for grid-item-10
    gridItem10.addEventListener('mouseover', () => {
        hoverText10.textContent = locationTerrainLabels[locationTerrainIndex];
    });

    gridItem10.addEventListener('mouseout', () => {
        hoverText10.textContent = '';
    });

    // Set hover text for grid-item-11
    gridItem11.addEventListener('mouseover', () => {
        hoverText11.textContent = temperatureTierNames[temperatureIndex];
    });

    gridItem11.addEventListener('mouseout', () => {
        hoverText11.textContent = '';
    });

    // Perceived Time and Temporal Drift (grid-item-4)
    const perceivedTimeElement = document.getElementById("perceived-time");
    const temporalDriftElement = document.getElementById("temporal-drift");

    function getRandomTime() {
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

    function getRandomTemporalDrift() {
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

    perceivedTimeElement.textContent = getRandomTime();
    temporalDriftElement.textContent = getRandomTemporalDrift();

    function generateRandomDollarAmount() {
        const min = 1.00;
        const max = 20.00;
        const randomValue = Math.random() * (max - min) + min;
        return randomValue.toFixed(2);
    }

    gridItem5Right.textContent = `$${generateRandomDollarAmount()}`;
    gridItem13Right.textContent = `$${generateRandomDollarAmount()}`;

    function generateRandomTokenAmount() {
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

    gridItem6Right.textContent = generateRandomTokenAmount();
    gridItem14Right.textContent = generateRandomTokenAmount();

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

    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-button");
    const chatWindow = document.querySelector(".chat-window");

    function addMessageToChatWindow(message, type) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.classList.add(`${type}-message`);
        
        // Create message content container
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = message;
        
        // Create timestamp
        const timestamp = document.createElement("div");
        timestamp.classList.add("message-timestamp");
        
        // Format timestamp as HH:MM MM/DD/YYYY
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const year = now.getFullYear();
        
        timestamp.textContent = `${hours}:${minutes} ${month}/${day}/${year}`;
        
        // Append content and timestamp to message element
        messageElement.appendChild(messageContent);
        messageElement.appendChild(timestamp);
        
        chatWindow.appendChild(messageElement);
        // Scroll to the bottom of the chat window
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessageToChatWindow(message, "user");
            console.log("Sending message:", message);
            // Simulate a response after a short delay
            setTimeout(() => {
                addMessageToChatWindow("Your query has been accepted", "response");
            }, 500);
            chatInput.value = "";
            chatInput.style.height = 'auto'; // Reset height after sending message
        }
    }

    sendButton.addEventListener("click", sendMessage);

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (new line)
            sendMessage();
        }
    });

    // Auto-resize textarea based on content
    chatInput.addEventListener("input", () => {
        chatInput.style.height = 'auto'; // Reset height to recalculate
        chatInput.style.height = chatInput.scrollHeight + 'px'; // Set height to scrollHeight
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

    // Test array of lorem ipsum samples (20-70 characters)
    const loremIpsumSamples = [
        "Lorem ipsum dolor sit", // 20 characters
        "Lorem ipsum dolor sit amet, consectetur", // 39 characters  
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit", // 56 characters
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do", // 65 characters
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do ei" // 70 characters
    ];

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

    // Set random lorem ipsum text for special event label on page load
    ffSpecialEventLabelText.textContent = loremIpsumSamples[Math.floor(Math.random() * loremIpsumSamples.length)];

    // Initial UI state - fast forward button should be disabled by default
    fastForwardButton.disabled = true;
    fastForwardButton.classList.add('disabled');
    updateUI();
});
