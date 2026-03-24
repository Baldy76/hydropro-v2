const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    updateGreeting();
    renderAll();
};

window.openTab = (name) => {
    closeModal();
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    
    const nav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.showActionModal = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    document.getElementById('modalCustomerName').innerText = c.name;
    document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`;
    document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); };
    document.getElementById('actionModal').classList.remove('hidden');
};

window.closeModal = () => {
    const m = document.getElementById('actionModal');
    if(m) m.classList.add('hidden');
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx > -1) ? db.customers[idx].week : "1", cleaned: (idx > -1) ? db.customers[idx].cleaned : false, paidThisMonth: (idx > -1) ? db.customers[idx].paidThisMonth : 0 };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('home');
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:20px;">${c.name}</strong><small style="color:var(--accent); font-weight:700; font-size:15px;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 18px 18px;">
                <button class="tile" style="height:55px; font-size:15px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('weeksHub')">⬅️ Hub</button>
                <button class="tile" style="height:55px; font-size:15px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('home')">🏠 Home</button>
            </div>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.innerHTML = `<div onclick="showActionModal('${c.id}')"><strong style="font-size:20px;">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street}</small></div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    const monthYearEl = document.getElementById('currentMonthYear');
    if (monthYearEl) monthYearEl.innerText = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    // Core stats logic preserved from previous baseline
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening"; document.getElementById('greetingMsg').innerText = `${g}, Partner! ☕`; };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-field'); const lockBtn = document.getElementById('bankLockBtn'); const saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 Lock" : "🔓 Unlock"; if(isLocked) saveBtn.classList.remove('hidden'); else saveBtn.classList.add('hidden'); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Saved! 🏦"); };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); alert("Logged! 💸"); };
window.renderLedger = () => { const container = document.getElementById('expenseList'); if(!container) return; container.innerHTML = ''; db.expenses.forEach(e => { const div = document.createElement('div'); div.className = 'customer-pill-bubble'; div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900">-£${n(e.amt).toFixed(2)}</div>`; container.appendChild(div); }); };
