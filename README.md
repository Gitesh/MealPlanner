# Simple Meal Planner

**Plan your week, one delicious meal at a time.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://gitesh.github.io/MealPlanner/)


Say goodbye to the dreaded "What's for dinner?" question! **Simple Meal Planner** is your personal meal planning companion that makes weekly meal organisation effortless, fun, and flexible. Whether you're planning for 3 days or a whole week, we've got you covered! 

Pick dishes from your personal collection, generate shopping lists, and keep everything neatly in one place. No account required. No servers. Just you and good food.

![Main Interface](./screenshots/main_interface.png)

---

## Why You'll Love It

- **Smart Randomisation**: Tired of eating the same things? Let our intelligent algorithm surprise you with meal suggestions based on popularity scores.
- **Drag & Drop Magic**: Don't like a suggestion? Simply drag and drop any meal from your database to replace it instantly.
- **Instant Shopping Lists**: Generate comprehensive shopping lists with one click - complete with calendar integration!
- **Powerful Search**: Find meals by name or tags in seconds
- **Your Data, Your Way**: Import and export your meal database in JSON or CSV format, and save it back the same way.
- **Beautiful & Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Lightning Fast**: No sign-ups, no servers, runs entirely in your browser!
- **Calendar integration** — push individual meals or your full shopping list to Google Calendar with ingredients included.

---

##  Getting Started

It's incredibly simple:

