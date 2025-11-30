document.addEventListener('DOMContentLoaded', () => {
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsTitle = document.getElementById('suggestions-title');
    const randomiseBtn = document.getElementById('randomise-btn');
    const dbList = document.getElementById('db-list');
    const dbTitle = document.getElementById('db-title');
    const searchInput = document.getElementById('search-input');
    const tagFilter = document.getElementById('tag-filter');
    const addMealOpen = document.getElementById('add-meal-open');
    const modal = document.getElementById('modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    const mealForm = document.getElementById('meal-form');
    const modalTitle = document.getElementById('modal-title');
    const mealNameInput = document.getElementById('meal-name');
    const mealTagsInput = document.getElementById('meal-tags');
    const mealPopInput = document.getElementById('meal-pop');
    const popValue = document.getElementById('pop-value');
    const exportBtn = document.getElementById('export-btn');
    const exportModal = document.getElementById('export-modal');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportCancel = document.getElementById('export-cancel');
    const importFile = document.getElementById('import-file');
    const toggleLayoutBtn = document.getElementById('toggle-layout-btn');
    const toast = document.getElementById('toast');
    const showDatesToggle = document.getElementById('show-dates-toggle');
    const shoppingListBtn = document.getElementById('shopping-list-btn');
    const shoppingListModal = document.getElementById('shopping-list-modal');
    const shoppingListItems = document.getElementById('shopping-list-items');
    const shoppingListClose = document.getElementById('shopping-list-close');
    const startDateInput = document.getElementById('start-date-input');
    const setStartDateBtn = document.getElementById('set-start-date-btn');



    let meals = [];
    let allTags = new Set();
    let editingMealId = null;
    let mealsEdited = false;

    // Load initial data
    fetch('meals_db.json')
        .then(response => response.json())
        .then(data => {
            meals = data.map((meal, index) => ({ id: `m${index}`, ...normalizeMeal(meal) }));
            updateAllTags();
            updateAllTags();
            renderDB();
            renderSuggestions(document.querySelector('input[name="days"]:checked').value);
        });



    function toTitleCase(str) {
        const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of']);
        return str.replace(/\w\S*/g, (txt, offset) => {
            if (offset > 0 && minorWords.has(txt.toLowerCase())) {
                return txt.toLowerCase();
            }
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
        });
    }

    function toSentenceCase(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    const REGIONS = new Map([
        'Italian', 'Indian', 'Chinese', 'Japanese', 'Thai', 'Mexican', 'French', 'Greek', 'Spanish',
        'American', 'Korean', 'Vietnamese', 'Mediterranean', 'British', 'German', 'Turkish', 'Lebanese',
        'Caribbean', 'Cajun', 'Creole', 'Asian', 'European', 'African', 'Middle Eastern', 'Moroccan',
        'Brazilian', 'Peruvian', 'Russian', 'Swedish', 'Irish', 'Scottish', 'Welsh', 'Australian', 'Canadian',
        'India', 'Italy', 'China', 'Japan', 'Thailand', 'Mexico', 'France', 'Greece', 'Spain', 'USA', 'UK',
        'Germany', 'Turkey', 'Lebanon', 'Vietnam', 'Korea', 'Brazil', 'Peru', 'Russia', 'Sweden', 'English'
    ].map(r => [r.toLowerCase(), r]));

    function formatTag(tag) {
        const lower = tag.trim().toLowerCase();
        return REGIONS.get(lower) || lower;
    }

    function sortTags(tags) {
        return tags.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    function normalizeMeal(meal) {
        const tags = (meal.tags || []).map(t => formatTag(t)).filter(Boolean);
        return {
            ...meal,
            name: toTitleCase(meal.name || ''),
            tags: sortTags(tags),
            ingredients: (meal.ingredients || []).map(i => toSentenceCase(i.trim())).filter(Boolean)
        };
    }

    function updateAllTags() {
        allTags.clear();
        meals.forEach(meal => {
            meal.tags.forEach(tag => allTags.add(tag));
        });

        // Sort and repopulate tag filter
        const sortedTags = [...allTags].sort();
        tagFilter.innerHTML = '<option value="all">all tags</option>';
        sortedTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }

    function renderDB(filter = '', tag = 'all') {
        dbList.innerHTML = '';
        const filteredMeals = meals.filter(meal => {
            const matchesFilter = meal.name.toLowerCase().includes(filter.toLowerCase()) ||
                meal.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
            const matchesTag = tag === 'all' || meal.tags.includes(tag);
            return matchesFilter && matchesTag;
        });

        dbTitle.textContent = `Choose from ${filteredMeals.length} meal${filteredMeals.length !== 1 ? 's' : ''}`;

        filteredMeals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.draggable = true;
            mealCard.dataset.mealId = meal.id;
            mealCard.innerHTML = `
                <div>
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-meta">
                        ${meal.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join(' ')}
                    </div>
                </div>
                <div class="right">
                    <button class="btn edit-btn" data-id="${meal.id}"><span class="material-symbols-outlined">edit</span></button>
                </div>
            `;
            dbList.appendChild(mealCard);
        });
    }

    function renderSuggestions(count) {
        suggestionsList.innerHTML = '';
        suggestionsTitle.textContent = `${count}-Day Meal Plan`;

        // let date = new Date();
        let date = customStartDate ? new Date(customStartDate) : new Date();

        const suggestions = new Set();
        while (suggestions.size < count) {
            const meal = weightedRandomSelect(meals);
            if (!suggestions.has(meal)) {
                suggestions.add(meal);
            }
        }

        suggestions.forEach((meal, index) => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion';
            suggestionEl.dataset.mealId = meal.id;
            const buttonDate = new Date(date);
            suggestionEl.innerHTML = `
                <div class="suggestion-date">
                  <div class="day">${date.getDate()}</div>
                  <div class="month-day">${date.toLocaleString('default', { weekday: 'short' })} ${date.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div class="suggestion-info">
                    <span class="meal-name">${meal.name}</span>
                </div>
                <div class="suggestion-action">
                    <button class="btn highlight-yellow calendar-btn" data-meal-name="${meal.name}" data-date="${buttonDate.toISOString()}">
                    <span class="material-symbols-outlined">event</span>
                    </button>
                </div>
            `;
            suggestionsList.appendChild(suggestionEl);
            date.setDate(date.getDate() + 1);
        });

        // Add click handler for calendar buttons
        suggestionsList.querySelectorAll('.calendar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const mealName = btn.dataset.mealName;
                const eventDate = new Date(btn.dataset.date);
                openCalendarLink(mealName, eventDate);
            });
        });

        updateDateVisibility();
    }

    function openCalendarLink(mealName, eventDate) {
        eventDate.setHours(18, 0, 0, 0); // 6 PM

        const pad = (n) => String(n).padStart(2, '0');
        const start = `${eventDate.getFullYear()}${pad(eventDate.getMonth() + 1)}${pad(eventDate.getDate())}T${pad(eventDate.getHours())}${pad(eventDate.getMinutes())}00`;

        const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour duration
        const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

        // Find the meal and get its ingredients
        const meal = meals.find(m => m.name === mealName);
        let details = `Meal planned: ${mealName}`;
        if (meal && meal.ingredients && meal.ingredients.length > 0) {
            const ingredientsList = meal.ingredients.map(ing => `• ${ing}`).join('\n');
            details = `Meal planned: ${mealName}\n\nIngredients:\n${ingredientsList}`;
        }

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: mealName,
            dates: `${start}/${end}`,
            details: details,
            sf: 'true',
            output: 'xml'
        });

        const calendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;
        window.open(calendarUrl, '_blank');
    }

    function weightedRandomSelect(list) {
        const totalWeight = list.reduce((sum, meal) => sum + meal.popularity, 0);
        let random = Math.random() * totalWeight;

        for (const meal of list) {
            if (random < meal.popularity) {
                return meal;
            }
            random -= meal.popularity;
        }
        return list[list.length - 1];
    }

    // Function to populate modal with meal data
    function populateModal(meal) {
        mealNameInput.value = meal.name;
        mealTagsInput.value = meal.tags.join(', ');
        mealPopInput.value = meal.popularity;
        popValue.textContent = meal.popularity;
        document.getElementById('ingredients').value = (meal.ingredients || []).join(', ');
    }
    // Function to handle adding a new meal
    function addMeal() {
        const rawName = mealNameInput.value.trim();
        if (!rawName) return;

        const name = toTitleCase(rawName);
        let tags = mealTagsInput.value.split(',').map(t => formatTag(t)).filter(Boolean);
        tags = sortTags(tags);
        const popularity = parseFloat(mealPopInput.value);
        const ingredients = document.getElementById('ingredients').value.split(',').map(i => toSentenceCase(i.trim())).filter(Boolean);

        if (editingMealId) {
            // Update existing meal
            const meal = meals.find(m => m.id === editingMealId);
            meal.name = name;
            meal.tags = tags;
            meal.popularity = popularity;
            meal.ingredients = ingredients;
        } else {
            // Add new meal
            const newMeal = {
                id: `m${Date.now()}`,
                name,
                tags,
                popularity,
                ingredients
            };
            meals.push(newMeal);
        }
        updateAllTags();
        renderDB(searchInput.value, tagFilter.value);
        modal.classList.add('hidden');
        mealsEdited = true;
        showToast(editingMealId ? 'Meal updated!' : 'Meal added!');
    }

    // Event listeners
    randomiseBtn.addEventListener('click', () => {
        const selectedDays = document.querySelector('input[name="days"]:checked').value;
        renderSuggestions(selectedDays);
    });

    searchInput.addEventListener('input', () => {
        renderDB(searchInput.value, tagFilter.value);
    });

    tagFilter.addEventListener('change', () => {
        renderDB(searchInput.value, tagFilter.value);
    });

    dbList.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) {
            editingMealId = e.target.closest('.edit-btn').dataset.id;
            const meal = meals.find(m => m.id === editingMealId);
            modalTitle.textContent = 'Edit Meal';
            populateModal(meal);
            modal.classList.remove('hidden');
        } else if (e.target.classList.contains('tag')) {
            const tag = e.target.dataset.tag;
            tagFilter.value = tag;
            renderDB(searchInput.value, tag);
        }
    });

    addMealOpen.addEventListener('click', () => {
        editingMealId = null;
        modalTitle.textContent = 'Add Meal';
        mealForm.reset();
        popValue.textContent = '0.5';
        mealPopInput.value = '0.5';
        modal.classList.remove('hidden');
    });

    modalCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    mealForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addMeal();
    });

    mealPopInput.addEventListener('input', () => popValue.textContent = mealPopInput.value);

    document.querySelectorAll('input[name="days"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            renderSuggestions(e.target.value);
        });
    });

    // Drag and drop functionality
    let draggedItem = null;

    dbList.addEventListener('dragstart', e => {
        if (e.target.classList.contains('meal-card')) {
            draggedItem = e.target;
            setTimeout(() => e.target.style.opacity = '0.5', 0);
        }
    });

    dbList.addEventListener('dragend', e => {
        if (draggedItem) {
            setTimeout(() => e.target.style.opacity = '1', 0);
            draggedItem = null;
        }
    });

    suggestionsList.addEventListener('dragover', e => {
        e.preventDefault();
        const target = e.target.closest('.suggestion');
        if (target) {
            target.classList.add('drag-over');
        }
    });

    suggestionsList.addEventListener('dragleave', e => {
        const target = e.target.closest('.suggestion');
        if (target) {
            target.classList.remove('drag-over');
        }
    });

    suggestionsList.addEventListener('drop', e => {
        e.preventDefault();
        const target = e.target.closest('.suggestion');
        if (target && draggedItem) {
            target.classList.remove('drag-over');
            const sourceMealId = draggedItem.dataset.mealId;
            const meal = meals.find(m => m.id === sourceMealId);

            // update visible meal name in the suggestion
            const mealNameEl = target.querySelector('.meal-name');
            if (mealNameEl) mealNameEl.textContent = meal.name;

            // update suggestion's dataset so other logic can reference the new meal id
            target.dataset.mealId = meal.id;

            // IMPORTANT: update the calendar button's data so "Add to Calendar" uses the new meal
            const calBtn = target.querySelector('.calendar-btn');
            if (calBtn) {
                calBtn.dataset.mealName = meal.name;
            }

            showToast('Meal updated in suggestions!');
        }
    });

    function downloadFile(filename, content, type) {
        const dataStr = `data:${type};charset=utf-8,${encodeURIComponent(content)}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function getTimestampFilename(extension) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
        return `${timestamp}_meals.${extension}`;
    }

    function exportAsJSON() {
        const jsonStr = JSON.stringify(meals, null, 2);
        downloadFile(getTimestampFilename('json'), jsonStr, 'application/json');
        showToast('Exported to JSON');
        mealsEdited = false;
        exportModal.classList.add('hidden');
    }

    function exportAsCSV() {
        const headers = ['name', 'tags', 'popularity', 'ingredients'];
        const rows = meals.map(m => [
            `"${m.name.replace(/"/g, '""')}"`,
            `"${(m.tags || []).join(';').replace(/"/g, '""')}"`,
            m.popularity,
            `"${(m.ingredients || []).join(';').replace(/"/g, '""')}"`
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        downloadFile(getTimestampFilename('csv'), csv, 'text/csv');
        showToast('Exported to CSV');
        mealsEdited = false;
        exportModal.classList.add('hidden');
    }

    exportBtn.addEventListener('click', () => {
        exportModal.classList.remove('hidden');
    });

    exportJsonBtn.addEventListener('click', exportAsJSON);
    exportCsvBtn.addEventListener('click', exportAsCSV);

    exportCancel.addEventListener('click', () => {
        exportModal.classList.add('hidden');
    });

    shoppingListBtn.addEventListener('click', () => {
        generateShoppingList();
    });

    shoppingListClose.addEventListener('click', () => {
        shoppingListModal.classList.add('hidden');
    });

    // Use event delegation for dynamically visibility or potential timing issues
    document.addEventListener('click', (e) => {
        if (e.target.closest('#shopping-list-copy')) {
            copyShoppingList();
        }
        if (e.target.closest('#shopping-list-calendar')) {
            addShoppingListToCalendar();
        }
    });

    function generateShoppingList() {
        // Collect all ingredients from current suggestions
        const ingredientCounts = new Map();
        const suggestionCards = suggestionsList.querySelectorAll('.suggestion');

        suggestionCards.forEach(card => {
            const mealName = card.querySelector('.meal-name').textContent;
            const meal = meals.find(m => m.name === mealName);
            if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
                meal.ingredients.forEach(ingredient => {
                    if (ingredient.trim()) {
                        const name = ingredient.trim();
                        ingredientCounts.set(name, (ingredientCounts.get(name) || 0) + 1);
                    }
                });
            }
        });

        // Generate HTML for ingredients with checkboxes
        if (ingredientCounts.size === 0) {
            shoppingListItems.innerHTML = '<p class="muted">No ingredients in current meal suggestions</p>';
        } else {
            const sortedIngredients = Array.from(ingredientCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            shoppingListItems.innerHTML = sortedIngredients.map(([ingredient, count]) => {
                const countDisplay = count > 1 ? ` [${count}]` : '';
                return `
                <label class="shopping-list-item">
                    <input type="checkbox" class="ingredient-checkbox" data-ingredient="${ingredient}">
                    <span>${ingredient}${countDisplay}</span>
                </label>
            `}).join('');
        }

        shoppingListModal.classList.remove('hidden');
    }

    function toStrikethrough(text) {
        return text.split('').map(char => char + '\u0336').join('');
    }

    function getFormattedShoppingListText() {
        const items = [];
        shoppingListItems.querySelectorAll('.shopping-list-item').forEach(label => {
            const checkbox = label.querySelector('input');
            const span = label.querySelector('span');
            items.push({
                text: span.textContent,
                checked: checkbox.checked
            });
        });

        // Sort: Unchecked first, then alphabetical
        items.sort((a, b) => {
            if (a.checked === b.checked) {
                return a.text.localeCompare(b.text);
            }
            return a.checked ? 1 : -1;
        });

        return items.map(item => {
            let text = item.text;
            if (item.checked) {
                text = toStrikethrough(text);
            }
            return `• ${text}`;
        }).join('\n');
    }

    function copyShoppingList() {
        const listText = getFormattedShoppingListText();
        if (!navigator.clipboard) {
            showToast('Clipboard access not supported');
            return;
        }
        navigator.clipboard.writeText(listText).then(() => {
            showToast('Shopping list copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy to clipboard');
        });
    }

    function addShoppingListToCalendar() {
        const listText = getFormattedShoppingListText();
        const details = `Shopping List:\n\n${listText}`;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: 'Shopping List',
            details: details,
            sf: 'true',
            output: 'xml'
        });

        const calendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;
        window.open(calendarUrl, '_blank');
    }

    function parseCSV(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const tagsIdx = headers.indexOf('tags');
        const popIdx = headers.indexOf('popularity');
        const ingredientsIdx = headers.indexOf('ingredients');

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].match(/(?:"[^"]*"|[^,])+/g) || [];
            const row = values.map(v => v.replace(/^"|"$/g, '').trim());

            result.push({
                name: row[nameIdx] || row[0] || `Row ${i}`,
                tags: (row[tagsIdx] || '').split(';').map(t => t.trim()).filter(Boolean),
                popularity: parseFloat(row[popIdx]) || 0.5,
                ingredients: (row[ingredientsIdx] || '').split(';').map(ing => ing.trim()).filter(Boolean)
            });
        }
        return result;
    }

    importFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                let importedMeals = [];

                // Auto-detect format by file extension
                if (file.name.toLowerCase().endsWith('.json')) {
                    importedMeals = JSON.parse(text);
                    if (!Array.isArray(importedMeals)) {
                        showToast('Invalid JSON format: expected an array');
                        return;
                    }
                } else if (file.name.toLowerCase().endsWith('.csv')) {
                    importedMeals = parseCSV(text);
                } else {
                    showToast('Unsupported file format. Use .json or .csv');
                    return;
                }

                if (Array.isArray(importedMeals)) {
                    meals = importedMeals.map((meal, index) => ({ id: `m${index}`, ...normalizeMeal(meal) }));
                    updateAllTags();
                    renderDB();
                    renderSuggestions(document.querySelector('input[name="days"]:checked').value);
                    mealsEdited = true;
                    showToast(`Imported ${importedMeals.length} meals`);
                } else {
                    showToast('Invalid data format');
                }
            } catch (error) {
                showToast('Error parsing file: ' + error.message);
            }
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    function updateDateVisibility() {
        const show = showDatesToggle.checked;
        suggestionsList.querySelectorAll('.suggestion-date').forEach(el => {
            el.style.display = show ? 'flex' : 'none';
        });
    }

    showDatesToggle.addEventListener('change', updateDateVisibility);

    // Exit Intent Detection
    let exitIntentShown = false;
    document.addEventListener('mouseout', (e) => {
        if (exitIntentShown || !mealsEdited) return;

        // Check if mouse left the window from the top
        if (e.clientY <= 0) {
            exitIntentShown = true;
            exportModal.classList.remove('hidden');
        }
    });


    //2025-11-30 GK - expandable layout for the menu database

    let isExpanded = false;
    toggleLayoutBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        const container = document.querySelector('.container');
        const buttonText = toggleLayoutBtn.querySelector('.button-text');

        if (isExpanded) {
            container.classList.add('expanded');
            buttonText.textContent = 'Collapse';
        } else {
            container.classList.remove('expanded');
            buttonText.textContent = 'Expand';
        }
    });

    let customStartDate = null;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    startDateInput.setAttribute('min', today);

    // Trigger date picker when button is clicked
    setStartDateBtn.addEventListener('click', () => {
        startDateInput.showPicker();
    });

    // Auto-update when date is selected
    startDateInput.addEventListener('change', () => {
        if (startDateInput.value) {
            customStartDate = new Date(startDateInput.value);
            const selectedDays = document.querySelector('input[name="days"]:checked').value;
            renderSuggestions(selectedDays);
            showToast('Start date updated!');
        }
    });

});
