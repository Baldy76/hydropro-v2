const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], bank: { name:'', sort:'', acc:'' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        
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
        renderAll(); updateHeader(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

window.renderMaster = () => {
    const list = document.getElementById('master-list-container');
    if(!list) return;
    list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();

    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CUST-CARD';
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `
                <div>
                    <strong style="font-size:18px;">${c.name}</strong><br>
                    <small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:950; color:var(--success); font-size:20px;">
                    £${n(c.price).toFixed(2)}
                </div>`;
            list.appendChild(div);
        }
    });
};

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Required");
    db.customers.push({ id: Date.now().toString(), name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, price: n(document.getElementById('cPrice').value), cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" });
    saveData(); alert("Saved!"); location.reload();
};
window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.sort = document.getElementById('bSort').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData(); alert("Bank Secured! 🔒");
};
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
