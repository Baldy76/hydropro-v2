const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Theme Switch Logic
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
    updateHeader(); renderAll(); initWeather();
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

/* --- 👥 CUSTOMER INTELLIGENCE --- */
window.renderMaster = () => {
    const list = document.getElementById('master-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CUST-BLOCK';
            div.onclick = () => showBriefing(c.id);
            div.style = "background:var(--card); margin:0 25px 12px; padding:20px; border-radius:30px; height:110px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 5px 15px rgba(0,0,0,0.03);";
            div.innerHTML = `<div><strong>${c.name}</strong><br><small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success); font-size:20px;">£${n(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const modal = document.getElementById('briefingModal');
    const container = document.getElementById('briefingData');
    
    const isPaid = n(c.paidThisMonth) >= n(c.price);
    const arrearsHtml = !isPaid ? `<div class="brief-arrears">⚠️ PAYMENT MISSED THIS MONTH (£${(n(c.price) - n(c.paidThisMonth)).toFixed(2)})</div>` : `<div style="color:var(--success); text-align:center; font-weight:900; margin:10px 0;">✅ PAID THIS MONTH</div>`;

    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let historyHtml = history.map(h => `<div class="brief-history-row"><span>${h.date}</span><span>£${n(h.amt).toFixed(2)}</span></div>`).join('') || '<p style="text-align:center; opacity:0.5;">No history found</p>';

    container.innerHTML = `
        <h2 style="margin:0; color:var(--accent); font-size:28px;">${c.name}</h2>
        <p style="margin:5px 0 20px; opacity:0.6; font-weight:800;">${c.houseNum} ${c.street}</p>
        <div class="brief-section"><strong>Base Price:</strong> £${n(c.price).toFixed(2)}</div>
        ${arrearsHtml}
        <div class="brief-section">
            <h3 style="font-size:14px; margin-bottom:10px; opacity:0.4; text-transform:uppercase;">Rolling 3-Month History</h3>
            ${historyHtml}
        </div>`;
    modal.classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

/* --- 🌦️ WEATHER --- */
window.launchWeatherApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) { window.location.href = "weather://"; setTimeout(() => { window.open("https://weather.com/", "_blank"); }, 300); }
    else { window.open("https://www.google.com/search?q=weather", "_blank"); }
};

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
// initWeather omitted for length, same as previous v44 logic.
