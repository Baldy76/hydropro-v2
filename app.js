const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };
let currentDayFilter = 'All';
let activePayId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    // 1. Render Date
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    
    // 2. Load Data
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    
    // 3. Dark Mode
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) { contents[i].style.display = "none"; contents[i].classList.remove("active"); }
    
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }
    
    document.getElementById(name).style.display = "block";
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");

    // UI Toggle for Search/Filters
    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') searchBar.classList.remove('hidden');
    else searchBar.classList.add('hidden');

    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
};

window.saveCustomer = function() {
    const name = document.getElementById('cName').value;
    if(!name) { alert("Name Required"); return; }
    
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id: id,
        name: name,
        address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: false,
        paidThisMonth: 0,
        debtHistory: []
    };

    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) {
        const old = db.customers[idx];
        entry.cleaned = old.cleaned;
        entry.paidThisMonth = old.paidThisMonth;
        entry.debtHistory = old.debtHistory || [];
        db.customers[idx] = entry;
    } else {
        db.customers.push(entry);
    }
    
    saveData();
    clearForm();
    openTab(null, 'master');
};

window.saveData = () => { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };
window.clearForm = () => { 
    ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    });
    document.getElementById('editActions').classList.add('hidden');
};

window.renderAll = () => {
    renderWeeks();
    // renderMasterTable, renderStats... as per previous versions
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

// ... Rest of logic functions (Export, Import, Debt Calc) remain consistent with v10.1 ...
