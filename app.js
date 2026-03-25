const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', acc: '' };
    
    // Theme
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

    // Load Bank Fields
    if(document.getElementById('bName')) {
        document.getElementById('bName').value = db.bank.name || '';
        document.getElementById('bAcc').value = db.bank.acc || '';
    }

    updateHeader(); renderAll(); initWeather();
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData(); alert("Bank Secured! 🔒");
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Name required");
    db.customers.push({ 
        id: Date.now().toString(), name, 
        houseNum: document.getElementById('cHouseNum').value, 
        street: document.getElementById('cStreet').value, 
        price: n(document.getElementById('cPrice').value), 
        cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" 
    });
    saveData(); alert("Saved!"); location.reload();
};

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.updateHeader = () => { if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { if(document.getElementById('master-root').classList.contains('active')) renderMaster(); };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent); if (isIOS) { window.location.href = "weather://"; setTimeout(() => { window.open("https://weather.com/", "_blank"); }, 300); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
