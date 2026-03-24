const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // UI Theme initialization
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    const dmT = document.getElementById('darkModeToggle'); if(dmT) dmT.checked = isDark;
    
    updateGreeting();
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    
    // Toggle the Back to Home pill
    const nav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
    }
    
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.updateGreeting = () => {
    const hr = new Date().getHours();
    const g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING";
    const msg = document.getElementById('greetingMsg');
    if(msg) msg.innerText = `${g}, PARTNER! ☕`;
    const dt = document.getElementById('headerDate');
    if(dt) dt.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.renderAll = () => {
    // Calling all functional render sub-routines
    if(window.renderMasterTable) renderMasterTable();
    if(window.renderWeekLists) renderWeekLists();
    if(window.renderStats) renderStats();
    if(window.renderLedger) renderLedger();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

// ... Remaining logic for Master Table, Stats, etc preserved from v22.7 baseline
