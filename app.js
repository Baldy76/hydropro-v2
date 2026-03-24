const DB_KEY = 'HydroPro_V31_Master';
const OLD_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

document.addEventListener('DOMContentLoaded', () => {
    const oldData = localStorage.getItem(OLD_KEY);
    const newData = localStorage.getItem(DB_KEY);
    if (oldData && !newData) { db = JSON.parse(oldData); saveData(); } 
    else if (newData) { db = JSON.parse(newData); }

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeCheckbox').checked = isDark;
    
    document.getElementById('themeCheckbox').addEventListener('change', (e) => {
        const dark = e.target.checked;
        document.body.classList.toggle('dark-mode', dark);
        localStorage.setItem('HP_Theme', dark);
        const logo = document.getElementById('mainLogo');const DB_KEY = 'HydroPro_V33_Master';
const OLD_KEY = 'HydroPro_V31_Master';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

document.addEventListener('DOMContentLoaded', () => {
    const oldData = localStorage.getItem(OLD_KEY);
    const newData = localStorage.getItem(DB_KEY);
    if (oldData && !newData) { db = JSON.parse(oldData); if(!db.history) db.history = []; saveData(); } 
    else if (newData) { db = JSON.parse(newData); if(!db.history) db.history = []; }

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeCheckbox').checked = isDark;
    
    document.getElementById('themeCheckbox').addEventListener('change', (e) => {
        const dark = e.target.checked;
        document.body.classList.toggle('dark-mode', dark);
        localStorage.setItem('HP_Theme', dark);
        const logo = document.getElementById('mainLogo');
        logo.style.opacity = '0';
        setTimeout(() => { logo.src = dark ? 'Logo-Dark.png' : 'Logo.png'; logo.style.opacity = '1'; }, 200);
    });

    document.getElementById('mainLogo').src = isDark ? 'Logo-Dark.png' : 'Logo.png';
    updateHeader();
    renderAll();
});

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- 👥 MASTER LIST --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 🃏 JOB BRIEFING (v33.0 NEW) --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const modal = document.getElementById('briefingModal');
    const display = document.getElementById('briefingData');
    const editBtn = document.getElementById('briefEditBtn');
    
    // Scrape last 3 months history
    const history = (db.history || [])
        .filter(h => h.custId === id)
        .slice(-3)
        .reverse();

    let histHtml = history.length > 0 ? '' : '<p style="font-size:12px; opacity:0.5;">No payment history found yet.</p>';
    history.forEach(h => {
        histHtml += `<div class="brief-hist-row"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`;
    });

    // Check Arrears
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;

    display.innerHTML = `
        <div class="briefing-title">${c.name}</div>
        <div class="briefing-addr">${c.houseNum} ${c.street}, ${c.postcode}</div>
        
        <div class="briefing-section">
            <h4>Monthly Rate</h4>
            <div style="font-size:22px; font-weight:900;">£${n(c.price).toFixed(2)}</div>
        </div>

        ${currentOwed > 0 ? `
        <div class="briefing-section" style="border:2px solid var(--danger); background:rgba(255,69,58,0.05);">
            <h4>Current Month Unpaid</h4>
            <div class="brief-arrear" style="font-size:22px;">£${currentOwed.toFixed(2)}</div>
        </div>` : ''}

        <div class="briefing-section">
            <h4>Payment History (Last 3)</h4>
            ${histHtml}
        </div>

        <div class="briefing-section">
            <h4>Private Notes</h4>
            <div style="font-size:13px; line-height:1.4;">${c.notes || 'No notes.'}</div>
        </div>
    `;

    editBtn.onclick = () => { closeBriefing(); editCust(id); };
    modal.classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container'); if(!list) return;
    bulk.innerHTML = `
        <button style="background:#25d366;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;margin-bottom:12px;" onclick="messageAll(${curWeek},'wa')">WA Message All W${curWeek}</button>
        <button style="background:#007aff;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;" onclick="messageAll(${curWeek},'sms')">SMS Message All W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        // v33.0 Redirect click to Briefing
        div.onclick = () => showJobBriefing(c.id);
        let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge" style="top:15px; right:15px;">UNPAID 🚩</div>` : "";
        div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div class="job-actions" onclick="event.stopPropagation()">
            <button class="btn-job-heavy btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button>
            <button class="btn-job-heavy" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button>
            <button class="btn-job-heavy" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button>
        </div>`;
        list.appendChild(div);
    });
};

/* --- 💸 LEDGER & STATS --- */
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.ondblclick = () => { if(confirm("Delete expense?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
        div.innerHTML = `<div><strong style="font-size:17px;">${e.desc}</strong><br><small style="opacity:0.5;">${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:20px;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;
    container.innerHTML = `<div class="stats-hero-main"><div>£${profit.toFixed(2)}</div><small>PROFIT IN POCKET</small></div><div class="stats-grid-row"><div class="stats-card-heavy"><span>📈</span><small>MONTH INCOME</small><div class="stats-value-large" style="color:var(--success);">£${paid.toFixed(2)}</div></div><div class="stats-card-heavy"><span>📉</span><small>MONTH SPEND</small><div class="stats-value-large" style="color:var(--danger);">£${spend.toFixed(2)}</div></div></div><div class="stats-progress-box"><div style="display:flex;justify-content:space-between;font-weight:900;font-size:13px;"><span>PROGRESS</span><span>${progress}%</span></div><div class="progress-track"><div class="progress-fill-bar" style="width:${progress}%"></div></div><div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.5;font-weight:800;"><span>GOAL £${target.toFixed(2)}</span><span>REMAINING £${(target - paid).toFixed(2)}</span></div></div>${arrears > 0 ? `<div class="stats-arrears-banner"><small style="display:block;font-size:11px;opacity:0.8;">ARREARS DETECTED</small>£${arrears.toFixed(2)}</div>` : ''}`;
};

/* --- 🛠️ RECORDING ENGINE --- */
window.markAsPaid = (id) => { 
    const c = db.customers.find(x => x.id === id); if(!c) return; 
    if(n(c.paidThisMonth) > 0) { if(confirm(`Reset payment?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; } 
    const amt = prompt(`Enter Amount Paid for ${c.name}:`, c.price); 
    if(amt !== null) { 
        const val = n(amt);
        c.paidThisMonth = val; 
        // Log to history
        db.history.push({
            custId: id,
            amt: val,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        });
        saveData(); renderWeek(); renderStats(); 
    } 
};

window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return alert("Enter Details"); db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats(); };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Name Required"); const id = document.getElementById('editId').value || Date.now().toString(); const ex = db.customers.find(x=>x.id===id); const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: ex?ex.week:"1", cleaned: ex?ex.cleaned:false, paidThisMonth: ex?ex.paidThisMonth:0 }; const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry); saveData(); openTab('master-root'); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-input'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Secured"); };
window.copyBankDetails = () => { navigator.clipboard.writeText(`${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`).then(() => alert("Copied!")); };
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); if(c.cleaned) { const msg = `Hi ${c.name} windows cleaned today. £${n(c.price).toFixed(2)}.\n\nBank: ${db.bank.name} ${db.bank.sort} ${db.bank.acc}`; document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden'); document.getElementById('modalButtons').innerHTML = `<button onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#25d366;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">WhatsApp</button><button onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#007aff;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">SMS</button><button onclick="closeMsgModal()" style="width:100%;height:45px;border:none;border-radius:15px;background:#8e8e93;color:white;">Skip</button>`; } };
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.openMap = (addr) => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank'); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(confirm("Reset month? Statuses will clear and Ledger will wipe.")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HydroPro_${type}.csv`; a.click(); };
        logo.style.opacity = '0';
        setTimeout(() => { logo.src = dark ? 'Logo-Dark.png' : 'Logo.png'; logo.style.opacity = '1'; }, 200);
    });

    document.getElementById('mainLogo').src = isDark ? 'Logo-Dark.png' : 'Logo.png';
    updateHeader();
    renderAll();
});

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- 👥 MASTER LIST --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 💸 LEDGER (v32.3) --- */
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.ondblclick = () => { if(confirm("Delete expense?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
        div.innerHTML = `<div><strong style="font-size:17px;">${e.desc}</strong><br><small style="opacity:0.5;">${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:20px;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Enter Details");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats();
};

/* --- 📊 STATS (v32.2 Icons) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;
    container.innerHTML = `
        <div class="stats-hero-main"><div>£${profit.toFixed(2)}</div><small>PROFIT IN POCKET</small></div>
        <div class="stats-grid-row">
            <div class="stats-card-heavy"><span>📈</span><small>MONTH INCOME</small><div class="stats-value-large" style="color:var(--success);">£${paid.toFixed(2)}</div></div>
            <div class="stats-card-heavy"><span>📉</span><small>MONTH SPEND</small><div class="stats-value-large" style="color:var(--danger);">£${spend.toFixed(2)}</div></div>
        </div>
        <div class="stats-progress-box">
            <div style="display:flex;justify-content:space-between;font-weight:900;font-size:13px;"><span>PROGRESS</span><span>${progress}%</span></div>
            <div class="progress-track"><div class="progress-fill-bar" style="width:${progress}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.5;font-weight:800;"><span>GOAL £${target.toFixed(2)}</span><span>REMAINING £${(target - paid).toFixed(2)}</span></div>
        </div>
        ${arrears > 0 ? `<div class="stats-arrears-banner"><small style="display:block;font-size:11px;opacity:0.8;">ARREARS DETECTED</small>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container'); if(!list) return;
    bulk.innerHTML = `
        <button style="background:#25d366;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;margin-bottom:12px;" onclick="messageAll(${curWeek},'wa')">WA Message All W${curWeek}</button>
        <button style="background:#007aff;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;" onclick="messageAll(${curWeek},'sms')">SMS Message All W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge" style="top:15px; right:15px;">UNPAID 🚩</div>` : "";
        div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div class="job-actions"><button class="btn-job-heavy btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button><button class="btn-job-heavy" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button><button class="btn-job-heavy" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button></div>`;
        list.appendChild(div);
    });
};
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; if(n(c.paidThisMonth) > 0) { if(confirm(`Reset payment?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; } const amt = prompt(`Enter Amount Paid for ${c.name}:`, c.price); if(amt !== null) { c.paidThisMonth = n(amt); saveData(); renderWeek(); renderStats(); } };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Name Required"); const id = document.getElementById('editId').value || Date.now().toString(); const ex = db.customers.find(x=>x.id===id); const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: ex?ex.week:"1", cleaned: ex?ex.cleaned:false, paidThisMonth: ex?ex.paidThisMonth:0 }; const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry); saveData(); openTab('master-root'); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-input'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Secured"); };
window.copyBankDetails = () => { navigator.clipboard.writeText(`${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`).then(() => alert("Copied!")); };
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); if(c.cleaned) { const msg = `Hi ${c.name} windows cleaned. £${n(c.price).toFixed(2)}.\n\nBank: ${db.bank.name} ${db.bank.sort} ${db.bank.acc}`; document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden'); document.getElementById('modalButtons').innerHTML = `<button onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#25d366;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">WhatsApp</button><button onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#007aff;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">SMS</button><button onclick="closeMsgModal()" style="width:100%;height:45px;border:none;border-radius:15px;background:#8e8e93;color:white;">Skip</button>`; } };
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.openMap = (addr) => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank'); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(confirm("Reset month? Statuses will clear and Ledger will wipe.")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HydroPro_${type}.csv`; a.click(); };
