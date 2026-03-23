const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
let currentCoords = { lat: null, lon: null };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    db.customers.forEach(c => { if(!c.paymentLogs) c.paymentLogs = []; if(!c.debtHistory) c.debtHistory = []; });
    
    // Sync Navy Palette & Adaptive Logo
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

// --- CORE HANDLERS ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const target = document.getElementById(name); if(target) target.style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    window.scrollTo(0,0);
};

window.saveCustomer = () => {
    const nVal = document.getElementById('cName').value; if(!nVal) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name: nVal, address: (document.getElementById('cAddr').value || ""), postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); location.reload(); 
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
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large bounce-on-tap" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large bounce-on-tap" onclick="handleSMS('${c.id}')">📱</button><a href="https://www.google.com/maps/dir/Current+Loc/Stop1/Stop2/0{encodeURIComponent((c.address||'') + ' ' + (c.postcode||''))}" target="_blank" class="icon-btn-large bounce-on-tap">📍</a></div>
                <div class="status-row" style="${d > 0 ? 'grid-template-columns:repeat(3,1fr)' : 'grid-template-columns:1fr 1fr'}"><button class="action-btn-main bounce-on-tap ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done ✅' : 'Cleaned'}</button><button class="action-btn-main bounce-on-tap ${isPaid ? 'btn-paid-active' : 'btn-pay-pending'}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay £' + n(c.price).toFixed(2)}</button>${d > 0 ? `<button class="action-btn-main bounce-on-tap" onclick="handleDebtCollection('${c.id}')">Debt £${d.toFixed(2)}</button>` : ''}</div></div>`;
            container.appendChild(card);
        });
    }
};

// ... Weather, Routing, and Stats Logic remains consistent ...

const fetchWeather = async (lat, lon) => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const weather = data.current_weather;
        document.getElementById('weatherWrap').classList.remove('hidden');
        document.getElementById('wTemp').innerText = `${Math.round(weather.temperature)}°C`;
        const icon = document.getElementById('wIcon');
        const code = weather.weathercode;
        if (code <= 1) icon.innerText = "☀️";
        else if (code <= 3) icon.innerText = "⛅";
        else if (code <= 67) icon.innerText = "🌧️";
        else icon.innerText = "☁️";
    } catch (e) {}
};

window.openWeatherApp = () => {
    if (!currentCoords.lat) return;
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isiOS ? `weather://` : `https://www.google.com/search?q=weather+at+my+location`, '_blank');
};

window.optimizeDay = (w) => {
    db.customers.sort((a,b) => (a.week==w && b.week==w) ? (a.address||"").localeCompare(b.address||"") : 0);
    saveData(); renderAll(); alert(`Week ${w} Sorted! 🚀`);
};

window.mapTheDay = (w) => {
    const dayJobs = db.customers.filter(c => c.week == w && !c.cleaned); if(dayJobs.length === 0) return;
    let url = "https://www.google.com/maps/dir/Current+Loc/Stop1/Stop2/1"; dayJobs.forEach(c => url += encodeURIComponent(c.address + " " + (c.postcode||"")) + "/");
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

window.renderStats = () => {
    let totalIn = 0; db.customers.forEach(c => (c.paymentLogs||[]).forEach(l => totalIn += n(l.amount)));
    let totalOut = db.expenses.reduce((s, e) => s + n(e.amt), 0);
    let potVal = db.customers.reduce((s, c) => s + n(c.price), 0);
    let jobCol = db.customers.reduce((s, c) => s + n(c.paidThisMonth), 0);
    document.getElementById('currProfit').innerText = `£${(totalIn - totalOut).toFixed(2)}`;
    document.getElementById('currRevenue').innerText = `£${totalIn.toFixed(2)}`;
    document.getElementById('currSpend').innerText = `£${totalOut.toFixed(2)}`;
    document.getElementById('progressBar').style.width = `${potVal > 0 ? (jobCol/potVal)*100 : 0}%`;
    document.getElementById('collectionPercent').innerText = `${Math.round(potVal>0?(jobCol/potVal)*100:0)}%`;
    document.getElementById('targetWork').innerText = `£${potVal.toFixed(2)}`;
    document.getElementById('stillToCollect').innerText = `£${Math.max(0, potVal - jobCol).toFixed(2)}`;
    document.getElementById('totalOldDebt').innerText = `£${db.customers.reduce((s,c)=>(c.debtHistory||[]).reduce((ss,d)=>ss+n(d.amount),s),0).toFixed(2)}`;
    renderHistory();
};

window.renderHistory = () => {
    const hist = document.getElementById('monthlyHistoryContainer'); if (!hist) return;
    hist.innerHTML = '<h3 class="section-title" style="margin-top:35px; color: var(--success);">🏆 Hall of Fame</h3>';
    db.history.forEach(h => {
        const net = n(h.income) - n(h.spend);
        const d = document.createElement('div'); d.className = 'history-item-card';
        d.innerHTML = `<div class="history-metrics-grid"><div class="metric-bubble b-profit"><small>${h.month}</small><strong>Net £${net.toFixed(2)}</strong></div>
            <div class="metric-bubble b-collected"><small>Collected</small><strong>£${n(h.income).toFixed(2)}</strong></div>
            <div class="metric-bubble b-spent"><small>Spent</small><strong>£${n(h.spend).toFixed(2)}</strong></div>
            <div class="metric-bubble b-arrears"><small>Arrears Rolled</small><strong>£${n(h.debtCreated).toFixed(2)}</strong></div></div>`; 
        hist.appendChild(d);
    });
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

window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.handleWhatsApp = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`https://wa.me/${c.phone.replace(/\s+/g,'')}`, '_blank'); };
window.handleSMS = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`sms:${c.phone.replace(/\s+/g,'')}${/iPhone|iPad/.test(navigator.userAgent)?'&':'?'}body=`, '_blank'); };
window.closeModal = () => document.getElementById('globalModal').style.display = 'none';
window.updateGreeting = () => {
    const hr = new Date().getHours();
    let g = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};
