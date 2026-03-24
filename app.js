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
        
        // Theme Slider Logic
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

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderFinances = () => {
    const dash = document.getElementById('finances-dashboard-container');
    const statement = document.getElementById('finances-statement-container');
    if(!dash || !statement) return;

    let target = 0, coll = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => { spend += n(e.amt); });

    dash.innerHTML = `
        <div class="FIN-HERO"><small style="opacity:0.4;">NET PROFIT</small><div>£${(coll - spend).toFixed(2)}</div></div>
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
            <div class="FIN-BUBBLE"><small>INCOME</small><strong>£${coll.toFixed(2)}</strong></div>
            <div class="FIN-BUBBLE"><small>SPENT</small><strong>£${spend.toFixed(2)}</strong></div>
        </div>`;
    
    let listHtml = '<div class="VAULT-CARD"><h3 class="VAULT-HDR">Statement</h3>';
    db.expenses.slice().reverse().forEach(e => {
        listHtml += `<div class="VAULT-ROW" style="justify-content:space-between; height:60px !important;"><span>${e.desc}</span><span style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</span></div>`;
    });
    listHtml += '</div>';
    statement.innerHTML = listHtml;
};

/* --- 👥 MASTER SEARCH --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px; border-radius:35px; margin:0 20px 15px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 5px 15px rgba(0,0,0,0.03);";
            div.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- ⚙️ SHARED LOGIC --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { if(document.getElementById('finances-root').classList.contains('active')) renderFinances(); renderMaster(); updateHeader(); };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, price: n(document.getElementById('cPrice').value), cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" }); saveData(); alert("Saved!"); location.reload(); };
window.exportToQuickBooks = () => { alert("Exporting to CSV..."); /* Logic for CSV download here */ };
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
