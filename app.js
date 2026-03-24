const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
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
        });
        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🛡️ VAULT PAGE ENGINE --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(id);
    if(activeTab) {
        activeTab.classList.add('active');
        window.scrollTo(0,0);
        renderAll();
    }
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    const options = { enableHighAccuracy: true, timeout: 10000 };
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            document.getElementById('w-icon').innerText = "🌤️";
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`;
        } catch (err) { }
    }, (err) => { }, options);
}

/* --- 📊 STATS DASHBOARD --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => {
        const cat = (e.cat||"").toLowerCase();
        if(cat.includes('fuel')) fuel += n(e.amt);
        else if(cat.includes('gear')) gear += n(e.amt);
        else if(cat.includes('food')) food += n(e.amt);
        else misc += n(e.amt);
    });
    const spend = fuel + gear + food + misc;
    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO">
            <small style="font-weight:900; opacity:0.4;">NET PROFIT</small>
            <div style="font-size:60px; font-weight:950; color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div>
        </div>
        <div class="ST-GRID">
            <div class="ST-BUBBLE"><span style="font-size:30px;">💰</span><small>Income</small><strong>£${coll.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE"><span style="font-size:30px;">💸</span><small>Spent</small><strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="ST-PROG-PLATE">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>MONTHLY TARGET</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:25px; border-radius:20px; overflow:hidden; margin:15px 0;">
                <div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%; transition:1s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:900; opacity:0.4;">
                <span>COLLECTED: £${coll}</span><span>GOAL: £${target}</span>
            </div>
        </div>
    `;
};

/* --- 📅 WEEKLY WORK & BRIEFING --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay);
    jobs.forEach(c => {
        const div = document.createElement('div');
        div.style = "background:var(--card); padding:30px; border-radius:40px; margin:0 25px 20px; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div style="text-align:left;"><strong style="font-size:22px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:900;">${c.houseNum} ${c.street}</small></div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-top:20px;">
                <button style="height:60px; border-radius:15px; border:none; background:var(--accent); color:white; font-size:22px;" onclick="event.stopPropagation(); window.open('tel:${c.phone}')">📱</button>
                <button style="height:60px; border-radius:15px; border:none; background:#ffeb3b; font-size:22px;" onclick="event.stopPropagation(); window.open('http://maps.apple.com/?q=${encodeURIComponent(c.houseNum+' '+c.street)}')">📍</button>
                <button style="height:60px; border-radius:15px; border:none; background:${c.cleaned?'var(--success)':'#aaa'}; font-size:22px;" onclick="event.stopPropagation(); handleClean('${c.id}')">🧼</button>
                <button style="height:60px; border-radius:15px; border:none; background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}; font-size:22px;" onclick="event.stopPropagation(); markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let htm = ''; history.forEach(h => { htm += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800; font-size:16px;"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`; });
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;
    
    document.getElementById('briefingData').innerHTML = `
        <div style="font-size:36px; font-weight:950; color:var(--accent);">${c.name}</div>
        <div style="margin:25px 0; display:flex; flex-direction:column; gap:12px;">
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800;">🏠 ${c.houseNum} ${c.street}</div>
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div>
        </div>
        <div style="background:rgba(0,122,255,0.05); padding:20px; border-radius:25px; margin-bottom:20px;">
            <small style="text-transform:uppercase; font-weight:950; opacity:0.4; font-size:11px;">Recent Payments</small>
            <div style="margin-top:10px;">${htm || '<p>No history</p>'}</div>
        </div>`;
    
    document.getElementById('quickSettleContainer').innerHTML = currentOwed > 0 ? `<button style="width:100%; height:80px; background:var(--success); color:white; border:none; border-radius:22px; font-weight:900; font-size:20px; margin-bottom:15px;" onclick="quickSettle('${c.id}', ${currentOwed})">💰 SETTLE £${currentOwed} NOW</button>` : '';
    document.getElementById('receiptActionBox').innerHTML = n(c.paidThisMonth) > 0 ? `<button style="width:100%; height:75px; background:#5856d6; color:white; border:none; border-radius:20px; font-weight:900; font-size:18px; margin-bottom:15px;" onclick="sendSmsReceipt('${c.id}')">💬 TEXT RECEIPT</button>` : '';
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); openEditModal(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

/* --- 👥 MASTER & EDIT --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800; text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.openEditModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price; document.getElementById('eNotes').value = c.notes || '';
    document.getElementById('editModal').classList.remove('hidden');
};

window.updateCustomerFromModal = () => {
    const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); db.customers[idx].notes = document.getElementById('eNotes').value; saveData(); closeEditModal(); renderMaster(); }
};

/* --- ☢️ CORE LIBS --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) }); saveData(); closeBriefing(); renderWeek(); renderStats(); };
window.sendSmsReceipt = (id) => { const c = db.customers.find(x => x.id === id); const msg = encodeURIComponent(`Hi ${c.name}, thanks for your payment of £${n(c.price).toFixed(2)} to Hydro Pro. Sparkling windows confirmed! 🧼`); window.location.href = `sms:${c.phone}?&body=${msg}`; };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value; if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.renderLedger = () => { const list = document.getElementById('ledger-list-container'); if(!list) return; list.innerHTML = ''; let total = 0; db.expenses.slice().reverse().forEach(e => { total += n(e.amt); const div = document.createElement('div'); div.style="background:var(--card); padding:30px; border-radius:40px; display:flex; justify-content:space-between; margin:0 25px 20px; border-left:10px solid var(--danger); flex-shrink:0;"; div.innerHTML = `<div style="text-align:left;"><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:22px;">-£${n(e.amt).toFixed(2)}</div>`; list.appendChild(div); }); document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`; };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: "1", price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0 }); saveData(); alert("Saved!"); location.reload(); };
window.renderAll = () => { renderMaster(); renderStats(); renderLedger(); updateHeader(); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Clear Month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "Name,Phone,HouseNum,Street,Postcode,Day,Price,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.day}","${c.price}","${c.notes}"\n`; }); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_FORTRESS_${d}.csv`; l.click(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); const amt = prompt(`Paid:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); renderLedger(); } };
