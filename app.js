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
        updateHeader(); renderAll(); initWeather();
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
        } catch (err) { document.getElementById('w-text').innerText = "OFFLINE"; }
    }, (err) => { document.getElementById('w-text').innerText = "GPS REQUIRED"; }, options);
}

window.launchWeatherApp = () => {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
        window.location.href = "weather://";
        setTimeout(() => window.open("https://weather.com/", "_blank"), 500);
    } else { window.open("https://www.google.com/search?q=weather", "_blank"); }
};

/* --- 🛡️ NUCLEAR RESET (Double Warning) --- */
window.nuclearReset = () => {
    if(confirm("☢️ WARNING: This will permanently DELETE all customers, expenses, and history. Are you absolutely sure?")) {
        if(confirm("⚠️ FINAL WARNING: There is no undo. Delete everything and start from scratch?")) {
            localStorage.removeItem(DB_KEY);
            location.reload();
        }
    }
};

/* --- TAB ENGINE --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- RENDERERS --- */
window.renderAll = () => { 
    renderMaster(); 
    if(document.getElementById('stats-root').classList.contains('active')) renderStats();
    if(document.getElementById('ledger-root').classList.contains('active')) renderLedger();
    updateHeader(); 
};

window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return;
    container.innerHTML = '';
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

/* --- SHARED CORE --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: document.getElementById('cWeek').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0 });
    saveData(); alert("Added!"); document.getElementById('cName').value = '';
};
window.openEditModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePhone').value = c.phone || ''; document.getElementById('eHouseNum').value = c.houseNum || ''; document.getElementById('eStreet').value = c.street || ''; document.getElementById('ePostcode').value = c.postcode || ''; document.getElementById('eDay').value = c.day || 'Mon'; document.getElementById('eWeek').value = c.week || '1'; document.getElementById('ePrice').value = c.price || 0; document.getElementById('eNotes').value = c.notes || '';
    document.getElementById('editModal').classList.remove('hidden');
};
window.updateCustomerFromModal = () => {
    const id = document.getElementById('eEditId').value;
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) {
        db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].phone = document.getElementById('ePhone').value; db.customers[idx].houseNum = document.getElementById('eHouseNum').value; db.customers[idx].street = document.getElementById('eStreet').value; db.customers[idx].postcode = document.getElementById('ePostcode').value.toUpperCase(); db.customers[idx].day = document.getElementById('eDay').value; db.customers[idx].week = document.getElementById('eWeek').value; db.customers[idx].price = n(document.getElementById('ePrice').value); db.customers[idx].notes = document.getElementById('eNotes').value;
        saveData(); closeEditModal(); renderMaster();
    }
};
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let t = 0, collected = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    db.customers.forEach(c => { t += n(c.price); collected += n(c.paidThisMonth); });
    db.expenses.forEach(e => { const cat = (e.cat||"").toLowerCase(); if(cat.includes('fuel')) fuel += n(e.amt); else if(cat.includes('gear')) gear += n(e.amt); else if(cat.includes('food')) food += n(e.amt); else misc += n(e.amt); });
    const spend = fuel + gear + food + misc;
    const prog = t > 0 ? Math.min(Math.round((collected / t) * 100), 100) : 0;
    container.innerHTML = `<div class="ST-HERO"><div>£${(collected - spend).toFixed(2)}</div><small>NET PROFIT</small></div><div class="ST-GRID"><div class="ST-BUBBLE">INCOME<strong>£${collected.toFixed(2)}</strong></div><div class="ST-BUBBLE">SPEND<strong>£${spend.toFixed(2)}</strong></div></div><div class="ST-PROG-CARD"><strong>Progress: ${prog}%</strong><div style="background:var(--bg); height:20px; border-radius:15px; margin-top:15px; overflow:hidden;"><div style="background:var(--accent); width:${prog}%; height:100%; transition:1s;"></div></div></div>`;
};
window.renderLedger = () => {
    const list = document.getElementById('ledger-list-container'); if(!list) return;
    list.innerHTML = ''; let total = 0;
    db.expenses.slice().reverse().forEach(e => { total += n(e.amt); const div = document.createElement('div'); div.className = 'LD-PILL'; div.innerHTML = `<div style="text-align:left;"><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:22px;">-£${n(e.amt).toFixed(2)}</div>`; list.appendChild(div); });
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
};
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "\ufeff--- CUSTOMERS ---\nName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`; }); const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_MASTER_${d}.csv`; l.click(); };
window.importData = (event) => { const file = event.target.files[0]; if(!file) return; const r = new FileReader(); r.onload = (e) => { const lines = e.target.result.split('\n'); if(!confirm("Import?")) return; let s = ""; lines.forEach(line => { const trim = line.trim(); if(!trim) return; if(trim.includes("--- CUSTOMERS ---")) { s = "C"; return; } const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []; const cl = (v) => (v||"").replace(/"/g, "").trim(); if(s === "C" && cols.length >= 7) { db.customers.push({ id: Date.now().toString()+Math.random().toString(36).substr(2,5), name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]), postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])), week: cl(cols[7])||"1", notes: cl(cols[8])||"", cleaned: cl(cols[9])==="true", paidThisMonth: n(cl(cols[10])) }); } }); saveData(); location.reload(); }; r.readAsText(file); };
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.DAY-BTN').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => { const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = ''; const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay); jobs.forEach(c => { const div = document.createElement('div'); div.className = 'JOB-CARD'; div.onclick = () => showJobBriefing(c.id); div.innerHTML = `<div style="text-align:left;"><strong style="font-size:24px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:800; font-size:18px;">${c.houseNum} ${c.street}</small></div><div class="JOB-ACTIONS" onclick="event.stopPropagation()"><button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button><button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button><button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button><button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button></div>`; list.appendChild(div); }); };
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); renderLedger(); } };
window.showJobBriefing = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse(); let htm = ''; history.forEach(h => { htm += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800; font-size:16px;"><span>${h.date}</span><span style="color:var(--success)">+£${n(h.amt).toFixed(2)}</span></div>`; }); document.getElementById('briefingData').innerHTML = `<div style="font-size:40px; font-weight:900; color:var(--accent);">${c.name}</div><div style="margin:30px 0; display:flex; flex-direction:column; gap:12px;"><div style="background:var(--bg); padding:25px; border-radius:25px; font-weight:800; font-size:20px;">🏠 ${c.houseNum} ${c.street}</div><div style="background:var(--bg); padding:25px; border-radius:25px; font-weight:800; font-size:20px; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div></div><div class="MD-HIST-WRAP"><small style="text-transform:uppercase; font-weight:900; opacity:0.4; font-size:12px;">Recent Payments</small>${htm || '<p>No history</p>'}</div>`; document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); openEditModal(id); }; document.getElementById('briefingModal').classList.remove('hidden'); };
