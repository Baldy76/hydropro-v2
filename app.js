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
        if (!db.bank) db.bank = { name: '', sort: '', acc: '' };
        
        const isDark = localStorage.getItem('HP_Theme') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        document.getElementById('themeCheckbox').checked = isDark;
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
        });

        // Pre-fill Bank Details
        document.getElementById('bName').value = db.bank.name || '';
        document.getElementById('bSort').value = db.bank.sort || '';
        document.getElementById('bAcc').value = db.bank.acc || '';

        updateHeader(); renderAll(); initWeather();
    } catch(e) { console.error("Boot Error", e); }
});

/* --- 🏦 BANK STORAGE --- */
window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.sort = document.getElementById('bSort').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData();
    alert("Bank Details Secured! 🏦");
};

/* --- 🛡️ VAULT NAVIGATION --- */
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const a = document.getElementById(id);
    if(a) { a.classList.add('active'); window.scrollTo(0,0); renderAll(); }
};

/* --- ☢️ NUCLEAR RESET --- */
window.nuclearReset = () => {
    if(confirm("☢️ WARNING: This will permanently DELETE all customers, bank details, and history.")) {
        if(confirm("⚠️ ARE YOU SURE? There is no undo.")) {
            if(confirm("🛑 FINAL CONFIRMATION: Wipe all data?")) {
                localStorage.removeItem(DB_KEY);
                location.reload();
            }
        }
    }
};

/* --- 💾 MASTER CSV ENGINE --- */
window.exportData = () => {
    const d = new Date().toLocaleDateString().replace(/\//g, '-');
    let csv = "Name,Phone,HouseNum,Street,Postcode,Price,Notes\n";
    db.customers.forEach(c => {
        csv += `"${c.name}","${c.phone}","${c.houseNum}","${c.street}","${c.postcode}","${c.price}","${(c.notes||'').replace(/"/g,'""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HP_FORTRESS_BACKUP_${d}.csv`;
    link.click();
};

window.importData = (event) => {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        if(!confirm("Overwrite existing data with this file?")) return;
        lines.forEach((line, index) => {
            if(index === 0 || !line.trim()) return;
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cl = (v) => (v||"").replace(/"/g, "").trim();
            if(cols.length >= 6) {
                db.customers.push({ 
                    id: Date.now().toString() + Math.random(), 
                    name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), 
                    street: cl(cols[3]), postcode: cl(cols[4]), price: n(cols[5]), 
                    notes: cl(cols[6])||"", cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" 
                });
            }
        });
        saveData(); location.reload();
    };
    reader.readAsText(file);
};

/* --- SHARED LIBS --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const el = document.getElementById('dateText'); if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.renderAll = () => { updateHeader(); renderMaster(); if(document.getElementById('stats-root').classList.contains('active')) renderStats(); if(document.getElementById('week-view-root').classList.contains('active')) renderWeek(); };
window.saveCustomer = () => { const name = document.getElementById('cName').value; if(!name) return alert("Required"); db.customers.push({ id: Date.now().toString(), name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, week: "1", day: "Mon" }); saveData(); alert("Saved!"); location.reload(); };
window.renderMaster = () => { const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = ''; const search = (document.getElementById('mainSearch')?.value || "").toLowerCase(); db.customers.forEach(c => { const match = c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search); if(match) { const div = document.createElement('div'); div.style = "background:var(--card); padding:25px 30px; border-radius:40px; display:flex; justify-content:space-between; align-items:center; margin:0 25px 15px; height:120px !important; box-shadow:0 8px 15px rgba(0,0,0,0.04);"; div.onclick = () => openEditModal(c.id); div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small style="font-size:16px; color:var(--accent); font-weight:800; text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:22px;">£${n(c.price).toFixed(2)}</div>`; container.appendChild(div); } }); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.closeEditModal = () => document.getElementById('editModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear Month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
async function initWeather() { navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); document.getElementById('w-icon').innerText = "🌤️"; document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`; } catch (err) { } }); }
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.D-BTN-LOCKED').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => { const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = ''; const jobs = db.customers.filter(c => c.week == curWeek && c.day == workingDay); jobs.forEach(c => { const div = document.createElement('div'); div.style = "background:var(--card); padding:25px; border-radius:40px; margin:0 25px 15px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 8px 15px rgba(0,0,0,0.03);"; div.onclick = () => showJobBriefing(c.id); div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="font-weight:800; color:var(--accent); text-transform:uppercase;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; font-size:20px;">£${n(c.price).toFixed(2)}</div>`; list.appendChild(div); }); };
window.openEditModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('eEditId').value = c.id; document.getElementById('eName').value = c.name; document.getElementById('ePrice').value = c.price; document.getElementById('editModal').classList.remove('hidden'); };
window.updateCustomerFromModal = () => { const id = document.getElementById('eEditId').value; const idx = db.customers.findIndex(c => c.id === id); if(idx > -1) { db.customers[idx].name = document.getElementById('eName').value; db.customers[idx].price = n(document.getElementById('ePrice').value); saveData(); closeEditModal(); renderMaster(); } };
window.showJobBriefing = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const currentOwed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : 0; document.getElementById('briefingData').innerHTML = `<div style="font-size:36px; font-weight:950; color:var(--accent);">${c.name}</div><div style="margin:25px 0; display:flex; flex-direction:column; gap:10px;"><div style="background:var(--bg); padding:18px; border-radius:18px; font-weight:800;">🏠 ${c.houseNum} ${c.street} [${c.postcode||''}]</div><div style="background:var(--bg); padding:18px; border-radius:18px; font-weight:800; color:var(--success);">💰 Rate: £${n(c.price).toFixed(2)}</div></div>`; document.getElementById('quickSettleContainer').innerHTML = currentOwed > 0 ? `<button style="width:100%; height:80px; background:var(--success); color:white; border:none; border-radius:22px; font-weight:900; font-size:20px; margin-bottom:15px;" onclick="quickSettle('${c.id}', ${currentOwed})">💰 SETTLE £${currentOwed} NOW</button>` : ''; document.getElementById('briefEditBtn').onclick = () => { closeBriefing(); openEditModal(id); }; document.getElementById('briefingModal').classList.remove('hidden'); };
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short'}) }); saveData(); closeBriefing(); renderAll(); };
window.launchWeatherApp = () => { if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) { window.location.href = "weather://"; setTimeout(() => window.open("https://weather.com/", "_blank"), 500); } else { window.open("https://www.google.com/search?q=weather", "_blank"); } };
