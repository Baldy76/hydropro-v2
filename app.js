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

const updateGreeting = () => {
    const hr = new Date().getHours();
    let g = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};

// --- WEATHER ---
const fetchWeather = async (lat, lon) => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const weather = data.current_weather;
        document.getElementById('weatherWrap').classList.remove('hidden');
        document.getElementById('wTemp').innerText = `${Math.round(weather.temperature)}°C`;
        const icon = document.getElementById('wIcon');
        const desc = document.getElementById('wDesc');
        const code = weather.weathercode;
        if (code <= 1) { icon.innerText = "☀️"; desc.innerText = "Clear"; }
        else if (code <= 3) { icon.innerText = "⛅"; desc.innerText = "Cloudy"; }
        else if (code <= 67) { icon.innerText = "🌧️"; desc.innerText = "Rainy"; }
        else { icon.innerText = "☁️"; desc.innerText = "Overcast"; }
    } catch (e) {}
};

window.openWeatherApp = () => {
    if (!currentCoords.lat) return;
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isiOS ? `weather://` : `https://www.google.com/search?q=weather+at+my+location`, '_blank');
};

// --- ROUTING & BROADCASTER ---
window.optimizeDay = (weekNum) => {
    if (!currentCoords.lat) { alert("GPS location required."); return; }
    // Sort logic: Groups by street name
    db.customers.sort((a, b) => {
        if (a.week != weekNum || b.week != weekNum) return 0;
        return (a.address || "").localeCompare(b.address || "");
    });
    saveData(); renderWeekLists(); alert("Route optimized by street proximity! 🚀");
};

window.mapTheDay = (weekNum) => {
    const dayJobs = db.customers.filter(c => c.week == weekNum && !c.cleaned);
    if(dayJobs.length === 0) return;
    let url = "http://googleusercontent.com/maps.google.com/4";
    const last = dayJobs[dayJobs.length - 1];
    url += encodeURIComponent(last.address + " " + last.postcode);
    if (dayJobs.length > 1) {
        let ways = dayJobs.slice(0, -1).map(c => c.address + " " + c.postcode).join('|');
        url += "&waypoints=" + encodeURIComponent(ways);
    }
    window.open(url, '_blank');
};

