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
    let selectedTags = new Set();
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

        // Sort and repopulate tag filter buttons
        const sortedTags = [...allTags].sort();
        tagFilter.innerHTML = '<option value="all">all tags</option>';

        sortedTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            const isSelected = selectedTags.has(tag);
            option.textContent = (isSelected ? '✔ ' : '') + tag;
            if (isSelected) {
                option.style.fontWeight = 'bold';
                option.style.backgroundColor = '#ffeaa7';
            }
            tagFilter.appendChild(option);
        });

        if (selectedTags.size === 1) {
            tagFilter.value = [...selectedTags][0];
        } else if (selectedTags.size === 0) {
            tagFilter.value = 'all';
        } else {
            const first = [...selectedTags][0];
            tagFilter.value = first;
        }
    }

    function renderDB(filter = '') {
        dbList.innerHTML = '';
        const filteredMeals = meals.filter(meal => {
            const matchesFilter = meal.name.toLowerCase().includes(filter.toLowerCase()) ||
                meal.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));

            // Check if meal has ALL selected tags
            const matchesTags = selectedTags.size === 0 ||
                [...selectedTags].every(tag => meal.tags.includes(tag));

            return matchesFilter && matchesTags;
        });

        dbTitle.textContent = `Choose from ${filteredMeals.length} meal${filteredMeals.length !== 1 ? 's' : ''}`;

        filteredMeals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.draggable = true;
            mealCard.dataset.mealId = meal.id;

            // Highlight active selected tags
            const tagsHtml = meal.tags.map(t => {
                const isActive = selectedTags.has(t) ? 'active' : '';
                return `<span class="tag ${isActive}" data-tag="${t}">${t}</span>`;
            }).join(' ');

            mealCard.innerHTML = `
                <div>
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-meta">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="right" style="flex-direction: row; align-items: center;">
                    <button class="btn link-btn-icon edit-btn" data-id="${meal.id}" title="Edit Meal"><span class="material-symbols-outlined">edit</span></button>
                    ${meal.url
                    ? `<button class="btn link-btn-icon" onclick="window.open('${meal.url}', '_blank')" title="View Recipe"><span class="material-symbols-outlined">open_in_new</span></button>`
                    : `<button class="btn link-btn-icon" style="visibility: hidden; pointer-events: none;" aria-hidden="true"><span class="material-symbols-outlined">open_in_new</span></button>`
                }
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
                    ${meal.url ? `<button class="btn link-btn-icon" onclick="window.open('${meal.url}', '_blank')" title="View Recipe"><span class="material-symbols-outlined">open_in_new</span></button>` : ''}
                    <button class="btn highlight-yellow calendar-btn" data-meal-name="${meal.name}" data-date="${buttonDate.toISOString()}" title="Add to Calendar">
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

        if (meal) {
            if (meal.url) {
                details += `\n\nRecipe: <a href="${meal.url}">${meal.url}</a>`;
            }
            if (meal.ingredients && meal.ingredients.length > 0) {
                const ingredientsList = meal.ingredients.map(ing => `• ${ing}`).join('\n');
                details += `\n\nIngredients:\n${ingredientsList}`;
            }
        }

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: mealName,
            dates: `${start}/${end}`,
            details: details,
            location: meal.url || '',
            sf: 'true',
            output: 'xml'
        });

        if (meal && meal.url) {
            params.append('sprop', `website:${meal.url}`);
            params.append('sprop', 'name:Recipe');
        }

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
        document.getElementById('meal-url').value = meal.url || '';
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
        const url = document.getElementById('meal-url').value.trim();

        if (editingMealId) {
            // Update existing meal
            const meal = meals.find(m => m.id === editingMealId);
            meal.name = name;
            meal.tags = tags;
            meal.popularity = popularity;
            meal.ingredients = ingredients;
            meal.url = url;
        } else {
            // Add new meal
            const newMeal = {
                id: `m${Date.now()}`,
                name,
                tags,
                popularity,
                ingredients,
                url
            };
            meals.push(newMeal);
        }
        updateAllTags();
        renderDB(searchInput.value);
        modal.classList.add('hidden');
        mealsEdited = true;
        showToast(editingMealId ? 'Meal updated!' : 'Meal added!');
    }

    // Audio Context for sound effects
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(freq, type, duration) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playSlotMachineEffect(selectedDays) {
        let count = 0;
        const maxCount = 20; // How many shuffles
        let speed = 50; // Start speed (ms)
        const endSpeed = 300; // End speed (ms)

        const shuffle = () => {
            renderSuggestions(selectedDays);

            // Sound effect: Pitch goes up as it slows down (or stays constant, let's do a 'tick')
            // Using a high 'tick' sound
            playTone(800 + (count * 20), 'square', 0.05);

            count++;
            if (count < maxCount) {
                // Ease out: slow down
                const progress = count / maxCount;
                speed = 50 + (endSpeed - 50) * (progress * progress); // Quadratic ease-out
                setTimeout(shuffle, speed);
            } else {
                // Final success sound and toast
                setTimeout(() => {
                    // Start 'Ding' sound moved to showToast()
                    showToast('Random meals selected!');
                }, 100);
            }
        };

        shuffle();
    }

    // Event listeners
    randomiseBtn.addEventListener('click', () => {
        const selectedDays = document.querySelector('input[name="days"]:checked').value;
        playSlotMachineEffect(selectedDays);
    });

    // Track Ctrl key explicitly on change due to some browser inconsistencies
    // But usually standard click adds modifier. 
    // For Select element, 'change' event might not expose full MouseEvent if triggered via keyboard.
    // We'll rely on a global tracker or assume MouseEvent if user clicks.

    // Better: Allow standard change behavior.
    // Search input listener (Restored)
    searchInput.addEventListener('input', () => {
        renderDB(searchInput.value);
    });

    tagFilter.addEventListener('click', (e) => {
        // We capture click to know if Ctrl was held, but 'change' fires after closes.
        // Actually, logic:
        // If user Ctrl-Clicks an option in an expanded dropdown?
        // Standard dropdown closes on click. 'change' fires.
        // We can check the event passed to 'change' IF it was triggered by mouse?
        // Or we use a global variable 'isCtrlPressed'.
    });

    let isCtrlPressed = false;
    document.addEventListener('keydown', e => { if (e.key === 'Control') isCtrlPressed = true; });
    document.addEventListener('keyup', e => { if (e.key === 'Control') isCtrlPressed = false; });

    tagFilter.addEventListener('change', (e) => {
        const val = tagFilter.value;
        if (val === 'all') {
            selectedTags.clear();
        } else {
            if (isCtrlPressed) {
                // Add to selection
                selectedTags.add(val);
            } else {
                // Replace selection
                selectedTags.clear();
                selectedTags.add(val);
            }
        }
        renderDB(searchInput.value);
        updateAllTags(); // Update visual checkmarks
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
            // Add to selected tags if not present, clears others? Or just toggles?
            // UX decision: Clicking a tag on a card usually means "filter by this tag"
            // Let's make it add to current filter for consistency with drilling down, or replace?
            // "Filter by clicking on multiple tags" -> let's assume adding it is useful.
            // But if I want to just see "Dinner", I might want to clear others.
            // Let's stick to "Add to filter" logic for now, or just toggle it in the set.

            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
            } else {
                selectedTags.add(tag);
            }

            // Sync dropdown with selection
            if (selectedTags.size === 0) {
                tagFilter.value = 'all';
            } else if (selectedTags.size === 1) {
                tagFilter.value = [...selectedTags][0];
            }
            // If multiple, we leave it as is (likely showing the last selected or primary) 
            // or we could force it to something, but 'all' is wrong and standard select can't show multiple.

            renderDB(searchInput.value);
            updateAllTags(); // Update visual checkmarks
        }
    });

    dbList.addEventListener('dblclick', (e) => {
        const card = e.target.closest('.meal-card');
        if (card) {
            editingMealId = card.dataset.mealId;
            const meal = meals.find(m => m.id === editingMealId);
            if (meal) {
                modalTitle.textContent = 'Edit Meal';
                populateModal(meal);
                modal.classList.remove('hidden');
            }
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

            showToast('Meal plan updated!');
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
        const headers = ['name', 'tags', 'popularity', 'ingredients', 'url'];
        const rows = meals.map(m => [
            `"${m.name.replace(/"/g, '""')}"`,
            `"${(m.tags || []).join(';').replace(/"/g, '""')}"`,
            m.popularity,
            `"${(m.ingredients || []).join(';').replace(/"/g, '""')}"`,
            `"${(m.url || '').replace(/"/g, '""')}"`
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
                const displayText = count > 1 ? `${ingredient} [${count}]` : ingredient;
                return `
                <label class="shopping-list-item">
                    <input type="checkbox" class="ingredient-checkbox">
                    <div class="item-content" data-current="${count}" data-original="${count}" data-ingredient="${ingredient}">
                        <span class="view-mode">${displayText}</span>
                        <div class="edit-mode quantity-controls">
                            <button class="qty-btn minus" type="button" aria-label="Decrease quantity">-</button>
                            <span class="qty-val">${count}</span>
                            <button class="qty-btn plus" type="button" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                </label>
            `}).join('');

            // Helper to update UI state
            const updateItemState = (row, newCount) => {
                const checkbox = row.closest('.shopping-list-item').querySelector('input');
                const contentDiv = row; // .item-content
                const name = contentDiv.dataset.ingredient;
                const valSpan = contentDiv.querySelector('.qty-val');
                const viewSpan = contentDiv.querySelector('.view-mode');

                contentDiv.dataset.current = newCount;
                valSpan.textContent = newCount;

                // Checkbox logic: 0 = Checked, >0 = Unchecked
                if (newCount === 0) {
                    checkbox.checked = true;
                    viewSpan.textContent = name; // Count 0 -> Show just name (crossed out)
                } else {
                    checkbox.checked = false;
                    viewSpan.textContent = newCount > 1 ? `${name} [${newCount}]` : name;
                }
            };

            // Event Listeners
            shoppingListItems.querySelectorAll('.shopping-list-item').forEach(item => {
                const checkbox = item.querySelector('input');
                const contentDiv = item.querySelector('.item-content');

                // Checkbox Change
                checkbox.addEventListener('change', (e) => {
                    if (checkbox.checked) {
                        // Checked -> Count 0
                        // Store current value as original if it wasn't 0 (to restore later)
                        let current = parseInt(contentDiv.dataset.current);
                        if (current > 0) contentDiv.dataset.original = current;
                        updateItemState(contentDiv, 0);
                    } else {
                        // Unchecked -> Restore original or default to 1
                        let restore = parseInt(contentDiv.dataset.original);
                        if (restore === 0) restore = 1; // Fallback
                        updateItemState(contentDiv, restore);
                    }
                });

                // Quantity Buttons
                item.querySelectorAll('.qty-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        let currentVal = parseInt(contentDiv.dataset.current);

                        if (btn.classList.contains('plus')) {
                            // Increment: If was 0, restores unchecked state
                            if (currentVal === 0) {
                                // Restore logic handled by updateItemState logic
                            }
                            currentVal++;
                        } else {
                            currentVal = Math.max(0, currentVal - 1);
                        }

                        // Update original if > 0 so that checking/unchecking remembers this new value
                        if (currentVal > 0) contentDiv.dataset.original = currentVal;

                        updateItemState(contentDiv, currentVal);
                    });
                });
            });
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
            const contentDiv = label.querySelector('.item-content');

            const name = contentDiv.dataset.ingredient || '';
            const qty = parseInt(contentDiv.dataset.current) || 0;

            // Format text with quantity if > 1
            const text = qty > 1 ? `${name} [${qty}]` : name;

            items.push({
                text: text,
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
        const urlIdx = headers.indexOf('url');

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].match(/(?:"[^"]*"|[^,])+/g) || [];
            const row = values.map(v => v.replace(/^"|"$/g, '').trim());

            result.push({
                name: row[nameIdx] || row[0] || `Row ${i}`,
                tags: (row[tagsIdx] || '').split(';').map(t => t.trim()).filter(Boolean),
                popularity: parseFloat(row[popIdx]) || 0.5,
                ingredients: (row[ingredientsIdx] || '').split(';').map(ing => ing.trim()).filter(Boolean),
                url: urlIdx !== -1 ? (row[urlIdx] || '') : ''
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
        // Play 'Ding' sound
        playTone(600, 'sine', 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2), 100);

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
        try {
            if (typeof startDateInput.showPicker === 'function') {
                startDateInput.showPicker();
            } else {
                startDateInput.click(); // Fallback for older browsers
                startDateInput.focus();
            }
        } catch (error) {
            console.log('Date picker not supported programmatically');
            startDateInput.click();
        }
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

    // User Guide Logic
    const guideModal = document.getElementById('guide-modal');
    const guideClose = document.getElementById('guide-close');

    document.addEventListener('keydown', (e) => {
        // Toggle Guide Modal on '?' (Shift + /) or Ctrl + /
        if ((e.key === '?' && !e.ctrlKey) || (e.key === '/' && e.ctrlKey)) {
            // Prevent if user is typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            e.preventDefault();
            guideModal.classList.toggle('hidden');
        }
    });

    guideClose.addEventListener('click', () => {
        guideModal.classList.add('hidden');
    });

});
