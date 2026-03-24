const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.history) db.history = [];
        
        // Restore Theme
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

/* --- 🛡️ NAVIGATION --- */
window.openTab = (id) => {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) { 
        a.classList.add('active'); 
        window.scrollTo(0,0); 
        renderAll(); 
    }
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            document.getElementById('w-icon').innerText = "🌤️";
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`;
        } catch (err) { document.getElementById('w-text').innerText = "OFFLINE"; }
    });
}

/* --- 📊 RENDERERS --- */
window.updateHeader = () => {
    const el = document.getElementById('dateText');
    if(el) {
        el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    }
};

window.renderAll = () => {
    updateHeader();
    renderMaster();
    if(document.getElementById('stats-root').classList.contains('active')) renderStats();
    if(document.getElementById('ledger-root').classList.contains('active')) renderLedger();
};

/* --- 👥 MASTER SEARCH --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        const match = c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search);
        if(match) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800; text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* (Standard stats, save, cycle, and nuclear logic preserved but verified) */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => { spend += n(e.amt); });
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;
    const net = coll - spend;
    container.innerHTML = `<div class="ST-HERO"><small style="font-weight:900; opacity:0.4;">NET PROFIT</small><div style="font-size:60px; font-weight:950; color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div></div><div class="ST-GRID"><div class="ST-BUBBLE"><span>💰</span><small>Income</small><strong>£${coll.toFixed(2)}</strong></div><div class="ST-BUBBLE"><span>💸</span><small>Spent</small><strong>£${spend.toFixed(2)}</strong></div></div><div class="ST-PROG-PLATE"><div style="display:flex; justify-content:space-between; font-weight:900; font-size:14px;"><span>ROUND PROGRESS</span><span>${prog}%</span></div><div style="background:var(--ios-grey); height:22px; border-radius:20px; overflow:hidden; margin:15px 0;"><div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%; transition:1s;"></div></div><div style="display:flex; justify-content:space-between; font-size:12px; font-weight:900; opacity:0.4;"><span>COLLECTED: £${coll}</span><span>GOAL: £${target}</span></div></div>`;
};

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" }); saveData(); alert("Saved!"); location.reload(); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL DATA?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Clear Month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "Name,Phone,HouseNum,Street,Postcode,Price,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.price}","${c.notes}"\n`; }); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_FORTRESS_${d}.csv`; l.click(); };
window.openEditModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price; document.getElementById('editModal').classList.remove('hidden'); };
window.updateCustomerFromModal = () => { const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id); if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); saveData(); closeEditModal(); renderMaster(); } };
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.renderWeek = () => { const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = ''; const jobs = db.customers.filter(c => c.week == curWeek); jobs.forEach(c => { const div = document.createElement('div'); div.style = "background:var(--card); padding:30px; border-radius:40px; margin:0 25px 20px; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;"; div.onclick = () => showJobBriefing(c.id); div.innerHTML = `<div style="text-align:left;"><strong style="font-size:22px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:900;">${c.houseNum} ${c.street}</small></div>`; list.appendChild(div); }); };
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
