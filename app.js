const MASTER_KEY = 'HydroPro_App_Production';
const BANK_DETAILS = "Bank: Monzo\nAcc: 12345678\nSort: 00-00-00"; 
let db = { customers: [], expenses: [], history: [] }; 
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
    
    db.customers.forEach(c => { 
        if(!c.paymentLogs) c.paymentLogs = []; 
        if(!c.debtHistory) c.debtHistory = [];
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    // Trigger Weather/GPS
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            (err) => console.log("Weather Location access denied")
        );
    }
    
    renderAll();
};

const updateGreeting = () => {
    const hr = new Date().getHours();
    let g = "Hey there!";
    if (hr < 12) g = "Good Morning! ☕";
    else if (hr < 18) g = "Good Afternoon! ☀️";
    else g = "Good Evening! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};

const fetchWeather = async (lat, lon) => {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const weather = data.current_weather;
        const wWrap = document.getElementById('weatherWrap');
        wWrap.classList.remove('hidden');
        document.getElementById('wTemp').innerText = `${Math.round(weather.temperature)}°C`;
        const icon = document.getElementById('wIcon');
        const desc = document.getElementById('wDesc');
        const code = weather.weathercode;
        if (code <= 1) { icon.innerText = "☀️"; desc.innerText = "Clear"; }
        else if (code <= 3) { icon.innerText = "⛅"; desc.innerText = "Cloudy"; }
        else if (code <= 48) { icon.innerText = "☁️"; desc.innerText = "Foggy"; }
        else if (code <= 67) { icon.innerText = "🌧️"; desc.innerText = "Rainy"; }
        else if (code <= 77) { icon.innerText = "❄️"; desc.innerText = "Snowy"; }
        else { icon.innerText = "⛈️"; desc.innerText = "Stormy"; }
    } catch (e) { console.log("Weather service error"); }
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const sw = document.getElementById('setup-form-wrapper');
    if (sw) name === 'admin' ? sw.classList.remove('hidden') : sw.classList.add('hidden');
    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    const target = document.getElementById(name);
    if (target) { target.style.display = "block"; if (evt) evt.currentTarget.classList.add("active"); }
    renderAll();
    window.scrollTo(0,0);
};

window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) { alert("Enter Name"); return; }
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;
    const entry = {
        id, name: nameVal, address: (document.getElementById('cAddr').value || ""),
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false, paidThisMonth: ex ? ex.paidThisMonth : 0, 
        debtHistory: ex ? ex.debtHistory : [], paymentLogs: ex ? ex.paymentLogs : []
    };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Saved!"); location.reload(); 
};

