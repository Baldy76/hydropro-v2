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
        
        // Dark Mode Logic
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        const cb = document.getElementById('themeCheckbox');
        if(cb) {
            cb.checked = isDark;
            cb.addEventListener('change', (e) => {
                document.body.classList.toggle('dark-mode', e.target.checked);
                localStorage.setItem('HP_Theme', e.target.checked);
            });
        }
        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🛡️ ENGINE ROOM --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    updateHeader();
    renderMaster();
    if(document.getElementById('stats-root').classList.contains('active')) renderStats();
    if(document.getElementById('ledger-root').classList.contains('active')) renderLedger();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
};

/* --- 👥 CUSTS --- */
window.renderMaster = () => {
    const list = document.getElementById('master-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px; border-radius:35px; margin:0 20px 15px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 5px 15px rgba(0,0,0,0.03);";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

/* --- 📊 STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => spend += n(e.amt));
    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO"><small style="opacity:0.4; font-weight:900;">NET PROFIT</small><div style="color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div></div>
        <div class="ST-GRID">
            <div class="ST-BUBBLE"><span style="font-size:24px;">💰</span><br><small>INCOME</small><br><strong>£${coll.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE"><span style="font-size:24px;">💸</span><br><small>SPENT</small><br><strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="VAULT-CARD">
            <div style="display:flex; justify-content:space-between; font-weight:950; font-size:14px; margin-bottom:10px;"><span>TARGET PROGRESS</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:20px; border-radius:10px; overflow:hidden;"><div style="width:${prog}%; height:100%; background:${prog>=100?'var(--success)':'var(--accent)'}; transition:1s;"></div></div>
        </div>
    `;
};

/* --- 💸 LEDGER --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Details required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) });
    saveData(); renderAll(); document.getElementById('expDesc').value = ''; document.getElementById('expAmt').value = '';
};
window.renderLedger = () => {
    const list = document.getElementById('ledger-list-container'); if(!list) return; list.innerHTML = ''; let t = 0;
    db.expenses.slice().reverse().forEach(e => {
        t += n(e.amt);
        const div = document.createElement('div');
        div.style = "background:var(--card); padding:20px; border-radius:30px; margin:0 20px 10px; display:flex; justify-content:space-between; border-left:8px solid var(--danger);";
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:900; color:var(--danger);">-£${n(e.amt).toFixed(2)}</div>`;
        list.appendChild(div);
    });
    document.getElementById('ledgerTotalDisplay').innerText = `£${t.toFixed(2)}`;
};

/* --- 📅 WEEKS --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN-LOCKED').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div');
        div.className = 'VAULT-CARD'; div.style = "display:flex; justify-content:space-between; align-items:center; margin:10px 20px;";
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900;">£${n(c.price).toFixed(2)}</div>`;
        list.appendChild(div);
    });
};

/* --- ⚙️ UTILS --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.saveCustomer = () => { 
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" });
    saveData(); alert("Saved!"); location.reload();
};
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Start new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
