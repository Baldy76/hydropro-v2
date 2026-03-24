const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.history) db.history = [];
        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🛡️ SEARCH LOGIC LOCKED --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        const match = c.name.toLowerCase().includes(search) || 
                      (c.street||"").toLowerCase().includes(search) || 
                      (c.postcode||"").toLowerCase().includes(search);
        if(match) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px; box-shadow:0 8px 15px rgba(0,0,0,0.04); flex-shrink:0;";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800; text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 📊 BRIEFING POPUP (ENHANCED HISTORY) --- */
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    
    // Get last 3 history items and MISSES
    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let htm = '<span class="HIST-LABEL">Transaction History (Red = Out/Paid)</span><div class="HIST-BOX">';
    
    if(history.length === 0) {
        htm += '<p style="opacity:0.5; font-size:14px; font-weight:800; text-align:center;">No recent transactions found.</p>';
    } else {
        history.forEach(h => {
            htm += `<div class="HIST-ROW"><span>${h.date}</span><span>£${n(h.amt).toFixed(2)}</span></div>`;
        });
    }
    htm += '</div>';

    document.getElementById('briefingData').innerHTML = `
        <div style="font-size:36px; font-weight:950; color:var(--accent);">${c.name}</div>
        <div style="margin:25px 0; display:flex; flex-direction:column; gap:12px;">
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800;">🏠 ${c.houseNum} ${c.street} [${c.postcode||''}]</div>
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800;">📱 ${c.phone||'No Number'}</div>
            <div style="background:var(--bg); padding:20px; border-radius:20px; font-weight:800; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div>
        </div>`;
    
    document.getElementById('briefHistoryZone').innerHTML = htm;
    
    const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0;
    document.getElementById('quickSettleContainer').innerHTML = currentOwed > 0 ? `<button style="width:100%; height:80px; background:var(--success); color:white; border:none; border-radius:22px; font-weight:900; font-size:20px; margin-bottom:15px;" onclick="quickSettle('${c.id}', ${currentOwed})">💰 SETTLE £${currentOwed} NOW</button>` : '';
    document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); openEditModal(id); };
    document.getElementById('briefingModal').classList.remove('hidden');
};

/* --- CORE FUNCTIONS --- */
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); const a = document.getElementById(id); if(a) { a.classList.add('active'); window.scrollTo(0,0); renderAll(); } };
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.renderAll = () => { renderMaster(); if(document.getElementById('stats-root').classList.contains('active')) renderStats(); updateHeader(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) }); saveData(); closeBriefing(); renderAll(); };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return alert("Required"); db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, week: "1", price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0 }); saveData(); alert("Saved!"); location.reload(); };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
window.openEditModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price; document.getElementById('editModal').classList.remove('hidden'); };
window.updateCustomerFromModal = () => { const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id); if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); saveData(); closeEditModal(); renderMaster(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
