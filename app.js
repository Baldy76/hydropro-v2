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

/* --- 🛡️ TAB PROTECTION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- 📊 STATS DASHBOARD --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let t = 0, coll = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    db.customers.forEach(c => { t += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => { const cat = (e.cat||"").toLowerCase(); if(cat.includes('fuel')) fuel += n(e.amt); else if(cat.includes('gear')) gear += n(e.amt); else if(cat.includes('food')) food += n(e.amt); else misc += n(e.amt); });
    const spend = fuel + gear + food + misc;
    const prog = t > 0 ? Math.min(Math.round((coll / t) * 100), 100) : 0;
    container.innerHTML = `<div class="ST-HERO"><small>Net Profit</small><div>£${(coll - spend).toFixed(2)}</div></div><div class="ST-GRID"><div class="ST-BUBBLE"><small>Income</small><strong>£${coll.toFixed(2)}</strong></div><div class="ST-BUBBLE"><small>Spend</small><strong>£${spend.toFixed(2)}</strong></div></div><div class="ST-PROG-PLATE" style="background:var(--card); padding:30px; border-radius:40px; margin:0 30px 30px;"><div style="display:flex; justify-content:space-between; font-weight:900;"><span>PROGRESS</span><span>${prog}%</span></div><div style="background:var(--ios-grey); height:20px; border-radius:15px; margin-top:15px; overflow:hidden;"><div style="background:var(--accent); width:${prog}%; height:100%; transition:1s;"></div></div></div>`;
};

/* --- SHARED CORE --- */
window.renderAll = () => { renderMaster(); renderStats(); renderLedger(); updateHeader(); if(typeof renderWeek === 'function') renderWeek(); };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
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
/* --- (Rest of weather, ledger, save, and nuclear logic exactly as v40.1) --- */
async function initWeather() { const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }; navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { document.getElementById('w-text').innerText = "OFFLINE"; } }, (err) => { document.getElementById('w-text').innerText = "GPS REQ"; }, options); }
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value; if(!d || a <= 0) return alert("Details Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.nuclearReset = () => { if(confirm("☢️ NUCLEAR RESET: Delete everything?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Name required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: document.getElementById('cWeek').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0 }); saveData(); alert("Added!"); document.getElementById('cName').value = ''; };
window.openEditModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price || 0; document.getElementById('editModal').classList.remove('hidden'); };
window.updateCustomerFromModal = () => { const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id); if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); saveData(); closeEditModal(); renderMaster(); } };
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "Name,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.day}","${c.price}","${c.week}","${c.notes}"\n`; }); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_BACKUP_${d}.csv`; l.click(); };
window.renderLedger = () => { const list = document.getElementById('ledger-list-container'); if(!list) return; list.innerHTML = ''; let total = 0; db.expenses.slice().reverse().forEach(e => { total += n(e.amt); const div = document.createElement('div'); div.className = 'LD-PILL'; div.innerHTML = `<div style="text-align:left;"><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:22px;">-£${n(e.amt).toFixed(2)}</div>`; list.appendChild(div); }); document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`; };
