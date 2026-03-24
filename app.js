const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let currentActiveWeek = 1;

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    updateHeader(); renderAll();
};

window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(fenceId).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => {
    renderMasterFence();
    renderStatsFence();
    renderLedgerFence();
    renderWeekFence();
    if(db.bank) {
        const bn = document.getElementById('bankName'), bs = document.getElementById('bankSort'), ba = document.getElementById('bankAcc');
        if(bn) bn.value = db.bank.name || ''; if(bs) bs.value = db.bank.sort || ''; if(ba) ba.value = db.bank.acc || '';
    }
};

/* --- LEDGER UPGRADE ROBOT --- */
window.renderLedgerFence = () => {
    const container = document.getElementById('expense-list-container');
    const totalEl = document.getElementById('ledgerTotalSpend');
    if(!container) return; container.innerHTML = '';
    
    let total = 0;
    db.expenses.forEach(e => total += n(e.amt));
    if(totalEl) totalEl.innerText = `£${total.toFixed(2)}`;

    if(db.expenses.length === 0) {
        container.innerHTML = '<div class="expense-tile" style="justify-content:center; opacity:0.5; border:none;">No expenses logged yet.</div>';
        return;
    }

    db.expenses.slice().reverse().forEach((e, index) => {
        const div = document.createElement('div');
        div.className = 'expense-tile';
        div.innerHTML = `
            <div class="expense-info">
                <strong>${e.desc}</strong>
                <small>📅 ${e.date}</small>
            </div>
            <div class="expense-amt">-£${n(e.amt).toFixed(2)}</div>
        `;
        // Optional: Add double tap to delete logic here in future
        container.appendChild(div);
    });
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Please enter description and amount.");
    db.expenses.push({ 
        id: Date.now(), 
        desc: d, 
        amt: a, 
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) 
    });
    saveData(); 
    document.getElementById('expDesc').value=''; 
    document.getElementById('expAmt').value=''; 
    renderLedgerFence();
    renderStatsFence(); // Keep stats in sync
};

/* --- PRESERVED ROBOTS --- */
window.renderMasterFence = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'cust-tile';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(tile);
        }
    });
};

window.renderStatsFence = () => {
    const container = document.getElementById('stats-dashboard-container'); if (!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.round((paid / target) * 100) : 0;
    container.innerHTML = `<div class="stats-hero"><span class="main-amt">£${profit.toFixed(2)}</span><small style="font-weight:600; opacity:0.7">💰 Total Profit in Pocket</small></div>
        <div class="progress-bubble"><strong style="font-size:18px;">Monthly Progress ${progress}%</strong><div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div><div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; opacity:0.5;"><span>TARGET: £${target.toFixed(2)}</span><span>REMAINING: £${(target - paid).toFixed(2)}</span></div></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; padding:0 20px 20px;"><div class="progress-bubble" style="margin:0; text-align:center;"><small>INCOME 🔍</small><div style="color:var(--success); font-size:24px; font-weight:800">£${paid.toFixed(2)}</div></div><div class="progress-bubble" style="margin:0; text-align:center;"><small>SPEND 🔍</small><div style="color:var(--danger); font-size:24px; font-weight:800">£${spend.toFixed(2)}</div></div></div><div class="arrears-bubble">Arrears 🔍 £${arrears.toFixed(2)}</div>`;
};

window.renderWeekFence = () => {
    const bulk = document.getElementById('bulk-action-bar'), list = document.getElementById('week-list-container');
    if(!list) return;
    bulk.innerHTML = `<button class="btn-bulk btn-wa" onclick="messageAll(${currentActiveWeek}, 'whatsapp')">WA ALL</button><button class="btn-bulk btn-sms" onclick="messageAll(${currentActiveWeek}, 'sms')">SMS ALL</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == currentActiveWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><span style="font-size:22px; font-weight:800;">${c.name} ${c.cleaned ? '✅' : ''}</span><br><span style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</span></div>
            <div class="job-action-grid"><button class="btn-job" style="background:${c.cleaned ? 'var(--success)' : '#aaa'}" onclick="handleCleanAction('${c.id}')">CLEAN</button>
            <button class="btn-job" style="background:${n(c.paidThisMonth)>0 ? 'var(--accent)' : '#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button></div>`;
        list.appendChild(div);
    });
};

/* --- SHARED ACTIONS --- */
window.handleCleanAction = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    c.cleaned = !c.cleaned; saveData(); renderWeekFence();
    if(c.cleaned) {
        const msg = `Hi ${c.name}, windows cleaned at ${c.houseNum} ${c.street}. Price £${n(c.price).toFixed(2)}.\n\nBank: ${db.bank.name}\nSort: ${db.bank.sort}\nAcc: ${db.bank.acc}\n\nThanks, Hydro Pro!`;
        document.getElementById('msgPreview').innerText = msg;
        document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('sendWA').onclick = () => { window.open(`https://wa.me/${c.phone.replace(/\s+/g,'')}?text=${encodeURIComponent(msg)}`,'_blank'); closeMsgModal(); };
        document.getElementById('sendSMS').onclick = () => { window.open(`sms:${c.phone.replace(/\s+/g,'')}?body=${encodeURIComponent(msg)}`,'_blank'); closeMsgModal(); };
    }
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(c => c.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx>-1)?db.customers[idx].week:"1", cleaned: (idx>-1)?db.customers[idx].cleaned:false, paidThisMonth: (idx>-1)?db.customers[idx].paidThisMonth:0 };
    if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); alert("Saved!"); openTab('fence-master');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('fence-setup');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked);
};
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Saved!"); };
window.openWeek = (w) => { currentActiveWeek = w; openTab('fence-week-view'); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(c) { c.paidThisMonth = (n(c.paidThisMonth)>0)?0:c.price; saveData(); renderWeekFence(); renderStatsFence(); } };
window.toggleDarkMode = () => { const d = document.body.classList.toggle('dark-mode'); localStorage.setItem('HP_Theme', d); document.getElementById('themeToggleBtn').innerText = d ? '☀️' : '🌙'; };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { 
    const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING";
    document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`;
    document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); 
};
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
window.exportToCSV = (type) => {
    let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n';
    if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`);
    else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`);
    const b = new Blob([csv], { type: 'text/csv' }); const u = window.URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `HydroPro_${type}.csv`; a.click();
};
