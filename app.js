// --- TAB NAVIGATION ---
window.openTab = function(evt, name) {
    // 1. Hide all contents
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
        contents[i].classList.remove("active");
    }

    // 2. Remove active state from all tabs
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    // 3. Show current tab
    const target = document.getElementById(name);
    if (target) {
        target.style.display = "block";
        target.classList.add("active");
    }

    // 4. Mark button as active
    if (evt) evt.currentTarget.classList.add("active");

    // 5. Refresh Data
    renderAll();
    window.scrollTo(0,0);
};

// --- REMAINDER OF LOGIC ---
// Ensure window.onload includes the date display fix
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    if (!db.customers) db.customers = [];
    if (!db.incomeHistory) db.incomeHistory = [];
    if (!db.expenses) db.expenses = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if (document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// ... [Include all other v8.7 functions: saveCustomer, renderWeeks, renderMasterTable, etc] ...
