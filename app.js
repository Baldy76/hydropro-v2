const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], bank: { name:'', sort:'', acc:'' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        
        // Theme Slider Init
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

        // Fill Admin Fields
        if(document.getElementById('bName')) {
            document.getElementById('bName').value = db.bank.name || '';
            document.getElementById('bSort').value = db.bank.sort || '';
            document.getElementById('bAcc').value = db.bank.acc || '';
        }

        renderAll(); updateHeader(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 💰 FINANCES ENGINE (MERGED STATS & LEDGER) --- */
window.renderFinances = () => {
    const dash = document.getElementById('finances-dashboard-container');
    const statement = document.getElementById('finances-statement-container');
    if(!dash || !statement) return;

    let target = 0, coll = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => { spend += n(e.amt); });
    const net = coll - spend;

    dash.innerHTML = `
        <div class="FIN-HERO">
            <small style="opacity:0.4; font-weight:900; letter-spacing:1px;">MONTHLY NET PROFIT</small>
            <div style="color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div>
        </div>
        <div class="FIN-GRID">
            <div class="FIN-BUBBLE"><span>💰</span><small>INCOME</small><strong>£${coll.toFixed(2)}</strong></div>
            <div class="FIN-BUBBLE"><span>💸</span><small>OUTGOINGS</small><strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="VAULT-CARD" style="margin-bottom:25px;">
            <h3 class="VAULT-HDR">Log Expense</h3>
            <div class="VAULT-ROW"><input type="text" id="fExpDesc" placeholder="e.g. Fuel, Gear"></div>
            <div class="VAULT-ROW"><input type="number" id="fExpAmt" placeholder="£ 0.00"></div>
            <button class="VAULT-SAVE-BTN" onclick="addFinanceExpense()">ADD TRANSACTION</button>
        </div>
    `;

    let listHtml = '<div class="FIN-STATEMENT-CARD"><h3 class="VAULT-HDR">Transaction Statement</h3>';
    if(db.expenses.length === 0) {
        listHtml += '<p style="text-align:center; opacity:0.5; font-weight:800;">No transactions yet.</p>';
    } else {
        db.expenses.slice().reverse().forEach(e => {
            listHtml += `<div class="FIN-ROW"><span>${e.date} - ${e.desc}</span><span style="color:var(--danger)">-£${n(e.amt).toFixed(2)}</span></div>`;
        });
    }
    listHtml += `<div style="display:flex; justify-content:space-between; padding-top:20px; font-weight:950; font-size:20px; color:var(--danger); border-top:3px solid var(--ios-grey); margin-top:10px;"><span>TOTAL SPEND</span><span>£${spend.toFixed(2)}</span></div></div>`;
    statement.innerHTML = listHtml;
};

window.addFinanceExpense = () => {
    const d = document.getElementById('fExpDesc').value;
    const a = n(document.getElementById('fExpAmt').value);
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) });
    saveData(); renderFinances();
};

/* --- 🛡️ ADMIN TOOLS --- */
window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.sort = document.getElementById('bSort').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData(); alert("Bank details bolted! 🔒");
};

window.exportToQuickBooks = () => {
    const d = new Date().toLocaleDateString().replace(/\//g, '-');
    let csv = "Date,Description,Amount,Type\n";
    // Add Income
    db.customers.forEach(c => { if(n(c.paidThisMonth) > 0) csv += `${new Date().toLocaleDateString()},Payment from ${c.name},${n(c.paidThisMonth)},Income\n`; });
    // Add Expenses
    db.expenses.forEach(e => { csv += `${e.date},${e.desc},${n(e.amt)},Expense\n`; });
    const b = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(b);
    const l = document.createElement("a"); l.href = u; l.download = `QuickBooks_Export_${d}.csv`; l.click();
};

/* --- SHARED NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    const el = document.getElementById('dateText');
    if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
};

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.saveCustomer = () => { 
    const name = document.getElementById('cName').value; if(!name) return alert("Required");
    db.customers.push({ id: Date.now().toString(), name, phone: '', houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, price: n(document.getElementById('cPrice').value), cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" });
    saveData(); alert("Saved!"); location.reload();
};
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Start new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
