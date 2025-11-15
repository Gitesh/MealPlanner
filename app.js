/* Meal Planner App (static) */
/* - Loads /meals_db.json with fallback sample data
   - Handles weighted selection, drag&drop, import/export, edit/add
*/

const DEFAULT_DAYS = 5;
let meals = []; // array of {name, tags:[], popularity:0-1}
let suggestions = []; // current suggestions (length days)
let daysCount = DEFAULT_DAYS;

/* ---------- Sample fallback data ---------- */
const SAMPLE_MEALS = [
  {name:"Tuna Pasta Bake", tags:["Italian","Quick"], popularity:0.7},
  {name:"Salmon with Roasted Veg", tags:["Fish","Healthy"], popularity:0.85},
  {name:"Lentil Shepherd's Pie", tags:["Vegetarian"], popularity:0.6},
  {name:"Satay Chicken Skewers", tags:["Asian","Chicken"], popularity:0.9},
  {name:"Butternut Squash Risotto", tags:["Vegetarian","Italian"], popularity:0.7},
  {name:"Chicken Fajitas", tags:["Mexican","Quick"], popularity:0.85},
  {name:"Chicken Shakshuka", tags:["Indian","Chicken"], popularity:0.2}
];

/* ---------- Utilities ---------- */

function showToast(msg, ms=2200){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), ms);
}

function safeParseJSON(text){
  try { return JSON.parse(text); } catch(e){ return null; }
}

function uniqueTagsList(){
  const s = new Set();
  meals.forEach(m => m.tags.forEach(t => s.add(t)));
  return Array.from(s).sort();
}

function downloadBlob(filename, content, type='application/json'){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Loading initial DB (fetch meals_db.json) ---------- */
async function loadInitialMeals(){
  try {
    const resp = await fetch('meals_db.json');
    if (!resp.ok) throw new Error('no file');
    const text = await resp.text();
    const data = safeParseJSON(text);
    if (!Array.isArray(data)) throw new Error('invalid');
    meals = data.map(normaliseMeal);
    showToast('Loaded meals_db.json');
  } catch(e){
    console.warn('Using fallback sample meals', e);
    meals = SAMPLE_MEALS.map(normaliseMeal);
    showToast('Using sample meal data (no meals_db.json)');
  }
}

/* ---------- Normalisation ---------- */
function normaliseMeal(m){
  return {
    name: String(m.name).trim(),
    tags: Array.isArray(m.tags) ? m.tags.map(String) : (String(m.tags||'').split(',').map(s=>s.trim()).filter(Boolean)),
    popularity: Math.max(0, Math.min(1, Number(m.popularity) || 0.5))
  };
}

/* ---------- Weighted random selection ---------- */
function pickWeightedOne(){
  // if all popularity zero, pick uniformly
  const total = meals.reduce((s,m)=>s+m.popularity,0);
  if (meals.length === 0) return null;
  if (total === 0) {
    return meals[Math.floor(Math.random()*meals.length)];
  }
  const r = Math.random() * total;
  let acc = 0;
  for (const m of meals){
    acc += m.popularity;
    if (r <= acc) return m;
  }
  return meals[meals.length-1];
}

function generateSuggestions(count){
  const chosen = [];
  // allow duplicates but better to try to avoid immediate duplicates
  for (let i=0;i<count;i++){
    const attemptLimit = 10;
    let candidate = null;
    for (let a=0;a<attemptLimit;a++){
      candidate = pickWeightedOne();
      if (!candidate) break;
      // avoid immediate duplicate with previous day when possible
      if (i>0 && candidate.name === chosen[i-1].name) continue;
      break;
    }
    chosen.push(candidate ? {...candidate} : {name:'(no meal)', tags:[], popularity:0});
  }
  return chosen;
}

/* ---------- Calendar link builder ---------- */
function nextMonday(date = new Date()){
  // compute next Monday (if today is Monday, next Monday = in 7 days)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun ... 1 Mon
  const daysUntil = ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + daysUntil);
  return d;
}

