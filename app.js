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
        updateLogo(isDark);

        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
            updateLogo(dark);
        });
        updateHeader(); renderAll();
    } catch(e) { console.error("Restore Error", e); }
});

function updateLogo(isDark) {
    const logoImg = document.getElementById('mainLogo');
    if(logoImg) logoImg.src = isDark ? 'Logo-Dark.png' : 'Logo.png';
}

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => { renderMaster(); renderLedger(); renderStats(); renderWeek(); };

/* --- 📊 STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let targetIncome = 0, paid = 0, arrears = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    db.customers.forEach(c => { 
        targetIncome += n(c.price);
        paid += n(c.paidThisMonth); 
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); 
    });
    db.expenses.forEach(e => {
        const cat = (e.cat||"").toLowerCase();
        if(cat.includes('fuel')) fuel += n(e.amt);
        else if(cat.includes('gear')) gear += n(e.amt);
        else if(cat.includes('food')) food += n(e.amt);
        else misc += n(e.amt);
    });
    const totalSpend = fuel + gear + food + misc;
    const profit = paid - totalSpend;
    const progressPercent = targetIncome > 0 ? Math.min(Math.round((paid / targetIncome) * 100), 100) : 0;
    
    container.innerHTML = `
        <div class="ST-HERO"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="ST-GRID">
            <div class="ST-BUBBLE" style="border-bottom: 5px solid var(--success);"><small>INCOME</small><strong>£${paid.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE" style="border-bottom: 5px solid var(--danger);"><small>SPEND</small><strong>£${totalSpend.toFixed(2)}</strong></div>
        </div>
        <div class="ST-PROG-CARD">
            <div class="ST-PROG-HEADER"><span>Monthly Target</span><span>${progressPercent}%</span></div>
            <div class="ST-PROG-TRACK"><div class="ST-PROG-FILL" style="width:${progressPercent}%"></div></div>
            <div class="ST-PROG-FOOTER"><span>GOAL: £${targetIncome.toFixed(0)}</span><span>REMAINING: £${Math.max(0, targetIncome - paid).toFixed(0)}</span></div>
        </div>
        <div class="ST-LIST-CARD">
            <div class="ST-ITEM"><span>⛽ Fuel</span><span>£${fuel.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🛠️ Gear</span><span>£${gear.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🍔 Food</span><span>£${food.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>📦 Misc</span><span>£${misc.toFixed(2)}</span></div>
            <div class="ST-TOTAL"><span>TOTAL SPEND</span><span>£${totalSpend.toFixed(2)}</span></div>
        </div>
        ${arrears > 0 ? `<div class="ST-ARREARS"><small style="display:block; font-size:12px; opacity:0.8;">UNPAID DEBT</small>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 👥 MASTER LIST --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'CT-PILL';
            div.onclick = () => editCust(c.id);
            const isOwed = (c.cleaned && n(c.paidThisMonth) < n(c.price));
            let badge = isOwed ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div class="CT-TEXT-STACK"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.DAY-BTN').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'JOB-CARD';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div class="CT-TEXT-STACK"><strong>${c.name} ${c.cleaned?'✅':''}</strong><small>${c.houseNum} ${c.street}</small></div>
            <div class="JOB-ACTIONS" onclick="event.stopPropagation()">
                <button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button>
                <button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button>
                <button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button>
                <button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- 📱 MODAL LOGIC --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let histHtml = history.length > 0 ? '' : '<p style="opacity:0.4; font-size:13px; font-weight:600;">No recent activity.</p>';
    history.forEach(h => { histHtml += `<div class="MD-HIST-ROW"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`; });
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;
    document.getElementById('briefingData').innerHTML = `<div style="font-size:28px; font-weight:900; color:var(--accent); margin-bottom:5px;">${c.name}</div><div class="MD-INFO-LIST"><div class="MD-INFO-ITEM"><span>🏠</span> ${c.houseNum} ${c.street}</div><div class="MD-INFO-ITEM"><span>📍</span> ${c.postcode || 'No Postcode'}</div><div class="MD-INFO-ITEM"><span>📱</span> ${c.phone || 'No Number'}</div><div class="MD-INFO-ITEM"><span>📅</span> Scheduled: ${c.day}s</div><div class="MD-INFO-ITEM" style="color:var(--success)"><span>💰</span> Rate: £${n(c.price).toFixed(2)}</div></div><div class="MD-HIST-WRAP"><span class="MD-HIST-TITLE">Last 3 Transactions</span>${histHtml}</div>${c.notes ? `<div style="font-size:13px; opacity:0.7; margin-bottom:20px; padding:0 10px;"><strong>Notes:</strong> ${c.notes}</div>` : ''}`;
    const settleBox = document.getElementById('quickSettleContainer'); settleBox.innerHTML = currentOwed > 0 ? `<button style="width:100%; height:70px; background:var(--success); color:white; border:none; border-radius:20px; font-weight:900; font-size:18px; margin-bottom:15px;" onclick="quickSettle('${c.id}', ${currentOwed})">💰 Settle £${currentOwed.toFixed(2)} Now</button>` : '';
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); editCust(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

/* --- CORE FUNCTIONS --- */
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: 'Debt-Settle' }); saveData(); closeBriefing(); renderWeek(); renderStats(); };
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
        const div = document.createElement('div'); div.className = 'LD-PILL';
        div.ondblclick = () => { if(confirm("Delete?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
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
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.launchRoutePlanner = () => { const list = db.customers.filter(c => c.week == curWeek && c.day == workingDay && !c.cleaned); if(list.length === 0) return alert("Done!"); const baseUrl = "https://www.google.com/maps/dir/"; const stops = list.map(c => encodeURIComponent(`${c.houseNum} ${c.street} ${c.postcode}`)).join('/'); window.open(`${baseUrl}${stops}`, '_blank'); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
