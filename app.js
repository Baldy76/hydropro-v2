const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [] };

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
        updateHeader(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

// 🌦️ WEATHER APP REDIRECT
window.launchWeatherApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
        window.location.href = "weather://";
        // Fallback for iOS if URL scheme fails
        setTimeout(() => { window.open("https://weather.com/", "_blank"); }, 300);
    } else if (isAndroid) {
        // Most Androids use the Google Weather intent or webview
        window.open("https://www.google.com/search?q=weather", "_blank");
    } else {
        window.open("https://weather.com/", "_blank");
    }
};

window.updateHeader = () => { if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };

async function initWeather() { 
    navigator.geolocation.getCurrentPosition(async (pos) => { 
        try { 
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); 
            const data = await res.json(); 
            document.getElementById('w-icon').innerText = "🌤️"; 
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; 
        } catch (err) { } 
    }); 
}

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
};
