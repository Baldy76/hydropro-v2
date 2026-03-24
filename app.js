const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
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

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.showActionModal = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    document.getElementById('modalCustomerName').innerText = c.name;
    document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`;
    const editBtn = document.getElementById('modalEditBtn');
    editBtn.onclick = () => { closeModal(); editCust(c.id); };
    document.getElementById('actionModal').classList.remove('hidden');
};

window.closeModal = () => { document.getElementById('actionModal').classList.add('hidden'); };

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const existing = idx > -1 ? db.customers[idx] : null;
    const entry = {
        id, name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value),
        notes: document.getElementById('cNotes').value, week: existing ? existing.week : "1", 
        cleaned: existing ? existing.cleaned : false, paidThisMonth: existing ? existing.paidThisMonth : 0
    };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Customer Saved Successfully! ✨");
    ['editId', 'cName', 'cHouseNum', 'cStreet', 'cPostcode', 'cPrice', 'cNotes'].forEach(f => {
        const el = document.getElementById(f); if(el) el.value = "";
    });
    openTab('home');
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble bounce-on-tap';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:19px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success)">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 15px 15px;"><button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('weeksHub')">⬅️ Weekly Hub</button><button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('home')">🏠 Home Hub</button></div>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.innerHTML = `<div><strong style="color:var(--accent); display:block; font-size:19px;">${c.name} ${c.cleaned ? '✅' : ''}</strong><small style="display:block; margin-top:2px;">${c.houseNum} ${c.street}</small></div><div style="display:flex; gap:10px;"><button class="tile" style="height:44px; padding:0 12px; font-weight:800; background:var(--input-bg); border:none; border-radius:15px; ${c.cleaned ? 'background:var(--success); color:white;' : ''}" onclick="toggleCleaned('${c.id}')">Clean</button><button class="tile" style="height:44px; padding:0 12px; font-weight:800; background:var(--input-bg); border:none; border-radius:15px; ${isPaid ? 'background:var(--accent); color:white;' : ''}" onclick="markAsPaid('${c.id}')">Pay</button></div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    let totalTarget = 0, totalPaid = 0, totalArrears = 0, totalSpend = 0;
    db.customers.forEach(c => {
        totalTarget += n(c.price); totalPaid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) totalArrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => totalSpend += n(e.amt));
    const profit = totalPaid - totalSpend; const progress = totalTarget > 0 ? (totalPaid / totalTarget) * 100 : 0;
    const map = { 'currProfit': `£${profit.toFixed(2)}`, 'statsIncome': `£${totalPaid.toFixed(2)}`, 'statsSpend': `£${totalSpend.toFixed(2)}`, 'statsArrears': `£${totalArrears.toFixed(2)}`, 'statsTarget': `£${totalTarget.toFixed(2)}`, 'statsRemaining': `£${(totalTarget - totalPaid).toFixed(2)}`, 'progressPercent': `${Math.round(progress)}%` };
    for (let [id, val] of Object.entries(map)) { const el = document.getElementById(id); if(el) el.innerText = val; }
    const bar = document.getElementById('progressBarFill'); if(bar) bar.style.width = `${progress}%`;
    const histBox = document.getElementById('monthlyHistoryContainer');
    if(histBox) {
        histBox.innerHTML = '';
        if (db.history.length === 0) histBox.innerHTML = '<div class="empty-history-msg">Month-end snapshots appear here.</div>';
        else [...db.history].reverse().forEach(h => {
            const div = document.createElement('div'); div.className = 'customer-pill-bubble';
            div.innerHTML = `<div><strong>${h.month} ${h.year}</strong><small>SNAPSHOT</small></div><div style="font-weight:900; color:var(--success)">£${n(h.profit).toFixed(2)}</div>`;
            histBox.appendChild(div);
        });
    }
};

window.updateGreeting = () => {
    const hr = new Date().getHours();
    const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening";
    const el = document.getElementById('greetingMsg'); if (el) el.innerText = `${g}, Partner! ☕`;
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.renderLedger = () => { const l = document.getElementById('expenseList'); if(!l) return; l.innerHTML = '<h3 class="hall-of-fame-title">💸 Spend History</h3>'; db.expenses.forEach(e => { const d = document.createElement('div'); d.className = 'customer-pill-bubble'; d.innerHTML = `<div style="display:flex; justify-content:space-between; width:100%"><div><strong>${e.desc}</strong><small>${e.date}</small></div><div class="amt-red" style="font-size:16px; font-weight:900">-£${n(e.amt).toFixed(2)}</div></div>`; l.appendChild(d); }); };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; let inc = 0, exp = 0; db.customers.forEach(c => inc += n(c.paidThisMonth)); db.expenses.forEach(e => exp += n(e.amt)); db.history.push({ month: new Date().toLocaleDateString('en-GB', {month:'long'}), year: new Date().getFullYear(), profit: (inc - exp) }); db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
