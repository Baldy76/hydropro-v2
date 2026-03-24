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
    const globalNav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) {
        globalNav.classList.add('hidden');
    } else {
        globalNav.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

// 📲 COMMUNICATION ENGINE
window.sendReminder = (id, method) => {
    const c = db.customers.find(x => x.id === id);
    if(!c || !c.phone) return alert("Please add a phone number for this customer first!");
    const msg = `Hi ${c.name}, it's Hydro Pro. Just a reminder I'll be coming to ${c.houseNum} ${c.street} this week on your requested day to clean your windows!`;
    const cleanPhone = c.phone.replace(/\s+/g, '');
    const url = method === 'whatsapp' 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
        : `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

// 🚀 BULK MODE ENGINE
window.messageAllInWeek = (weekNum) => {
    const list = db.customers.filter(c => c.week == weekNum && c.phone && c.phone.length > 5);
    if(list.length === 0) return alert("No customers with phone numbers found for this week.");
    
    if(!confirm(`This will open WhatsApp for ${list.length} customers one after another. Ready?`)) return;

    list.forEach((c, index) => {
        setTimeout(() => {
            const msg = `Hi ${c.name}, it's Hydro Pro. Just a reminder I'll be coming to ${c.houseNum} ${c.street} this week on your requested day to clean your windows!`;
            const cleanPhone = c.phone.replace(/\s+/g, '');
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }, index * 2000); // 2 second delay to prevent browser blocking
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const existing = idx > -1 ? db.customers[idx] : null;
    const entry = {
        id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, 
        street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), 
        price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, 
        week: existing ? existing.week : "1", cleaned: existing ? existing.cleaned : false, paidThisMonth: existing ? existing.paidThisMonth : 0
    };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Customer Saved Successfully! ✨");
    ['editId', 'cName', 'cPhone', 'cHouseNum', 'cStreet', 'cPostcode', 'cPrice', 'cNotes'].forEach(f => {
        const el = document.getElementById(f); if(el) el.value = "";
    });
    openTab('home');
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `
            <div class="bulk-action-bar">
                <button class="btn-bulk-message" onclick="messageAllInWeek(${i})">🚀 Message All (WhatsApp)</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 15px 15px;">
                <button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('weeksHub')">⬅️ Weekly Hub</button>
                <button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('home')">🏠 Home Hub</button>
            </div>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.style.flexDirection = 'column'; card.style.alignItems = 'stretch';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div onclick="showActionModal('${c.id}')">
                        <strong style="color:var(--accent); display:block; font-size:19px;">${c.name} ${c.cleaned ? '✅' : ''}</strong>
                        <small style="display:block; margin-top:2px;">${c.houseNum} ${c.street}</small>
                    </div>
                    <button class="btn-comm" onclick="sendReminder('${c.id}', 'whatsapp')">💬 Text</button>
                </div>
                <div class="week-card-actions">
                    <button class="btn-week-action" style="${c.cleaned ? 'background:var(--success); color:white;' : ''}" onclick="toggleCleaned('${c.id}')">Clean</button>
                    <button class="btn-week-action" style="${isPaid ? 'background:var(--accent); color:white;' : ''}" onclick="markAsPaid('${c.id}')">Pay</button>
                    <button class="btn-week-action" onclick="showActionModal('${c.id}')">Edit</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

// CORE DATABASE UTILS (LOCKED)
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.showActionModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('modalCustomerName').innerText = c.name; document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`; const editBtn = document.getElementById('modalEditBtn'); editBtn.onclick = () => { closeModal(); editCust(c.id); }; document.getElementById('actionModal').classList.remove('hidden'); };
window.closeModal = () => { document.getElementById('actionModal').classList.add('hidden'); };
window.renderMasterTable = () => { const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = ''; const search = (document.getElementById('mainSearch').value || "").toLowerCase(); db.customers.forEach(c => { if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) { const tile = document.createElement('div'); tile.className = 'customer-pill-bubble bounce-on-tap'; tile.onclick = () => showActionModal(c.id); tile.innerHTML = `<div><strong style="display:block; font-size:19px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success)">£${n(c.price).toFixed(2)}</div>`; body.appendChild(tile); } }); };
window.renderStats = () => { const monthYearEl = document.getElementById('currentMonthYear'); if (monthYearEl) monthYearEl.innerText = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + " Summary"; let target = 0, paid = 0, arrears = 0, spend = 0; db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); }); db.expenses.forEach(e => spend += n(e.amt)); const profit = paid - spend; const progress = target > 0 ? (paid / target) * 100 : 0; const map = { 'currProfit': `£${profit.toFixed(2)}`, 'statsIncome': `£${paid.toFixed(2)}`, 'statsSpend': `£${spend.toFixed(2)}`, 'statsArrears': `£${arrears.toFixed(2)}`, 'statsTarget': `£${target.toFixed(2)}`, 'statsRemaining': `£${(target - paid).toFixed(2)}`, 'progressPercent': `${Math.round(progress)}%` }; for (let [id, val] of Object.entries(map)) { const el = document.getElementById(id); if(el) el.innerText = val; } const bar = document.getElementById('progressBarFill'); if(bar) bar.style.width = `${progress}%`; const histBox = document.getElementById('monthlyHistoryContainer'); if(histBox) { histBox.innerHTML = ''; if (db.history.length === 0) histBox.innerHTML = '<div class="customer-pill-bubble" style="justify-content:center; opacity:0.5">Month-end snapshots appear here.</div>'; else [...db.history].reverse().forEach(h => { const div = document.createElement('div'); div.className = 'customer-pill-bubble'; div.innerHTML = `<div><strong>${h.month} ${h.year}</strong><small>SNAPSHOT</small></div><div style="font-weight:900; color:var(--success)">£${n(h.profit).toFixed(2)}</div>`; histBox.appendChild(div); }); } };
window.addExpense = () => { const desc = document.getElementById('expDesc').value, amt = n(document.getElementById('expAmt').value); if(!desc || amt <= 0) return; db.expenses.push({ id: Date.now(), desc, amt, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); document.getElementById('expDesc').value = ""; document.getElementById('expAmt').value = ""; alert("Expense Logged! 💸"); };
window.renderLedger = () => { const container = document.getElementById('expenseList'); if(!container) return; container.innerHTML = ''; if(db.expenses.length === 0) container.innerHTML = '<div class="customer-pill-bubble" style="justify-content:center; opacity:0.5">No spend history yet.</div>'; [...db.expenses].reverse().forEach(e => { const div = document.createElement('div'); div.className = 'customer-pill-bubble'; div.innerHTML = `<div><strong style="display:block; font-size:18px">${e.desc}</strong><small style="font-weight:700; color:#8e8e93">${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:18px">-£${n(e.amt).toFixed(2)}</div>`; container.appendChild(div); }); };
window.exportToCSV = (type) => { let csv = type === 'income' ? 'Name,House,Street,Amount,Date\n' : 'Description,Amount,Date\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `${c.name},${c.houseNum},${c.street},${c.paidThisMonth},${new Date().toLocaleDateString()}\n`); else db.expenses.forEach(e => csv += `${e.desc},${e.amt},${e.date}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', `HydroPro_${type}_${Date.now()}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening"; const el = document.getElementById('greetingMsg'); if (el) el.innerText = `${g}, Partner! ☕`; };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone || ""; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; let inc = 0, exp = 0; db.customers.forEach(c => inc += n(c.paidThisMonth)); db.expenses.forEach(e => exp += n(e.amt)); db.history.push({ month: new Date().toLocaleDateString('en-GB', {month:'long'}), year: new Date().getFullYear(), profit: (inc - exp) }); db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
