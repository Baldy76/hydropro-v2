const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [] };

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    applyTheme(localStorage.getItem('HP_Theme') === 'true');
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
    container.innerHTML = `<h2 style="color:var(--accent); font-size:28px;">${c.name}</h2><p>${c.houseNum} ${c.street}</p><div style="background:var(--ios-grey); padding:15px; border-radius:20px;">📍 ${c.postcode || 'N/A'}<br>📞 ${c.phone || 'N/A'}<br>💰 £${c.price}</div>`;
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
