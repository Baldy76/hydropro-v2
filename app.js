const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], bank: { name:'', acc:'' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1; let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.bank) db.bank = { name:'', acc:'' };
        
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        applyTheme(isDark);
        const cb = document.getElementById('themeCheckbox');
        if(cb) {
            cb.checked = isDark;
            cb.addEventListener('change', (e) => {
                applyTheme(e.target.checked);
                localStorage.setItem('HP_Theme', e.target.checked);
            });
        }
        
        if(document.getElementById('bName')) {
            document.getElementById('bName').value = db.bank.name || '';
            document.getElementById('bAcc').value = db.bank.acc || '';
        }

        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

/* --- 🛡️ FINANCES HUB --- */
window.renderFinances = () => {
    const dash = document.getElementById('finances-dashboard-container');
    const statement = document.getElementById('finances-statement-container');
    if(!dash || !statement) return;

    let coll = 0, spend = 0, arrears = 0;
    db.customers.forEach(c => {
        coll += n(c.paidThisMonth);
        if(c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));

    dash.innerHTML = `
        <div class="FIN-HERO"><small style="opacity:0.4; font-weight:900;">NET PROFIT</small><div>£${(coll - spend).toFixed(2)}</div></div>
        ${arrears > 0 ? `<div class="ST-ARREARS-VAULT"><small>UNCOLLECTED ARREARS</small><div>£${arrears.toFixed(2)}</div></div>` : ''}
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
            <div style="width:170px; background:var(--card); padding:20px; border-radius:30px; text-align:center;"><small>INCOME</small><br><strong>£${coll.toFixed(2)}</strong></div>
            <div style="width:170px; background:var(--card); padding:20px; border-radius:30px; text-align:center;"><small>SPENT</small><br><strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="VAULT-CARD"><h3 class="VAULT-HDR">Log Expense</h3><div class="VAULT-ROW"><input type="text" id="fExpDesc" placeholder="Fuel, Gear..."></div><div class="VAULT-ROW"><input type="number" id="fExpAmt" placeholder="£"></div><button class="VAULT-SAVE-BTN" onclick="addFinanceExpense()">ADD TRANSACTION</button></div>`;
    
    let htm = '<div class="VAULT-CARD"><h3 class="VAULT-HDR">Statement</h3>';
    db.expenses.slice().reverse().forEach(e => {
        htm += `<div class="VAULT-ROW" style="justify-content:space-between; height:55px !important; border-bottom:1px solid rgba(0,0,0,0.05);"><span>${e.desc}</span><span style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</span></div>`;
    });
    statement.innerHTML = htm + '</div>';
};

window.addFinanceExpense = () => {
    const d = document.getElementById('fExpDesc').value; const a = n(document.getElementById('fExpAmt').value);
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) });
    saveData(); renderFinances();
};

/* --- 👥 CUSTOMER SEARCH --- */
window.renderMaster = () => {
    const list = document.getElementById('master-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CUST-BLOCK';
            div.innerHTML = `<div><strong style="font-size:18px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success); font-size:20px;">£${n(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

/* --- 📅 WEEKS LOGIC --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN-LOCKED').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'CUST-BLOCK';
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="display:flex; gap:8px;"><button onclick="toggleClean('${c.id}')" style="background:#eee; border:none; padding:10px; border-radius:10px;">🧼</button><button onclick="settlePaid('${c.id}')" style="background:#eee; border:none; padding:10px; border-radius:10px;">£</button></div>`;
        list.appendChild(div);
    });
};
window.toggleClean = (id) => { const c = db.customers.find(x => x.id === id); c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.settlePaid = (id) => { const c = db.customers.find(x => x.id === id); const amt = prompt("Amount paid?", c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString() }); saveData(); renderWeek(); } };

/* --- ⚙️ ADMIN & CORE --- */
window.saveBank = () => { db.bank.name = document.getElementById('bName').value; db.bank.acc = document.getElementById('bAcc').value; saveData(); alert("Bank Secured! 🔒"); };
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    db.customers.push({ id: Date.now().toString(), name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, price: n(document.getElementById('cPrice').value), cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" });
    saveData(); alert("Saved!"); location.reload();
};
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.updateHeader = () => { if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { if(document.getElementById('finances-root').classList.contains('active')) renderFinances(); if(document.getElementById('master-root').classList.contains('active')) renderMaster(); };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Start new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
