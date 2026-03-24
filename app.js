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

/* --- 📊 STATS RESTORED --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, collected = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    
    db.customers.forEach(c => { target += n(c.price); collected += n(c.paidThisMonth); });
    db.expenses.forEach(e => {
        const cat = (e.cat||"").toLowerCase();
        if(cat.includes('fuel')) fuel += n(e.amt);
        else if(cat.includes('gear')) gear += n(e.amt);
        else if(cat.includes('food')) food += n(e.amt);
        else misc += n(e.amt);
    });
    
    const spend = fuel + gear + food + misc;
    const profit = collected - spend;
    const prog = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="ST-GRID">
            <div class="ST-BUBBLE">INCOME<strong>£${collected.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE">SPEND<strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div class="ST-PROG-CARD">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>ROUND PROGRESS</span><span>${prog}%</span></div>
            <div class="ST-PROG-TRACK"><div class="ST-PROG-FILL" style="width:${prog}%"></div></div>
        </div>
        <div class="SU-CARD" style="margin:0 30px;">
            <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>⛽ Fuel</span><span>£${fuel.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>🛠️ Gear</span><span>£${gear.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>🍔 Food</span><span>£${food.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; padding:15px 0; font-weight:800;"><span>📦 Misc</span><span>£${misc.toFixed(2)}</span></div>
        </div>
    `;
};

/* --- 💸 LEDGER RESTORED --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); renderLedger(); renderStats();
    document.getElementById('expDesc').value = ''; document.getElementById('expAmt').value = '';
};

window.renderLedger = () => {
    const list = document.getElementById('ledger-list-container'); if(!list) return;
    list.innerHTML = ''; let total = 0;
    db.expenses.slice().reverse().forEach(e => {
        total += n(e.amt);
        const div = document.createElement('div'); div.className = 'LD-PILL';
        div.ondblclick = () => { if(confirm("Delete?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
        div.innerHTML = `<div style="text-align:left;"><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:22px;">-£${n(e.amt).toFixed(2)}</div>`;
        list.appendChild(div);
    });
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
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
    if(jobs.length === 0) { list.innerHTML = '<p style="text-align:center; padding:100px 0; opacity:0.3; font-weight:900;">NO JOBS SCHEDULED</p>'; return; }
    jobs.forEach(c => {
        const div = document.createElement('div'); div.className = 'JOB-CARD';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `<div style="text-align:left;"><strong style="font-size:24px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:800; font-size:18px;">${c.houseNum} ${c.street}</small></div><div class="JOB-ACTIONS" onclick="event.stopPropagation()"><button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button><button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button><button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button><button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button></div>`;
        list.appendChild(div);
    });
};

/* --- 👥 MASTER & MODAL --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'CT-PILL';
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div class="CT-TEXT-STACK"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:26px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.openEditModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('eEditId').value = c.id;
    document.getElementById('eName').value = c.name;
    document.getElementById('ePhone').value = c.phone;
    document.getElementById('eHouseNum').value = c.houseNum;
    document.getElementById('eStreet').value = c.street;
    document.getElementById('ePostcode').value = c.postcode;
    document.getElementById('eDay').value = c.day;
    document.getElementById('eWeek').value = c.week;
    document.getElementById('ePrice').value = c.price;
    document.getElementById('eNotes').value = c.notes;
    document.getElementById('editModal').classList.remove('hidden');
};

window.updateCustomerFromModal = () => {
    const id = document.getElementById('eEditId').value;
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) {
        db.customers[idx].name = document.getElementById('eName').value;
        db.customers[idx].phone = document.getElementById('ePhone').value;
        db.customers[idx].houseNum = document.getElementById('eHouseNum').value;
        db.customers[idx].street = document.getElementById('eStreet').value;
        db.customers[idx].postcode = document.getElementById('ePostcode').value.toUpperCase();
        db.customers[idx].day = document.getElementById('eDay').value;
        db.customers[idx].week = document.getElementById('eWeek').value;
        db.customers[idx].price = n(document.getElementById('ePrice').value);
        db.customers[idx].notes = document.getElementById('eNotes').value;
        saveData(); closeEditModal(); renderMaster();
    }
};

/* --- SHARED CORE --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.renderAll = () => { renderMaster(); renderStats(); renderLedger(); updateHeader(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); renderLedger(); } };
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: document.getElementById('cWeek').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0 });
    saveData(); alert("Customer Added!"); document.getElementById('cName').value = '';
};
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "\ufeff--- CUSTOMERS ---\nName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`; }); csv += "\n\n--- EXPENSES ---\nDate,Category,Description,Amount\n"; db.expenses.forEach(e => { csv += `"${e.date}","${e.cat}","${e.desc}","${e.amt}"\n`; }); csv += "\n\n--- HISTORY ---\nDate,CustomerID,Amount\n"; db.history.forEach(h => { csv += `"${h.date}","${h.custId}","${h.amt}"\n`; }); const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_MASTER_${d}.csv`; l.click(); };
window.importData = (event) => { const file = event.target.files[0]; if(!file) return; const r = new FileReader(); r.onload = (e) => { const lines = e.target.result.split('\n'); if(!confirm("Import data?")) return; let s = ""; lines.forEach(line => { const trim = line.trim(); if(!trim) return; if(trim.includes("--- CUSTOMERS ---")) { s = "C"; return; } if(trim.includes("--- EXPENSES ---")) { s = "E"; return; } if(trim.includes("--- HISTORY ---")) { s = "H"; return; } if(trim.includes("Name,Phone") || trim.includes("Date,Category") || trim.includes("Date,CustomerID")) return; const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []; const cl = (v) => (v||"").replace(/"/g, "").trim(); if(s === "C" && cols.length >= 7) { db.customers.push({ id: Date.now().toString()+Math.random().toString(36).substr(2,5), name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]), postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])), week: cl(cols[7])||"1", notes: cl(cols[8])||"", cleaned: cl(cols[9])==="true", paidThisMonth: n(cl(cols[10])) }); } else if(s === "E" && cols.length >= 4) { db.expenses.push({ date: cl(cols[0]), cat: cl(cols[1]), desc: cl(cols[2]), amt: n(cl(cols[3])) }); } else if(s === "H" && cols.length >= 3) { db.history.push({ date: cl(cols[0]), custId: cl(cols[1]), amt: n(cl(cols[2])) }); } }); saveData(); location.reload(); }; r.readAsText(file); };