// Google Calendar event date format: YYYYMMDDTHHMMSS (we'll use local times without trailing Z)
function formatDateForCal(dt){
  const pad = n => String(n).padStart(2,'0');
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function calendarLinkForMeal(mealName, dayIndex){
  const baseMonday = nextMonday();
  const eventDate = new Date(baseMonday);
  eventDate.setDate(baseMonday.getDate() + dayIndex);
  eventDate.setHours(18,0,0,0); // 6 PM
  const start = formatDateForCal(eventDate);
  const end = formatDateForCal(new Date(eventDate.getTime() + 60*60*1000)); // 1-hour
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: mealName,
    dates: `${start}/${end}`,
    details: `Meal planned: ${mealName}`,
    sf: 'true',
    output: 'xml'
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/* ---------- DOM rendering ---------- */

function renderSuggestions(){
  const list = document.getElementById('suggestions-list');
  list.innerHTML = '';
  suggestions.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'suggestion';
    li.dataset.index = i;
    li.draggable = true;

    // Drag and drop event listeners
    li.addEventListener('dragover', e => e.preventDefault());
    li.addEventListener('dragenter', () => li.classList.add('drag-over'));
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      li.classList.remove('drag-over');
      handleDropOnSuggestion(e, i);
    });

    const mealName = document.createElement('div');
    mealName.className = 'meal-name';
    mealName.textContent = s?.name || '(no meal)';

    const calBtn = document.createElement('a');
    calBtn.className = 'btn highlight-yellow';
    calBtn.href = calendarLinkForMeal(s?.name || 'Meal', i);
    calBtn.target = '_blank';
    calBtn.rel = 'noopener';
    calBtn.innerHTML = '<i data-lucide="calendar"></i> Add to Calendar';

    li.appendChild(mealName);
    li.appendChild(calBtn);

    list.appendChild(li);
  });

  // refresh icons
  if (window.lucide) lucide.createIcons();
}

function renderDB() {
  const db = document.getElementById('db-list');
  const searchInput = document.getElementById('search-input');
  const tagSelect = document.getElementById('tag-filter');

  const search = searchInput.value.trim().toLowerCase();
  const tagChoice = tagSelect.value;

  // Update tag filter options first, preserving the selected value
  const tags = uniqueTagsList();
  const currentOptions = Array.from(tagSelect.options).map(o => o.value).sort().join(',');
  const newOptions = ['all', ...tags].sort().join(',');

  if (currentOptions !== newOptions) {
    tagSelect.innerHTML = '<option value="all">all</option>';
    tags.forEach(t => {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      tagSelect.appendChild(o);
    });
    // Restore selection
    tagSelect.value = tagChoice;
  }

  db.innerHTML = '';
  const filtered = meals.filter(m => {
    const tagMatch = (tagChoice === 'all' || m.tags.includes(tagChoice));
    if (!tagMatch) return false;

    const searchMatch = (
      !search ||
      m.name.toLowerCase().includes(search) ||
      m.tags.join(' ').toLowerCase().includes(search)
    );
    return searchMatch;
  });

  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.draggable = true;
    card.dataset.mealName = m.name;

    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', m.name);
      e.dataTransfer.setData('application/json', JSON.stringify(m));
    });

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    const h = document.createElement('div');
    h.style.fontWeight = 700;
    h.textContent = m.name;
    const meta = document.createElement('div');
    meta.className = 'meal-meta';
    meta.textContent = `Popularity: ${Number(m.popularity).toFixed(2)}`;
    left.appendChild(h);
    left.appendChild(meta);

    const right = document.createElement('div');
    right.className = 'right';
    const tagWrap = document.createElement('div');
    m.tags.forEach(t => {
      const sp = document.createElement('span');
      sp.className = 'tag';
      sp.textContent = t;
      sp.addEventListener('click', () => {
        tagSelect.value = t;
        searchInput.value = ''; // Also clear search
        renderDB();
      });
      tagWrap.appendChild(sp);
    });
    const editBtn = document.createElement('button');
    editBtn.className = 'link-btn edit-btn';
    editBtn.innerHTML = '<i data-lucide="edit-2"></i>';
    editBtn.title = 'Edit meal';
    editBtn.addEventListener('click', () => openEditModalForMealName(m.name));

    right.appendChild(tagWrap);
    right.appendChild(editBtn);

    card.appendChild(left);
    card.appendChild(right);
    db.appendChild(card);
  });

  // refresh icons
  if (window.lucide) lucide.createIcons();
}


