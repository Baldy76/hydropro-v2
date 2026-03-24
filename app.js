const DB_KEY = 'HydroPro_Gold_V36';
let db = { customers: [], expenses: [], bank: { name: '', sort: '', acc: '' }, history: [] };
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
        updateLogo(isDark);
        document.getElementById('themeCheckbox').addEventListener('change', (e) => {
            const dark = e.target.checked;
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('HP_Theme', dark);
            updateLogo(dark);
        });
        updateHeader(); renderAll();
    } catch(e) { console.error("Boot Error", e); }
});

function updateLogo(isDark) {
    const logoImg = document.getElementById('mainLogo');
    if(logoImg) logoImg.src = isDark ? 'Logo-Dark.png' : 'Logo.png';
}

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => { renderMaster(); renderLedger(); renderStats(); renderWeek(); };

/* --- 📊 STATS --- */
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let targetIncome = 0, paid = 0, arrears = 0, fuel = 0, gear = 0, food = 0, misc = 0;
    db.customers.forEach(c => { 
        targetIncome += n(c.price);
        paid += n(c.paidThisMonth); 
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); 
    });
    db.expenses.forEach(e => {
        const cat = (e.cat||"").toLowerCase();
        if(cat.includes('fuel')) fuel += n(e.amt);
        else if(cat.includes('gear')) gear += n(e.amt);
        else if(cat.includes('food')) food += n(e.amt);
        else misc += n(e.amt);
    });
    const totalSpend = fuel + gear + food + misc;
    const profit = paid - totalSpend;
    const progressPercent = targetIncome > 0 ? Math.min(Math.round((paid / targetIncome) * 100), 100) : 0;
    container.innerHTML = `
        <div class="ST-HERO"><div>£${profit.toFixed(2)}</div><small>NET PROFIT</small></div>
        <div class="ST-GRID">
            <div class="ST-BUBBLE" style="border-bottom: 5px solid var(--success);"><small>INCOME</small><strong>£${paid.toFixed(2)}</strong></div>
            <div class="ST-BUBBLE" style="border-bottom: 5px solid var(--danger);"><small>SPEND</small><strong>£${totalSpend.toFixed(2)}</strong></div>
        </div>
        <div class="ST-PROG-CARD">
            <div class="ST-PROG-HEADER"><span>Monthly Target</span><span>${progressPercent}%</span></div>
            <div class="ST-PROG-TRACK"><div class="ST-PROG-FILL" style="width:${progressPercent}%"></div></div>
            <div class="ST-PROG-FOOTER"><span>GOAL: £${targetIncome.toFixed(0)}</span><span>REMAINING: £${Math.max(0, targetIncome - paid).toFixed(0)}</span></div>
        </div>
        <div class="ST-LIST-CARD">
            <div class="ST-ITEM"><span>⛽ Fuel</span><span>£${fuel.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🛠️ Gear</span><span>£${gear.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>🍔 Food</span><span>£${food.toFixed(2)}</span></div>
            <div class="ST-ITEM"><span>📦 Misc</span><span>£${misc.toFixed(2)}</span></div>
            <div class="ST-TOTAL"><span>TOTAL SPEND</span><span>£${totalSpend.toFixed(2)}</span></div>
        </div>
        ${arrears > 0 ? `<div class="ST-ARREARS"><small style="display:block; font-size:12px; opacity:0.8;">UNPAID DEBT</small>£${arrears.toFixed(2)}</div>` : ''}
    `;
};

/* --- 👥 MASTER LIST --- */
window.renderMaster = () => {
    const container = document.getElementById('master-list-container'); if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'CT-PILL';
            div.onclick = () => editCust(c.id);
            const isOwed = (c.cleaned && n(c.paidThisMonth) < n(c.price));
            let badge = isOwed ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div class="CT-TEXT-STACK"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

/* --- 📅 WEEKLY WORK --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.DAY-BTN').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };
window.renderWeek = () => {
    const list = document.getElementById('week-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'JOB-CARD';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `<div class="CT-TEXT-STACK"><strong>${c.name} ${c.cleaned?'✅':''}</strong><small>${c.houseNum} ${c.street}</small></div><div class="JOB-ACTIONS" onclick="event.stopPropagation()"><button class="BTN-ACTION" style="background:var(--accent)" onclick="window.open('tel:${c.phone}')">📱</button><button class="BTN-ACTION" style="background:#ffeb3b; color:#333" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.houseNum+' '+c.street+' '+c.postcode)}')">📍</button><button class="BTN-ACTION" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">🧼</button><button class="BTN-ACTION" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">£</button></div>`;
        list.appendChild(div);
    });
};

/* --- 🍏 TRIPLE-LOCK CSV ENGINE v37.7 --- */
window.exportData = async () => {
    alert("Starting Backup: You will receive 3 files. Please tap 'Allow' if your phone asks to download multiple files.");
    const date = new Date().toLocaleDateString();
    
    // 1. Customers
    let cCSV = "\ufeffName,Phone,HouseNum,Street,Postcode,Day,Price,Week,Notes,Cleaned,PaidThisMonth\n";
    db.customers.forEach(c => {
        cCSV += `"${c.name}","${c.phone||''}","${c.houseNum||''}","${c.street||''}","${c.postcode||''}","${c.day}","${c.price}","${c.week}","${(c.notes||'').replace(/"/g,'""')}","${c.cleaned}","${c.paidThisMonth}"\n`;
    });
    downloadCSV(cCSV, `HP_Customers_${date}.csv`);

    // 2. Expenses (1s delay)
    await new Promise(r => setTimeout(r, 1000));
    let eCSV = "\ufeffDate,Category,Description,Amount\n";
    db.expenses.forEach(e => {
        eCSV += `"${e.date}","${e.cat}","${e.desc}","${e.amt}"\n`;
    });
    downloadCSV(eCSV, `HP_Expenses_${date}.csv`);

    // 3. History (1s delay)
    await new Promise(r => setTimeout(r, 1000));
    let hCSV = "\ufeffDate,CustomerID,Amount\n";
    db.history.forEach(h => {
        hCSV += `"${h.date}","${h.custId}","${h.amt}"\n`;
    });
    downloadCSV(hCSV, `HP_History_${date}.csv`);
};

function downloadCSV(csv, name) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = name; link.click();
}

