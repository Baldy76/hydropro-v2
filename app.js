const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    
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
    if (target) {
        target.style.display = "block";
        target.classList.add("active");
    }
    if (evt) evt.currentTarget.classList.add("active");

    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(searchBar) name === 'master' ? searchBar.classList.remove('hidden') : searchBar.classList.add('hidden');
    if(filterBar) name.startsWith('week') ? filterBar.classList.remove('hidden') : filterBar.classList.add('hidden');

    renderAll();
};

window.saveCustomer = function() {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) { alert("Enter Name"); return; }
    
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id: id, name: nameVal,
        address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: []
    };

    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    alert("Saved!");
    location.reload();
};

window.runUATClear = () => {
    if(confirm("Wipe everything?")) {
        localStorage.clear();
        location.reload();
    }
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.renderAll = () => {
    // Logic for master list and weeks...
};
