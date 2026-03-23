const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- LOCKED NAVIGATION ENGINE ---
window.openTab = (evt, name) => {
    // 1. Hide all tab containers
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    
    // 2. Un-highlight all tab buttons
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    
    // 3. Special: Hide Search Bar unless on Custs
    const search = document.getElementById('globalSearchContainer');
    if (search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');

    // 4. Show the selected tab
    const target = document.getElementById(name);
    if (target) {
        target.style.display = "block";
        if (evt) evt.currentTarget.classList.add("active");
    }

    renderAll();
    window.scrollTo(0,0);
};

// --- DATA LOGIC ---
window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) { alert("Enter Name"); return; }
    
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name: nameVal, address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: []
    };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    location.reload(); 
};

// --- RENDER PORTALS ---
window.renderAll = () => {
    renderMasterTable();
    renderWeekLists();
    renderStats();
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody');
    if (!container) return;
    container.innerHTML = '';
    const searchInput = document.getElementById('mainSearch');
    const search = (searchInput ? searchInput.value : "").toLowerCase();

    db.customers.forEach(c => {
        if (c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const row = document.createElement('div');
            row.className = 'master-row';
            row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}<br><small>${c.day}</small></div>`;
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
            container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5; padding:40px;">No jobs this week.</div>';
            continue;
        }
        weekCusts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>${c.name}</strong><br><small>${c.day} - ${c.address}</small></div><div style="font-size:20px; font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div></div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    let rev = db.customers.reduce((sum, c) => sum + n(c.price), 0);
    let exp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    const rEl = document.getElementById('statRevenue');
    const sEl = document.getElementById('statSpend');
    const pEl = document.getElementById('statProfit');
    if(rEl) rEl.innerText = `£${rev.toFixed(2)}`;
    if(sEl) sEl.innerText = `£${exp.toFixed(2)}`;
    if(pEl) pEl.innerText = `£${(rev - exp).toFixed(2)}`;
};

// --- UTILS ---
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.runUATClear = () => { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };

window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Notes\n";
    db.customers.forEach(c => {
        csv += `${c.id},"${c.name}","${c.address}","${c.postcode}","${c.phone}",${c.price},${c.week},"${c.day}","${c.notes}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `HydroPro_Backup.csv`; a.click();
};

window.importFullCSV = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1);
        let imported = [];
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(cols.length > 5) {
                imported.push({
                    id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''),
                    postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''),
                    price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : ""
                });
            }
        });
        db.customers = imported;
        localStorage.setItem(MASTER_KEY, JSON.stringify(db));
        location.reload();
    };
    reader.readAsText(file);
};
