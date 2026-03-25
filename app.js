const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [] };

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Theme Switch Engine
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

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success); font-size:22px;">£${c.price}</div>`;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const container = document.getElementById('briefingData');
    const paid = (parseFloat(c.paidThisMonth) || 0);
    const price = (parseFloat(c.price) || 0);
    
    const arrearsHtml = paid < price ? `<div style="background:var(--danger); color:white; padding:15px; border-radius:20px; text-align:center; font-weight:950; margin:10px 0;">⚠️ PAYMENT MISSED (£${(price-paid).toFixed(2)})</div>` : `<div style="color:var(--success); text-align:center; font-weight:950; margin:15px 0;">✅ PAID THIS MONTH</div>`;

    container.innerHTML = `
        <div class="CST-brief-header"><h2 style="margin:0; font-size:32px; font-weight:950;">${c.name}</h2></div>
        <div class="CST-brief-item"><span class="CST-brief-icon">📍</span><strong>Postcode:</strong> ${c.postcode || 'N/A'}</div>
        <div class="CST-brief-item" onclick="window.location.href='tel:${c.phone}'"><span class="CST-brief-icon">📞</span><strong>Call:</strong> <span style="text-decoration:underline;">${c.phone || 'N/A'}</span></div>
        <div class="CST-brief-item"><span class="CST-brief-icon">💰</span><strong>Price:</strong> £${c.price}</div>
        ${arrearsHtml}
        <div style="margin-top:20px; opacity:0.5; font-size:12px; text-transform:uppercase;">Recent History Logic Active</div>`;
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

async function initWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`;
        } catch (e) { document.getElementById('w-text').innerText = "OFFLINE"; }
    });
}

window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
