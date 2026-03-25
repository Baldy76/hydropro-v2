const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };

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

/* --- 🌦️ LIVE WEATHER SYNC ONLY --- */
async function initWeather() {
    // Attempt local storage cache first to prevent "SYNC..." flicker
    const cachedW = localStorage.getItem('HP_Weather_Cache');
    if(cachedW) document.getElementById('w-text').innerText = cachedW;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            const temp = `${Math.round(data.main.temp)}°C`;
            document.getElementById('w-icon').innerText = "🌤️";
            document.getElementById('w-text').innerText = temp;
            localStorage.setItem('HP_Weather_Cache', temp);
        } catch (err) {
            document.getElementById('w-text').innerText = "OFFLINE";
        }
    });
}

/* --- ⚓ CORE NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); 
    renderAll();
};

window.updateHeader = () => {
    if(el = document.getElementById('dateText')) {
        el.innerText = new Date().toLocaleDateString('en-GB', { 
            weekday: 'long', day: 'numeric', month: 'short' 
        });
    }
};

window.renderAll = () => {
    // Check active tab and render appropriate island logic
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
};

// ... Remaining logic for saveCustomer, saveBank, renderMaster, showBriefing, etc. 
// remain exactly as per v47.2 to maintain audit trail.
