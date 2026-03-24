const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.history) db.history = [];
        if (!db.bank) db.bank = { name: '', sort: '', acc: '' };
        
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        document.getElementById('themeCheckbox').checked = isDark;
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
        });

        if(document.getElementById('bName')) {
            document.getElementById('bName').value = db.bank.name || '';
            document.getElementById('bSort').value = db.bank.sort || '';
            document.getElementById('bAcc').value = db.bank.acc || '';
        }

        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🛡️ VAULT NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) { a.classList.add('active'); window.scrollTo(0,0); renderAll(); }
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            document.getElementById('w-icon').innerText = "🌤️";
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`;
        } catch (err) { }
    });
}

/* --- 👥 MASTER SEARCH LOCKED --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        const match = c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search) || (c.postcode||"").toLowerCase().includes(search);
        if(match) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px !important; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800; text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 📊 STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => { spend += n(e.amt); });
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;
    const net = coll - spend;

    container.innerHTML = `
        <div class="ST-HERO" style="background:var(--card); border:5px solid var(--accent); padding:45px; border-radius:50px; text-align:center; margin:0 25px 25px;">
            <small style="font-weight:900; opacity:0.4; letter-spacing:2px;">NET PROFIT</small>
            <div style="font-size:60px; font-weight:950; color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:0 25px; margin-bottom:25px;">
            <div style="background:var(--card); padding:30px; border-radius:45px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                <span style="font-size:30px;">💰</span><br><strong>£${coll.toFixed(2)}</strong>
            </div>
            <div style="background:var(--card); padding:30px; border-radius:45px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                <span style="font-size:30px;">💸</span><br><strong>£${spend.toFixed(2)}</strong>
            </div>
        </div>
        <div style="background:var(--card); margin:0 25px 100px; padding:30px; border-radius:45px;">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>ROUND PROGRESS</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:22px; border-radius:20px; overflow:hidden; margin:15px 0;">
                <div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%; transition:1s;"></div>
            </div>
        </div>`;
};

/* --- ☢️ LIBS --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.saveBank = () => { db.bank.name = document.getElementById('bName').value; db.bank.sort = document.getElementById('bSort').value; db.bank.acc = document.getElementById('bAcc').value; saveData(); alert("Bank details secured!"); };
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { updateHeader(); renderMaster(); if(document.getElementById('stats-root').classList.contains('active')) renderStats(); if(document.getElementById('week-view-root').classList.contains('active')) renderWeek(); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" }); saveData(); alert("Saved!"); location.reload(); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL DATA?")) { if(confirm("FINAL WARNING?")) { localStorage.removeItem(DB_KEY); location.reload(); } } };
window.completeCycle = () => { if(confirm("Clear Month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "Name,Phone,HouseNum,Street,Postcode,Price,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.price}","${(c.notes||'').replace(/"/g,'""')}"\n`; }); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_VAULT_${d}.csv`; l.click(); };
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN-LOCKED').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => { const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = ''; const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay); jobs.forEach(c => { const div = document.createElement('div'); div.style = "background:var(--card); padding:25px; border-radius:40px; margin:0 25px 15px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 8px 15px rgba(0,0,0,0.03);"; div.onclick = () => showJobBriefing(c.id); div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="font-weight:800; color:var(--accent); text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; font-size:20px;">£${n(c.price).toFixed(2)}</div>`; list.appendChild(div); }); };
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let htm = '<span style="font-size:11px; font-weight:950; opacity:0.4; text-transform:uppercase;">Last 3 Transactions (Paid = Red)</span><div style="background:rgba(255,69,58,0.08); padding:20px; border-radius:25px; margin:15px 0;">';
    if(history.length === 0) htm += '<p style="text-align:center; opacity:0.5; font-weight:800;">No history.</p>';
    else history.forEach(h => { htm += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800; color:var(--danger);"><span>${h.date}</span><span>£${n(h.amt).toFixed(2)}</span></div>`; });
    htm += '</div>';
    document.getElementById('briefingData').innerHTML = `<div style="font-size:36px; font-weight:950; color:var(--accent);">${c.name}</div><div style="margin:25px 0; display:flex; flex-direction:column; gap:10px;"><div style="background:var(--bg); padding:18px; border-radius:18px; font-weight:800;">🏠 ${c.houseNum} ${c.street} [${c.postcode||''}]</div><div style="background:var(--bg); padding:18px; border-radius:18px; font-weight:800; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div></div>`;
    document.getElementById('briefHistoryZone').innerHTML = htm;
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;
    document.getElementById('quickSettleContainer').innerHTML = currentOwed > 0 ? `<button style="width:100%; height:80px; background:var(--success); color:white; border:none; border-radius:22px; font-weight:900; font-size:20px; margin-bottom:15px;" onclick="quickSettle('${c.id}', ${currentOwed})">💰 SETTLE £${currentOwed} NOW</button>` : '';
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); openEditModal(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) }); saveData(); closeBriefing(); renderAll(); };
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.openEditModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price; document.getElementById('editModal').classList.remove('hidden'); };
window.updateCustomerFromModal = () => { const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id); if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); saveData(); closeEditModal(); renderMaster(); } };
