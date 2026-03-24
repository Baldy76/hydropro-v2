const DB_KEY = 'HydroPro_Gold_V36';
const LEGACY_KEYS = ['HydroPro_V35_Master', 'HydroPro_V33_Master', 'HydroPro_V31_Master'];
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon';

// ⚙️ FLAWLESS INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    try {
        const currentData = localStorage.getItem(DB_KEY);
        if (currentData) {
            db = JSON.parse(currentData);
        } else {
            // Migration Robot: Scans all previous version keys
            for (let key of LEGACY_KEYS) {
                const old = localStorage.getItem(key);
                if (old) {
                    db = JSON.parse(old);
                    migrateMissingFields();
                    saveData();
                    break;
                }
            }
        }

        if (!db.history) db.history = [];
        migrateMissingFields(); // Final safety sweep

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

function migrateMissingFields() {
    db.customers.forEach(c => {
        if (!c.day) c.day = 'Mon';
        if (c.paidThisMonth === undefined) c.paidThisMonth = 0;
    });
}

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

/* --- NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
};

/* --- 🗺️ ROUTE PLANNER (PRO) --- */
window.setWorkingDay = (day, btn) => {
    workingDay = day;
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); renderWeek();
};

window.launchRoutePlanner = () => {
    const list = db.customers.filter(c => c.week == curWeek && c.day == workingDay && !c.cleaned);
    if(list.length === 0) return alert("No uncleaned jobs for this selection.");
    
    // Check for valid addresses
    const valid = list.filter(c => c.houseNum && c.street);
    if(valid.length === 0) return alert("No valid addresses found to map.");

    const baseUrl = "https://www.google.com/maps/dir/";
    const stops = valid.map(c => encodeURIComponent(`${c.houseNum} ${c.street} ${c.postcode}`)).join('/');
    window.open(`${baseUrl}${stops}`, '_blank');
};

/* --- 📊 STATS (ACCURATE MATH) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let paid = 0, arrears = 0, fuel = 0, gear = 0, misc = 0;

    db.customers.forEach(c => { 
        paid += n(c.paidThisMonth); 
        // Arrears = Owed from misses + Owed from cleaned but not paid
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            arrears += (n(c.price) - n(c.paidThisMonth));
        }
    });

    db.expenses.forEach(e => {
        if((e.cat||"").includes('⛽')) fuel += n(e.amt);
        else if((e.cat||"").includes('🛠️')) gear += n(e.amt);
        else misc += n(e.amt);
    });

    const totalSpend = fuel + gear + misc;
    const profit = paid - totalSpend;
    
    container.innerHTML = `
        <div class="stats-hero"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="stats-split-grid">
            <div class="stats-card"><span>📈</span><small>INCOME</small><strong style="color:var(--success);">£${paid.toFixed(2)}</strong></div>
            <div class="stats-card"><span>📉</span><small>SPEND</small><strong style="color:var(--danger);">£${totalSpend.toFixed(2)}</strong></div>
        </div>
        <div class="stats-card" style="margin: 0 20px 20px; text-align:left;">
            <small>SPEND BREAKDOWN</small>
            <div style="font-size:14px; font-weight:700; margin-top:10px;">⛽ Fuel: £${fuel.toFixed(2)}</div>
            <div style="font-size:14px; font-weight:700;">🛠️ Gear: £${gear.toFixed(2)}</div>
            <div style="font-size:14px; font-weight:700;">📦 Misc: £${misc.toFixed(2)}</div>
        </div>
        ${arrears > 0 ? `<div class="arrears-banner"><small>UNPAID DEBT</small><br>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 🃏 BRIEFING & SETTLE --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;

    let histHtml = history.length > 0 ? '' : '<p style="opacity:0.3; font-size:12px;">No payment history.</p>';
    history.forEach(h => histHtml += `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-bottom:1px solid rgba(0,0,0,0.05);"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`);

    document.getElementById('briefingData').innerHTML = `
        <div style="font-size:26px; font-weight:900; color:var(--accent);">${c.name}</div>
        <div style="font-size:16px; font-weight:700; opacity:0.8;">${c.houseNum} ${c.street}</div>
        <div style="font-size:14px; opacity:0.5; margin-bottom:20px;">📍 ${c.postcode} | 📱 ${c.phone} | 📅 ${c.day}s</div>
        <div style="background:var(--bg); padding:15px; border-radius:15px;">
            <small style="text-transform:uppercase; font-size:10px; opacity:0.5;">History</small>${histHtml}
        </div>
    `;

    const settleBox = document.getElementById('quickSettleContainer');
    settleBox.innerHTML = currentOwed > 0 ? `<button class="btn-settle-arrears" onclick="quickSettle('${c.id}', ${currentOwed})">💰 Settle £${currentOwed.toFixed(2)} Now</button>` : '';

    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); editCust(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.quickSettle = (id, amt) => {
    const c = db.customers.find(x => x.id === id);
    c.paidThisMonth = n(c.price);
    db.history.push({ custId: id, amt: n(amt), date: 'Debt-Settle' });
    saveData(); closeBriefing(); renderWeek(); renderStats();
};

/* --- 📅 WEEKLY WORK RENDER --- */
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

/* --- SHARED CORE FUNCTIONS --- */
window.handleClean = (id) => { 
    const c = db.customers.find(x => x.id === id); if(!c) return; 
    c.cleaned = !c.cleaned; saveData(); renderWeek(); 
    if(c.cleaned) {
        const msg = `Hi ${c.name}, windows cleaned. £${n(c.price).toFixed(2)}. Bank: ${db.bank.name} ${db.bank.sort} ${db.bank.acc}`;
        document.getElementById('msgPreview').innerText = msg;
        document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('modalButtons').innerHTML = `<button onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#25d366;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">WhatsApp</button><button onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')" style="width:100%;margin-bottom:10px;background:#007aff;color:white;height:55px;border:none;border-radius:15px;font-weight:900;">SMS</button><button onclick="closeMsgModal()" style="width:100%;height:45px;border:none;border-radius:15px;background:#8e8e93;color:white;">Skip</button>`;
    }
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    if(n(c.paidThisMonth) > 0) { if(confirm(`Reset?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; }
    const amt = prompt(`Enter Paid for ${c.name}:`, c.price);
    if(amt) {
        c.paidThisMonth = n(amt);
        db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
        saveData(); renderWeek(); renderStats();
    }
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return;
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats();
};

window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'expense-pill';
        div.innerHTML = `<div><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'customer-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (db.customers.find(x=>x.id===id)||{week:"1"}).week, cleaned: (db.customers.find(x=>x.id===id)||{cleaned:false}).cleaned, paidThisMonth: (db.customers.find(x=>x.id===id)||{paidThisMonth:0}).paidThisMonth };
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day || 'Mon'; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(confirm("Clear status for new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HydroPro_${type}.csv`; a.click(); };
