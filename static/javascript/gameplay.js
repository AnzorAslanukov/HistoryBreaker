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

    darkModeButton.addEventListener("click", () => {
        console.log("Dark Mode button clicked!");
        // Add dark mode logic here
    });

    lightModeButton.addEventListener("click", () => {
        console.log("Light Mode button clicked!");
        // Add light mode logic here
    });

    autoModeButton.addEventListener("click", () => {
        console.log("Auto Mode button clicked!");
        // Add auto mode logic here
    });

    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-button");
    const chatWindow = document.querySelector(".chat-window");

    function addMessageToChatWindow(message, type) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.classList.add(`${type}-message`);
        messageElement.textContent = message;
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

    // Fast Forward Hours Period Selector
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // Fast Forward Hours Input and Unit Switch
    // Fast Forward Hours Input and Unit Switch
    const ffHoursMainLabel = document.getElementById('ff-hours-main-label');
    const ffHoursExclamation = document.getElementById('ff-hours-exclamation');
    const ffHoursWarning = document.getElementById('ff-hours-warning');
    const ffMinutesInput = document.getElementById('ff-minutes-input');
    const ffHoursInput = document.getElementById('ff-hours-input');
    const unitInputWrappers = document.querySelectorAll('.unit-input-wrapper');

    let activeUnit = 'minutes'; // Default active unit

    function updateHoursWarningAndActiveInput() {
        unitInputWrappers.forEach(wrapper => {
            const input = wrapper.querySelector('input[type="text"]');
            if (wrapper.dataset.unit === activeUnit) {
                wrapper.classList.add('active');
                input.disabled = false;
                // Do not focus here, let the user click the input to focus
                if (activeUnit === 'minutes') {
                    ffHoursMainLabel.textContent = 'Add number of minutes to FF...';
                    ffHoursWarning.textContent = 'Only enter up to 1440 minutes';
                } else {
                    ffHoursMainLabel.textContent = 'Add number of hours to FF...';
                    ffHoursWarning.textContent = 'Only enter up to 24 hours';
                }
            } else {
                wrapper.classList.remove('active');
                input.disabled = true;
                input.value = ''; // Clear value of inactive input
            }
        });
        // ffHoursWarning.style.display is handled by focus/blur listeners
    }

    // Initial setup
    updateHoursWarningAndActiveInput();
    ffHoursWarning.style.visibility = 'hidden'; // Initially hide warning

    unitInputWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            activeUnit = wrapper.dataset.unit;
            updateHoursWarningAndActiveInput();
        });

        const input = wrapper.querySelector('input[type="text"]');
        
        input.addEventListener('focus', () => {
            // Set active unit when input gains focus
            activeUnit = wrapper.dataset.unit;
            updateHoursWarningAndActiveInput(); // Update active state and warning
            
            ffHoursExclamation.style.visibility = 'visible';
            ffHoursWarning.style.visibility = 'visible'; // Show warning on focus
        });
        input.addEventListener('blur', () => {
            // Only hide exclamation and warning if neither input is focused
            if (document.activeElement !== ffMinutesInput && document.activeElement !== ffHoursInput) {
                ffHoursExclamation.style.visibility = 'hidden';
                ffHoursWarning.style.visibility = 'hidden'; // Hide warning on blur
            }
        });
    });

    // Fast Forward Days Input
    const ffDaysLabel = document.getElementById('ff-days-label');
    const ffDaysInput = document.getElementById('ff-days-input');
    const ffDaysExclamation = document.getElementById('ff-days-exclamation');
    const ffDaysWarning = document.getElementById('ff-days-warning');

    // Initial setup for ffDays elements
    ffDaysExclamation.style.visibility = 'hidden';
    ffDaysInput.style.visibility = 'hidden';
    ffDaysWarning.style.visibility = 'hidden';

    ffDaysLabel.addEventListener('click', () => {
        ffDaysLabel.style.visibility = 'hidden';
        ffDaysInput.style.visibility = 'visible';
        ffDaysExclamation.style.visibility = 'visible';
        ffDaysWarning.style.visibility = 'visible';
        ffDaysInput.focus();
    });

    ffDaysInput.addEventListener('blur', () => {
        if (ffDaysInput.value.trim() === '') {
            ffDaysLabel.style.visibility = 'visible';
            ffDaysInput.style.visibility = 'hidden';
            ffDaysExclamation.style.visibility = 'hidden';
            ffDaysWarning.style.visibility = 'hidden';
        }
    });

    // Fast Forward Button
    const fastForwardButton = document.getElementById('fast-forward-button');
    fastForwardButton.addEventListener('click', () => {
        console.log('Fast Forward button clicked!');
        // For now, this button does nothing.
    });
});