/* ---------- Drag & Drop ---------- */
function handleDropOnSuggestion(e, targetIndex){
  e.preventDefault();
  const json = e.dataTransfer.getData('application/json');
  let meal = null;
  if (json) meal = safeParseJSON(json);
  if (!meal){
    const name = e.dataTransfer.getData('text/plain');
    meal = meals.find(m=>m.name === name) || null;
  }
  if (!meal) return;
  // replace
  suggestions[targetIndex] = normaliseMeal(meal);
  renderSuggestions();
  showToast(`Replaced day ${targetIndex+1} with "${meal.name}"`);
}

/* ---------- Editing & Adding ---------- */
let editingIndex = null; // if editing suggestion index; used for editing suggestion's meal in place
let editingMealName = null; // if editing meal from DB

function openEditModal(indexOrName){
  // If index: editing a suggestion meal
  editingIndex = (typeof indexOrName === 'number') ? indexOrName : null;
  editingMealName = (typeof indexOrName === 'string') ? indexOrName : null;
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('meal-name');
  const tagsInput = document.getElementById('meal-tags');
  const popInput = document.getElementById('meal-pop');

  if (editingIndex !== null){
    // edit suggestion meal (that might be from DB — find DB meal by name)
    const cur = suggestions[editingIndex];
    title.textContent = `Edit suggestion for day ${editingIndex+1}`;
    nameInput.value = cur.name || '';
    tagsInput.value = (cur.tags || []).join(', ');
    popInput.value = cur.popularity || 0.5;
  } else if (editingMealName !== null){
    const meal = meals.find(m=>m.name===editingMealName);
    if (!meal) return;
    title.textContent = `Edit meal: ${meal.name}`;
    nameInput.value = meal.name;
    tagsInput.value = meal.tags.join(', ');
    popInput.value = meal.popularity;
  } else {
    // open blank for new meal
    title.textContent = 'Add new meal';
    nameInput.value = '';
    tagsInput.value = '';
    popInput.value = 0.5;
  }

  modal.classList.remove('hidden');
}

function openEditModalForMealName(name){
  openEditModal(name);
}

function closeModal(){
  document.getElementById('modal').classList.add('hidden');
  editingIndex = null;
  editingMealName = null;
}

function saveFromModal(e){
  e.preventDefault();
  const name = document.getElementById('meal-name').value.trim();
  const tags = document.getElementById('meal-tags').value.split(',').map(s=>s.trim()).filter(Boolean);
  const pop = Math.max(0, Math.min(1, Number(document.getElementById('meal-pop').value || 0.5)));

  if (!name){
    alert('Name is required');
    return;
  }

  const normalised = normaliseMeal({name, tags, popularity: pop});

  if (editingIndex !== null){
    // Update suggestion item; also if meal exists in DB, update that too
    suggestions[editingIndex] = normalised;
    // If DB contains the same name, update popularity/tags there as well
    const dbIdx = meals.findIndex(m=>m.name===normalised.name);
    if (dbIdx >= 0) meals[dbIdx] = normalised;
    showToast('Updated suggestion');
  } else if (editingMealName !== null){
    // editing DB meal
    const idx = meals.findIndex(m=>m.name===editingMealName);
    if (idx >= 0){
      meals[idx] = normalised;
      showToast('Meal updated');
    } else {
      // fallback add
      meals.push(normalised);
      showToast('Meal added');
    }
  } else {
    // adding new meal: if name exists overwrite
    const idx = meals.findIndex(m=>m.name===normalised.name);
    if (idx >= 0){
      meals[idx] = normalised;
      showToast('Meal overwritten');
    } else {
      meals.push(normalised);
      showToast('Meal added');
    }
  }

  closeModal();
  renderDB();
  renderSuggestions();
}

/* ---------- Import / Export ---------- */

function importFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    if (file.name.toLowerCase().endsWith('.json')){
      const parsed = safeParseJSON(text);
      if (!Array.isArray(parsed)){
        alert('Invalid JSON format: expected an array of meals');
        return;
      }
      mergeImportedMeals(parsed);
    } else if (file.name.toLowerCase().endsWith('.csv')){
      const parsed = parseCSVMeals(text);
      mergeImportedMeals(parsed);
    } else {
      alert('Unsupported format. Use .json or .csv');
    }
  };
  reader.readAsText(file);
}

function parseCSVMeals(text){
  // Very simple CSV: expect header line with name,tags,popularity
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(s=>s.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const tagsIdx = header.indexOf('tags');
  const popIdx = header.indexOf('popularity');
  const out = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',').map(s=>s.trim());
    const obj = {
      name: cols[nameIdx] || cols[0] || `Row ${i}`,
      tags: (cols[tagsIdx] || '').split(';').join(',').split(',').map(s=>s.trim()).filter(Boolean),
      popularity: Number(cols[popIdx] || 0.5)
    };
    out.push(obj);
  }
  return out;
}

function mergeImportedMeals(list){
  // map by lower-case name to overwrite duplicates
  const map = new Map(meals.map(m=>[m.name.toLowerCase(), m]));
  list.forEach(raw => {
    const normalised = normaliseMeal(raw);
    map.set(normalised.name.toLowerCase(), normalised);
  });
  meals = Array.from(map.values());
  renderDB();
  renderSuggestions();
  showToast('Imported meals and merged into database');
}

function exportJSON(){
  downloadBlob('meals_db_export.json', JSON.stringify(meals, null, 2));
}

function exportCSV(){
  const header = 'name,tags,popularity\n';
  const rows = meals.map(m => {
    const tags = (m.tags||[]).join(';');
    return `${csvEscape(m.name)},${csvEscape(tags)},${m.popularity}`;
  }).join('\n');
  downloadBlob('meals_db_export.csv', header + rows, 'text/csv');
}

function csvEscape(s){
  if (typeof s !== 'string') s = String(s);
  if (s.includes(',') || s.includes('"')) {
    return `"${s.replace(/"/g,'""')}"`;
  }
  return s;
}

/* ---------- UI wiring ---------- */

async function init(){
  // DOM elements
  await loadInitialMeals();

  const checkedBox = document.querySelector('input[name="days"]:checked');
  daysCount = checkedBox ? Number(checkedBox.value) : DEFAULT_DAYS;

  suggestions = generateSuggestions(daysCount);
  renderSuggestions();
  renderDB();

  // set up handlers
  const daysRadios = document.querySelectorAll('input[name="days"]');
  daysRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      daysCount = Number(e.target.value);
      suggestions = generateSuggestions(daysCount);
      renderSuggestions();
      document.getElementById('suggestions-title').textContent = `${daysCount}-Day Meal Suggestions`;
    });
  });

  document.getElementById('randomise-btn').addEventListener('click', ()=>{
    suggestions = generateSuggestions(daysCount);
    renderSuggestions();
    showToast('Week randomised');
  });

  document.getElementById('search-input').addEventListener('input', renderDB);
  document.getElementById('tag-filter').addEventListener('change', (e) => {
    if (e.target.value === 'all') {
      document.getElementById('search-input').value = '';
    }
    renderDB();
  });

  document.getElementById('add-meal-open').addEventListener('click', ()=>openEditModal());

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('meal-form').addEventListener('submit', saveFromModal);

  document.getElementById('import-file').addEventListener('change', (ev)=>{
    const f = ev.target.files[0];
    if (!f) return;
    importFile(f);
    ev.target.value = '';
  });

  document.getElementById('export-json').addEventListener('click', exportJSON);

  // wire the visible upload label to the existing hidden input (if present)
  const importLabel = document.querySelector('label.link-btn[title="Upload meals"]');
  if (importLabel && document.getElementById('import-file')){
    importLabel.addEventListener('click', ()=>document.getElementById('import-file').click());
  }
}

/* ---------- Kick off ---------- */
document.addEventListener('DOMContentLoaded', init);
