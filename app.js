const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let currentDayFilter = 'All';
let activePayId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) {
        try { db = JSON.parse(saved); } catch(e) { console.error("Data Load Error"); }
    }
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

    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') searchBar.classList.remove('hidden');
    else searchBar.classList.add('hidden');

    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
    window.scrollTo(0,0);
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value;
    if(!name) return;

    const entry = { 
        id: id, name: name, 
        address: document.getElementById('cAddr').value, 
        postcode: document.getElementById('cPostcode').value, 
        phone: document.getElementById('cPhone').value, 
        price: n(document.getElementById('cPrice').value), 
        week: document.getElementById('cWeek').value, 
        day: document.getElementById('cDay').value, 
        freq: document.getElementById('cFreq').value, 
        cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [] 
    };

    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { 
        const old = db.customers[idx];
        entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; entry.debtHistory = old.debtHistory || [];
        db.customers[idx] = entry; 
    } else { db.customers.push(entry); }
    
    clearForm(); saveData(); openTab(null, 'master');
};

window.clearForm = function() { 
    ['editId','cName','cAddr','cPostcode','cPhone','cPrice'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    }); 
    document.getElementById('editActions').classList.add('hidden'); 
};

window.saveData = () => { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };
window.handleSearch = () => { renderMasterTable(); };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.runUATClear = () => { if(confirm("WIPE ALL DATA?")) { localStorage.clear(); location.reload(); } };

// ... Include other logic functions (renderWeeks, renderMasterTable, confirmQuickPay, calculateTrueDebt) from v9.4 ...
