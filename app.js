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
    } catch(e) { console.error("Restore Error", e); }
});

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => { renderMaster(); renderLedger(); renderStats(); renderWeek(); };

/* --- 📊 STATS (Restored Arrears & Bubbles) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let paid = 0, arrears = 0, totalSpend = 0;
    db.customers.forEach(c => { 
        paid += n(c.paidThisMonth); 
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); 
    });
    db.expenses.forEach(e => totalSpend += n(e.amt));
    const profit = paid - totalSpend;
    
    container.innerHTML = `
        <div class="stats-hero-card"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="stats-split-grid">
            <div class="stats-bubble" style="border-bottom: 5px solid var(--success);">
                <small>Income</small><strong>£${paid.toFixed(2)}</strong>
            </div>
            <div class="stats-bubble" style="border-bottom: 5px solid var(--danger);">
                <small>Spend</small><strong>£${totalSpend.toFixed(2)}</strong>
            </div>
        </div>
        ${arrears > 0 ? `<div class="arrears-banner"><small style="display:block; font-size:12px; opacity:0.8;">UNPAID DEBT</small>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 👥 MASTER LIST (Fixed Text Stack) --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'customer-pill';
            div.onclick = () => editCust(c.id);
            const isOwed = (c.cleaned && n(c.paidThisMonth) < n(c.price));
            let badge = isOwed ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `
                ${badge}
                <div class="pill-text-wrap">
                    <strong>${c.name}</strong>
                    <small>${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>
            `;
            container.appendChild(div);
        }
    });
};

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div>
            <div class="job-actions-grid" onclick="event.stopPropagation()">
                <button class="btn-job-mini" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button>
                <button class="btn-job-mini" style="background:#ffeb3b; color:#333" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button>
                <button class="btn-job-mini" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button>
                <button class="btn-job-mini" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- CORE FUNCTIONS --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return alert("Details Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value='';
};
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'expense-pill';
        div.innerHTML = `<div><strong>${e.cat||'📦'} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
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
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); } };
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "MORNING" : (hr < 18) ? "AFTERNOON" : "EVENING"; document.getElementById('greetText').innerText = `GOOD ${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.launchRoutePlanner = () => { const list = db.customers.filter(c => c.week == curWeek && c.day == workingDay && !c.cleaned); if(list.length === 0) return alert("Done!"); const baseUrl = "https://www.google.com/maps/dir/"; const stops = list.map(c => encodeURIComponent(`${c.houseNum} ${c.street} ${c.postcode}`)).join('/'); window.open(`${baseUrl}${stops}`, '_blank'); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
