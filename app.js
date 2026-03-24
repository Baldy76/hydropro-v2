const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
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
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
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

/* --- 📄 SMART RECEIPT ENGINE v38.6 --- */
window.sendSmsReceipt = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const msg = encodeURIComponent(`Hi ${c.name}, thanks for your payment of £${n(c.price).toFixed(2)} to Hydro Pro. Your windows are all sparkling! 🧼`);
    window.open(`sms:${c.phone}?&body=${msg}`);
};

window.printReceipt = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>HYDRO PRO</h1><p>PAID IN FULL</p><hr><p>Customer: ${c.name}</p><p>Amount: £${n(c.price).toFixed(2)}</p><button onclick="window.print()">PRINT NOW</button></body></html>`);
    win.document.close();
};

/* --- 📅 WEEKS --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { 
    workingDay = day; 
    document.querySelectorAll('.DAY-BTN').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); renderWeek(); 
};

window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay);
    if(jobs.length === 0) { list.innerHTML = '<p style="text-align:center; padding:80px; opacity:0.3; font-weight:900;">NO JOBS SCHEDULED</p>'; return; }
    jobs.forEach(c => {
        const div = document.createElement('div'); div.className = 'JOB-CARD';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div style="text-align:left;"><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small></div>
            <div class="JOB-ACTIONS" onclick="event.stopPropagation()">
                <button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button>
                <button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button>
                <button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button>
                <button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- BRIEFING --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let htm = ''; history.forEach(h => { htm += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`; });
    
    document.getElementById('briefingData').innerHTML = `
        <div style="font-size:36px; font-weight:900; color:var(--accent);">${c.name}</div>
        <div style="margin:25px 0; display:flex; flex-direction:column; gap:15px;">
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800;">🏠 ${c.houseNum} ${c.street}</div>
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div>
        </div>
        <div class="MD-HIST-WRAP"><small style="text-transform:uppercase; font-weight:900; opacity:0.4;">Payment History</small>${htm || '<p>No history</p>'}</div>
    `;
    
    const rBox = document.getElementById('receiptActionBox');
    rBox.innerHTML = n(c.paidThisMonth) > 0 ? `
        <button style="height:70px; background:#5856d6; color:white; border:none; border-radius:20px; font-weight:900; font-size:18px;" onclick="sendSmsReceipt('${c.id}')">💬 TEXT RECEIPT</button>
        <button style="height:70px; background:var(--ios-grey); color:var(--text); border:none; border-radius:20px; font-weight:900; font-size:18px;" onclick="printReceipt('${c.id}')">🖨️ PRINT / PDF</button>
    ` : '';

    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); editCust(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

/* --- CORE --- */
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: document.getElementById('cWeek').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: (db.customers.find(x=>x.id===id)||{cleaned:false}).cleaned, paidThisMonth: (db.customers.find(x=>x.id===id)||{paidThisMonth:0}).paidThisMonth };
    const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};
window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day; document.getElementById('cWeek').value = c.week; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "\ufeff--- CUSTOMERS ---\nName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`; }); csv += "\n\n--- EXPENSES ---\nDate,Category,Description,Amount\n"; db.expenses.forEach(e => { csv += `"${e.date}","${e.cat}","${e.desc}","${e.amt}"\n`; }); csv += "\n\n--- HISTORY ---\nDate,CustomerID,Amount\n"; db.history.forEach(h => { csv += `"${h.date}","${h.custId}","${h.amt}"\n`; }); const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_BACKUP_${d}.csv`; l.click(); };
window.importData = (event) => { const file = event.target.files[0]; if(!file) return; const r = new FileReader(); r.onload = (e) => { const lines = e.target.result.split('\n'); if(!confirm("Import data?")) return; let s = ""; lines.forEach(line => { const trim = line.trim(); if(!trim) return; if(trim.includes("--- CUSTOMERS ---")) { s = "C"; return; } if(trim.includes("--- EXPENSES ---")) { s = "E"; return; } if(trim.includes("--- HISTORY ---")) { s = "H"; return; } if(trim.includes("Name,Phone") || trim.includes("Date,Category") || trim.includes("Date,CustomerID")) return; const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []; const cl = (v) => (v||"").replace(/"/g, "").trim(); if(s === "C" && cols.length >= 7) { db.customers.push({ id: Date.now().toString()+Math.random().toString(36).substr(2,5), name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]), postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])), week: cl(cols[7])||"1", notes: cl(cols[8])||"", cleaned: cl(cols[9])==="true", paidThisMonth: n(cl(cols[10])) }); } else if(s === "E" && cols.length >= 4) { db.expenses.push({ date: cl(cols[0]), cat: cl(cols[1]), desc: cl(cols[2]), amt: n(cl(cols[3])) }); } else if(s === "H" && cols.length >= 3) { db.history.push({ date: cl(cols[0]), custId: cl(cols[1]), amt: n(cl(cols[2])) }); } }); saveData(); location.reload(); }; r.readAsText(file); };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.renderAll = () => { renderMaster(); renderLedger(); renderStats(); renderWeek(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); } };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value; if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.renderLedger = () => { const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = ''; let total = 0; db.expenses.forEach(e => total += n(e.amt)); document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`; db.expenses.slice().reverse().forEach(e => { const div = document.createElement('div'); div.className = 'LD-PILL'; div.style = "background:var(--card); padding:25px; border-radius:30px; display:flex; justify-content:space-between; margin:0 25px 15px; border-left:6px solid var(--danger);"; div.innerHTML = `<div><strong>${e.cat||'📦'} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`; container.appendChild(div); }); };
window.renderStats = () => { const container = document.getElementById('stats-container'); if(!container) return; let target = 0, paid = 0, spend = 0; db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); }); db.expenses.forEach(e => spend += n(e.amt)); const progress = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0; container.innerHTML = `<div class="ST-HERO"><div>£${(paid - spend).toFixed(2)}</div><small>NET PROFIT</small></div><div class="ST-GRID"><div class="ST-BUBBLE">INCOME<strong>£${paid.toFixed(2)}</strong></div><div class="ST-BUBBLE">SPEND<strong>£${spend.toFixed(2)}</strong></div></div><div class="ST-PROG-CARD" style="padding:25px; border-radius:35px; background:var(--card); margin:0 25px 25px;"><strong>Round Progress: ${progress}%</strong><div style="background:var(--bg); height:15px; border-radius:10px; margin-top:10px; overflow:hidden;"><div style="background:var(--accent); width:${progress}%; height:100%; transition:1s;"></div></div></div>`; };
window.renderMaster = () => { const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = ''; const search = (document.getElementById('mainSearch').value || "").toLowerCase(); db.customers.forEach(c => { if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) { const div = document.createElement('div'); div.className = 'CT-PILL'; div.onclick = () => editCust(c.id); div.innerHTML = `<div class="CT-TEXT-STACK"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`; container.appendChild(div); } }); };
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
