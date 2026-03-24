const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.history) db.history = [];
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        document.getElementById('themeCheckbox').checked = isDark;
        updateLogo(isDark);
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
            updateLogo(dark);
        });
        updateHeader(); renderAll();
        initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`;
            const res = await fetch(url);
            const data = await res.json();
            const iconMap = { "Clear": "☀️", "Clouds": "☁️", "Rain": "🌧️", "Drizzle": "🌦️", "Thunderstorm": "⛈️", "Snow": "❄️", "Mist": "🌫️" };
            document.getElementById('w-icon').innerText = iconMap[data.weather[0].main] || "🌤️";
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C ${data.weather[0].main.toUpperCase()}`;
        } catch (err) { document.getElementById('w-text').innerText = "API Offline"; }
    }, (err) => { document.getElementById('w-text').innerText = "GPS Offline"; }, options);
}

window.launchWeatherApp = () => {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
        window.location.href = "weather://";
        setTimeout(() => window.open("https://weather.com/", "_blank"), 500);
    } else { window.open("https://www.google.com/search?q=weather", "_blank"); }
};

/* --- 📄 RECEIPT ENGINE --- */
window.generateReceipt = (id) => {
    const c = db.customers.find(x => x.id === id); if (!c) return;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('receipt-zone').innerHTML = `
        <div style="text-align:center; padding:40px; background:white; color:black; font-family:sans-serif;">
            <img src="Logo.png" style="width:200px; margin-bottom:20px;">
            <h2 style="margin:0;">Payment Receipt</h2>
            <div class="paid-stamp">PAID IN FULL</div>
            <div style="text-align:left; line-height:2; border-top:1px solid #eee; padding-top:20px;">
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Customer:</strong> ${c.name}</p>
                <p><strong>Property:</strong> ${c.houseNum} ${c.street}, ${c.postcode}</p>
                <p style="font-size:24px; border-top:2px solid #000; padding-top:10px;"><strong>TOTAL PAID: £${n(c.price).toFixed(2)}</strong></p>
            </div>
            <p style="margin-top:40px; font-style:italic;">Thank you for your business!</p>
        </div>`;
    window.print();
};

/* --- 📅 WEEKS LOGIC --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { 
    workingDay = day; 
    document.querySelectorAll('.DAY-BTN').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); renderWeek(); 
};

window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay);
    if(jobs.length === 0) { list.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.4;">No jobs today.</p>'; return; }
    jobs.forEach(c => {
        const div = document.createElement('div'); div.className = 'JOB-CARD';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div class="CT-TEXT-STACK"><strong>${c.name} ${c.cleaned?'✅':''}</strong><small>${c.houseNum} ${c.street}</small></div>
            <div class="JOB-ACTIONS" onclick="event.stopPropagation()">
                <button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button>
                <button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button>
                <button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button>
                <button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- CORE DATABASE FUNCTIONS --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let histHtml = history.length > 0 ? '' : '<p style="opacity:0.4; font-size:13px; font-weight:600;">No recent activity.</p>';
    history.forEach(h => { histHtml += `<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`; });
    document.getElementById('briefingData').innerHTML = `<div style="font-size:28px; font-weight:900; color:var(--accent); margin-bottom:5px;">${c.name}</div><div style="margin:15px 0; display:flex; flex-direction:column; gap:10px;"><div style="background:var(--bg); padding:10px; border-radius:12px; font-weight:700;">🏠 ${c.houseNum} ${c.street}</div><div style="background:var(--bg); padding:10px; border-radius:12px; font-weight:700;">💰 Rate: £${n(c.price).toFixed(2)}</div></div><div class="MD-HIST-WRAP"><small style="text-transform:uppercase; font-weight:900; opacity:0.5;">Recent Payments</small>${histHtml}</div>`;
    document.getElementById('receiptButtonContainer').innerHTML = n(c.paidThisMonth) > 0 ? `<button style="width:100%; height:60px; background:#5856d6; color:white; border:none; border-radius:18px; font-weight:900; margin-bottom:10px;" onclick="generateReceipt('${c.id}')">📄 Share Receipt</button>` : '';
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); editCust(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: document.getElementById('cWeek').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: (db.customers.find(x=>x.id===id)||{cleaned:false}).cleaned, paidThisMonth: (db.customers.find(x=>x.id===id)||{paidThisMonth:0}).paidThisMonth };
    const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day || 'Mon'; document.getElementById('cWeek').value = c.week || '1'; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

/* --- 💾 MASTER CSV ENGINE --- */
window.exportData = () => {
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    let csv = "\ufeff--- CUSTOMERS ---\nName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n";
    db.customers.forEach(c => { csv += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`; });
    csv += "\n\n--- EXPENSES ---\nDate,Category,Description,Amount\n";
    db.expenses.forEach(e => { csv += `"${e.date}","${e.cat}","${e.desc}","${e.amt}"\n`; });
    csv += "\n\n--- HISTORY ---\nDate,CustomerID,Amount\n";
    db.history.forEach(h => { csv += `"${h.date}","${h.custId}","${h.amt}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `HP_MASTER_BACKUP_${date}.csv`; link.click();
};

window.importData = (event) => {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        if(!confirm("Import this data?")) return;
        let section = "";
        lines.forEach(line => {
            const trim = line.trim(); if(!trim) return;
            if(trim.includes("--- CUSTOMERS ---")) { section = "C"; return; }
            if(trim.includes("--- EXPENSES ---")) { section = "E"; return; }
            if(trim.includes("--- HISTORY ---")) { section = "H"; return; }
            if(trim.includes("Name,Phone") || trim.includes("Date,Category") || trim.includes("Date,CustomerID")) return;
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cl = (v) => (v||"").replace(/"/g, "").trim();
            if(section === "C" && cols.length >= 7) { db.customers.push({ id: Date.now().toString()+Math.random().toString(36).substr(2,5), name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]), postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])), week: cl(cols[7])||"1", notes: cl(cols[8])||"", cleaned: cl(cols[9])==="true", paidThisMonth: n(cl(cols[10])) }); }
            else if(section === "E" && cols.length >= 4) { db.expenses.push({ date: cl(cols[0]), cat: cl(cols[1]), desc: cl(cols[2]), amt: n(cl(cols[3])) }); }
            else if(section === "H" && cols.length >= 3) { db.history.push({ date: cl(cols[0]), custId: cl(cols[1]), amt: n(cl(cols[2])) }); }
        });
        saveData(); location.reload();
    };
    reader.readAsText(file);
};

