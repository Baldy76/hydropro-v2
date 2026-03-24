const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.history) db.history = [];
        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 📊 STATS DASHBOARD (RESTORED & BLEED-PROOF) --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0, arrears = 0;
    let expHtml = '';

    db.customers.forEach(c => { 
        target += n(c.price); 
        coll += n(c.paidThisMonth); 
        if(c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            arrears += (n(c.price) - n(c.paidThisMonth));
        }
    });

    db.expenses.forEach(e => { 
        spend += n(e.amt); 
        expHtml += `<div class="STATS-EXP-ROW"><span>${e.desc}</span><span style="color:var(--danger)">-£${n(e.amt).toFixed(2)}</span></div>`;
    });

    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO"><small style="font-weight:900; opacity:0.4;">NET PROFIT</small><div style="color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div></div>
        ${arrears > 0 ? `<div class="ST-ARREARS-VAULT"><small>Total Arrears</small><div>£${arrears.toFixed(2)}</div></div>` : ''}
        <div style="text-align:center; margin-bottom:25px;">
            <div style="display:inline-block; width:170px; background:var(--card); padding:20px; border-radius:30px; margin-right:10px;">
                <small style="opacity:0.5;">INCOME</small><br><strong>£${coll.toFixed(2)}</strong>
            </div>
            <div style="display:inline-block; width:170px; background:var(--card); padding:20px; border-radius:30px;">
                <small style="opacity:0.5;">SPENT</small><br><strong>£${spend.toFixed(2)}</strong>
            </div>
        </div>
        <div style="background:var(--card); margin:25px; padding:30px; border-radius:40px;">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>PROGRESS</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:20px; border-radius:10px; overflow:hidden; margin-top:10px;">
                <div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%;"></div>
            </div>
        </div>
        <div class="STATS-EXPENSE-CARD">
            <h3 style="margin-top:0; opacity:0.5; font-size:14px; text-transform:uppercase;">Monthly Expenses</h3>
            ${expHtml || '<p style="text-align:center; opacity:0.5;">No expenses.</p>'}
            <div style="display:flex; justify-content:space-between; padding-top:20px; font-weight:950; color:var(--danger); border-top:1px solid #eee;"><span>TOTAL</span><span>£${spend.toFixed(2)}</span></div>
        </div>
    `;
};

/* --- CORE NAV --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => { if(document.getElementById('stats-root').classList.contains('active')) renderStats(); updateHeader(); };
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, price: n(document.getElementById('cPrice').value), cleaned: false, paidThisMonth: 0 }); saveData(); alert("Saved!"); location.reload(); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL DATA?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
