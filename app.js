const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- INITIALIZE ---
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- DATA LOGIC ---
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

// --- RENDER LOGIC (THE FIX) ---
window.renderAll = () => {
    renderMasterTable();
    renderWeekLists();
    renderStats();
    renderExpenses();
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody');
    if (!container) return;
    container.innerHTML = '';
    const search = document.getElementById('mainSearch').value.toLowerCase();

    db.customers.forEach(c => {
        if (c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const row = document.createElement('div');
            row.className = 'master-row';
            row.innerHTML = `
                <div><strong>${c.name}</strong><br><small>${c.address}</small></div>
                <div style="text-align:right">£${n(c.price).toFixed(2)}<br><small>${c.day}</small></div>
            `;
            container.appendChild(row);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue;
        container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        
        if (weekCusts.length === 0) {
            container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5;">No jobs scheduled for this week.</div>';
            continue;
        }

        weekCusts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>${c.name}</strong><br><small>${c.day} - ${c.address}</small></div>
                    <div style="font-size:20px; font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    let rev = db.customers.reduce((sum, c) => sum + n(c.price), 0);
    let exp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    document.getElementById('statRevenue').innerText = `£${rev.toFixed(2)}`;
    document.getElementById('statSpend').innerText = `£${exp.toFixed(2)}`;
    document.getElementById('statProfit').innerText = `£${(rev - exp).toFixed(2)}`;
};

// --- MISC ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(name).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
    const search = document.getElementById('globalSearchContainer');
    name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
};

window.addExpense = () => {
    const desc = document.getElementById('expDesc').value;
    const amt = n(document.getElementById('expAmt').value);
    if (!desc || amt <= 0) return;
    db.expenses.push({ desc, amt, date: new Date().toLocaleDateString() });
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    location.reload();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.runUATClear = () => { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };
