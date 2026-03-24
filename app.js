const DB_KEY = 'HydroPro_Gold_V36';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
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
        updateHeader(); renderAll();
    } catch(e) { console.error("Critical System Error", e); }
});

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
};

/* --- 📊 STATS Restoration --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let paid = 0, arrears = 0, fuel = 0, gear = 0, misc = 0;
    db.customers.forEach(c => { 
        paid += n(c.paidThisMonth); 
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); 
    });
    db.expenses.forEach(e => {
        if((e.cat||"").includes('⛽')) fuel += n(e.amt);
        else if((e.cat||"").includes('🛠️')) gear += n(e.amt);
        else misc += n(e.amt);
    });
    const spend = fuel + gear + misc;
    const profit = paid - spend;
    
    container.innerHTML = `
        <div class="stats-hero-card"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="stats-split-grid">
            <div class="stats-box"><span>📈</span><small>INCOME</small><strong style="color:var(--success);">£${paid.toFixed(2)}</strong></div>
            <div class="stats-box"><span>📉</span><small>SPEND</small><strong style="color:var(--danger);">£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="stats-box" style="margin: 0 20px 20px; text-align:left;">
            <small>BREAKDOWN</small>
            <div style="font-size:14px; font-weight:700; margin-top:5px;">⛽ Fuel: £${fuel.toFixed(2)} | 🛠️ Gear: £${gear.toFixed(2)}</div>
        </div>
        ${arrears > 0 ? `<div class="arrears-banner"><small>UNPAID DEBT</small><br>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 💸 LEDGER Restoration --- */
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'expense-pill';
        div.ondblclick = () => { if(confirm("Delete?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
        div.innerHTML = `<div><strong>${e.cat||'📦'} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

/* --- WEEKLY WORK ENGINE --- */
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.onclick = () => showJobBriefing(c.id);
        let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
        div.innerHTML = `
            ${badge}
            <div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div>
            <div class="job-actions-grid" onclick="event.stopPropagation()">
                <button class="btn-job-mini btn-blue" onclick="window.open('tel:${c.phone}')">📱</button>
                <button class="btn-job-mini btn-yellow" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button>
                <button class="btn-job-mini btn-grey ${c.cleaned?'btn-active-success':''}" onclick="handleClean('${c.id}')">🧼</button>
                <button class="btn-job-mini btn-grey ${n(c.paidThisMonth)>0?'btn-active-accent':''}" onclick="markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- SYSTEM UTILS --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return alert("Enter Details");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats();
};
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const ex = db.customers.find(x=>x.id===id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: ex?ex.week:"1", cleaned: ex?ex.cleaned:false, paidThisMonth: ex?ex.paidThisMonth:0 };
    const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};
window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day || 'Mon'; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => { if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) { const div = document.createElement('div'); div.className = 'customer-pill'; div.onclick = () => editCust(c.id); let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : ""; div.innerHTML = `${badge}<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`; container.appendChild(div); } });
};
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); if(c.cleaned) { const msg = `Hi ${c.name}, windows cleaned. £${n(c.price).toFixed(2)}.`; document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden'); document.getElementById('modalButtons').innerHTML = `<button onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#25d366;color:white;height:55px;border-radius:15px;font-weight:900;">WhatsApp</button><button onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')" style="width:100%;background:#007aff;color:white;height:55px;border-radius:15px;font-weight:900;">SMS</button><button onclick="closeMsgModal()" style="width:100%;height:45px;border:none;border-radius:15px;background:#8e8e93;color:white;">Skip</button>`; } };
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "MORNING" : (hr < 18) ? "AFTERNOON" : "EVENING"; document.getElementById('greetText').innerText = `GOOD ${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(confirm("Clear status for new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
