const GLOBAL_MIN_YEAR = -2000;
const GLOBAL_MAX_YEAR = 1600;

document.addEventListener("DOMContentLoaded", async () => {
    // ===== Data & DOM References =====
    let subregionData = {};
    let rawRegionData = {};
    let timePeriodData = {};
    
    let worldButton;
    let eraContainer;
    let continentButtonWrappers;
    let continentButtons;
    let selectedRegionInput;
    let selectedErasInput;
    let continueBtn;
    let surpriseMeBtn;
    let legendDiv;
    let civLookupBtn;

    // ===== State Management =====
    let worldExpanded = false;
    let selectedWorldEras = [];
    let selectedSubregions = new Set();
    let selectedContinents = new Set();
    let selectedContinentPeriods = new Map();
    let selectedRegionPeriods = new Map();

    // ===== Helper Functions =====
    function makeRadial(value, colour = "#28a745") {
        const wrap = document.createElement("div");
        wrap.className = "radial-wrap";
        wrap.style.setProperty("--val", value);
        wrap.style.setProperty("--clr", colour);

        const track = document.createElement("div");
        track.className = "radial-track";

        const centre = document.createElement("span");
        centre.className = "radial-center";
        centre.textContent = value;

        wrap.append(track, centre);
        return wrap;
    }

    function addHoverEffect(button) {
        button.addEventListener("mouseenter", () => {
            if (button.disabled) return; 
            const nameSpan = button.querySelector(".era-name");
            const yearsSpan = button.querySelector(".era-years");
            if (nameSpan && yearsSpan) {
                nameSpan.style.transform = "translateX(-100%)";
                yearsSpan.style.transform = "translateX(0)";
            }
        });

        button.addEventListener("mouseleave", () => {
            if (button.disabled) return;
            const nameSpan = button.querySelector(".era-name");
            const yearsSpan = button.querySelector(".era-years");
            if (nameSpan && yearsSpan) {
                nameSpan.style.transform = "translateX(0)";
                yearsSpan.style.transform = "translateX(100%)";
            }
        });
    }

    function formatYear(year) {
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    }

    function getPeriodYearsDisplay(periodName, timePeriodDataSet) {
        const period = timePeriodDataSet.find(p => p.name === periodName);
        return period ? `${formatYear(period.start_year)} - ${formatYear(period.end_year)}` : "";
    }

    // ===== Core Form Functions =====
    function updateContinueButtonState() {
        let canContinue = false;
        let regionValue = "";
        let erasValue = "";

        const isSurpriseMeClicked = surpriseMeBtn.classList.contains("clicked");

        if (isSurpriseMeClicked) {
            canContinue = true;
            regionValue = "SurpriseMe"; // Indicate surprise me was chosen
            erasValue = JSON.stringify({}); // No specific eras for surprise me initially
        } else if (worldExpanded) {
            canContinue = selectedWorldEras.length > 0;
            regionValue = "World";
            erasValue = JSON.stringify(selectedWorldEras);
        } else {
            canContinue = selectedSubregions.size > 0 || selectedContinents.size > 0; // Allow continue if a continent is selected even with no subregions yet
            if (selectedSubregions.size > 0) {
                const regionalSelections = {};
                selectedSubregions.forEach(key => {
                    const [continent, subregion] = key.split(':');
                    if (!regionalSelections[continent]) regionalSelections[continent] = [];
                    regionalSelections[continent].push(subregion);
                });
                regionValue = JSON.stringify(regionalSelections);
            } else if (selectedContinents.size > 0) {
                // If only a continent is selected, send that
                const regionalSelections = {};
                selectedContinents.forEach(continent => {
                    regionalSelections[continent] = []; // Empty array for subregions, as none are selected
                });
                regionValue = JSON.stringify(regionalSelections);
            }


            const allPeriodSelectionsForBackend = {};
            selectedContinentPeriods.forEach((periodsSet, continent) => {
                if (periodsSet.size > 0) {
                    allPeriodSelectionsForBackend[`${continent}__Periods`] = Array.from(periodsSet);
                }
            });
            selectedRegionPeriods.forEach((periodsSet, subregionKey) => {
                if (periodsSet.size > 0) {
                    allPeriodSelectionsForBackend[`${subregionKey.replace(':', '__')}__Periods`] = Array.from(periodsSet);
                }
            });
            erasValue = JSON.stringify(allPeriodSelectionsForBackend);
        }

        continueBtn.disabled = !canContinue;
        if (canContinue) {
            continueBtn.title = "Proceed to the main gameplay page.";
        } else {
            continueBtn.title = "Please select a World, Continent, or use the Surprise Me! button to continue.";
        }
        selectedRegionInput.value = regionValue;
        selectedErasInput.value = erasValue;
    }

    function createPeriodButton(container, periodName, type, parentIdentifier) {
        const periodBtn = document.createElement("button");
        periodBtn.type = "button";
        
        let dataSetForYears = [];
        let specificPeriodData = null;

        switch (type) {
            case "world":
                periodBtn.classList.add("era-btn");
                dataSetForYears = timePeriodData.World;
                specificPeriodData = timePeriodData.World.find(p => p.name === periodName);
                break;
            case "continent":
                periodBtn.classList.add("continent-period-btn");
                dataSetForYears = timePeriodData[parentIdentifier];
                specificPeriodData = timePeriodData[parentIdentifier].find(p => p.name === periodName);
                break;
            case "region":
                periodBtn.classList.add("region-period-btn");
                const subregionOnlyName = parentIdentifier.split(':')[1];
                dataSetForYears = timePeriodData[subregionOnlyName];
                specificPeriodData = timePeriodData[subregionOnlyName].find(p => p.name === periodName);
                break;
        }

        const yearsDisplay = getPeriodYearsDisplay(periodName, dataSetForYears);
        periodBtn.dataset.type = type;
        periodBtn.dataset.identifier = parentIdentifier;
        periodBtn.dataset.period = periodName;

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("era-name");
        nameSpan.textContent = periodName;

        const yearsSpan = document.createElement("span");
        yearsSpan.classList.add("era-years");
        yearsSpan.textContent = yearsDisplay;

        periodBtn.appendChild(nameSpan);
        periodBtn.appendChild(yearsSpan);

        let pct = 0;
        if (type === "world") {
            pct = rawRegionData.world_periods.World[periodName];
        } else if (type === "continent") {
            pct = rawRegionData.continent_periods[parentIdentifier][periodName];
        } else {
            const region = parentIdentifier.split(":")[1];
            pct = rawRegionData.continent_sub_region_dynasties[region][periodName];
        }
        
        const color = type === "continent" ? "#007bff" : type === "region" ? "#ff9800" : "#28a745";
        periodBtn.appendChild(makeRadial(pct, color));

        if (specificPeriodData && specificPeriodData.is_usable === false) {
            periodBtn.classList.add("period-off");
            periodBtn.disabled = true;
            periodBtn.title = "Not enough historical data available";
        }

        addHoverEffect(periodBtn);
        container.appendChild(periodBtn);
        return periodBtn;
    }

    function updateButtonVisuals() {
        // World button state
        const worldPeriods = timePeriodData.World || [];
        eraContainer.innerHTML = '';
        worldPeriods.forEach(period => {
            const btn = createPeriodButton(eraContainer, period.name, "world", "World");
            btn.addEventListener("click", () => {
                if (!worldExpanded || btn.disabled) return;
                const era = btn.dataset.period;
                const wasEraSelected = btn.classList.contains("era-selected");
                if (wasEraSelected) { 
                    selectedWorldEras = selectedWorldEras.filter(e => e !== era); 
                    if (selectedWorldEras.length === 0) worldExpanded = false; 
                } else { 
                    if (!selectedWorldEras.includes(era)) selectedWorldEras.push(era);
                }
                updateButtonVisuals(); 
            });
        });

        Array.from(eraContainer.children).forEach(btn => {
            if (btn.disabled) return;
            const eraName = btn.dataset.period;
            btn.classList.toggle("era-selected", selectedWorldEras.includes(eraName));
            btn.classList.toggle("era-unselected", !selectedWorldEras.includes(eraName));
        });

        worldExpanded 
            ? worldButton.classList.add("world-selected") 
            : worldButton.classList.remove("world-selected");
        eraContainer.classList.toggle("era-visible", worldExpanded);

        // Continent buttons state
        continentButtonWrappers.forEach(wrapper => {
            const continentBtn = wrapper.querySelector(".region-btn-vertical");
            const continentName = continentBtn.dataset.region;
            const normalizedContinentName = continentName.toLowerCase().replace(' ', '-');
            const subregionContainer = document.getElementById(`subregion-container-${normalizedContinentName}`);
            const continentPeriodsContainer = document.getElementById(`continent-periods-container-${normalizedContinentName}`);
            const subregionDataExists = subregionData[continentName] || [];

            continentBtn.disabled = worldExpanded;
            if (selectedContinents.has(continentName)) {
                continentBtn.classList.add("region-selected");
                subregionContainer.classList.add("subregion-visible");
                const selectedSubregionKeysForContinent = Array.from(selectedSubregions).filter(key => key.startsWith(`${continentName}:`));
                const allSubregionsSelected = subregionDataExists.length > 0 && subregionDataExists.length === selectedSubregionKeysForContinent.length;
                updateSubregionButtons(continentName, subregionContainer, subregionDataExists);
                processSubregionStates(continentName, subregionContainer, allSubregionsSelected);
                processContinentPeriods(continentName, continentPeriodsContainer, allSubregionsSelected);
            } else {
                continentBtn.classList.remove("region-selected");
                subregionContainer.classList.remove("subregion-visible");
                continentPeriodsContainer.classList.remove("container-visible");
                subregionContainer.innerHTML = '';
                continentPeriodsContainer.innerHTML = '';
            }
        });

        updateContinueButtonState();

        const isSurpriseMeActive = surpriseMeBtn.classList.contains("clicked");
        const isWorldOrContinentMainSelection = worldExpanded || selectedContinents.size > 0;

        // Disable Surprise Me if World or Continent is selected
        surpriseMeBtn.disabled = isWorldOrContinentMainSelection;
        if (surpriseMeBtn.disabled) {
            surpriseMeBtn.title = "Deselect World/Continent to enable Surprise Me.";
        } else {
            surpriseMeBtn.title = "Click to get a random civilization (revealed at game start).";
        }

        // Disable World and Continent buttons if Surprise Me is active
        worldButton.disabled = isSurpriseMeActive || (selectedContinents.size > 0 || selectedSubregions.size > 0);
        continentButtons.forEach(btn => {
            btn.disabled = isSurpriseMeActive || worldExpanded;
        });

        // Update civ-lookup-btn state
        civLookupBtn.disabled = isWorldOrContinentMainSelection || isSurpriseMeActive;
        if (isWorldOrContinentMainSelection || isSurpriseMeActive) {
            civLookupBtn.title = "Deselect World/Continent/Surprise Me to choose a civilization by name.";
        } else {
            civLookupBtn.title = "Go to page to select a civilization by name.";
        }
    }

    function updateSubregionButtons(continentName, subregionContainer, subregionDataExists) {
        subregionContainer.innerHTML = '';
        subregionDataExists.forEach(subregion => {
            const subregionItemWrapper = document.createElement("div");
            subregionItemWrapper.classList.add("subregion-item-wrapper");

            const subregionBtn = document.createElement("button");
            subregionBtn.type = "button";
            subregionBtn.classList.add("subregion-btn");
            subregionBtn.dataset.continent = continentName;
            subregionBtn.dataset.subregion = subregion;
            subregionBtn.textContent = subregion;

            const pct = rawRegionData.continent_sub_region_data[continentName]
                .find(obj => obj[subregion])[subregion];
            subregionBtn.appendChild(makeRadial(pct, "#28a745"));

            const regionPeriodsContainer = document.createElement("div");
            regionPeriodsContainer.classList.add("region-periods-container");
            regionPeriodsContainer.id = `region-periods-container-${continentName.toLowerCase().replace(' ', '-')}-${subregion.toLowerCase().replace(' ', '-')}`;

            subregionBtn.addEventListener("click", () => {
                if (subregionBtn.disabled) return;
                handleSubregionClick(continentName, subregion);
            });
            
            subregionItemWrapper.appendChild(subregionBtn);
            subregionItemWrapper.appendChild(regionPeriodsContainer);
            subregionContainer.appendChild(subregionItemWrapper);
        });
    }

    function handleSubregionClick(continentName, subregion) {
        const subregionKey = `${continentName}:${subregion}`;
        const wasAlreadySelected = selectedSubregions.has(subregionKey);
        if (wasAlreadySelected) {
            selectedSubregions.delete(subregionKey);
            selectedRegionPeriods.delete(subregionKey);
        } else {
            selectedSubregions.add(subregionKey);
            const regionSpecificPeriods = timePeriodData[subregion] || [];
            if (regionSpecificPeriods.length > 0) {
                selectedRegionPeriods.set(subregionKey, new Set(regionSpecificPeriods.map(p => p.name)));
            }
        }

        const remainingSelectedSubregions = Array.from(selectedSubregions)
            .filter(key => key.startsWith(`${continentName}:`));
        if (remainingSelectedSubregions.length === 0) {
            selectedContinents.delete(continentName);
            Array.from(selectedRegionPeriods.keys()).forEach(key => {
                if (key.startsWith(`${continentName}:`)) {
                    selectedRegionPeriods.delete(key);
                }
            });
        }
        updateButtonVisuals();
    }

    function processSubregionStates(continentName, subregionContainer, allSubregionsAreSelected) {
        Array.from(subregionContainer.children).forEach(subregionItemWrapper => {
            const subBtn = subregionItemWrapper.querySelector('.subregion-btn');
            const regionPeriodsContainer = subregionItemWrapper.querySelector('.region-periods-container');
            const subregionName = subBtn.dataset.subregion;
            const subregionKey = `${continentName}:${subregionName}`;

            if (!subBtn.disabled) {
                subBtn.classList.toggle("subregion-selected", selectedSubregions.has(subregionKey));
            }

            regionPeriodsContainer.classList.toggle("container-visible", 
                selectedSubregions.has(subregionKey) && !allSubregionsAreSelected
            );

            if (!selectedSubregions.has(subregionKey) || allSubregionsAreSelected) {
                regionPeriodsContainer.classList.remove("container-visible");
                regionPeriodsContainer.innerHTML = ''; 
                return;
            }

            if (selectedSubregions.has(subregionKey) && !allSubregionsAreSelected) {
                updateSubregionPeriodButtons(continentName, regionPeriodsContainer, subregionName, subregionKey);
            }
        });
    }

    function updateSubregionPeriodButtons(continentName, regionPeriodsContainer, subregionName, subregionKey) {
        const regionSpecificPeriodsData = timePeriodData[subregionName] || [];
        const regionSpecificPeriodNames = regionSpecificPeriodsData.map(p => p.name);
        if (!selectedRegionPeriods.has(subregionKey) && regionSpecificPeriodNames.length > 0) {
            selectedRegionPeriods.set(subregionKey, new Set(regionSpecificPeriodNames));
        }

        regionPeriodsContainer.innerHTML = '';
        regionSpecificPeriodNames.forEach(periodName => {
            const periodBtn = createPeriodButton(regionPeriodsContainer, periodName, "region", subregionKey);
            periodBtn.addEventListener("click", () => {
                if (periodBtn.disabled) return;
                handleSubregionPeriodClick(subregionKey, periodName, periodBtn);
            });
        });

        const currentRegionPeriodSet = selectedRegionPeriods.get(subregionKey) || new Set();
        Array.from(regionPeriodsContainer.children).forEach(periodBtn => {
            if (periodBtn.disabled) return;
            const periodName = periodBtn.dataset.period;
            periodBtn.classList.toggle("period-selected", currentRegionPeriodSet.has(periodName));
            periodBtn.classList.toggle('period-locked', currentRegionPeriodSet.size === 1 && currentRegionPeriodSet.has(periodName));
        });
    }

    function handleSubregionPeriodClick(subregionKey, periodName, periodBtn) {
        let periodSet = selectedRegionPeriods.get(subregionKey);
        if (!periodSet) { 
            periodSet = new Set();
            selectedRegionPeriods.set(subregionKey, periodSet);
        }

        const isSelected = periodSet.has(periodName);
        if (isSelected && periodSet.size === 1) return; 

        if (isSelected) { 
            periodSet.delete(periodName);
        } else { 
            periodSet.add(periodName);
        }
        
        if (periodSet.size === 0) {
            selectedRegionPeriods.delete(subregionKey);
            selectedSubregions.delete(subregionKey);
            const [continentName, ] = subregionKey.split(':');
            const remainingSelectedSubregionsForContinent = Array.from(selectedSubregions).filter(key => key.startsWith(`${continentName}:`));
            if (remainingSelectedSubregionsForContinent.length === 0) {
                selectedContinents.delete(continentName);
                selectedContinentPeriods.delete(continentName); 
            }
        }
        updateButtonVisuals();
    }

    function processContinentPeriods(continentName, continentPeriodsContainer, allSubregionsAreSelected) {
        continentPeriodsContainer.classList.toggle("container-visible", allSubregionsAreSelected);
        if (!allSubregionsAreSelected) {
            continentPeriodsContainer.innerHTML = '';
            selectedContinentPeriods.delete(continentName);
            return;
        }

        const continentSpecificPeriodsData = timePeriodData[continentName] || [];
        const continentSpecificPeriodNames = continentSpecificPeriodsData.map(p => p.name);
        if (!selectedContinentPeriods.has(continentName) && continentSpecificPeriodNames.length > 0) {
            selectedContinentPeriods.set(continentName, new Set(continentSpecificPeriodNames));
        }

        continentPeriodsContainer.innerHTML = '';
        continentSpecificPeriodNames.forEach(periodName => {
            const periodBtn = createPeriodButton(continentPeriodsContainer, periodName, "continent", continentName);
            periodBtn.addEventListener("click", () => {
                if (periodBtn.disabled) return;
                handleContinentPeriodClick(continentName, periodName, periodBtn, allSubregionsAreSelected);
            });
        });

        const currentContinentPeriodSet = selectedContinentPeriods.get(continentName) || new Set();
        Array.from(continentPeriodsContainer.children).forEach(periodBtn => {
            if (periodBtn.disabled) return;
            const periodName = periodBtn.dataset.period;
            periodBtn.classList.toggle("period-selected", currentContinentPeriodSet.has(periodName));
            periodBtn.classList.toggle('period-locked', currentContinentPeriodSet.size === 1 && currentContinentPeriodSet.has(periodName) && allSubregionsAreSelected);
        });
    }

    function handleContinentPeriodClick(continentName, periodName, periodBtn, allSubregionsAreSelected) {
        let periodSet = selectedContinentPeriods.get(continentName);
        if (!periodSet) { 
            periodSet = new Set();
            selectedContinentPeriods.set(continentName, periodSet);
        }

        const isSelected = periodSet.has(periodName);
        if (isSelected && periodSet.size === 1 && allSubregionsAreSelected) return;
        
        if (isSelected) {
            periodSet.delete(periodName);
        } else {
            periodSet.add(periodName);
        }
        updateButtonVisuals();
    }

    // ===== Helper Functions for Civilization Selection =====
    function getTargetRegionNames(selectedRegionCriteriaValue, rawRegionDataLocal) {
        const targetRegions = new Set();
        if (!selectedRegionCriteriaValue || selectedRegionCriteriaValue === "SurpriseMe") {
            // For "SurpriseMe" or undefined, all regions are implicitly valid at the civ filtering stage.
            // Or, if you want to explicitly list all known regions for "World" if it's a fallback for SurpriseMe's region part:
            if (rawRegionDataLocal && rawRegionDataLocal.world_regions) {
                 rawRegionDataLocal.world_regions.forEach(continent => {
                    targetRegions.add(continent);
                    if (rawRegionDataLocal.continent_sub_regions && rawRegionDataLocal.continent_sub_regions[continent]) {
                        rawRegionDataLocal.continent_sub_regions[continent].forEach(subObj => targetRegions.add(Object.keys(subObj)[0]));
                    }
                });
            }
            return targetRegions; // Effectively means "all regions" if SurpriseMe, or empty if error.
        }

        if (selectedRegionCriteriaValue === "World") {
            if (rawRegionDataLocal && rawRegionDataLocal.world_regions) {
                rawRegionDataLocal.world_regions.forEach(continent => {
                    targetRegions.add(continent);
                    // Add subregions of each continent
                    if (rawRegionDataLocal.continent_sub_regions && rawRegionDataLocal.continent_sub_regions[continent]) {
                         rawRegionDataLocal.continent_sub_regions[continent].forEach(subObj => targetRegions.add(Object.keys(subObj)[0]));
                    }
                });
            }
            // It might be useful to also add "World" itself if some civs are directly tagged that way.
            // targetRegions.add("World"); 
            return targetRegions;
        }
        
        // For specific continent/subregion selections (JSON string)
        try {
            const selections = JSON.parse(selectedRegionCriteriaValue);
            for (const continentName in selections) {
                targetRegions.add(continentName); // Add the continent itself
                if (selections[continentName] && selections[continentName].length > 0) {
                    selections[continentName].forEach(subregion => targetRegions.add(subregion));
                } else { // If a continent is selected but no subregions, all its subregions are implied
                    if (rawRegionDataLocal.continent_sub_regions && rawRegionDataLocal.continent_sub_regions[continentName]) {
                        rawRegionDataLocal.continent_sub_regions[continentName].forEach(subObj => {
                            targetRegions.add(Object.keys(subObj)[0]);
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing selected region criteria for target names:", e, selectedRegionCriteriaValue);
        }
        return targetRegions;
    }

    function getMinMaxYearsFromEras(selectedErasValue, timePeriodDataGlobal) {
        let minStartYear = Infinity;
        let maxEndYear = -Infinity;
        let erasSelected = false;

        if (!selectedErasValue || selectedErasValue === "{}") return { minStartYear: null, maxEndYear: null, erasSelected: false };

        try {
            const eraSelections = JSON.parse(selectedErasValue);
            for (const selectionKey in eraSelections) {
                const periodNames = eraSelections[selectionKey];
                if (periodNames.length === 0) continue;
                erasSelected = true;

                let dataSetKey;
                let categoryForTimeData; // e.g. "World", "Europe", "Roman Britain"

                if (selectionKey === "World" || selectionKey === "selectedWorldEras") { // Legacy or direct key
                    categoryForTimeData = "World";
                } else if (selectionKey.endsWith("__Periods")) {
                    const baseName = selectionKey.substring(0, selectionKey.indexOf("__Periods"));
                    if (baseName.includes("__")) { // continent__subregion
                        categoryForTimeData = baseName.split("__")[1]; // subregion name
                    } else { // continent
                        categoryForTimeData = baseName; // continent name
                    }
                } else { // Fallback for older structures if any, or direct continent/subregion name
                    categoryForTimeData = selectionKey;
                }
                
                const periodsInDataset = timePeriodDataGlobal[categoryForTimeData];

                if (periodsInDataset) {
                    periodNames.forEach(pName => {
                        const periodDetail = periodsInDataset.find(p => p.name === pName);
                        if (periodDetail) {
                            minStartYear = Math.min(minStartYear, parseInt(periodDetail.start_year, 10));
                            maxEndYear = Math.max(maxEndYear, parseInt(periodDetail.end_year, 10));
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error processing selected eras criteria for years:", e, selectedErasValue);
        }
        
        return {
            minStartYear: minStartYear === Infinity ? null : minStartYear,
            maxEndYear: maxEndYear === -Infinity ? null : maxEndYear,
            erasSelected: erasSelected
        };
    }

    // ===== Event Handlers =====
    function handleWorldClick() {
        if (worldButton.disabled && !surpriseMeBtn.classList.contains("clicked")) return; // Allow if disabled by surprise me
        
        // If surprise me is active, clicking world should deactivate surprise me
        if (surpriseMeBtn.classList.contains("clicked")) {
            surpriseMeBtn.classList.remove("clicked");
        }

        worldExpanded = !worldExpanded;
        if (worldExpanded) {
            selectedContinents.clear();
            selectedSubregions.clear();
            selectedContinentPeriods.clear();
            selectedRegionPeriods.clear();
            selectedWorldEras = (timePeriodData.World || []).map(p => p.name);
        } else {
            selectedWorldEras = [];
        }
        updateButtonVisuals();
    }

    function handleContinentClick(btn) {
        if (btn.disabled && !surpriseMeBtn.classList.contains("clicked")) return; // Allow if disabled by surprise me

        // If surprise me is active, clicking a continent should deactivate surprise me
        if (surpriseMeBtn.classList.contains("clicked")) {
            surpriseMeBtn.classList.remove("clicked");
        }

        const clickedContinent = btn.dataset.region;
        const willBeContinentSelected = !selectedContinents.has(clickedContinent);

        if (worldExpanded) {
            worldExpanded = false;
            selectedWorldEras = [];
        }

        if (willBeContinentSelected) {
            selectedContinents.add(clickedContinent);
            const subregionsForContinent = subregionData[clickedContinent] || [];
            subregionsForContinent.forEach(sr => {
                selectedSubregions.add(`${clickedContinent}:${sr}`);
            });
            // Ensure continent periods are marked as selected in the data model
            const continentPeriodsData = timePeriodData[clickedContinent] || [];
            if (continentPeriodsData.length > 0) {
                // Select all usable periods by default for the continent
                const usablePeriodNames = continentPeriodsData
                    .filter(p => p.is_usable !== false) // Consider only usable periods for initial selection
                    .map(p => p.name);
                if (usablePeriodNames.length > 0) {
                    selectedContinentPeriods.set(clickedContinent, new Set(usablePeriodNames));
                } else {
                    // If no usable periods, ensure the entry is cleared or not set
                    selectedContinentPeriods.delete(clickedContinent);
                }
            } else {
                 selectedContinentPeriods.delete(clickedContinent); // No periods for this continent
            }
        } else {
            selectedContinents.delete(clickedContinent);
            selectedContinentPeriods.delete(clickedContinent);
            Array.from(selectedSubregions).forEach(key => {
                if (key.startsWith(`${clickedContinent}:`)) {
                    selectedSubregions.delete(key);
                    selectedRegionPeriods.delete(key);
                }
            });
        }
        updateButtonVisuals();
    }

    async function handleFormSubmit(e) {
        e.preventDefault(); 
        if (continueBtn.disabled) {
            return; 
        }

        continueBtn.disabled = true;
        continueBtn.textContent = "Processing...";

        let civCatalog = [];
        try {
            const response = await fetch('/static/json/civ_catalog_filtered.json');
            if (!response.ok) throw new Error(`Failed to load civilization catalog: ${response.statusText}`);
            civCatalog = await response.json();
        } catch (error) {
            console.error("Error fetching civ_catalog_filtered.json:", error);
            alert(`Error loading civilization data: ${error.message}. Please try again.`);
            continueBtn.disabled = false; 
            continueBtn.textContent = "Continue to Game Setup";
            return;
        }

        if (!civCatalog || civCatalog.length === 0) {
            alert("No civilizations found in the catalog. Cannot proceed.");
            continueBtn.disabled = false; 
            continueBtn.textContent = "Continue to Game Setup";
            return;
        }

        const isSurpriseMeActive = surpriseMeBtn.classList.contains("clicked");
        const selectedRegionCriteriaValue = selectedRegionInput.value; 
        const selectedErasValue = selectedErasInput.value; 

        let eligibleCivs = [];
        let userMinStartYear = -Infinity;
        let userMaxEndYear = Infinity;
        let erasWereActuallySelected = false;

        // Filter civilizations to ensure they have valid years within global constraints
        if (isSurpriseMeActive) {
            eligibleCivs = civCatalog.filter(civ => {
                const start = parseInt(civ.start_year, 10);
                const end = parseInt(civ.end_year, 10);
                return start <= GLOBAL_MAX_YEAR && end >= GLOBAL_MIN_YEAR;
            });
        } else {
            const timeWindow = getMinMaxYearsFromEras(selectedErasValue, timePeriodData);
            userMinStartYear = timeWindow.minStartYear !== null ? timeWindow.minStartYear : -Infinity;
            userMaxEndYear = timeWindow.maxEndYear !== null ? timeWindow.maxEndYear : Infinity;
            erasWereActuallySelected = timeWindow.erasSelected;

            const targetRegions = getTargetRegionNames(selectedRegionCriteriaValue, rawRegionData);
            
            eligibleCivs = civCatalog.filter(civ => {
                let regionMatch = false;
                if (selectedRegionCriteriaValue === "World" || targetRegions.size === 0) { 
                    regionMatch = true; 
                } else {
                    const civRegions = civ.region.split(',').map(r => r.trim().toLowerCase());
                    const targetRegionsLower = Array.from(targetRegions).map(r => r.toLowerCase());
                    regionMatch = civRegions.some(cr => targetRegionsLower.includes(cr));
                }

                const timeMatch = !erasWereActuallySelected || 
                                (parseInt(civ.start_year, 10) <= userMaxEndYear && parseInt(civ.end_year, 10) >= userMinStartYear);
                
                // Additional constraint for global year limits
                const globalYearMatch = parseInt(civ.start_year, 10) <= GLOBAL_MAX_YEAR && 
                                       parseInt(civ.end_year, 10) >= GLOBAL_MIN_YEAR;
                
                return regionMatch && timeMatch && globalYearMatch;
            });
        }

        if (eligibleCivs.length === 0) {
            alert("No civilizations match your criteria. Please adjust your selections.");
            continueBtn.disabled = false; 
            continueBtn.textContent = "Continue to Game Setup";
            return;
        }

        const chosenCiv = eligibleCivs[Math.floor(Math.random() * eligibleCivs.length)];

        const civActualStart = parseInt(chosenCiv.start_year, 10);
        const civActualEnd = parseInt(chosenCiv.end_year, 10);

        let minSelectableYearForRandom;
        let maxSelectableYearForRandom;

        // userMinStartYear, userMaxEndYear, and erasWereActuallySelected are defined earlier in this function
        // from the result of getMinMaxYearsFromEras(selectedErasValue, timePeriodData)

        if (isSurpriseMeActive) {
            minSelectableYearForRandom = Math.max(civActualStart, GLOBAL_MIN_YEAR);
            maxSelectableYearForRandom = Math.min(civActualEnd, GLOBAL_MAX_YEAR);
        } else {
            // For non-surprise me, the bounds are the intersection of:
            // 1. Civ's actual lifespan (civActualStart, civActualEnd)
            // 2. Global game limits (GLOBAL_MIN_YEAR, GLOBAL_MAX_YEAR)
            // 3. Selected periods' range (userMinStartYear, userMaxEndYear) - if erasWereActuallySelected

            let currentMin = civActualStart;
            let currentMax = civActualEnd;

            // Intersect with global limits
            currentMin = Math.max(currentMin, GLOBAL_MIN_YEAR);
            currentMax = Math.min(currentMax, GLOBAL_MAX_YEAR);

            // If eras were selected, intersect with their period range.
            // userMinStartYear and userMaxEndYear are already numbers (or +/- Infinity if no specific eras were selected,
            // which works correctly with Math.max/min).
            if (erasWereActuallySelected) {
                currentMin = Math.max(currentMin, userMinStartYear);
                currentMax = Math.min(currentMax, userMaxEndYear);
            }
            
            minSelectableYearForRandom = currentMin;
            maxSelectableYearForRandom = currentMax;
        }

        let randomStartYear;
        if (minSelectableYearForRandom > maxSelectableYearForRandom) {
            // This condition implies that the intersection of all constraints is an empty range.
            // This should ideally be prevented by the earlier filtering of eligibleCivs,
            // which checks for overlap with global limits and selected periods.
            console.warn(`Warning: No valid year range for random selection for ${chosenCiv.name} after considering all constraints. Min/Max: ${minSelectableYearForRandom}/${maxSelectableYearForRandom}. This might indicate overly restrictive selections or data issues. Using civ's global-clamped midpoint as fallback.`);
            
            // Fallback strategy: Use the civ's lifespan strictly within global game years, and take the midpoint.
            const fallbackMin = Math.max(civActualStart, GLOBAL_MIN_YEAR);
            const fallbackMax = Math.min(civActualEnd, GLOBAL_MAX_YEAR);
            
            if (fallbackMin > fallbackMax) { 
                // More severe fallback: civ is entirely outside global game years or has zero duration within them.
                // This should also be caught by initial civ filtering.
                console.error(`Critical Fallback: Civilization ${chosenCiv.name} has no valid span within global game years (${GLOBAL_MIN_YEAR}-${GLOBAL_MAX_YEAR}). Clamping its own midpoint to global range.`);
                randomStartYear = Math.floor((civActualStart + civActualEnd) / 2); 
                randomStartYear = Math.max(GLOBAL_MIN_YEAR, Math.min(GLOBAL_MAX_YEAR, randomStartYear)); // Clamp to global
            } else {
                randomStartYear = Math.floor((fallbackMin + fallbackMax) / 2);
            }
        } else {
            randomStartYear = Math.floor(Math.random() * (maxSelectableYearForRandom - minSelectableYearForRandom + 1)) + minSelectableYearForRandom;
        }
        // randomStartYear is now determined and respects all applicable constraints.

        const dataToSend = {
            civilization: chosenCiv.name,
            selected_start_year: randomStartYear,
            raw_region_selection: selectedRegionCriteriaValue,
            raw_era_selection: selectedErasValue,
            is_surprise_me: isSurpriseMeActive
        };

        try {
            const configResponse = await fetch('/update_game_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            continueBtn.textContent = "Continue to Game Setup"; 

            if (!configResponse.ok) {
                let errorMsg = `Failed to update game configuration. Status: ${configResponse.status}`;
                try {
                    const errorData = await configResponse.json();
                    errorMsg = errorData.error || errorData.message || errorMsg;
                } catch (e) { /* Ignore */ }
                throw new Error(errorMsg);
            }

            const result = await configResponse.json();
            if (result.success) {
                window.location.href = "/gameplay";
            } else {
                alert("Error updating game configuration: " + (result.message || "Unknown server error."));
                continueBtn.disabled = false; 
            }
        } catch (error) {
            console.error("Error sending data to /update_game_config:", error);
            alert(`Error saving game settings: ${error.message}`);
            continueBtn.disabled = false; 
            continueBtn.textContent = "Continue to Game Setup";
        }
    }

    function handleSurpriseMeClick() {
        if (surpriseMeBtn.disabled) return;

        surpriseMeBtn.classList.toggle("clicked");
        
        if (surpriseMeBtn.classList.contains("clicked")) {
            // Deactivate World and Continent selections
            worldExpanded = false;
            selectedWorldEras = [];
            selectedContinents.clear();
            selectedSubregions.clear();
            selectedContinentPeriods.clear();
            selectedRegionPeriods.clear();
        }
        // No need to explicitly enable/disable other buttons here,
        // updateButtonVisuals will handle that based on surpriseMeBtn's state.
        updateButtonVisuals();
    }

    function resetAllButtons() {
        document.querySelectorAll("button").forEach(btn => {
            if (btn.classList.contains("period-off") && btn.dataset.period) {
                const type = btn.dataset.type;
                const parentIdentifier = btn.dataset.identifier;
                const periodName = btn.dataset.period;
                let specificPeriodData = null;
                if (type === "world") specificPeriodData = timePeriodData.World.find(p => p.name === periodName);
                else if (type === "continent") specificPeriodData = timePeriodData[parentIdentifier].find(p => p.name === periodName);
                else if (type === "region") specificPeriodData = timePeriodData[parentIdentifier.split(':')[1]].find(p => p.name === periodName);

                if (!(specificPeriodData && specificPeriodData.is_usable === false)) {
                    btn.disabled = false;
                    btn.classList.remove("period-off");
                    btn.title = "";
                }
            } else { 
                btn.disabled = false;
                btn.classList.remove("period-off");
                btn.title = "";
            }
        });

        worldExpanded = false;
        selectedWorldEras.length = 0;
        selectedSubregions.clear();
        selectedContinents.clear();
        selectedContinentPeriods.clear();
        selectedRegionPeriods.clear();
        updateButtonVisuals();
    }

    // ===== Initialization =====
    try {
        // Data loading
        const regionResponse = await fetch('/static/json/region_data.json');
        if (!regionResponse.ok) throw new Error(`Region data error: ${regionResponse.status}`);
        rawRegionData = await regionResponse.json();

        const timePeriodResponse = await fetch('/static/json/time_period_data.json');
        if (!timePeriodResponse.ok) throw new Error(`Time period error: ${timePeriodResponse.status}`);
        timePeriodData = await timePeriodResponse.json();

        // Prepare subregion data
        for (const continent in rawRegionData.continent_sub_region_data) {
            if (rawRegionData.continent_sub_region_data.hasOwnProperty(continent)) {
                subregionData[continent] = rawRegionData.continent_sub_region_data[continent].map(item => Object.keys(item)[0]);
            }
        }

        // DOM setup
        worldButton = document.querySelector(".world-btn");
        eraContainer = document.querySelector(".era-container");
        continentButtonWrappers = document.querySelectorAll(".region-btn-vertical-wrapper:not(.world-container)");
        continentButtons = Array.from(continentButtonWrappers).map(wrapper => wrapper.querySelector(".region-btn-vertical"));
        selectedRegionInput = document.getElementById("selected-region");
        selectedErasInput = document.getElementById("selected-eras");
        continueBtn = document.getElementById("continue-btn");
        surpriseMeBtn = document.getElementById("surprise-me-btn");
        legendDiv = document.querySelector(".legend");
        civLookupBtn = document.getElementById("civ-lookup-btn");
        const form = document.getElementById("region-form-main");

        // Initialize UI
        updateButtonVisuals();

        // Event listeners
        worldButton.addEventListener("click", handleWorldClick);
        continentButtons.forEach(btn => btn.addEventListener("click", () => handleContinentClick(btn)));
        form.addEventListener("submit", handleFormSubmit); // This will now handle redirection
        surpriseMeBtn.addEventListener("click", handleSurpriseMeClick);
        civLookupBtn.addEventListener("click", () => {
            if (!civLookupBtn.disabled) {
                window.location.href = "/civ_lookup"; // Or the correct URL for civ_lookup page
            }
        });

    } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to load game data. Please try again later.");
        if (continueBtn) continueBtn.disabled = true;
        if (worldButton) worldButton.disabled = true;
        if (continentButtons) continentButtons.forEach(btn => btn.disabled = true);
        if (surpriseMeBtn) surpriseMeBtn.disabled = true;
    }
});
