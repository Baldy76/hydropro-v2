const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
let currentCoords = { lat: null, lon: null };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
            currentCoords.lat = pos.coords.latitude;
            currentCoords.lon = pos.coords.longitude;
            fetchWeather(currentCoords.lat, currentCoords.lon);
        });
    }
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(name).classList.add("active");
    
    const header = document.querySelector('.app-header');
    const nav = document.getElementById('subpageNav');
    
    if (name === 'home') {
        nav.classList.add('hidden');
        header.classList.remove('hidden');
    } else {
        nav.classList.remove('hidden');
        header.classList.add('hidden');
    }
    window.scrollTo(0,0);
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

// ... other core rendering and archival logic remains exactly as per v13.8 baseline ...
const updateGreeting = () => {
    const hr = new Date().getHours();
    document.getElementById('greetingMsg').innerText = hr < 12 ? "Good Morning! ☕" : hr < 18 ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
};

const fetchWeather = async (lat, lon) => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        document.getElementById('weatherWrap').classList.remove('hidden');
        document.getElementById('wTemp').innerText = `${Math.round(data.current_weather.temperature)}°C`;
        const code = data.current_weather.weathercode;
        document.getElementById('wIcon').innerText = code <= 3 ? "☀️" : code <= 67 ? "🌧️" : "☁️";
    } catch (e) {}
};

window.renderAll = () => { /* Render Master, Stats, etc. using your uploaded baseline logic */ };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
