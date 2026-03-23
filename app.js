const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };

// --- BOOT ENGINE ---
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
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
    
    const target = document.getElementById(name);
    target.style.display = "block";
    // Slight delay to trigger animation
    setTimeout(() => target.classList.add("active"), 10);
    
    if (evt) evt.currentTarget.classList.add("active");

    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') searchBar.classList.remove('hidden');
    else searchBar.classList.add('hidden');

    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
};

// ... Include standard logic (saveCustomer, renderWeeks, etc.) ...
// Note: Ensure your renderWeeks uses the Hybrid Card classes from v10.0