window.importData = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    let count = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const name = file.name.toLowerCase();
            if (name.includes("customer")) importCust(text);
            else if (name.includes("expense")) importExp(text);
            else if (name.includes("history")) importHist(text);
            count++;
            if(count === files.length) { saveData(); alert("Restore Complete!"); location.reload(); }
        };
        reader.readAsText(file);
    });
};

function importCust(text) {
    const rows = text.split('\n').slice(1);
    rows.forEach(row => {
        if(!row.trim()) return;
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cl = (v) => (v||"").replace(/"/g, "").trim();
        if(cols.length >= 7) {
            db.customers.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: cl(cols[0]), phone: cl(cols[1]), houseNum: cl(cols[2]), street: cl(cols[3]),
                postcode: cl(cols[4]), day: cl(cols[5]), price: n(cl(cols[6])),
                week: cl(cols[7]) || "1", notes: cl(cols[8]) || "",
                cleaned: cl(cols[9]) === "true", paidThisMonth: n(cl(cols[10]))
            });
        }
    });
}
function importExp(text) {
    const rows = text.split('\n').slice(1);
    rows.forEach(row => {
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cl = (v) => (v||"").replace(/"/g, "").trim();
        if(cols.length >= 4) db.expenses.push({ date: cl(cols[0]), cat: cl(cols[1]), desc: cl(cols[2]), amt: n(cl(cols[3])) });
    });
}
function importHist(text) {
    const rows = text.split('\n').slice(1);
    rows.forEach(row => {
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cl = (v) => (v||"").replace(/"/g, "").trim();
        if(cols.length >= 3) db.history.push({ date: cl(cols[0]), custId: cl(cols[1]), amt: n(cl(cols[2])) });
    });
}

window.nuclearReset = () => {
    if(confirm("☢️ NUCLEAR OPTION: Delete EVERYTHING?")) {
        if(confirm("FINAL WARNING: This cannot be undone. Proceed?")) {
            localStorage.removeItem(DB_KEY); location.reload();
        }
    }
};

/* --- SHARED --- */
window.quickSettle = (id, amt) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = n(c.price); db.history.push({ custId: id, amt: n(amt), date: 'Debt-Settle' }); saveData(); closeBriefing(); renderWeek(); renderStats(); };
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value), c = document.getElementById('expCat').value;
    if(!d || a <= 0) return alert("Required");
    db.expenses.push({ id: Date.now(), desc: d, amt: a, cat: c, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); renderLedger(); renderStats(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value='';
};
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'); if(!container) return; container.innerHTML = '';
    let total = 0; db.expenses.forEach(e => total += n(e.amt));
    document.getElementById('ledgerTotalDisplay').innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'LD-PILL';
        div.ondblclick = () => { if(confirm("Delete?")) { db.expenses = db.expenses.filter(x => x.id !== e.id); saveData(); renderLedger(); renderStats(); } };
        div.innerHTML = `<div><strong>${e.cat||'📦'} ${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name required");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), day: document.getElementById('cDay').value, price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (db.customers.find(x=>x.id===id)||{week:"1"}).week, cleaned: (db.customers.find(x=>x.id===id)||{cleaned:false}).cleaned, paidThisMonth: (db.customers.find(x=>x.id===id)||{paidThisMonth:0}).paidThisMonth };
    const idx = db.customers.findIndex(c => c.id === id); if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};
window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cDay').value = c.day || 'Mon'; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};
window.handleClean = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; const amt = prompt(`Paid for ${c.name}:`, c.price); if(amt) { c.paidThisMonth = n(amt); db.history.push({ custId: id, amt: n(amt), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderWeek(); renderStats(); } };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.launchRoutePlanner = () => { const list = db.customers.filter(c => c.week == curWeek && c.day == workingDay && !c.cleaned); if(list.length === 0) return alert("Done!"); const baseUrl = "https://www.google.com/maps/dir/"; const stops = list.map(c => encodeURIComponent(`${c.houseNum} ${c.street} ${c.postcode}`)).join('/'); window.open(`${baseUrl}${stops}`, '_blank'); };
window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');
window.completeCycle = () => { if(confirm("Clear month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