1. **Visit**: [https://gitesh.github.io/MealPlanner/](https://gitesh.github.io/MealPlanner/)
2. **Explore**: The app comes pre-loaded with example meals spanning Italian, Indian, Japanese, Mexican and more.
3. **Customise**: Add your own favourite meals to the database
4. **Plan**: Generate a meal plan for 3, 5, or 7 days. Search / filter meals by tag, then drag from the list on the right to replace a meal
5. **Organise**: Click the calendar icon to add the meal to your calendar
6. **Shopping List**: Tick off what you already have, adjust quantities, then copy or push to your calendar.

---
--

## Features in Detail

### Your Weekly Meal Plan

The left panel displays your current plan with dates, meal names, recipe links (where available), and calendar buttons. Choose between 3, 5, or 7-day plans. Toggle date visibility on or off. Hit randomise as many times as you like — a slot-machine-style spin effect makes the process surprisingly satisfying.

![Main Interface](./screenshots/main_interface.png)




##  See It In Action

###  Main Interface - Your Weekly Meal Hub
The clean, intuitive interface shows your weekly meal plan on the left and your entire meal database on the right. Choose between 3, 5, or 7-day plans and customise them to your heart's content! Watch as dates instantly appear when you toggle the "Show dates" option!
![Main Interface](./screenshots/main_interface.webp)

---

### Search and Filter

Type into the search bar to filter by meal name or tag in real time. Use the tag dropdown (with Ctrl-click for multi-select) to drill down further. Click any tag on a meal card to instantly filter by that tag.

![Search and Filter](./screenshots/search_filter.png)

---

### Shopping List

Generate a complete, alphabetised shopping list from your current meal plan. Quantities are automatically aggregated when the same ingredient appears in multiple meals. Tick items off, adjust amounts with the +/- controls, then copy to clipboard or add the whole list to Google Calendar.

![Shopping List](./screenshots/shopping_list_modal.png)



1. **Rate your favourites** — set popularity above 0.8 for dishes you want to see often. Lower it for meals you enjoy but want less frequently.
2. **Tag thoughtfully** — use cuisines (Italian, Thai), timings (15 min, 40 min), dietary labels (vegetarian, vegan), or main proteins (chicken, fish) so filters stay useful.
3. **Back up regularly** — export your database after adding several meals. The app stores nothing on a server, so an exported JSON file is your safety net.
4. **Use the expanded view** — click *Expand* in the database footer to spread your meal cards across the full width of the screen, making it easier to browse a large collection.
5. **Add recipe URLs** — meals with a linked recipe show a book icon on both the database card and the plan card, giving you one-click access while cooking.

---

###  Easy Meal Management

<!-- ![Add/Edit Meal Modal](./screenshots/add_meal.webp) -->

Adding new meals is a breeze! Watch as we create "Vegetable Curry" - just enter the name, tags, ingredients, and set a popularity score. The meal instantly appears in your database!

---

###  Drag & Drop Customisation
Not feeling the suggested meal? No problem! Watch as we drag a meal from the database and drop it to replace any day's meal. It's that simple! 
![Drag and Drop](./screenshots/drag_and_drop.webp)



---

##  Key Features

### Meal Planning
-  **Flexible Plans**: Choose 3, 5, or 7-day meal plans
-  **Smart Randomisation**: Weighted algorithm favours your most popular meals
-  **Optional Dates**: Toggle date display for your meal plan
-  **Instant Refresh**: Don't like the plan? Randomise again instantly!

### Meal Database
-  **Add/Edit/Delete**: Full CRUD operations on your meal collection
-  **Tag System**: Organise meals by cuisine, cooking time, dietary preferences, etc.
-  **Popularity Ratings**: Rate meals from 0-1 to influence randomisation
-  **Search & Filter**: Find meals quickly by name or tag
-  **Ingredients Tracking**: Store ingredient lists for each meal

### Shopping Lists
-  **Auto-Generation**: Creates shopping lists from your meal plan
-  **Interactive Checkboxes**: Mark items you already have
-  **Copy to Clipboard**: One-click copy for easy sharing
-  **Calendar Integration**: Add meals directly to your calendar with ingredients

### Data Management
-  **Export Options**: Download your meals as JSON or CSV
-  **Import Support**: Upload previously exported data
-  **Browser Storage**: All data saved locally - your privacy is guaranteed
-  **No Account Needed**: Use immediately without sign-up

---

##  Technical Highlights

Built with modern web technologies for maximum performance and simplicity:

- **Pure Vanilla JavaScript**: No frameworks, blazing fast performance
- **CSS3**: Beautiful gradients, smooth animations, and glassmorphism effects
- **Local Storage API**: Persistent data without servers
- **Drag & Drop API**: Native browser drag-and-drop functionality
- **Responsive Design**: Mobile-first approach with Flexbox
- **Google Fonts**: Poppins font family for clean typography
- **Material Symbols**: Modern icon system
- **Web Audio API** for the slot-machine sound effects

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `?` or `Ctrl + /` | Open the user guide |

---

## Built With



## Tips

1. **Rate Your Favourites**: Set higher popularity scores (0.8-1.0) for meals you love - they'll appear more often in randomised plans!
2. **Use Tags Wisely**: Tag meals with cuisines, cooking time (Quick, Slow), dietary needs (Vegetarian, Vegan), or main proteins (Chicken, Fish)
3. **Save Regularly**: Export your meal database occasionally as a backup
4. **Plan Ahead**: Use the calendar integration to add meals to your schedule days in advance
5. **Batch Ingredients**: When adding meals, list all ingredients to get comprehensive shopping lists

---

##  Design Philosophy

We believe meal planning should be **joyful, not a chore**. That's why Simple Meal Planner features:

-  **Vibrant Colour Palette**: Eye-catching gradients and modern colours
-  **Smooth Animations**: Delightful micro-interactions throughout
-  **Intuitive UX**: Everything is where you expect it to be
-  **Mobile-First**: Designed for thumbs and fingers, not just mice
-  **Easy on the Eyes**: Balanced contrast and readable typography

---

##  Perfect For

- **Busy Families**: Plan meals for the whole week in minutes
- **Home Cooks**: Keep track of your recipe repertoire
- **Meal Preppers**: Organise your weekly prep sessions
- **Students**: Budget-friendly meal planning
- **Health Enthusiasts**: Track and plan nutritious meals

---

## Contributing

Found a bug? Have a feature idea? Contributions are welcome! Feel free to:

- 🐛 Report issues
- ✨ Suggest features
- 🔧 Submit pull requests
- ⭐ Star the repo if you find it useful!

---

##  Try It Now!

Ready to revolutionise your meal planning? 

**[Launch Simple Meal Planner](https://gitesh.github.io/MealPlanner/)**

No installation. No sign-up. Just open and start planning.

---

<div align="center">

**Made with good food in mind**

[Live Demo](https://gitesh.github.io/MealPlanner/) · [Report Bug](https://github.com/gitesh/MealPlanner/issues) · [Request Feature](https://github.com/gitesh/MealPlanner/issues)

</div>
