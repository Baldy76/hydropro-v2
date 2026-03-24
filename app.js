const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    // Set Bank fields
    document.getElementById('bankName').value = db.bank.name || "";
    document.getElementById('bankSort').value = db.bank.sort || "";
    document.getElementById('bankAcc').value = db.bank.acc || "";

    // Mask for Sort Code
    document.getElementById('bankSort').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 6) val = val.substring(0, 6);
        let formatted = val.match(/.{1,2}/g)?.join('-') || val;
        e.target.value = formatted;
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    renderAll();
};

/* ---------------------------------- */
/* CORE RENDERING ENGINES        */
/* ---------------------------------- */

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
        container.innerHTML = `
            <div class="bulk-dual-bar">
                <button class="btn-bulk-wa" onclick="messageAllInWeek(${i}, 'whatsapp')">🚀 Message WA</button>
                <button class="btn-bulk-sms" onclick="messageAllInWeek(${i}, 'sms')">🚀 Message SMS</button>
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
                    <div style="display:flex; gap:5px;">
                        <button class="btn-comm" onclick="sendReminder('${c.id}', 'whatsapp')">WA</button>
                        <button class="btn-comm" style="background:#ff9500" onclick="sendReminder('${c.id}', 'sms')">SMS</button>
                    </div>
                </div>
                <div class="week-card-actions" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px;">
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; ${c.cleaned ? 'background:var(--success); color:white;' : 'background:var(--input-bg)'}" onclick="toggleCleaned('${c.id}')">Clean</button>
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; ${isPaid ? 'background:var(--accent); color:white;' : 'background:var(--input-bg)'}" onclick="markAsPaid('${c.id}')">Pay</button>
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; background:var(--input-bg)" onclick="showActionModal('${c.id}')">Edit</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    const monthYearEl = document.getElementById('currentMonthYear');
    if (monthYearEl) monthYearEl.innerText = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + " Summary";
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += n(c.price); paid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend; const progress = target > 0 ? (paid / target) * 100 : 0;
    const map = { 'currProfit': `£${profit.toFixed(2)}`, 'statsIncome': `£${paid.toFixed(2)}`, 'statsSpend': `£${spend.toFixed(2)}`, 'statsArrears': `£${arrears.toFixed(2)}`, 'statsTarget': `£${target.toFixed(2)}`, 'statsRemaining': `£${(target - paid).toFixed(2)}`, 'progressPercent': `${Math.round(progress)}%` };
    for (let [id, val] of Object.entries(map)) { const el = document.getElementById(id); if(el) el.innerText = val; }
    const bar = document.getElementById('progressBarFill'); if(bar) bar.style.width = `${progress}%`;
    const histBox = document.getElementById('monthlyHistoryContainer');
    if(histBox) {
        histBox.innerHTML = '';
        [...db.history].reverse().forEach(h => {
            const div = document.createElement('div'); div.className = 'customer-pill-bubble';
            div.innerHTML = `<div><strong>${h.month} ${h.year}</strong><small>SNAPSHOT</small></div><div style="font-weight:900; color:var(--success)">£${n(h.profit).toFixed(2)}</div>`;
            histBox.appendChild(div);
        });
    }
};

window.renderLedger = () => {
    const container = document.getElementById('expenseList'); if(!container) return; container.innerHTML = '';
    if(db.expenses.length === 0) container.innerHTML = '<div class="customer-pill-bubble" style="justify-content:center; opacity:0.5">No spend history yet.</div>';
    [...db.expenses].reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'customer-pill-bubble';
        div.innerHTML = `<div><strong style="display:block; font-size:18px">${e.desc}</strong><small style="font-weight:700; color:#8e8e93">${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:18px">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

/* ---------------------------------- */
/* FUNCTIONAL UTILITIES          */
/* ---------------------------------- */

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx > -1) ? db.customers[idx].week : "1", cleaned: (idx > -1) ? db.customers[idx].cleaned : false, paidThisMonth: (idx > -1) ? db.customers[idx].paidThisMonth : 0 };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); renderAll(); openTab('home');
};

window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field');
    const lockBtn = document.getElementById('bankLockBtn');
    const saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly;
    fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 Lock" : "🔓 Unlock";
    if(isLocked) saveBtn.classList.remove('hidden'); else saveBtn.classList.add('hidden');
};

window.saveBankDetails = () => {
    db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value };
    saveData(); toggleBankLock(); alert("Bank Details Secured! 🏦");
};

window.messageAllInWeek = (weekNum, method) => {
    const list = db.customers.filter(c => c.week == weekNum && c.phone && c.phone.length > 5);
    if(list.length === 0) return alert("No phone numbers found.");
    list.forEach((c, index) => {
        setTimeout(() => {
            const msg = `Hi ${c.name}, it's Hydro Pro. Reminder: I'm coming to ${c.houseNum} ${c.street} this week to clean your windows!`;
            const cleanPhone = c.phone.replace(/\s+/g, '');
            const url = method === 'whatsapp' ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }, index * 2200);
    });
};

window.sendReminder = (id, method) => {
    const c = db.customers.find(x => x.id === id);
    if(!c || !c.phone) return alert("Add phone first!");
    const msg = `Hi ${c.name}, it's Hydro Pro. Reminder: I'm coming to ${c.houseNum} ${c.street} this week to clean your windows!`;
    const url = method === 'whatsapp' ? `https://wa.me/${c.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}` : `sms:${c.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name); if(target) target.classList.add("active");
    const nav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden'); else nav.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' }); renderAll();
};

window.showActionModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('modalCustomerName').innerText = c.name;
    document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`;
    const editBtn = document.getElementById('modalEditBtn');
    editBtn.onclick = () => { closeModal(); editCust(c.id); };
    document.getElementById('actionModal').classList.remove('hidden');
};

window.closeModal = () => document.getElementById('actionModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone||""; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); document.getElementById('expDesc').value = ""; document.getElementById('expAmt').value = ""; alert("Logged! 💸"); };
window.exportToCSV = (type) => { let csv = type === 'income' ? 'Name,House,Street,Amount,Date\n' : 'Description,Amount,Date\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `${c.name},${c.houseNum},${c.street},${c.paidThisMonth},${new Date().toLocaleDateString()}\n`); else db.expenses.forEach(e => csv += `${e.desc},${e.amt},${e.date}\n`); const b = new Blob([csv], { type: 'text/csv' }); const u = window.URL.createObjectURL(b); const a = document.createElement('a'); a.setAttribute('href', u); a.setAttribute('download', `HydroPro_${type}.csv'); document.body.appendChild(a); a.click(); document.body.removeChild(a); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening"; document.getElementById('greetingMsg').innerText = `${g}, Partner! ☕`; };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; let inc = 0, exp = 0; db.customers.forEach(c => inc += n(c.paidThisMonth)); db.expenses.forEach(e => exp += n(e.amt)); db.history.push({ month: new Date().toLocaleDateString('en-GB', {month:'long'}), year: new Date().getFullYear(), profit: (inc - exp) }); db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
