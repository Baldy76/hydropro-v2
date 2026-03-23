const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };

window.onload = () => {
    // Immediate Date Render
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    // Load Data
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Dark Mode Sync
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
        contents[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }
    
    document.getElementById(name).style.display = "block";
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");

    // Dynamic UI Elements
    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') searchBar.classList.remove('hidden');
    else searchBar.classList.add('hidden');

    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

// ... Include all other v10.1 logic functions (saveCustomer, renderWeeks, etc.) ...
