const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
let curWeek = 1; let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    applyTheme(localStorage.getItem('HP_Theme') === 'true');
    const cb = document.getElementById('themeCheckbox');
    if(cb) {
        cb.checked = localStorage.getItem('HP_Theme') === 'true';
        cb.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
            localStorage.setItem('HP_Theme', e.target.checked);
        });
    }
    updateHeader(); renderAll(); initWeather();
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

/* --- 👥 CST- LOGIC --- */
window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success); font-size:22px;">£${(c.price || 0)}</div>`;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const modal = document.getElementById('briefingModal');
    const container = document.getElementById('briefingData');
    const paid = (parseFloat(c.paidThisMonth) || 0);
    const price = (parseFloat(c.price) || 0);
    const arrearsHtml = paid < price ? `<div style="background:var(--danger); color:white; padding:15px; border-radius:20px; text-align:center; font-weight:900; margin:10px 0;">⚠️ PAYMENT MISSED (£${(price-paid).toFixed(2)})</div>` : `<div style="color:var(--success); text-align:center; font-weight:900; margin:10px 0;">✅ PAID THIS MONTH</div>`;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let historyHtml = history.map(h => `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:700;"><span>${h.date}</span><span>£${h.amt}</span></div>`).join('') || '<p style="text-align:center; opacity:0.5;">No history found</p>';

    container.innerHTML = `<h2 style="color:var(--accent); font-size:28px; margin:0;">${c.name}</h2><p style="opacity:0.6; font-weight:800; margin-bottom:20px;">${c.houseNum} ${c.street}</p>${arrearsHtml}<div style="margin-top:20px;"><h3 style="font-size:14px; opacity:0.4; text-transform:uppercase;">3-Month History</h3>${historyHtml}</div>`;
    modal.classList.remove('hidden');
};

/* --- 💰 FIN- LOGIC --- */
window.renderFinances = () => {
    const dash = document.getElementById('FIN-dashboard'); if(!dash) return;
    let inc = 0, exp = 0;
    db.customers.forEach(c => inc += (parseFloat(c.paidThisMonth) || 0));
    db.expenses.forEach(e => exp += (parseFloat(e.amt) || 0));
    dash.innerHTML = `<div class="FIN-hero-iron"><small style="opacity:0.5; font-weight:900;">NET PROFIT</small><div>£${(inc - exp).toFixed(2)}</div></div>`;
};

/* --- 📅 WEE- LOGIC --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.WEE-day-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('WEE-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'CST-card-item';
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="display:flex; gap:8px;"><button onclick="toggleClean('${c.id}')" style="background:#eee; border:none; padding:12px; border-radius:15px;">🧼</button><button onclick="settlePaid('${c.id}')" style="background:#eee; border:none; padding:12px; border-radius:15px;">£</button></div>`;
        list.appendChild(div);
    });
};

/* --- 🌦️ UTILS --- */
window.save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
    if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); if (isIOS) { window.location.href = "weather://"; setTimeout(() => { window.open("https://weather.com/", "_blank"); }, 300); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
