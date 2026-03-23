const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
let currentCoords = { lat: null, lon: null };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
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

// --- CORE NAVIGATION ---
window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(name).classList.add("active");
    
    // Header Visibility
    const header = document.querySelector('.app-header');
    const nav = document.getElementById('subpageNav');
    
    if (name === 'home') {
        nav.classList.add('hidden');
        header.classList.remove('hidden');
    } else {
        nav.classList.remove('hidden');
        header.classList.add('hidden'); // Hide logo header when inside tools
    }
    
    window.scrollTo(0,0);
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

// --- UTILS ---
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

window.optimizeDay = (w) => {
    db.customers.sort((a,b) => (a.week==w && b.week==w) ? (a.address||"").localeCompare(b.address||"") : 0);
    saveData(); renderAll(); alert(`Week ${w} Sorted! 🚀`);
};

window.mapTheDay = (w) => {
    const dayJobs = db.customers.filter(c => c.week == w && !c.cleaned); if(dayJobs.length === 0) return;
    let url = "https://www.google.com/maps/dir/Current+Loc/Stop1/Stop2/1"; 
    dayJobs.forEach(c => url += encodeURIComponent(c.address + " " + (c.postcode||"")) + "/");
    window.open(url, '_blank');
};

window.broadcastWeek = (w, t) => {
    const cs = db.customers.filter(c => c.week == w && c.phone && !c.cleaned);
    cs.forEach((c, i) => setTimeout(() => {
        const msg = encodeURIComponent(`Hey ${c.name}, cleaning windows at ${c.address} this ${c.day}. See ya!`);
        const p = c.phone.replace(/\s+/g,'');
        window.open(t=='wa' ? `https://wa.me/${p}?text=${msg}` : `sms:${p}${/iPhone|iPad/.test(navigator.userAgent)?'&':'?'}body=${msg}`, '_blank');
    }, i*1200));
};

// --- RENDERING ---
window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) { container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5; padding:40px;">🍹 Week complete!</div>'; continue; }
        weekCusts.forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="showCustDetails('${c.id}')"><strong style="font-size:20px; color:var(--accent);">${c.name}</strong><br><small style="opacity:0.7; font-weight:600;">${c.address}</small></div>
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large bounce-on-tap" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large bounce-on-tap" onclick="handleSMS('${c.id}')">📱</button><a href="https://www.google.com/maps/dir/{encodeURIComponent((c.address||'') + ' ' + (c.postcode||''))}" target="_blank" class="icon-btn-large bounce-on-tap">📍</a></div>
                <div class="status-row"><button class="action-btn-main bounce-on-tap ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done' : 'Cleaned'}</button><button class="action-btn-main bounce-on-tap ${isPaid ? 'btn-paid-active' : ''}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay'}</button></div>${d > 0 ? `<button class="action-btn-main bounce-on-tap" onclick="handleDebtCollection('${c.id}')" style="background:var(--danger); color:white; margin-top:8px;">Arrears £${d}</button>` : ''}</div>`;
            container.appendChild(card);
        });
    }
};

// ... include standard Master, Stats, Ledger functions from your uploaded app.js ...
window.saveCustomer = () => {
    const nVal = document.getElementById('cName').value; if(!nVal) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name: nVal, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); location.reload(); 
};
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.updateGreeting = () => {
    const hr = new Date().getHours();
    let g = hr < 12 ? "Good Morning! ☕" : hr < 18 ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};
// (Remaining Master/Stats/Ledger logic from v13.8)