window.exportQBIncome = () => {
    let csv = "Customer,Invoice Date,Invoice No,Service,Amount,Tax Amount\n";
    db.customers.forEach(c => { (c.paymentLogs || []).forEach((log, idx) => {
        const dateStr = log.date.split(',')[0].replace(/\//g, '-');
        csv += `"${c.name}",${dateStr},INV-${c.id}-${idx},"Window Clean",${n(log.amount).toFixed(2)},0\n`;
    }); });
    downloadCSV(csv, "QB_Income.csv");
};

window.exportQBExpenses = () => {
    let csv = "Vendor,Date,Description,Amount,Account\n";
    db.expenses.forEach(e => {
        const dateStr = e.date.replace(/\//g, '-');
        csv += `"Vendor",${dateStr},"${e.desc}",${n(e.amt).toFixed(2)},"Expenses"\n`;
    });
    downloadCSV(csv, "QB_Expenses.csv");
};

const downloadCSV = (csv, fn) => {
    const b = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = fn; a.click();
};

window.showIncomeModal = () => {
    const body = document.getElementById('modalContentBody');
    let html = '<h3 class="section-title">💸 Collections Log</h3>';
    let total = 0;
    db.customers.forEach(c => { (c.paymentLogs || []).forEach(log => {
        const desc = log.arrearsContext ? `Arrears (${log.arrearsContext})` : 'Monthly Job';
        html += `<div class="drilldown-row"><div><strong>${c.name}</strong><br><small>${log.date}<br>${desc}</small></div><div style="color:${log.type === 'debt' ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">£${n(log.amount).toFixed(2)}</div></div>`;
        total += n(log.amount);
    }); });
    html += `<div class="drilldown-total"><span>Total Collected</span><span>£${total.toFixed(2)}</span></div>`;
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

window.showExpenseModal = () => {
    const body = document.getElementById('modalContentBody');
    let html = '<h3 class="section-title">🧾 Spend Detail</h3>';
    let total = 0;
    db.expenses.forEach(e => {
        html += `<div class="drilldown-row"><div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:bold;">£${n(e.amt).toFixed(2)}</div></div>`;
        total += n(e.amt);
    });
    html += `<div class="drilldown-total"><span>Total Spent</span><span>£${total.toFixed(2)}</span></div>`;
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

window.showArrearsModal = () => {
    const body = document.getElementById('modalContentBody');
    let html = '<h3 class="section-title">⚠️ Arrears Ledger</h3>';
    let total = 0;
    db.customers.forEach(c => { (c.debtHistory || []).forEach(d => {
        html += `<div class="drilldown-row"><div><strong>${c.name}</strong><br><small>Added: ${d.date}<br>${d.month || 'Old'}</small></div><div style="color:var(--danger); font-weight:bold;">£${n(d.amount).toFixed(2)}</div></div>`;
        total += n(d.amount);
    }); });
    html += `<div class="drilldown-total"><span>Total Arrears Owed</span><span>£${total.toFixed(2)}</span></div>`;
    body.innerHTML = html; document.getElementById('globalModal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('globalModal').style.display = 'none';

window.toggleCleaned = (id) => {
    const c = db.customers.find(x => x.id === id); if (!c) return;
    c.cleaned = !c.cleaned; saveData(); renderWeekLists();
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id);
    if (!c || n(c.paidThisMonth) >= n(c.price)) return;
    const amt = n(c.price);
    c.paidThisMonth = amt;
    if(!c.paymentLogs) c.paymentLogs = [];
    c.paymentLogs.push({ date: new Date().toLocaleString('en-GB'), amount: amt, type: 'income', arrearsContext: null });
    saveData(); renderWeekLists(); renderStats();
};

window.handleDebtCollection = (id) => {
    const c = db.customers.find(x => x.id === id); if (!c) return;
    const totalOwed = (c.debtHistory || []).reduce((s,d)=>s+n(d.amount),0);
    const input = prompt(`Debt Recovery for ${c.name}: £${totalOwed.toFixed(2)}\nEnter amount paid:`, totalOwed.toFixed(2));
    if (input === null) return;
    const amt = n(input); if (amt <= 0) return;
    let context = ""; if(c.debtHistory.length > 0) context = `${c.debtHistory[0].month || ''} Clean: ${c.debtHistory[0].date}`;
    if(!c.paymentLogs) c.paymentLogs = [];
    c.paymentLogs.push({ date: new Date().toLocaleString('en-GB'), amount: amt, type: 'debt', arrearsContext: context });
    let rem = amt;
    for (let i = 0; i < (c.debtHistory || []).length; i++) {
        if (rem <= 0) break;
        if (c.debtHistory[i].amount <= rem) { rem -= c.debtHistory[i].amount; c.debtHistory.splice(i, 1); i--; }
        else { c.debtHistory[i].amount -= rem; rem = 0; }
    }
    saveData(); renderWeekLists(); renderStats();
};

window.renderStats = () => {
    const curMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if(document.getElementById('statsMonthTitle')) document.getElementById('statsMonthTitle').innerText = `${curMonth} Summary`;
    let totalIn = 0; db.customers.forEach(c => { (c.paymentLogs||[]).forEach(l => totalIn += n(l.amount)); });
    let totalOut = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let potentialVal = db.customers.reduce((sum, c) => sum + n(c.price), 0);
    let jobCollected = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let overdueVal = db.customers.reduce((sum, c) => sum + (c.debtHistory||[]).reduce((s,d)=>s+n(d.amount),0), 0);
    let progress = potentialVal > 0 ? (jobCollected / potentialVal) * 100 : 0;
    document.getElementById('currProfit').innerText = `£${(totalIn - totalOut).toFixed(2)}`;
    document.getElementById('currRevenue').innerText = `£${totalIn.toFixed(2)}`;
    document.getElementById('currSpend').innerText = `£${totalOut.toFixed(2)}`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('collectionPercent').innerText = `${Math.round(progress)}%`;
    document.getElementById('targetWork').innerText = `£${potentialVal.toFixed(2)}`;
    document.getElementById('stillToCollect').innerText = `£${Math.max(0, potentialVal - jobCollected).toFixed(2)}`;
    document.getElementById('totalOldDebt').innerText = `£${overdueVal.toFixed(2)}`;
    renderHistory();
};

window.renderHistory = () => {
    const hist = document.getElementById('monthlyHistoryContainer'); if (!hist) return;
    hist.innerHTML = '<h3 class="section-title" style="margin-top:35px; color: var(--qb-green); font-weight:800;">🏆 The Hall of Fame</h3>';
    if(db.history.length === 0) { hist.innerHTML += '<div class="card" style="text-align:center; opacity:0.5;">Month-end snapshots will appear here.</div>'; return; }
    db.history.forEach(h => {
        const net = n(h.income) - n(h.spend);
        const d = document.createElement('div'); d.className = 'history-item-card';
        d.innerHTML = `<div class="history-metrics-grid"><div class="metric-bubble b-profit"><small>${h.month}</small><strong>Net Profit £${net.toFixed(2)}</strong></div>
            <div class="metric-bubble b-collected"><small>Collected</small><strong>£${n(h.income).toFixed(2)}</strong></div>
            <div class="metric-bubble b-spent"><small>Spent</small><strong>£${n(h.spend).toFixed(2)}</strong></div>
            <div class="metric-bubble b-arrears"><small>Arrears Added</small><strong>£${n(h.debtCreated).toFixed(2)}</strong></div></div>`; 
        hist.appendChild(d);
    });
};

window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.renderLedger = () => {
    const list = document.getElementById('expenseList'); if(!list) return;
    list.innerHTML = '<h3 class="section-title">💸 Spend History</h3>';
    db.expenses.forEach(e => {
        const div = document.createElement('div'); div.className = 'card'; div.style.padding = '18px'; div.style.marginBottom = '10px';
        div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:900; color:var(--danger);">£${n(e.amt).toFixed(2)}</div></div>`;
        list.appendChild(div);
    });
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody'); if (!container) return;
    container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => { 
        const addr = (c.address || "").toLowerCase();
        if (c.name.toLowerCase().includes(search) || addr.includes(search)) {
            const row = document.createElement('div'); row.className = 'master-row';
            row.onclick = () => showCustDetails(c.id);
            const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
            row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address || 'No Address'}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}${d > 0 ? '<br><small style="color:var(--danger); font-weight:800;">ARREARS: £' + d.toFixed(2) + '</small>' : ''}</div>`;
            container.appendChild(row);
        }
    });
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
            card.innerHTML = `<div onclick="showCustDetails('${c.id}')"><strong style="font-size:19px; color:var(--accent);">${c.name}</strong><br><small style="opacity:0.6;">${c.address || 'No Address'}</small></div>
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large bounce-on-tap" style="color:#25D366" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large bounce-on-tap" style="color:#007AFF" onclick="handleSMS('${c.id}')">📱</button><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.address||'') + ' ' + (c.postcode||''))}" target="_blank" class="icon-btn-large bounce-on-tap" style="color:#ea4335">📍</a></div>
                <div class="status-row" style="${d > 0 ? 'grid-template-columns:repeat(3,1fr)' : 'grid-template-columns:1fr 1fr'}"><button class="action-btn-main bounce-on-tap ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done ✅' : 'Cleaned'}</button><button class="action-btn-main bounce-on-tap ${isPaid ? 'btn-paid-active' : 'btn-pay-pending'}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid 💰' : 'Pay £' + n(c.price).toFixed(2)}</button>${d > 0 ? `<button class="action-btn-main bounce-on-tap btn-debt-pending" onclick="handleDebtCollection('${c.id}')">Debt £${d.toFixed(2)}</button>` : ''}</div></div>`;
            container.appendChild(card);
        });
    }
};

window.showCustDetails = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const body = document.getElementById('modalContentBody');
    const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
    body.innerHTML = `<h2 style="margin-top:0; color:var(--accent);">${c.name}</h2><p>📍 ${c.address || 'N/A'} ${c.postcode || ''}</p><p>📞 ${c.phone || 'N/A'}</p><p>💰 Price: £${n(c.price).toFixed(2)}</p>${d > 0 ? `<p style="color:var(--danger); font-weight:bold; background:rgba(255,59,48,0.1); padding:10px; border-radius:10px;">Arrears: £${d.toFixed(2)}</p>` : ''}<p>📝 Notes: ${c.notes || 'No notes.'}</p><button class="btn-main full-width-btn" onclick="editCust('${c.id}')">⚙️ Edit</button>`;
    document.getElementById('globalModal').style.display = 'flex';
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    closeModal(); openTab(null, 'admin');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name;
    document.getElementById('cAddr').value = c.address; document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week; document.getElementById('cDay').value = c.day; document.getElementById('cNotes').value = c.notes;
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleDarkMode = () => { const d = document.getElementById('darkModeToggle').checked; document.body.className = d ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', d); };
window.runUATClear = () => { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };
window.addExpense = () => { 
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); 
    if(!d || a<=0) return; db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')}); saveData(); location.reload(); 
};

window.completeCycle = () => {
    if(!confirm("Archive Month? Cleaned/Unpaid jobs move to Arrears.")) return;
    const curLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    let mInc = 0; db.customers.forEach(c => { (c.paymentLogs||[]).forEach(l => mInc += n(l.amount)); });
    let mExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let nDebt = 0;
    db.customers.forEach(c => {
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            const bal = n(c.price) - n(c.paidThisMonth);
            if(!c.debtHistory) c.debtHistory = [];
            c.debtHistory.push({ date: new Date().toLocaleDateString('en-GB'), amount: bal, month: curLabel });
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
    const b = new Blob([c], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `HydroBackup.csv`; a.click();
};
window.importFullCSV = (e) => {
    const f = e.target.files[0], r = new FileReader();
    r.onload = (ev) => {
        const rows = ev.target.result.split('\n').slice(1);
        let imp = [];
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(cols.length > 5) {
                imp.push({ id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''), postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''), price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : "", cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] });
            }
        });
        db.customers = imp; saveData(); location.reload();
    };
    r.readAsText(f);
};
