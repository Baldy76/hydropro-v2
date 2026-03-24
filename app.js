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

/* --- RENDERING ROBOTS --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            div.innerHTML = `<div><strong style="font-size:20px; display:block;">${c.name}</strong><small style="color:var(--accent);font-weight:700;">${c.houseNum} ${c.street}</small></div>
                             <div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'), totalEl = document.getElementById('ledgerTotal');
    if(!container) return; container.innerHTML = ''; let total = 0;
    db.expenses.forEach(e => total += n(e.amt)); if(totalEl) totalEl.innerText = `£${total.toFixed(2)}`;
    
    if(db.expenses.length === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.3; padding:20px;">No spend logged yet.</div>';
        return;
    }

    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        // Double-tap to delete implementation
        div.ondblclick = () => deleteExpense(e.id);
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small style="opacity:0.5; font-weight:700;">📅 ${e.date}</small></div>
                         <div style="color:var(--danger); font-weight:900; font-size:18px;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.deleteExpense = (id) => {
    if(confirm("Delete this expense?")) {
        db.expenses = db.expenses.filter(e => e.id !== id);
        saveData(); renderLedger(); renderStats();
    }
};

window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.round((paid/target)*100) : 0;
    container.innerHTML = `<div class="stats-hero">
        <div style="font-size:55px; font-weight:900;">£${profit.toFixed(2)}</div><small style="font-weight:700; opacity:0.6;">PROFIT IN POCKET</small>
        </div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
        <div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5; font-size:10px;">MONTH INCOME</small><div style="color:var(--success); font-weight:900; font-size:20px;">£${paid.toFixed(2)}</div></div>
        <div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5; font-size:10px;">MONTH SPEND</small><div style="color:var(--danger); font-weight:900; font-size:20px;">£${spend.toFixed(2)}</div></div>
        </div><div style="background:var(--card); padding:25px; border-radius:35px; margin-bottom:20px;">
        <strong>Progress ${progress}%</strong><div style="background:#eee; height:14px; border-radius:7px; margin:10px 0; overflow:hidden;"><div style="background:var(--accent); height:100%; width:${progress}%"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.6; font-weight:700;"><span>TARGET £${target.toFixed(2)}</span><span>REMAINING £${(target - paid).toFixed(2)}</span></div>
        </div><div style="background:var(--danger); color:white; padding:25px; border-radius:30px; text-align:center; font-weight:900; font-size:20px;">ARREARS: £${arrears.toFixed(2)}</div>`;
};

window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container'); if(!list) return;
    bulk.innerHTML = `<button class="btn-wa" onclick="messageAll(${curWeek},'wa')">WA ALL W${curWeek}</button><button class="btn-sms" onclick="messageAll(${curWeek},'sms')">SMS ALL W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div>
            <div class="job-actions" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
                <button class="btn-job" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button>
                <button class="btn-job" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- SHARED CORE LOGIC --- */
window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field-fixed'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked);
};
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Details Secured!"); };
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
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
    if(!d || a <= 0) return alert("Details required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats();
};
window.handleClean = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    c.cleaned = !c.cleaned; saveData(); renderWeek();
    if(c.cleaned) {
        const msg = `Hi ${c.name} your windows at ${c.houseNum}, ${c.street}, were cleaned today. If you would like to make a bank transfer payment for £${n(c.price).toFixed(2)}, please use the bank details below.\n\nThank you for your business\nJonathan\n\n${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`;
        document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('modalButtons').innerHTML = `<button class="btn-wa" style="width:100%;margin-bottom:10px;height:60px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')">Send WhatsApp</button><button class="btn-sms" style="width:100%;margin-bottom:10px;height:60px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')">Send SMS</button><button onclick="closeMsgModal()" style="width:100%;height:50px;border-radius:15px;border:none;background:#8e8e93;color:white;font-weight:900;">Skip</button>`;
    }
};
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(c) { c.paidThisMonth = (n(c.paidThisMonth)>0)?0:c.price; saveData(); renderWeek(); renderStats(); } };
window.toggleDarkMode = () => { const d = document.body.classList.toggle('dark-mode'); localStorage.setItem('HP_Theme', d); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
window.exportToCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const b = new Blob([csv], { type: 'text/csv' }); const u = window.URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `HydroPro_${type}.csv`; a.click(); };
