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

/* --- 👥 MASTER LIST RENDERER (Restored Step 2) --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if (!container) return;
    container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    
    db.customers.forEach(c => {
        const nameMatch = c.name.toLowerCase().includes(search);
        const streetMatch = (c.street || "").toLowerCase().includes(search);
        
        if (nameMatch || streetMatch) {
            const div = document.createElement('div');
            div.className = 'CT-PILL';
            div.onclick = () => editCust(c.id);
            div.innerHTML = `
                <div class="CT-TEXT-STACK">
                    <strong>${c.name}</strong>
                    <small>${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:900; color:var(--success); font-size:26px;">
                    £${n(c.price).toFixed(2)}
                </div>
            `;
            container.appendChild(div);
        }
    });
};

/* --- CORE DATA ACTIONS --- */
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

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => { document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); renderAll(); };
window.renderAll = () => { renderMaster(); updateHeader(); }; 
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear month? Statuses reset but history is kept.")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); saveData(); location.reload(); } };
window.nuclearReset = () => { if(confirm("☢️ DELETE EVERYTHING?")) { if(confirm("FINAL WARNING?")) { localStorage.removeItem(DB_KEY); location.reload(); } } };

/* --- 💾 MASTER CSV ENGINE --- */
window.exportData = () => {
    const d = new Date().toLocaleDateString().replace(/\//g, '-');
    let csv = "\ufeff--- CUSTOMERS ---\nName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n";
    db.customers.forEach(c => { csv += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`; });
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const u = URL.createObjectURL(b);
    const l = document.createElement("a"); l.href = u; l.download = `HP_BACKUP_${d}.csv`; l.click();
};

window.importData = (event) => {
    const file = event.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = (e) => {
        const lines = e.target.result.split('\n');
        if(!confirm("Import data?")) return;
        let s = ""; lines.forEach(line => {
            const trim = line.trim(); if(!trim) return;
            if(trim.includes("--- CUSTOMERS ---")) { s = "C"; return; }
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cl = (v) => (v||"").replace(/"/g, "").trim();
            if(s === "C" && cols.length >= 7) { db.customers.push({ id: Date.now().toString()+Math.random().toString(36).substr(2,5), name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]), postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])), week: cl(cols[7])||"1", notes: cl(cols[8])||"", cleaned: cl(cols[9])==="true", paidThisMonth: n(cl(cols[10])) }); }
        });
        saveData(); location.reload();
    }; r.readAsText(file);
};
