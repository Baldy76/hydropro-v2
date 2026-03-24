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
        updateHeader(); renderAll(); initWeather();
        
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        const cb = document.getElementById('themeCheckbox');
        if(cb) {
            cb.checked = isDark;
            cb.addEventListener('change', (e) => {
                const dark = e.target.checked;
                document.body.classList.toggle('dark-mode', dark);
                localStorage.setItem('HP_Theme', dark);
            });
        }
    } catch(e) { console.error("Boot Error", e); }
});

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderStats = () => {
    const container = document.getElementById('stats-dashboard-container'); if(!container) return;
    let target = 0, coll = 0, spend = 0, arrears = 0;
    db.customers.forEach(c => { 
        target += n(c.price); coll += n(c.paidThisMonth); 
        if(c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const net = coll - spend;
    const prog = target > 0 ? Math.min(Math.round((coll / target) * 100), 100) : 0;
    container.innerHTML = `
        <div class="ST-HERO"><small style="opacity:0.4;">NET PROFIT</small><div style="color:${net>=0?'var(--success)':'var(--danger)'}">£${net.toFixed(2)}</div></div>
        ${arrears > 0 ? `<div class="ST-ARREARS-VAULT"><small>Total Arrears</small><div>£${arrears.toFixed(2)}</div></div>` : ''}
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
            <div style="width:170px; background:var(--card); padding:20px; border-radius:30px; text-align:center;"><small style="opacity:0.5;">INCOME</small><br><strong>£${coll.toFixed(2)}</strong></div>
            <div style="width:170px; background:var(--card); padding:20px; border-radius:30px; text-align:center;"><small style="opacity:0.5;">SPENT</small><br><strong>£${spend.toFixed(2)}</strong></div>
        </div>
        <div style="background:var(--card); margin:0 25px 25px; padding:30px; border-radius:40px;">
            <div style="display:flex; justify-content:space-between; font-weight:900;"><span>PROGRESS</span><span>${prog}%</span></div>
            <div style="background:var(--ios-grey); height:15px; border-radius:10px; overflow:hidden; margin-top:10px;"><div style="width:${prog}%; background:${prog>=100?'var(--success)':'var(--accent)'}; height:100%;"></div></div>
        </div>`;
};

window.renderMaster = () => {
    const list = document.getElementById('master-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.style = "background:var(--card); padding:25px; border-radius:35px; margin:0 25px 15px; display:flex; justify-content:space-between; align-items:center;";
            div.onclick = () => openEditModal(c.id);
            div.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Required");
    db.customers.push({ 
        id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, 
        houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, 
        postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), 
        notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" 
    });
    saveData(); alert("Saved!"); location.reload();
};

/* Shared Boilerplate */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { updateHeader(); renderMaster(); if(document.getElementById('stats-root').classList.contains('active')) renderStats(); if(document.getElementById('week-view-root').classList.contains('active')) renderWeek(); };
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN-LOCKED').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div');
        div.style = "background:var(--card); padding:25px; border-radius:35px; margin:0 25px 15px; display:flex; justify-content:space-between; align-items:center;";
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900;">£${n(c.price).toFixed(2)}</div>`;
        list.appendChild(div);
    });
};
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { localStorage.removeItem(DB_KEY); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
