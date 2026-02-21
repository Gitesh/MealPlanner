
// Functions from app.js to be tested

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

function toStrikethrough(text) {
    return text.split('').map(char => char + '\u0336').join('');
}


// Tests

console.log('Running tests...');

// toTitleCase tests
console.assert(toTitleCase('a tale of two cities') === 'A Tale of Two Cities', 'toTitleCase test 1 failed');
console.assert(toTitleCase('the lord of the rings') === 'The Lord of the Rings', 'toTitleCase test 2 failed');
console.assert(toTitleCase('HELLO WORLD') === 'Hello World', 'toTitleCase test 3 failed');

// toSentenceCase tests
console.assert(toSentenceCase('hello world') === 'Hello world', 'toSentenceCase test 1 failed');
console.assert(toSentenceCase('HELLO WORLD') === 'Hello world', 'toSentenceCase test 2 failed');
console.assert(toSentenceCase('') === '', 'toSentenceCase test 3 failed');

// formatTag tests
console.assert(formatTag('italian') === 'Italian', 'formatTag test 1 failed');
console.assert(formatTag('  JAPAN  ') === 'Japan', 'formatTag test 2 failed');
console.assert(formatTag('random') === 'random', 'formatTag test 3 failed');

// sortTags tests
console.assert(JSON.stringify(sortTags(['c', 'a', 'b'])) === JSON.stringify(['a', 'b', 'c']), 'sortTags test 1 failed');
console.assert(JSON.stringify(sortTags(['z', 'x', 'y'])) === JSON.stringify(['x', 'y', 'z']), 'sortTags test 2 failed');

// normalizeMeal tests
const meal1 = { name: 'test meal', tags: ['italian', 'dinner'], ingredients: ['pasta', 'sauce'] };
const normalizedMeal1 = normalizeMeal(meal1);
console.assert(normalizedMeal1.name === 'Test Meal', 'normalizeMeal test 1 failed (name)');
console.assert(JSON.stringify(normalizedMeal1.tags) === JSON.stringify(['dinner', 'Italian']), 'normalizeMeal test 1 failed (tags)');
console.assert(JSON.stringify(normalizedMeal1.ingredients) === JSON.stringify(['Pasta', 'Sauce']), 'normalizeMeal test 1 failed (ingredients)');

// weightedRandomSelect tests
const mealList = [
    { name: 'meal1', popularity: 1 },
    { name: 'meal2', popularity: 99 }
];
// Run it a few times to see if it's biased towards meal2
let meal2Count = 0;
for (let i = 0; i < 100; i++) {
    const selected = weightedRandomSelect(mealList);
    if (selected.name === 'meal2') {
        meal2Count++;
    }
}
console.assert(meal2Count > 80, 'weightedRandomSelect test 1 failed');


// parseCSV tests
const csvText = `"name","tags","popularity","ingredients","url"\n"Pasta","Italian;Dinner","1","Pasta;Sauce","http://example.com"`;
const parsedCsv = parseCSV(csvText);
console.assert(parsedCsv.length === 1, 'parseCSV test 1 failed (length)');
console.assert(parsedCsv[0].name === 'Pasta', 'parseCSV test 1 failed (name)');
console.assert(JSON.stringify(parsedCsv[0].tags) === JSON.stringify(['Italian', 'Dinner']), 'parseCSV test 1 failed (tags)');

// getTimestampFilename tests
const filename = getTimestampFilename('json');
console.assert(filename.endsWith('_meals.json'), 'getTimestampFilename test 1 failed');
console.assert(filename.length > 20, 'getTimestampFilename test 2 failed');

// toStrikethrough tests
console.assert(toStrikethrough('hello') === 'h\u0336e\u0336l\u0336l\u0336o\u0336', 'toStrikethrough test 1 failed');


console.log('All tests passed!');
