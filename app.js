const DB_KEY = 'HydroPro_V35_Master';
const V33_KEY = 'HydroPro_V33_Master';
const V31_KEY = 'HydroPro_V31_Master';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon'; // v35.0 State

// ⚙️ INITIALIZATION & DATA MIGRATION
document.addEventListener('DOMContentLoaded', () => {
    try {
        const v35 = localStorage.getItem(DB_KEY);
        const v33 = localStorage.getItem(V33_KEY);
        const v31 = localStorage.getItem(V31_KEY);
        
        if (v35) db = JSON.parse(v35);
        else if (v33) { db = JSON.parse(v33); migrateDays(); saveData(); }
        else if (v31) { db = JSON.parse(v31); migrateDays(); saveData(); }
        
        if (!db.history) db.history = [];

        // Theme Support
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        document.getElementById('themeCheckbox').checked = isDark;
        
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
            document.getElementById('mainLogo').src = dark ? 'Logo-Dark.png' : 'Logo.png';
        });

        document.getElementById('mainLogo').src = isDark ? 'Logo-Dark.png' : 'Logo.png';
        updateHeader();
        renderAll();
    } catch(e) { console.error("Boot Error:", e); }
});

// v35.0 Helper: Assign Monday to existing legacy customers
function migrateDays() {
    db.customers.forEach(c => { if(!c.day) c.day = 'Mon'; });
}

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

/* --- 🗺️ ROUTE PLANNER ENGINE (v35.0) --- */
window.setWorkingDay = (day, btn) => {
    workingDay = day;
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderWeek();
};

window.launchRoutePlanner = () => {
    const list = db.customers.filter(c => c.week == curWeek && c.day == workingDay && !c.cleaned);
    if(list.length === 0) return alert(`No uncleaned jobs for Week ${curWeek} - ${workingDay}`);
    
    // Construct multi-stop URL
    const baseUrl = "https://www.google.com/maps/dir/";
    const stops = list.map(c => encodeURIComponent(`${c.houseNum} ${c.street} ${c.postcode}`)).join('/');
    window.open(`${baseUrl}${stops}`, '_blank');
};

/* --- 👥 MASTER LIST --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'customer-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 📊 STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { 
        target += n(c.price); paid += n(c.paidThisMonth); 
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); 
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;
    
    container.innerHTML = `
        <div class="stats-hero"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="stats-split-grid">
            <div class="stats-card"><span>📈</span><small>INCOME</small><strong style="color:var(--success);">£${paid.toFixed(2)}</strong></div>
            <div class="stats-card"><span>📉</span><small>SPEND</small><strong style="color:var(--danger);">£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="stats-progress-card">
            <div style="display:flex;justify-content:space-between;font-weight:900;"><span>PROGRESS</span><span>${progress}%</span></div>
            <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        </div>
        ${arrears > 0 ? `<div class="arrears-banner"><small>ARREARS</small><br>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 🃏 JOB BRIEFING --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let histHtml = history.length > 0 ? '' : '<p style="opacity:0.3;">No history found.</p>';
    history.forEach(h => histHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; font-size:14px; border-bottom:1px solid rgba(0,0,0,0.05);"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`);

    document.getElementById('briefingData').innerHTML = `
        <div class="briefing-title">${c.name}</div><div class="briefing-addr">${c.houseNum} ${c.street}</div>
        <div style="font-size:14px; opacity:0.6; margin-bottom:20px;">📍 ${c.postcode} | 📱 ${c.phone} | 📅 ${c.day}s</div>
        <div class="briefing-item"><h4>Current Rate</h4><div style="font-size:22px; font-weight:900;">£${n(c.price).toFixed(2)}</div></div>
        <div class="briefing-item"><h4>Payment History</h4>${histHtml}</div>
        <div class="briefing-item"><h4>Notes</h4><div style="font-size:14px;">${c.notes || 'None.'}</div></div>
    `;
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); editCust(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container'); if(!list) return;
    bulk.innerHTML = `<button style="background:#25d366;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;margin-bottom:12px;" onclick="messageAll(${curWeek},'wa')">WhatsApp All W${curWeek}</button><button style="background:#007aff;color:white;height:65px;width:100%;border-radius:20px;border:none;font-weight:900;" onclick="messageAll(${curWeek},'sms')">SMS All W${curWeek}</button>`;
    list.innerHTML = '';
    // v35.0 Filtering by Week AND Day
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.onclick = () => showJobBriefing(c.id);
        let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge" style="top:15px; right:15px;">UNPAID 🚩</div>` : "";
        div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent);">${c.houseNum} ${c.street}</small></div><div class="job-actions" onclick="event.stopPropagation()"><button class="btn-job-control btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button><button class="btn-job-control" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button><button class="btn-job-control" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button></div>`;
        list.appendChild(div);
    });
};

/* --- SYSTEM LOGIC --- */
window.saveCustomer = () => { 
    const name = document.getElementById('cName').value; if(!name) return; 
    const id = document.getElementById('editId').value || Date.now().toString(); 
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (db.customers.find(x=>x.id===id)||{week:"1"}).week, cleaned: (db.customers.find(x=>x.id===id)||{cleaned:false}).cleaned, paidThisMonth: (db.customers.find(x=>x.id===id)||{paidThisMonth:0}).paidThisMonth }; 
    const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry); saveData(); openTab('master-root'); 
};
window.editCust = (id) => { 
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root'); 
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day || 'Mon'; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; 
};
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; if(n(c.paidThisMonth) > 0) { if(confirm(`Reset?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; } const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt !== null) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); } };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats(); };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-field'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); };
window.copyBankDetails = () => { navigator.clipboard.writeText(`${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`).then(() => alert("Copied!")); };
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); if(c.cleaned) { const msg = `Hi ${c.name} windows cleaned. £${n(c.price).toFixed(2)}.\n\nBank: ${db.bank.name} ${db.bank.sort} ${db.bank.acc}`; document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden'); document.getElementById('modalButtons').innerHTML = `<button onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#25d366;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">WhatsApp</button><button onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#007aff;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">SMS</button><button onclick="closeMsgModal()" style="width:100%;height:45px;border:none;border-radius:15px;background:#8e8e93;color:white;">Skip</button>`; } };
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.openMap = (addr) => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank'); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderLedger = () => { const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = ''; let total = 0; db.expenses.forEach(e => total += n(e.amt)); document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`; db.expenses.slice().reverse().forEach(e => { const div = document.createElement('div'); div.className = 'expense-pill'; div.ondblclick = () => { if(confirm("Delete?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } }; div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`; container.appendChild(div); }); };
window.completeCycle = () => { if(confirm("Reset month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HydroPro_${type}.csv`; a.click(); };
