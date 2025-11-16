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
    const toast = document.getElementById('toast');
    const showDatesToggle = document.getElementById('show-dates-toggle');
    const shoppingListBtn = document.getElementById('shopping-list-btn');
    const shoppingListModal = document.getElementById('shopping-list-modal');
    const shoppingListItems = document.getElementById('shopping-list-items');
    const shoppingListClose = document.getElementById('shopping-list-close');


    let meals = [];
    let allTags = new Set();
    let editingMealId = null;

    // Load initial data
    fetch('meals_db.json')
        .then(response => response.json())
        .then(data => {
            meals = data.map((meal, index) => ({ id: `m${index}`, ...meal }));
            updateAllTags();
            updateDBTitle();
            renderDB();
            renderSuggestions(document.querySelector('input[name="days"]:checked').value);
        });

    function updateDBTitle() {
        dbTitle.textContent = `Choose from ${meals.length} meal${meals.length !== 1 ? 's' : ''}`;
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
        suggestionsTitle.textContent = `${count}-Day Meal Suggestions`;
        let date = new Date();

        const suggestions = new Set();
        while(suggestions.size < count) {
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
                  <div class="month-day">${date.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <span class="meal-name">${meal.name}</span>
                <button class="btn highlight-yellow calendar-btn" data-meal-name="${meal.name}" data-date="${buttonDate.toISOString()}">
                  <span class="material-symbols-outlined">event</span><span class="calendar-text"> Add to Calendar</span>
                </button>
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
        const name = mealNameInput.value.trim();
        if (!name) return;
        const tags = mealTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        const popularity = parseFloat(mealPopInput.value);
        const ingredients = document.getElementById('ingredients').value.split(',').map(ingredient => ingredient.trim());

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
        updateDBTitle();
        renderDB(searchInput.value, tagFilter.value);
        modal.classList.add('hidden');
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

    function generateShoppingList() {
        // Collect all ingredients from current suggestions
        const ingredientSet = new Set();
        const suggestionCards = suggestionsList.querySelectorAll('.suggestion');
        
        suggestionCards.forEach(card => {
            const mealName = card.querySelector('.meal-name').textContent;
            const meal = meals.find(m => m.name === mealName);
            if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
                meal.ingredients.forEach(ingredient => {
                    if (ingredient.trim()) {
                        ingredientSet.add(ingredient.trim());
                    }
                });
            }
        });

        // Generate HTML for ingredients with checkboxes
        if (ingredientSet.size === 0) {
            shoppingListItems.innerHTML = '<p class="muted">No ingredients in current meal suggestions</p>';
        } else {
            const ingredientsList = Array.from(ingredientSet).sort();
            shoppingListItems.innerHTML = ingredientsList.map((ingredient, index) => `
                <label class="shopping-list-item">
                    <input type="checkbox" class="ingredient-checkbox" data-ingredient="${ingredient}">
                    <span>${ingredient}</span>
                </label>
            `).join('');
        }

        shoppingListModal.classList.remove('hidden');
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
                    meals = importedMeals.map((meal, index) => ({ id: `m${index}`, ...meal }));
                    updateAllTags();
                    updateDBTitle();
                    renderDB();
                    renderSuggestions(document.querySelector('input[name="days"]:checked').value);
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

});