document.addEventListener("DOMContentLoaded", () => {
    /* ---------- Elements ---------- */
    const tbody        = document.querySelector("#civ-table tbody");
    const countSpan    = document.getElementById("civ-count");
    const startInp     = document.getElementById("start-year");
    const endInp       = document.getElementById("end-year");
    const startErr     = document.getElementById("start-error");
    const endErr       = document.getElementById("end-error");
    const regionSel    = document.getElementById("region-select");
    const tagBox       = document.getElementById("region-tags");
    const nameInput    = document.getElementById("name-search");
    const nameSearchError = document.getElementById("name-search-error"); 
    const customYearToggle = document.getElementById("custom-year-toggle");
    const customYearInput  = document.getElementById("custom-year-input");
    const customYearError  = document.getElementById("custom-year-error");
    const backToRegionBtn = document.getElementById("back-to-region-btn");
    const surpriseBtn = document.getElementById("surprise-civ-btn"); 
    const civSelectionForm = document.getElementById("civ-selection-form");
    const continueToGameplayBtn = document.getElementById("continue-to-gameplay-btn");
    const hiddenCivName = document.getElementById("selected-civ-name");
    const hiddenCivStartYear = document.getElementById("selected-civ-start-year");
    const hiddenCivEndYear = document.getElementById("selected-civ-end-year");
    const hiddenUseCustomToggle = document.getElementById("use-custom-start-year-toggle");
    const hiddenFinalGameStartYear = document.getElementById("final-game-start-year");
    const hiddenFilterStartYear = document.getElementById("filter-start-year-val"); 
    const hiddenFilterEndYear = document.getElementById("filter-end-year-val");   
    const civContainer = document.querySelector(".civ-container"); 

    const GAME_MIN_YEAR_CONSTRAINT = -2000;
    const GAME_MAX_YEAR_CONSTRAINT = 1600;

    const REGION_MAP = {
      "Africa":["East Africa","Horn of Africa","North Africa","Sub-Saharan Africa","West Africa"],
      "Americas":["Caribbean","Central America","North America","South America"],
      "Asia":["Central Asia","East Asia","Middle East","South Asia","Southeast Asia"],
      "Europe":["Balkans","Central Europe","Eastern Europe","Northern Europe","Southern Europe","Western Europe"],
      "Oceania":["Micronesia"]
    };
    const selectedRegions = new Set(); 
    const selectedContinents = new Set(); 
    let allCivs   = [];
    let selectedRow = null;
    let isSurpriseMeModeActive = false;
    let maxCivNameLength = 0; 

    const yLabel = y => (y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`);

    Object.entries(REGION_MAP).forEach(([cont,subs])=>{
        const optGrp = document.createElement("optgroup"); optGrp.label = cont;
        const continentOption = document.createElement("option");
        continentOption.value = `continent-${cont}`; continentOption.textContent = `[${cont}]`;
        optGrp.appendChild(continentOption);
        subs.forEach(r=>{ const o = document.createElement("option"); o.value = r; o.textContent = r; optGrp.appendChild(o); });
        regionSel.appendChild(optGrp);
    });

    regionSel.addEventListener("change", e=>{
        const selectedValue = e.target.value; if (!selectedValue) return;
        exitSurpriseModeIfNeeded(); 
        if (selectedValue.startsWith("continent-")) {
            const continentName = selectedValue.substring("continent-".length);
            const subRegions = REGION_MAP[continentName];
            if (selectedContinents.has(continentName)) { 
                selectedContinents.delete(continentName);
                subRegions.forEach(sr => { if (selectedRegions.has(sr)) { selectedRegions.delete(sr); removeTagElement(sr); } });
            } else { 
                selectedContinents.add(continentName);
                subRegions.forEach(sr => { if (!selectedRegions.has(sr)) { selectedRegions.add(sr); addTagElement(sr); } });
            }
        } else { 
            if (!selectedRegions.has(selectedValue)) { selectedRegions.add(selectedValue); addTagElement(selectedValue); updateContinentSelectionStateBasedOnSubregions(); }
        }
        updateRegionDropdownOptions(); filterAndRender(); regionSel.value = ""; 
    });
    
    function addTagElement(txt){
        const span = document.createElement("span"); span.className = "tag"; span.dataset.region = txt; 
        span.innerHTML = `${txt}<button data-t="${txt}">&times;</button>`;
        span.querySelector("button").onclick = e=>{
            exitSurpriseModeIfNeeded(); selectedRegions.delete(txt); span.remove();
            updateContinentSelectionStateBasedOnSubregions(); updateRegionDropdownOptions(); filterAndRender();
        };
        tagBox.appendChild(span);
    }

    function removeTagElement(txt) { const tagEl = tagBox.querySelector(`.tag[data-region="${txt}"]`); if (tagEl) tagEl.remove(); }

    function updateContinentSelectionStateBasedOnSubregions() {
        Object.keys(REGION_MAP).forEach(continent => {
            const subRegions = REGION_MAP[continent];
            if (subRegions.every(sr => selectedRegions.has(sr))) selectedContinents.add(continent);
            else selectedContinents.delete(continent);
        });
    }
    
    function updateRegionDropdownOptions() {
        Array.from(regionSel.options).forEach(option => {
            if (option.value.startsWith("continent-")) { option.disabled = false; } 
            else if (option.value) { 
                let parentContinentSelected = false;
                for (const c of selectedContinents) { if (REGION_MAP[c] && REGION_MAP[c].includes(option.value)) { parentContinentSelected = true; break; } }
                option.disabled = parentContinentSelected || selectedRegions.has(option.value);
            }
        });
    }

    function validateNameSearchInput() {
        if (nameInput.disabled || !nameSearchError) return true; 
        if (nameInput.value.length > maxCivNameLength + 1 && maxCivNameLength > 0) {
            nameSearchError.textContent = `Name search cannot exceed ${maxCivNameLength + 1} characters.`;
            nameInput.classList.add("error"); return false;
        }
        nameSearchError.textContent = ""; nameInput.classList.remove("error"); return true;
    }

    nameInput.addEventListener("input", () => { exitSurpriseModeIfNeeded(); validateNameSearchInput(); filterAndRender(); });

    function checkMainYearFilters(){ 
        let ok = true; startErr.textContent = ""; endErr.textContent = "";
        startInp.classList.remove("error"); endInp.classList.remove("error");
        if (startInp.disabled) return true;
        if (startInp.value.trim() === "") { startInp.classList.add("error"); startErr.textContent = "Start year cannot be empty."; ok = false; }
        else if (startInp.value.length > 5) { startInp.classList.add("error"); startErr.textContent = "Max 5 chars."; ok = false; }
        if (endInp.value.trim() === "") { endInp.classList.add("error"); endErr.textContent = "End year cannot be empty."; ok = false; }
        else if (endInp.value.length > 5) { endInp.classList.add("error"); endErr.textContent = "Max 5 chars."; ok = false; }
        if (ok && startInp.value.trim() !== "" && endInp.value.trim() !== "") {
            const s = +startInp.value; const e = +endInp.value;
            if(isNaN(s) || (startInp.value.match(/-/g) || []).length > 1){ startInp.classList.add("error"); if (!startErr.textContent) startErr.textContent = "Invalid number/format."; ok = false; }
            else if(s < -2000 || s > 1599){ startInp.classList.add("error"); if (!startErr.textContent) startErr.textContent = "Year: -2000 to 1599."; ok = false; }
            if(isNaN(e) || (endInp.value.match(/-/g) || []).length > 1){ endInp.classList.add("error"); if (!endErr.textContent) endErr.textContent = "Invalid number/format."; ok = false; }
            else if(e < -1999 || e > 1600){ endInp.classList.add("error"); if (!endErr.textContent) endErr.textContent = "Year: -1999 to 1600."; ok = false; }
            if(ok && s > e){ startInp.classList.add("error"); endInp.classList.add("error"); if (!endErr.textContent) endErr.textContent = "End year must be ≥ start year."; else if (!startErr.textContent) startErr.textContent = "Start year must be ≤ end year."; ok = false; }
        }
        return ok;
    }

    [startInp,endInp].forEach(inp=>inp.addEventListener("input", ()=>{ exitSurpriseModeIfNeeded(); checkMainYearFilters(); filterAndRender(); }));
    
    function validateCustomYearInput() { 
        if (customYearInput.disabled) { customYearError.textContent = ""; customYearInput.classList.remove("error"); return true; }
        let isValid = true; customYearError.textContent = ""; customYearInput.classList.remove("error");
        const yearStr = customYearInput.value.trim();
        if (yearStr === "") { customYearError.textContent = "Specific start year cannot be empty."; customYearInput.classList.add("error"); isValid = false; }
        else if (yearStr.length > 5) { customYearError.textContent = "Max 5 characters."; customYearInput.classList.add("error"); isValid = false; }
        else {
            const yearNum = +yearStr;
            if (isNaN(yearNum) || (yearStr.match(/-/g) || []).length > 1 || !/^-?\d+$/.test(yearStr)) { customYearError.textContent = "Invalid number or format."; customYearInput.classList.add("error"); isValid = false; }
            else if (yearNum < GAME_MIN_YEAR_CONSTRAINT || yearNum > GAME_MAX_YEAR_CONSTRAINT) { customYearError.textContent = `Year must be ${GAME_MIN_YEAR_CONSTRAINT} to ${GAME_MAX_YEAR_CONSTRAINT}.`; customYearInput.classList.add("error"); isValid = false; }
            else if (selectedRow) { const civData = JSON.parse(selectedRow.dataset.civData); if (yearNum < civData.start_year || yearNum > civData.end_year) { customYearError.textContent = `Year must be within civ range: ${yLabel(civData.start_year)} to ${yLabel(civData.end_year)}.`; customYearInput.classList.add("error"); isValid = false; } }
            else if (!selectedRow && customYearToggle.checked) { 
                customYearError.textContent = "Select a civ to validate year range."; 
            }
        }
        return isValid;
    }

    function updateMainAndFilterControlsState() { 
        const disableFilters = isSurpriseMeModeActive;
        nameInput.disabled = disableFilters; regionSel.disabled = disableFilters;
        if (disableFilters && nameSearchError) { nameSearchError.textContent = ""; nameInput.classList.remove("error");}
        const disableMainYears = isSurpriseMeModeActive || customYearToggle.checked;
        startInp.disabled = disableMainYears; endInp.disabled = disableMainYears;
        if (disableMainYears) { startInp.classList.remove("error"); startErr.textContent = ""; endInp.classList.remove("error"); endErr.textContent = ""; }
    }

    function exitSurpriseModeIfNeeded() { 
        if (isSurpriseMeModeActive) { 
            isSurpriseMeModeActive = false; 
            civContainer.classList.remove('surprise-me-active'); 
            surpriseBtn.classList.remove("clicked"); 
            hiddenCivName.value = ""; hiddenCivStartYear.value = ""; hiddenCivEndYear.value = ""; hiddenFinalGameStartYear.value = "";
            updateAllButtonAndInputStates(); 
        } 
    }
    function updateSurpriseMeButtonState() { 
        surpriseBtn.disabled = (selectedRow !== null && !isSurpriseMeModeActive); 
    }
    function updateBackToRegionButtonState() { backToRegionBtn.disabled = (selectedRow !== null || isSurpriseMeModeActive); }
    
    function updateAllButtonAndInputStates() {
        updateSurpriseMeButtonState(); updateBackToRegionButtonState();
        updateMainAndFilterControlsState(); updateCustomYearInputState(); 
        updateContinueButtonState();  
    }

    fetch("/static/json/civ_catalog_filtered.json")
      .then(r=>r.json())
      .then(json=>{ 
          allCivs = json; 
          if (allCivs.length > 0) { maxCivNameLength = Math.max(...allCivs.map(c => c.name.length)); }
          filterAndRender(); updateRegionDropdownOptions(); 
        })
      .catch(err=>{ tbody.innerHTML = `<tr><td colspan="5" style="color:red">Failed: ${err}</td></tr>`; });

    function filterAndRender(){ 
        let filtered = [...allCivs]; const nameQ = nameInput.value.trim().toLowerCase();
        let currentSelectedCivData = null;
        if(selectedRow) { // Preserve selected civ data if a row is selected
            currentSelectedCivData = selectedRow.dataset.civData;
        }

        if (customYearToggle.checked && !customYearInput.disabled && customYearInput.value.trim() !== "") {
            const customY = +customYearInput.value;
            if (!isNaN(customY) && validateCustomYearInput()) { 
                 filtered = filtered.filter(c => customY >= c.start_year && customY <= c.end_year);
            } else if (!selectedRow && customYearToggle.checked && customYearInput.value.trim() !== "" && !isNaN(customY) && customY >= GAME_MIN_YEAR_CONSTRAINT && customY <= GAME_MAX_YEAR_CONSTRAINT) {
                 filtered = filtered.filter(c => customY >= c.start_year && customY <= c.end_year);
            } else if (customYearToggle.checked) { 
                filtered = []; 
            }
        } else if (!startInp.disabled && !endInp.disabled) { 
            if (checkMainYearFilters()) { const minY = +startInp.value; const maxY = +endInp.value; filtered = filtered.filter(c => c.end_year >= minY && c.start_year <= maxY); } 
            else { filtered = []; } 
        }
        if (selectedRegions.size > 0) { filtered = filtered.filter(c => [...selectedRegions].some(r => c.region.includes(r))); }
        if (nameQ && validateNameSearchInput()) { filtered = filtered.filter(c => c.name.toLowerCase().includes(nameQ)); }
        
        countSpan.textContent = `${filtered.length} records`; tbody.innerHTML = ""; 
        
        let newSelectedRowFound = false;
        filtered.forEach(c => {
            const tr = addRow(c); // addRow now returns the created tr
            if (currentSelectedCivData && tr.dataset.civData === currentSelectedCivData) {
                tr.classList.add("selected");
                selectedRow = tr; // Re-assign selectedRow to the new tr element
                newSelectedRowFound = true;
            }
        });

        if (!newSelectedRowFound) { // If previously selected row is no longer in filtered list
            selectedRow = null;
        }
        updateAllButtonAndInputStates();
    }

    function updateContinueButtonState() { 
        let yearsAreValid = customYearToggle.checked ? validateCustomYearInput() : checkMainYearFilters();
        let nameIsValid = validateNameSearchInput();
        if (isSurpriseMeModeActive) { continueToGameplayBtn.disabled = false; }
        else if (selectedRow && yearsAreValid && nameIsValid) { continueToGameplayBtn.disabled = false; }
        else { continueToGameplayBtn.disabled = true; }
        
        if (!continueToGameplayBtn.disabled) {
            if (isSurpriseMeModeActive) { /* Fields set by surprise logic */ }
            else if (selectedRow) {
                const civData = JSON.parse(selectedRow.dataset.civData);
                hiddenCivName.value = civData.name; hiddenCivStartYear.value = civData.start_year;
                hiddenCivEndYear.value = civData.end_year; hiddenUseCustomToggle.value = customYearToggle.checked;
                hiddenFinalGameStartYear.value = customYearToggle.checked ? customYearInput.value : "random"; 
            }
        } else { if (!isSurpriseMeModeActive) { hiddenCivName.value = ""; hiddenCivStartYear.value = ""; hiddenCivEndYear.value = ""; hiddenUseCustomToggle.value = ""; hiddenFinalGameStartYear.value = ""; } }
    }

    function updateCustomYearInputState() { 
        const disableToggle = isSurpriseMeModeActive; customYearToggle.disabled = disableToggle;
        const disableInput = isSurpriseMeModeActive || !customYearToggle.checked;
        customYearInput.disabled = disableInput;
        if (disableInput) { 
            if (!isSurpriseMeModeActive || (isSurpriseMeModeActive && !customYearToggle.checked)) { customYearInput.value = ""; } 
            customYearError.textContent = ""; customYearInput.classList.remove("error"); 
        }
        updateMainAndFilterControlsState(); 
        if (!customYearToggle.checked) { customYearInput.value = ""; customYearError.textContent = ""; customYearInput.classList.remove("error"); }
    }

    customYearToggle.addEventListener("change", () => { 
        exitSurpriseModeIfNeeded(); 
        updateAllButtonAndInputStates(); 
        filterAndRender(); 
    });
    customYearInput.addEventListener("input", () => { 
        exitSurpriseModeIfNeeded(); 
        validateCustomYearInput(); 
        filterAndRender(); 
    });

    function addRow(c){ 
        const tr = document.createElement("tr"); tr.dataset.civData = JSON.stringify(c);
        const startTxt = c.start_year < -2000 ? `${yLabel(-2000)} (${yLabel(c.start_year)})` : yLabel(c.start_year);
        const endTxt   = c.end_year > 1600   ? `${yLabel(1600)} (${yLabel(c.end_year)})`   : yLabel(c.end_year);
        tr.innerHTML = `<td>${c.name}</td><td>${c.region}</td><td>${startTxt}</td><td>${endTxt}</td><td>${c.notes || ""}</td>`;
        tr.onclick = () => {
            if (isSurpriseMeModeActive) return; 
            if (selectedRow === tr) { 
                tr.classList.remove("selected"); 
                selectedRow = null; 
            } else { 
                if (selectedRow) selectedRow.classList.remove("selected");
                selectedRow = tr; 
                tr.classList.add("selected"); 
            }
            updateAllButtonAndInputStates(); 
            if(customYearToggle.checked) validateCustomYearInput(); 
            // filterAndRender(); // Removed: Row click itself doesn't change filter criteria
        };
        tbody.appendChild(tr);
        return tr; // Return the created row
    }

    surpriseBtn.addEventListener("click", () => { 
        if (selectedRow && !isSurpriseMeModeActive) return; 
        if (isSurpriseMeModeActive) { exitSurpriseModeIfNeeded(); return; }
        isSurpriseMeModeActive = true; civContainer.classList.add('surprise-me-active'); surpriseBtn.classList.add("clicked"); 
        if (selectedRow) { selectedRow.classList.remove("selected"); selectedRow = null; } 
        startInp.value = "-2000"; endInp.value = "1600"; nameInput.value = ""; 
        if(nameSearchError) nameSearchError.textContent = ""; nameInput.classList.remove("error");
        selectedRegions.clear(); tagBox.innerHTML = ""; regionSel.value = ""; customYearToggle.checked = false; 
        if (allCivs.length === 0) { alert("No civilizations available."); exitSurpriseModeIfNeeded(); return; }
        const chosenCiv = allCivs[Math.floor(Math.random() * allCivs.length)];
        let gameStartYear = Math.floor(Math.random() * (chosenCiv.end_year - chosenCiv.start_year + 1)) + chosenCiv.start_year;
        if (gameStartYear < GAME_MIN_YEAR_CONSTRAINT) gameStartYear = GAME_MIN_YEAR_CONSTRAINT;
        if (gameStartYear > GAME_MAX_YEAR_CONSTRAINT) gameStartYear = GAME_MAX_YEAR_CONSTRAINT;
        hiddenCivName.value = chosenCiv.name; hiddenCivStartYear.value = chosenCiv.start_year; 
        hiddenCivEndYear.value = chosenCiv.end_year; hiddenUseCustomToggle.value = "false";           
        hiddenFinalGameStartYear.value = gameStartYear;  
        updateAllButtonAndInputStates(); updateRegionDropdownOptions(); 
    });

    backToRegionBtn.addEventListener("click", () => { if (backToRegionBtn.disabled) return; window.location.href = "/start_region"; });

    checkMainYearFilters(); updateAllButtonAndInputStates(); updateRegionDropdownOptions();

    civSelectionForm.addEventListener("submit", (event) => { 
        if (isSurpriseMeModeActive) { 
            hiddenFilterStartYear.value = ""; hiddenFilterEndYear.value = ""; return; 
        }
        let formIsValid = true;
        if (!selectedRow) { alert("Please select a civilisation to continue."); event.preventDefault(); return; }
        if (!validateNameSearchInput()) { alert("Please correct the error in the name search."); formIsValid = false; }
        if (customYearToggle.checked) { 
            if (!validateCustomYearInput()) { alert("Please correct the error in the specific start year."); formIsValid = false; }
            hiddenFilterStartYear.value = ""; hiddenFilterEndYear.value = "";
        } else { 
            if (!checkMainYearFilters()) { alert("Please correct the errors in the year filters."); formIsValid = false; }
            hiddenFilterStartYear.value = startInp.value; hiddenFilterEndYear.value = endInp.value;
        }
        if (!formIsValid) { event.preventDefault(); return; }
        const civData = JSON.parse(selectedRow.dataset.civData);
        hiddenCivName.value = civData.name; 
        hiddenCivStartYear.value = civData.start_year; 
        hiddenCivEndYear.value = civData.end_year;     
        hiddenUseCustomToggle.value = customYearToggle.checked;
        if (customYearToggle.checked) { hiddenFinalGameStartYear.value = customYearInput.value; } 
        else { hiddenFinalGameStartYear.value = "random"; }
    });
});
