const DB_KEY = 'HydroPro_V31_Master';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

// ⚙️ RELIABLE BOOTLOADER
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeCheckbox').checked = isDark;
    
    // Theme Slider Logic
    document.getElementById('themeCheckbox').addEventListener('change', (e) => {
        const dark = e.target.checked;
        document.body.classList.toggle('dark-mode', dark);
        localStorage.setItem('HP_Theme', dark);
        const logo = document.getElementById('mainLogo');
        logo.style.opacity = '0';
        setTimeout(() => {
            logo.src = dark ? 'Logo-Dark.png' : 'Logo.png';
            logo.style.opacity = '1';
        }, 200);
    });

    // Set Initial Logo
    document.getElementById('mainLogo').src = isDark ? 'Logo-Dark.png' : 'Logo.png';

    updateHeader();
    renderAll();
});

/* --- TABS --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- RENDERING --- */
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

window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong style="font-size:18px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- REBUILT LEDGER (v31.0) --- */
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container');
    if(!container) return; container.innerHTML = '';
    let totalSpend = 0;
    db.expenses.forEach(e => totalSpend += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${totalSpend.toFixed(2)}`;

    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.ondblclick = () => deleteExpense(e.id);
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Enter details");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger();
};

window.deleteExpense = (id) => { if(confirm("Delete expense?")) { db.expenses = db.expenses.filter(e => e.id !== id); saveData(); renderLedger(); } };

/* --- STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend;
    const progress = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;
    container.innerHTML = `<div class="stats-hero-surgical"><div>£${profit.toFixed(2)}</div><small>PROFIT IN POCKET</small></div><div class="stats-grid-surgical"><div class="stats-card-surgical"><small>INCOME</small><div style="color:var(--success);">£${paid.toFixed(2)}</div></div><div class="stats-card-surgical"><small>SPEND</small><div style="color:var(--danger);">£${spend.toFixed(2)}</div></div></div><div class="stats-progress-box"><strong>Progress ${progress}%</strong><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%"></div></div></div>${arrears>0?`<div class="stats-arrears-alert"><small>ARREARS DETECTED</small><br>£${arrears.toFixed(2)}</div>`:''}`;
};

/* --- WEEK LOGIC --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container');
    if(!list) return;
    bulk.innerHTML = `<button class="btn-wa" onclick="messageAll(${curWeek},'wa')">WA Message All W${curWeek}</button><button class="btn-sms" onclick="messageAll(${curWeek},'sms')">SMS Message All W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><strong style="font-size:18px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div class="job-actions"><button class="btn-job btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button><button class="btn-job" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button><button class="btn-job" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button></div>`;
        list.appendChild(div);
    });
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    if(n(c.paidThisMonth) > 0) { if(confirm("Reset payment?")) { c.paidThisMonth = 0; saveData(); renderWeek(); } return; }
    const amt = prompt(`Enter paid for ${c.name}:`, c.price);
    if(amt !== null) { c.paidThisMonth = n(amt); saveData(); renderWeek(); }
};

window.handleClean = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    c.cleaned = !c.cleaned; saveData(); renderWeek();
    if(c.cleaned) {
        const msg = `Hi ${c.name} your windows at ${c.houseNum}, ${c.street}, were cleaned today. Price: £${n(c.price).toFixed(2)}.\n\nBank: ${db.bank.name}\nSort: ${db.bank.sort}\nAcc: ${db.bank.acc}`;
        document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('modalButtons').innerHTML = `<button class="btn-wa" style="width:100%;margin-bottom:10px;" onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')">WhatsApp</button><button class="btn-sms" style="width:100%;margin-bottom:10px;" onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')">SMS</button><button onclick="closeMsgModal()" style="width:100%;">Skip</button>`;
    }
};

/* --- CORE UTILS --- */
window.openMap = (addr) => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank'); };
window.copyBankDetails = () => { const txt = `${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`; navigator.clipboard.writeText(txt).then(() => { alert("Copied!"); }); };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return; const id = document.getElementById('editId').value || Date.now().toString(); const idx = db.customers.findIndex(c => c.id === id); const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx>-1)?db.customers[idx].week:"1", cleaned: (idx>-1)?db.customers[idx].cleaned:false, paidThisMonth: (idx>-1)?db.customers[idx].paidThisMonth:0 }; if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry); saveData(); openTab('master-root'); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-field-fixed'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); };
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(confirm("Reset Month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HydroPro_${type}.csv`; a.click(); };
