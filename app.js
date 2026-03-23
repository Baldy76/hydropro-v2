const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };

window.onload = () => {
    // Render Date
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    // Load Data
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    
    // Dark Mode Sync
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(name).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
    
    // UI logic for hiding/showing search bar etc...
    const search = document.getElementById('globalSearchContainer');
    name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
};

// ... Include Export, Import, Save and Render logic from v10.7 ...
