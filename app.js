const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

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

/* --- 📊 STATS DASHBOARD REBUILD --- */
window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    
    db.customers.forEach(c => { target += n(c.price); coll += n(c.paidThisMonth); });
    db.expenses.forEach(e => {
        const cat = (e.cat||"").toLowerCase();
        if(cat.includes('fuel')) fuel += n(e.amt);
        else if(cat.includes('gear')) gear += n(e.amt);
        else if(cat.includes('food')) food += n(e.amt);
        else misc += n(e.amt);
    });
    
    const spend = fuel + gear + food + misc;
    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;

    container.innerHTML = `
        <div class="ST-HERO">
            <small>Net Monthly Profit</small>
            <div style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">£${net.toFixed(2)}</div>
        </div>

        <div class="ST-GRID">
            <div class="ST-BUBBLE"><span>💰</span><small>Income</small><strong>£${coll.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE"><span>💸</span><small>Spent</small><strong>£${spend.toFixed(2)}</strong></div>
        </div>

        <div class="ST-PROG-PLATE">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>MONTHLY TARGET</span><span>${prog}%</span></div>
            <div class="ST-PROG-BAR"><div class="ST-PROG-FILL" style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'};"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:900; opacity:0.4;">
                <span>COLLECTED: £${coll}</span><span>GOAL: £${target}</span>
            </div>
        </div>

        <div class="ST-LIST-CARD">
            <h4 style="margin:0 0 20px 0; opacity:0.4; text-transform:uppercase;">Expense Breakdown</h4>
            <div class="ST-ITEM"><span>⛽ Fuel</span><span>£${fuel.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🛠️ Gear</span><span>£${gear.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🍔 Food</span><span>£${food.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>📦 Misc</span><span>£${misc.toFixed(2)}</span></div>
            <div class="ST-TOTAL-LINE"><span>TOTAL SPEND</span><span>£${spend.toFixed(2)}</span></div>
        </div>
    `;
};

/* --- 💸 LEDGER CORE --- */
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); renderLedger(); renderStats();
    document.getElementById('expDesc').value=''; document.getElementById('expAmt').value='';
};

window.renderLedger = () => {
    const list = document.getElementById('ledger-list-container'); if(!list) return;
    list.innerHTML = ''; let total = 0;
    db.expenses.slice().reverse().forEach(e => {
        total += n(e.amt);
        const div = document.createElement('div'); div.className = 'LD-PILL';
        div.style="background:var(--card); padding:30px; border-radius:40px; display:flex; justify-content:space-between; margin:0 30px 20px; border-left:10px solid var(--danger); box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
        div.innerHTML = `<div style="text-align:left;"><strong>${e.cat} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:22px;">-£${n(e.amt).toFixed(2)}</div>`;
        list.appendChild(div);
    });
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
};

/* --- SHARED CORE --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.renderAll = () => { renderMaster(); renderStats(); renderLedger(); updateHeader(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.openEditModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price || 0; document.getElementById('eNotes').value = c.notes || '';
    document.getElementById('editModal').classList.remove('hidden');
};
window.updateCustomerFromModal = () => {
    const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); db.customers[idx].notes = document.getElementById('eNotes').value; saveData(); closeEditModal(); renderMaster(); }
};
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
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.exportData = () => { const d = new Date().toLocaleDateString().replace(/\//g, '-'); let csv = "Name,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.day}","${c.price}","${c.week}","${c.notes}"\n`; }); const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `HP_BACKUP_${d}.csv`; l.click(); };
async function initWeather() { const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }; navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { document.getElementById('w-text').innerText = "OFFLINE"; } }, (err) => { document.getElementById('w-text').innerText = "GPS REQ"; }, options); }
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
