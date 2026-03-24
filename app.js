const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    updateHeader();
    renderAll();
};

window.openTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    renderMaster();
    renderLedger();
    renderStats();
    renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

/* --- STATS ROBOT (RESTORED) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container');
    if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += n(c.price); paid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.round((paid/target)*100) : 0;
    
    container.innerHTML = `
        <div class="stats-hero"><div>£${profit.toFixed(2)}</div><small>PROFIT IN POCKET</small></div>
        
        <div class="stats-grid-2x1">
            <div class="stats-mini-card">
                <small>MONTH INCOME</small>
                <div style="color:var(--success)">£${paid.toFixed(2)}</div>
            </div>
            <div class="stats-mini-card">
                <small>MONTH SPEND</small>
                <div style="color:var(--danger)">£${spend.toFixed(2)}</div>
            </div>
        </div>

        <div class="progress-bubble">
            <strong>Progress ${progress}%</strong>
            <div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.6; font-weight:700;">
                <span>TARGET £${target.toFixed(2)}</span>
                <span>REMAINING £${(target - paid).toFixed(2)}</span>
            </div>
        </div>
        <div class="arrears-bubble">ARREARS: £${arrears.toFixed(2)}</div>`;
};

/* --- WEEKLY ROBOT --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container');
    if(!list) return;
    bulk.innerHTML = `<button class="btn-wa" onclick="messageAll(${curWeek},'wa')">WA ALL</button><button class="btn-sms" onclick="messageAll(${curWeek},'sms')">SMS ALL</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div>
            <div class="job-actions">
                <button class="btn-job" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button>
                <button class="btn-job" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- PRESERVED ACTIONS --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent);font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'), totalEl = document.getElementById('ledgerTotal');
    if(!container) return; container.innerHTML = ''; let total = 0;
    db.expenses.forEach(e => total += n(e.amt)); if(totalEl) totalEl.innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.handleClean = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    c.cleaned = !c.cleaned; saveData(); renderWeek();
    if(c.cleaned) {
        const msg = `Hi ${c.name}, windows cleaned at ${c.houseNum}. Price £${n(c.price).toFixed(2)}. \n\nBank: ${db.bank.name} \nSort: ${db.bank.sort} \nAcc: ${db.bank.acc}`;
        document.getElementById('msgPreview').innerText = msg;
        document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('modalButtons').innerHTML = `<button class="btn-wa" style="width:100%;margin-bottom:10px;height:55px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')">Send WhatsApp</button>
            <button class="btn-sms" style="width:100%;margin-bottom:10px;height:55px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')">Send SMS</button>
            <button onclick="closeMsgModal()" style="width:100%;height:50px;border-radius:15px;border:none;background:#8e8e93;color:white;font-weight:900;">Skip</button>`;
    }
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(c => c.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx>-1)?db.customers[idx].week:"1", cleaned: (idx>-1)?db.customers[idx].cleaned:false, paidThisMonth: (idx>-1)?db.customers[idx].paidThisMonth:0 };
    if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger();
};

window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked);
};
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Details Secured!"); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(c) { c.paidThisMonth = (n(c.paidThisMonth)>0)?0:c.price; saveData(); renderWeek(); renderStats(); } };
window.toggleDarkMode = () => { const d = document.body.classList.toggle('dark-mode'); localStorage.setItem('HP_Theme', d); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.sendMsg = (phone, method, msg) => { const clean = (phone||"").replace(/\s+/g,''); window.open(method==='wa' ? `https://wa.me/${clean}?text=${msg}` : `sms:${clean}?body=${msg}`, '_blank'); closeMsgModal(); };
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
