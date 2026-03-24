const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

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

/* --- 🛡️ VAULT NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) { a.classList.add('active'); window.scrollTo(0,0); renderAll(); }
};

/* --- 📊 STATS DASHBOARD (CLEANED & UNIQUE) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0, arrears = 0;
    let expHtml = '';

    // Arrears Calculation: Done but Unpaid
    db.customers.forEach(c => { 
        target += n(c.price); 
        coll += n(c.paidThisMonth); 
        if(c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            arrears += (n(c.price) - n(c.paidThisMonth));
        }
    });

    // Expenses List Logic
    db.expenses.forEach(e => { 
        spend += n(e.amt); 
        expHtml += `<div class="STATS-EXP-ROW"><span>${e.desc}</span><span style="color:var(--danger)">-£${n(e.amt).toFixed(2)}</span></div>`;
    });

    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO">
            <small style="font-weight:900; opacity:0.4; letter-spacing:2px;">NET PROFIT</small>
            <div style="color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div>
        </div>

        ${arrears > 0 ? `<div class="ST-ARREARS-VAULT"><small>Uncollected Arrears</small><div>£${arrears.toFixed(2)}</div></div>` : ''}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:0 25px; margin-bottom:25px;">
            <div style="background:var(--card); padding:30px; border-radius:45px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                <span style="font-size:30px;">💰</span><br><small style="font-weight:900; opacity:0.5;">INCOME</small><br><strong>£${coll.toFixed(2)}</strong>
            </div>
            <div style="background:var(--card); padding:30px; border-radius:45px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                <span style="font-size:30px;">💸</span><br><small style="font-weight:900; opacity:0.5;">SPENT</small><br><strong>£${spend.toFixed(2)}</strong>
            </div>
        </div>

        <div style="background:var(--card); margin:0 25px 25px; padding:30px; border-radius:45px;">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>MONTHLY PROGRESS</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:22px; border-radius:20px; overflow:hidden; margin:15px 0;">
                <div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%; transition:1s;"></div>
            </div>
        </div>

        <div class="STATS-EXPENSE-CARD">
            <h3 style="margin-top:0; opacity:0.5; font-size:14px; text-transform:uppercase;">Expense Breakdown</h3>
            ${expHtml || '<p style="text-align:center; opacity:0.5;">No expenses logged this month.</p>'}
            <div class="STATS-EXP-TOTAL"><span>TOTAL SPENT</span><span>£${spend.toFixed(2)}</span></div>
        </div>
    `;
};

/* --- ☢️ CORE FUNCTIONS --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); renderAll(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value='';
};
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { updateHeader(); renderMaster(); if(document.getElementById('stats-root').classList.contains('active')) renderStats(); renderLedger(); };
window.renderLedger = () => { const list = document.getElementById('ledger-list-container'); if(!list) return; list.innerHTML = ''; let t = 0; db.expenses.slice().reverse().forEach(e => { t += n(e.amt); const div = document.createElement('div'); div.style="background:var(--card); padding:25px; border-radius:35px; margin:0 25px 15px; display:flex; justify-content:space-between; border-left:8px solid var(--danger);"; div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:900; color:var(--danger);">-£${n(e.amt).toFixed(2)}</div>`; list.appendChild(div); }); document.getElementById('ledgerTotalDisplay').innerText = `£${t.toFixed(2)}`; };
window.renderMaster = () => { const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = ''; const search = (document.getElementById('mainSearch')?.value || "").toLowerCase(); db.customers.forEach(c => { const match = c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search); if(match) { const div = document.createElement('div'); div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px !important; box-shadow:0 8px 15px rgba(0,0,0,0.04);"; div.onclick = () => showJobBriefing(c.id); div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`; container.appendChild(div); } }); };
/* (Init logic preserved) */
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" }); saveData(); alert("Saved!"); location.reload(); };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
