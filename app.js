const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- NAVIGATION ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    
    const setupWrapper = document.getElementById('setup-form-wrapper');
    if (setupWrapper) name === 'admin' ? setupWrapper.classList.remove('hidden') : setupWrapper.classList.add('hidden');

    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    
    const target = document.getElementById(name);
    if (target) {
        target.style.display = "block";
        if (evt) evt.currentTarget.classList.add("active");
    }

    renderAll();
    window.scrollTo(0, 0);
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
    saveData();
    alert("Saved!");
    location.reload(); 
};

// --- MODAL LOGIC (THE INTERACTION FIX) ---
window.showCustDetails = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    const modal = document.getElementById('custModal');
    const body = document.getElementById('modalBody');
    
    body.innerHTML = `
        <h2 style="margin-top:0; color:var(--accent); font-weight:900;">${c.name}</h2>
        <div style="margin-bottom:20px; font-size:15px; line-height:1.6;">
            <p>📍 <strong>Address:</strong><br>${c.address} ${c.postcode}</p>
            <p>📞 <strong>Mobile:</strong><br>${c.phone || 'No number'}</p>
            <p>📅 <strong>Schedule:</strong><br>Week ${c.week} - ${c.day}</p>
            <p>💰 <strong>Price:</strong> £${n(c.price).toFixed(2)}</p>
            <hr style="opacity:0.1">
            <p>📝 <strong>Notes:</strong><br>${c.notes || 'No specific notes recorded.'}</p>
        </div>
        <button class="btn-main full-width-btn" onclick="editCustomer('${c.id}')">⚙️ Edit Customer</button>
    `;
    modal.style.display = 'flex';
};

window.closeCustModal = () => {
    document.getElementById('custModal').style.display = 'none';
};

window.editCustomer = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    closeCustModal();
    openTab(null, 'admin');
    document.getElementById('editId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cAddr').value = c.address;
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week;
    document.getElementById('cDay').value = c.day;
    document.getElementById('cNotes').value = c.notes;
};

// --- RENDERING ---
window.renderAll = () => {
    renderMasterTable();
    renderWeekLists();
    renderStats();
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody');
    if (!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if (c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const row = document.createElement('div');
            row.className = 'master-row';
            row.onclick = () => showCustDetails(c.id);
            row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}<br><small>${c.day}</small></div>`;
            container.appendChild(row);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue; container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) {
            container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5;">No jobs scheduled.</div>';
            continue;
        }
        weekCusts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => showCustDetails(c.id);
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>${c.name}</strong><br><small>${c.day} - ${c.address}</small></div><div style="font-size:18px; font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div></div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    const currentMonthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const statsTitle = document.getElementById('statsMonthTitle');
    if (statsTitle) statsTitle.innerText = `${currentMonthLabel} Summary`;

    let currInc = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let currExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let currDebt = db.customers.reduce((sum, c) => sum + (c.cleaned ? Math.max(0, n(c.price) - n(c.paidThisMonth)) : 0), 0);

    const rEl = document.getElementById('currRevenue');
    const sEl = document.getElementById('currSpend');
    const dEl = document.getElementById('currDebt');
    const pEl = document.getElementById('currProfit');
    if(rEl) rEl.innerText = `£${currInc.toFixed(2)}`;
    if(sEl) sEl.innerText = `£${currExp.toFixed(2)}`;
    if(dEl) dEl.innerText = `£${currDebt.toFixed(2)}`;
    if(pEl) pEl.innerText = `£${(currInc - currExp).toFixed(2)}`;

    const histContainer = document.getElementById('monthlyHistoryContainer');
    if (!histContainer) return; histContainer.innerHTML = '<h3 class="section-title" style="margin-top:25px;">Monthly History</h3>';
    db.history.forEach(h => {
        const div = document.createElement('div');
        div.className = 'history-card';
        div.innerHTML = `<div class="history-header"><span>${h.month}</span> <span>📊</span></div>
            <div class="history-grid">
                <div class="history-item"><small>Income</small><strong>£${n(h.income).toFixed(2)}</strong></div>
                <div class="history-item"><small>Spend</small><strong>£${n(h.spend).toFixed(2)}</strong></div>
                <div class="history-item"><small>Debt</small><strong style="color:var(--danger)">£${n(h.debtCreated).toFixed(2)}</strong></div>
                <div class="history-item"><small>Profit</small><strong style="color:var(--success)">£${(n(h.income)-n(h.spend)).toFixed(2)}</strong></div>
            </div>`;
        histContainer.appendChild(div);
    });
};

// --- UTILS ---
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
window.runUATClear = () => { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };
window.addExpense = () => {
    const desc = document.getElementById('expDesc').value;
    const amt = n(document.getElementById('expAmt').value);
    if (!desc || amt <= 0) return;
    db.expenses.push({ desc, amt, date: new Date().toLocaleDateString() });
    saveData(); location.reload();
};
window.completeCycle = () => {
    if(!confirm("🚀 Archive Month & Reset?")) return;
    let mInc = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let mExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let nDebt = db.customers.reduce((sum, c) => sum + (c.cleaned ? Math.max(0, n(c.price) - n(c.paidThisMonth)) : 0), 0);
    db.history.unshift({ month: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), income: mInc, spend: mExp, debtCreated: nDebt });
    db.customers.forEach(c => {
        const balance = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
        if (balance > 0) { if(!c.debtHistory) c.debtHistory = []; c.debtHistory.push({ date: new Date().toLocaleDateString(), amount: balance }); }
        c.cleaned = false; c.paidThisMonth = 0;
    });
    db.expenses = []; saveData(); location.reload();
};
// ... CSV Import/Export as per v11.6 ...
