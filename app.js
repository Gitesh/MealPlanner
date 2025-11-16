document.addEventListener('DOMContentLoaded', () => {
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsTitle = document.getElementById('suggestions-title');
    const randomiseBtn = document.getElementById('randomise-btn');
    const dbList = document.getElementById('db-list');
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
    const exportJsonBtn = document.getElementById('export-json');
    const importFile = document.getElementById('import-file');
    const toast = document.getElementById('toast');
    const showDatesToggle = document.getElementById('show-dates-toggle');


    let meals = [];
    let allTags = new Set();
    let editingMealId = null;

    // Load initial data
    fetch('meals_db.json')
        .then(response => response.json())
        .then(data => {
            meals = data.map((meal, index) => ({ id: `m${index}`, ...meal }));
            updateAllTags();
            renderDB();
            renderSuggestions(document.querySelector('input[name="days"]:checked').value);
        });

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

        suggestions.forEach(meal => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion';
            suggestionEl.dataset.mealId = meal.id;
            suggestionEl.innerHTML = `
                <div class="suggestion-date">
                  <div class="day">${date.getDate()}</div>
                  <div class="month-day">${date.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <span class="meal-name">${meal.name}</span>
                <a href="#" class="btn highlight-yellow">Add to Calendar</a>
            `;
            suggestionsList.appendChild(suggestionEl);
            date.setDate(date.getDate() + 1);
        });
        updateDateVisibility();
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
            mealNameInput.value = meal.name;
            mealTagsInput.value = meal.tags.join(', ');
            mealPopInput.value = meal.popularity;
            popValue.textContent = meal.popularity;
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
        const name = mealNameInput.value.trim();
        if (!name) return;
        const tags = mealTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        const popularity = parseFloat(mealPopInput.value);

        if (editingMealId) {
            // Update existing meal
            const meal = meals.find(m => m.id === editingMealId);
            meal.name = name;
            meal.tags = tags;
            meal.popularity = popularity;
        } else {
            // Add new meal
            const newMeal = {
                id: `m${Date.now()}`,
                name,
                tags,
                popularity
            };
            meals.push(newMeal);
        }
        updateAllTags();
        renderDB(searchInput.value, tagFilter.value);
        modal.classList.add('hidden');
        showToast(editingMealId ? 'Meal updated!' : 'Meal added!');
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
            target.querySelector('.meal-name').textContent = meal.name;
            target.dataset.mealId = meal.id;
            showToast('Meal updated in suggestions!');
        }
    });

    // Import / Export
    exportJsonBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meals, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "meals.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('Exported to meals.json');
    });

    importFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedMeals = JSON.parse(event.target.result);
                if (Array.isArray(importedMeals)) {
                    meals = importedMeals.map((meal, index) => ({ id: `m${index}`, ...meal }));
                    updateAllTags();
                    renderDB();
                    renderSuggestions(document.querySelector('input[name="days"]:checked').value);
                    showToast(`Imported ${importedMeals.length} meals`);
                } else {
                    showToast('Invalid JSON format');
                }
            } catch (error) {
                showToast('Error parsing JSON file');
            }
        };
        reader.readAsText(file);
        importFile.value = ''; // Reset for same-file import
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