/* --- SHARED --- */
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); } };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value; if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.renderLedger = () => { const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = ''; let total = 0; db.expenses.forEach(e => total += n(e.amt)); document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`; db.expenses.slice().reverse().forEach(e => { const div = document.createElement('div'); div.className = 'LD-PILL'; div.innerHTML = `<div><strong>${e.cat||'📦'} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`; container.appendChild(div); }); };
window.renderStats = () => { const container = document.getElementById('stats-container'); if(!container) return; let targetIncome = 0, paid = 0, totalSpend = 0; db.customers.forEach(c => { targetIncome += n(c.price); paid += n(c.paidThisMonth); }); db.expenses.forEach(e => { totalSpend += n(e.amt); }); const progressPercent = targetIncome > 0 ? Math.min(Math.round((paid / targetIncome) * 100), 100) : 0; container.innerHTML = `<div class="ST-HERO"><div>£${(paid - totalSpend).toFixed(2)}</div><small>NET PROFIT</small></div><div class="ST-GRID"><div class="ST-BUBBLE">INCOME<strong>£${paid.toFixed(2)}</strong></div><div class="ST-BUBBLE">SPEND<strong>£${totalSpend.toFixed(2)}</strong></div></div><div class="ST-PROG-CARD"><strong>Round Progress: ${progressPercent}%</strong><div class="ST-PROG-TRACK"><div class="ST-PROG-FILL" style="width:${progressPercent}%"></div></div></div>`; };
window.renderMaster = () => { const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = ''; const search = (document.getElementById('mainSearch').value || "").toLowerCase(); db.customers.forEach(c => { if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) { const div = document.createElement('div'); div.className = 'CT-PILL'; div.onclick = () => editCust(c.id); div.innerHTML = `<div class="CT-TEXT-STACK"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`; container.appendChild(div); } }); };
window.updateLogo = (isDark) => { const logoImg = document.getElementById('mainLogo'); if(logoImg) logoImg.src = isDark ? 'Logo-Dark.png' : 'Logo.png'; };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.renderAll = () => { renderMaster(); renderLedger(); renderStats(); renderWeek(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear month? Statuses reset but history is kept.")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { if(confirm("FINAL WARNING?")) { localStorage.removeItem(DB_KEY); location.reload(); } } };