window.broadcastWeek = (weekNum, type) => {
    const weekCusts = db.customers.filter(c => c.week == weekNum && c.phone && !c.cleaned);
    if(weekCusts.length === 0) return;
    if(!confirm(`Open ${weekCusts.length} messages?`)) return;
    weekCusts.forEach((c, i) => {
        setTimeout(() => {
            const msg = `Hey ${c.name}, coming to clean your windows at ${c.address} this ${c.day} (weather permitting). See ya!`;
            const phone = c.phone.replace(/\s+/g, '');
            let url = (type === 'wa') ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `sms:${phone}${/iPad|iPhone|iPod/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }, i * 1000);
    });
};

// --- RENDERING ---
window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = '';
        const hub = document.createElement('div'); hub.className = 'navigator-card';
        hub.innerHTML = `<div class="nav-header"><span>🛰️ Smart Navigator</span><span>📢 Broadcaster</span></div>
            <div class="nav-btn-row"><button class="btn-nav-action" onclick="optimizeDay(${i})">🚀 Sort Route</button><button class="btn-nav-action map-btn" onclick="mapTheDay(${i})">🗺️ View Map</button></div>
            <div class="nav-btn-row"><button class="btn-nav-action" onclick="broadcastWeek(${i}, 'wa')">💬 WhatsApp All</button><button class="btn-nav-action" onclick="broadcastWeek(${i}, 'sms')">📱 SMS All</button></div>`;
        container.appendChild(hub);
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) { container.innerHTML += '<div class="card" style="text-align:center; opacity:0.5; padding:40px;">🍹 Week empty.</div>'; continue; }
        weekCusts.forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="showCustDetails('${c.id}')"><strong style="font-size:19px; color:var(--accent);">${c.name}</strong><br><small style="opacity:0.6; font-weight:600;">${c.address || 'No Address'}</small></div>
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large bounce-on-tap" style="color:#25D366" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large bounce-on-tap" style="color:#007AFF" onclick="handleSMS('${c.id}')">📱</button><a href="http://googleusercontent.com/maps.google.com/5{encodeURIComponent((c.address||'') + ' ' + (c.postcode||''))}" target="_blank" class="icon-btn-large bounce-on-tap" style="color:#ea4335">📍</a></div>
                <div class="status-row" style="${d > 0 ? 'grid-template-columns:repeat(3,1fr)' : 'grid-template-columns:1fr 1fr'}"><button class="action-btn-main bounce-on-tap ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done ✅' : 'Cleaned'}</button><button class="action-btn-main bounce-on-tap ${isPaid ? 'btn-paid-active' : 'btn-pay-pending'}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid 💰' : 'Pay £' + n(c.price).toFixed(2)}</button>${d > 0 ? `<button class="action-btn-main bounce-on-tap btn-debt-pending" onclick="handleDebtCollection('${c.id}')">Debt £${d.toFixed(2)}</button>` : ''}</div></div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    let totalIn = 0; db.customers.forEach(c => { (c.paymentLogs||[]).forEach(l => totalIn += n(l.amount)); });
    let totalOut = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let potVal = db.customers.reduce((sum, c) => sum + n(c.price), 0);
    let jobCol = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let arrears = db.customers.reduce((s,c)=>(c.debtHistory||[]).reduce((ss,d)=>ss+n(d.amount),s), 0);
    document.getElementById('currProfit').innerText = `£${(totalIn - totalOut).toFixed(2)}`;
    document.getElementById('currRevenue').innerText = `£${totalIn.toFixed(2)}`;
    document.getElementById('currSpend').innerText = `£${totalOut.toFixed(2)}`;
    document.getElementById('progressBar').style.width = `${potVal > 0 ? (jobCol/potVal)*100 : 0}%`;
    document.getElementById('collectionPercent').innerText = `${Math.round(potVal>0?(jobCol/potVal)*100:0)}%`;
    document.getElementById('targetWork').innerText = `£${potVal.toFixed(2)}`;
    document.getElementById('stillToCollect').innerText = `£${Math.max(0, potVal - jobCol).toFixed(2)}`;
    document.getElementById('totalOldDebt').innerText = `£${arrears.toFixed(2)}`;
    renderHistory();
};

window.renderHistory = () => {
    const hist = document.getElementById('monthlyHistoryContainer'); if (!hist) return;
    hist.innerHTML = '<h3 class="section-title" style="margin-top:35px; color: var(--qb-green);">🏆 The Hall of Fame</h3>';
    db.history.forEach(h => {
        const net = n(h.income) - n(h.spend);
        const d = document.createElement('div'); d.className = 'history-item-card';
        d.innerHTML = `<div class="history-metrics-grid"><div class="metric-bubble b-profit"><small>${h.month}</small><strong>Net Profit £${net.toFixed(2)}</strong></div>
            <div class="metric-bubble b-collected"><small>Collected</small><strong>£${n(h.income).toFixed(2)}</strong></div>
            <div class="metric-bubble b-spent"><small>Spent</small><strong>£${n(h.spend).toFixed(2)}</strong></div>
            <div class="metric-bubble b-arrears"><small>Debt Rolled</small><strong>£${n(h.debtCreated).toFixed(2)}</strong></div></div>`; 
        hist.appendChild(d);
    });
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody'); if (!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => { if (c.name.toLowerCase().includes(search) || (c.address||"").toLowerCase().includes(search)) {
        const row = document.createElement('div'); row.className = 'master-row'; row.onclick = () => showCustDetails(c.id);
        const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
        row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address || 'No Address'}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}${d > 0 ? '<br><small style="color:var(--danger)">Debt: £' + d.toFixed(2) + '</small>' : ''}</div>`;
        container.appendChild(row);
    }});
};

window.showIncomeModal = () => {
    const body = document.getElementById('modalContentBody'); let html = '<h3 class="section-title">💸 Collections Log</h3>';
    db.customers.forEach(c => { (c.paymentLogs || []).forEach(log => {
        const desc = log.arrearsContext ? `Arrears (${log.arrearsContext})` : 'Cycle Job';
        html += `<div class="drilldown-row"><div><strong>${c.name}</strong><br><small>${log.date}<br>${desc}</small></div><div style="color:${log.type === 'debt' ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">£${n(log.amount).toFixed(2)}</div></div>`;
    }); });
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

window.showExpenseModal = () => {
    const body = document.getElementById('modalContentBody'); let html = '<h3 class="section-title">🧾 Spend Detail</h3>';
    db.expenses.forEach(e => { html += `<div class="drilldown-row"><div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:bold;">£${n(e.amt).toFixed(2)}</div></div>`; });
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

window.showArrearsModal = () => {
    const body = document.getElementById('modalContentBody'); let html = '<h3 class="section-title">⚠️ Arrears Ledger</h3>';
    db.customers.forEach(c => { (c.debtHistory || []).forEach(d => {
        html += `<div class="drilldown-row"><div><strong>${c.name}</strong><br><small>Date: ${d.date}<br>${d.month || 'Old'}</small></div><div style="color:var(--danger); font-weight:bold;">£${n(d.amount).toFixed(2)}</div></div>`;
    }); });
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

// --- CORE HANDLERS ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const sw = document.getElementById('setup-form-wrapper'); if (sw) name === 'admin' ? sw.classList.remove('hidden') : sw.classList.add('hidden');
    const target = document.getElementById(name); if (target) { target.style.display = "block"; if (evt) evt.currentTarget.classList.add("active"); }
    renderAll();
};
window.saveCustomer = () => {
    const nVal = document.getElementById('cName').value; if(!nVal) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id); let ex = idx > -1 ? db.customers[idx] : null;
    const entry = { id, name: nVal, address: (document.getElementById('cAddr').value || ""), postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: ex?ex.cleaned:false, paidThisMonth: ex?ex.paidThisMonth:0, debtHistory: ex?ex.debtHistory:[], paymentLogs: ex?ex.paymentLogs:[] };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); location.reload(); 
};
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleDarkMode = () => { const d = document.getElementById('darkModeToggle').checked; document.body.className = d ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', d); };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a<=0) return; db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')}); saveData(); location.reload(); };
window.completeCycle = () => {
    if(!confirm("Start New Month? Unpaid jobs move to Arrears.")) return;
    const curLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    let mInc = 0; db.customers.forEach(c => { (c.paymentLogs||[]).forEach(l => mInc += n(l.amount)); });
    let mExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let nDebt = 0;
    db.customers.forEach(c => {
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            const bal = n(c.price) - n(c.paidThisMonth);
            if(!c.debtHistory) c.debtHistory = []; c.debtHistory.push({ date: new Date().toLocaleDateString('en-GB'), amount: bal, month: curLabel });
            nDebt += bal;
        }
        c.cleaned = false; c.paidThisMonth = 0; c.paymentLogs = [];
    });
    db.history.unshift({ month: curLabel, income: mInc, spend: mExp, debtCreated: nDebt });
    db.expenses = []; saveData(); location.reload();
};
window.exportFullCSV = () => {
    let c = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Notes\n";
    db.customers.forEach(x => { c += `${x.id},"${x.name}","${x.address}","${x.postcode}","${x.phone}",${x.price},${x.week},"${x.day}","${x.notes}"\n`; });
    const b = new Blob([c], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `HydroBackup.csv`; a.click();
};
window.importFullCSV = (e) => {
    const f = e.target.files[0], r = new FileReader();
    r.onload = (ev) => {
        const rows = ev.target.result.split('\n').slice(1);
        let imp = [];
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(cols.length > 5) imp.push({ id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''), postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''), price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : "", cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] });
        });
        db.customers = imp; saveData(); location.reload();
    };
    r.readAsText(f);
};
window.exportQBIncome = () => {
    let csv = "Customer,Invoice Date,Invoice No,Service,Amount,Tax Amount\n";
    db.customers.forEach(c => { (c.paymentLogs || []).forEach((log, idx) => {
        const dateStr = log.date.split(',')[0].replace(/\//g, '-');
        csv += `"${c.name}",${dateStr},INV-${c.id}-${idx},"Window Clean",${n(log.amount).toFixed(2)},0\n`;
    }); });
    const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `QB_Income.csv`; a.click();
};
window.exportQBExpenses = () => {
    let csv = "Vendor,Date,Description,Amount,Account\n";
    db.expenses.forEach(e => {
        const dateStr = e.date.replace(/\//g, '-');
        csv += `"Vendor",${dateStr},"${e.desc}",${n(e.amt).toFixed(2)},"Expenses"\n`;
    });
    const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `QB_Expenses.csv`; a.click();
};
window.handleWhatsApp = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`https://wa.me/${c.phone.replace(/\s+/g,'')}`, '_blank'); };
window.handleSMS = (id) => { const c = db.customers.find(x => x.id === id); if(c && c.phone) window.open(`sms:${c.phone.replace(/\s+/g,'')}`, '_blank'); };
window.closeModal = () => document.getElementById('globalModal').style.display = 'none';
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
