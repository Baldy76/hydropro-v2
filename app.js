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
    db.customers.forEach(c => { if(!c.paymentLogs) c.paymentLogs = []; if(!c.debtHistory) c.debtHistory = []; });
    
    // Sync Branding
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    const logoImg = document.getElementById('appLogo');
    if (logoImg) logoImg.src = isDark ? 'Logo-Dark.png' : 'Logo-Light.png';
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
    // Hide all
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    // Show target
    document.getElementById(name).classList.add("active");
    
    // Show/Hide Navigation Bar
    const nav = document.getElementById('subpageNav');
    if (name === 'home') nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    
    window.scrollTo(0,0);
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    const logoImg = document.getElementById('appLogo');
    if (logoImg) {
        logoImg.style.opacity = '0';
        setTimeout(() => {
            logoImg.src = isDark ? 'Logo-Dark.png' : 'Logo-Light.png';
            logoImg.style.opacity = '1';
        }, 150);
    }
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

const updateGreeting = () => {
    const hr = new Date().getHours();
    let g = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};

const fetchWeather = async (lat, lon) => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const weather = data.current_weather;
        document.getElementById('weatherWrap').classList.remove('hidden');
        document.getElementById('wTemp').innerText = `${Math.round(weather.temperature)}°C`;
        const code = weather.weathercode;
        document.getElementById('wIcon').innerText = code <= 3 ? "☀️" : code <= 67 ? "🌧️" : "☁️";
    } catch (e) {}
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) { container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5; padding:40px;">🍹 Week empty.</div>'; continue; }
        weekCusts.forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="showCustDetails('${c.id}')"><strong style="font-size:20px; color:var(--accent);">${c.name}</strong><br><small style="opacity:0.7; font-weight:600;">${c.address}</small></div>
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large" onclick="handleSMS('${c.id}')">📱</button><a href="https://www.google.com/maps/dir/Current+Loc/Stop1/Stop2/1{encodeURIComponent((c.address||'') + ' ' + (c.postcode||''))}" target="_blank" class="icon-btn-large">📍</a></div>
                <div class="status-row" style="display:grid; gap:8px; grid-template-columns:${d > 0 ? 'repeat(3,1fr)' : '1fr 1fr'}"><button class="action-btn-main bounce-on-tap ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done' : 'Cleaned'}</button><button class="action-btn-main bounce-on-tap ${isPaid ? 'btn-paid-active' : ''}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay £'+n(c.price)}</button>${d > 0 ? `<button class="action-btn-main bounce-on-tap" onclick="handleDebtCollection('${c.id}')" style="background:var(--danger); color:white;">Debt £${d}</button>` : ''}</div></div>`;
            container.appendChild(card);
        });
    }
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody'); if (!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => { if (c.name.toLowerCase().includes(search) || (c.address||"").toLowerCase().includes(search)) {
        const row = document.createElement('div'); row.className = 'master-row'; row.onclick = () => showCustDetails(c.id);
        const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
        row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}${d > 0 ? '<br><small style="color:var(--danger)">Debt: £' + d.toFixed(2) + '</small>' : ''}</div>`;
        container.appendChild(row);
    }});
};

window.saveCustomer = () => {
    const nVal = document.getElementById('cName').value; if(!nVal) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name: nVal, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); location.reload(); 
};

window.renderAll = () => { renderMasterTable(); renderWeekLists(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.handleWhatsApp = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`https://wa.me/${c.phone.replace(/\s+/g,'')}`, '_blank'); };
window.handleSMS = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`sms:${c.phone.replace(/\s+/g,'')}`, '_blank'); };
window.closeModal = () => document.getElementById('globalModal').style.display = 'none';
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; c.cleaned = !c.cleaned; saveData(); renderWeekLists(); };
