const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], bank: { name:'', sort:'', acc:'' }, history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;
let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) db = JSON.parse(saved);
        if (!db.bank) db.bank = { name:'', sort:'', acc:'' };
        
        // Restore Theme
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        const cb = document.getElementById('themeCheckbox');
        if(cb) {
            cb.checked = isDark;
            cb.addEventListener('change', (e) => {
                document.body.classList.toggle('dark-mode', e.target.checked);
                localStorage.setItem('HP_Theme', e.target.checked);
            });
        }

        // Restore Bank inputs
        if(document.getElementById('bName')) {
            document.getElementById('bName').value = db.bank.name;
            document.getElementById('bSort').value = db.bank.sort;
            document.getElementById('bAcc').value = db.bank.acc;
        }

        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🛡️ ENGINE ROOM --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) a.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.sort = document.getElementById('bSort').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData(); alert("Bank details bolted! 🔒");
};

/* --- 📅 WEEK LOGIC RESTORED --- */
window.handleClean = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(c) { c.cleaned = !c.cleaned; saveData(); renderWeek(); }
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id);
    const amt = prompt(`Amount paid by ${c.name}:`, c.price);
    if(amt !== null) {
        c.paidThisMonth = n(amt);
        db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) });
        saveData(); renderWeek();
    }
};

window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div');
        div.className = 'VAULT-CARD';
        div.style = "display:flex; justify-content:space-between; align-items:center; margin:10px 20px;";
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div>
            <div style="display:flex; gap:10px;">
                <button onclick="event.stopPropagation(); handleClean('${c.id}')" style="background:${c.cleaned?'#34C759':'#aaa'}; border:none; border-radius:10px; padding:10px;">🧼</button>
                <button onclick="event.stopPropagation(); markAsPaid('${c.id}')" style="background:${n(c.paidThisMonth)>0?'#007aff':'#aaa'}; border:none; border-radius:10px; padding:10px;">£</button>
            </div>`;
        list.appendChild(div);
    });
};

/* --- (Stats, Master, Utility remain as per v42.7 but verified for IDs) --- */
window.renderAll = () => {
    const el = document.getElementById('dateText');
    if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    renderMaster();
    if(document.getElementById('stats-root').classList.contains('active')) renderStats();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
};

async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.launchWeatherApp = () => { window.open("https://weather.com/", "_blank"); };
