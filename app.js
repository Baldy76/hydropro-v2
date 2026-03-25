const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
let curWeek = 1; 
let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            db.customers = parsed.customers || [];
            db.expenses = parsed.expenses || [];
            db.history = parsed.history || [];
            db.bank = parsed.bank || { name: '', acc: '' };
        }
    } catch(err) { console.error("Database Boot Error."); }

    applyTheme(localStorage.getItem('HP_Theme') === 'true');
    const cb = document.getElementById('themeCheckbox');
    if(cb) {
        cb.checked = localStorage.getItem('HP_Theme') === 'true';
        cb.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
            localStorage.setItem('HP_Theme', e.target.checked);
        });
    }

    const bNameEl = document.getElementById('bName');
    const bAccEl = document.getElementById('bAcc');
    if(bNameEl) bNameEl.value = db.bank.name;
    if(bAccEl) bAccEl.value = db.bank.acc;

    updateHeaderDate(); 
    renderAllSafe(); 
    initWeather();
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    renderAllSafe();
};

window.updateHeaderDate = () => {
    const el = document.getElementById('dateText');
    if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.renderAllSafe = () => {
    try {
        if(document.getElementById('master-root').classList.contains('active')) renderMaster();
        if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
        if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
    } catch (err) { console.error("Render Error:", err); }
};

/* --- ⚙️ ADMIN --- */
window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Name required!");
    db.customers.push({
        id: Date.now().toString(),
        name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        cleaned: false, paidThisMonth: 0, week: "1", day: "Mon"
    });
    saveData(); alert("Saved!"); location.reload();
};
window.saveBank = () => { db.bank.name = document.getElementById('bName').value; db.bank.acc = document.getElementById('bAcc').value; saveData(); alert("Secured!"); };
window.exportToQuickBooks = () => {
    let csv = "Date,Description,Amount,Type,Category\n";
    const today = new Date().toLocaleDateString('en-GB');
    db.customers.forEach(c => { if(parseFloat(c.paidThisMonth) > 0) csv += `${today},Income: ${c.name},${c.paidThisMonth},Income,Service\n`; });
    db.expenses.forEach(e => { csv += `${e.date},${e.desc},${e.amt},Expense,${e.cat || 'Other'}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "HydroPro_QuickBooks.csv"; link.click();
};
window.exportData = () => { const blob = new Blob([JSON.stringify(db)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "HydroPro_Backup.json"; link.click(); };
window.importData = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try { const imported = JSON.parse(e.target.result); db.customers = imported.customers || []; db.expenses = imported.expenses || []; db.history = imported.history || []; db.bank = imported.bank || { name: '', acc: '' }; saveData(); alert("Restored!"); location.reload(); } catch (err) { alert("Invalid Format."); }
    }; reader.readAsText(event.target.files[0]);
};
window.completeCycle = () => { if(confirm("Start new month?")) { db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); } };
window.nuclearReset = () => { if(confirm("☢️ DELETE ALL?")) { localStorage.removeItem(DB_KEY); location.reload(); } };

/* --- 👥 MASTER LIST GENERATOR --- */
window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const paid = parseFloat(c.paidThisMonth) || 0;
            const price = parseFloat(c.price) || 0;
            const arrearsBadge = paid < price ? `<span class="CST-badge badge-unpaid">UNPAID</span>` : `<span class="CST-badge badge-paid">PAID</span>`;
            
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `
                <div class="CST-card-top">
                    <div>
                        <strong style="font-size:20px;">${c.name}</strong><br>
                        <small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small>
                    </div>
                    <div style="font-weight:950; font-size:22px;">£${price.toFixed(2)}</div>
                </div>
                <div class="CST-card-badges">${arrearsBadge}</div>
            `;
            list.appendChild(div);
        }
    });
};

/* --- 📅 WEEKS LIST GENERATOR --- */
window.viewWeek = (num) => { curWeek = num; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.WEE-day-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };

window.renderWeek = () => {
    const list = document.getElementById('WEE-list-container'); if(!list) return; list.innerHTML = '';
    let customersToday = db.customers.filter(c => c.week == curWeek && c.day == workingDay);
    
    if(customersToday.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.4; font-weight:950; font-size:20px;">No jobs booked for ${workingDay}.</div>`;
        return;
    }

    customersToday.forEach(c => {
        const paid = parseFloat(c.paidThisMonth) || 0;
        const price = parseFloat(c.price) || 0;
        const cleanBadge = c.cleaned ? `<span class="CST-badge badge-clean">✅ CLEANED</span>` : '';
        const arrearsBadge = paid < price ? `<span class="CST-badge badge-unpaid">❌ UNPAID</span>` : `<span class="CST-badge badge-paid">✅ PAID</span>`;

        const div = document.createElement('div'); 
        div.className = 'CST-card-item';
        div.onclick = () => showBriefing(c.id); // Tapping opens Command Vault
        div.innerHTML = `
            <div class="CST-card-top">
                <div>
                    <strong style="font-size:20px;">${c.name}</strong><br>
                    <small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:950; font-size:22px;">£${price.toFixed(2)}</div>
            </div>
            <div class="CST-card-badges">${cleanBadge} ${arrearsBadge}</div>
        `;
        list.appendChild(div);
    });
};

/* --- 💡 COMMAND VAULT (MODAL) --- */
window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const container = document.getElementById('briefingData');
    
    const paid = parseFloat(c.paidThisMonth) || 0;
    const price = parseFloat(c.price) || 0;
    const isCleaned = c.cleaned;
    const owesMoney = paid < price;
    
    // Status Logic
    const arrearsHtml = owesMoney ? `<div style="background:var(--danger); color:white; padding:15px; border-radius:20px; text-align:center; font-weight:950; margin:15px 0; font-size:18px;">⚠️ OWES £${(price-paid).toFixed(2)}</div>` : `<div style="color:var(--success); text-align:center; font-weight:950; margin:15px 0; font-size:18px;">✅ FULLY PAID</div>`;

    // History Logic
    const history = db.history.filter(h => h.custId === id).slice(-3).reverse();
    let historyHtml = history.map(h => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;"><span>${h.date}</span><span>£${parseFloat(h.amt).toFixed(2)}</span></div>`).join('') || '<p style="text-align:center; opacity:0.4; margin:0;">No history</p>';

    // Build the Action Maps URL
    const mapQuery = encodeURIComponent(`${c.houseNum} ${c.street}, ${c.postcode || ''}`);

    container.innerHTML = `
        <div style="border-bottom:3px solid var(--accent); padding-bottom:15px; margin-bottom:15px;">
            <h2 style="margin:0; font-size:32px; font-weight:950;">${c.name}</h2>
            <div style="font-size:18px; opacity:0.6; font-weight:800; margin-top:5px;">${c.houseNum} ${c.street}</div>
        </div>
        
        ${arrearsHtml}

        <div class="CMD-action-grid">
            <button class="CMD-action-btn clean" onclick="cmdToggleClean('${c.id}')">
                <span style="font-size:24px;">🧼</span> ${isCleaned ? 'UNDO CLEAN' : 'MARK CLEAN'}
            </button>
            <button class="CMD-action-btn pay" onclick="cmdSettlePaid('${c.id}')">
                <span style="font-size:24px;">💰</span> COLLECT £
            </button>
            <button class="CMD-action-btn route" onclick="window.open('https://maps.google.com/?q=${mapQuery}', '_blank')">
                <span style="font-size:24px;">📍</span> NAVIGATE
            </button>
            <button class="CMD-action-btn call" onclick="window.location.href='tel:${c.phone}'">
                <span style="font-size:24px;">📞</span> CALL
            </button>
        </div>

        <div style="margin-top:25px;">
            <h3 style="font-size:12px; opacity:0.5; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Rolling History</h3>
            <div style="background:var(--ios-grey); padding:15px; border-radius:20px;">${historyHtml}</div>
        </div>
    `;
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

// Modal Specific Action Handlers
window.cmdToggleClean = (id) => { 
    const c = db.customers.find(x => x.id === id); 
    c.cleaned = !c.cleaned; 
    saveData(); 
    renderAllSafe(); 
    showBriefing(id); // Refresh modal
};

window.cmdSettlePaid = (id) => { 
    const c = db.customers.find(x => x.id === id); 
    const amtStr = prompt(`Process payment for ${c.name}?\nExpected: £${c.price}`, c.price); 
    if(amtStr !== null && amtStr !== "") { 
        const amt = parseFloat(amtStr); 
        c.paidThisMonth = amt; 
        if(!db.history) db.history = [];
        db.history.push({ custId: id, amt: amt, date: new Date().toLocaleDateString('en-GB') }); 
        saveData(); 
        renderAllSafe(); 
        showBriefing(id); // Refresh modal
    } 
};

/* --- 💰 FINANCES VAULT LOGIC --- */
window.addFinanceExpense = () => {
    const desc = document.getElementById('fExpDesc').value; const amt = parseFloat(document.getElementById('fExpAmt').value); const cat = document.getElementById('fExpCat').value;
    if(!desc || !amt || amt <= 0) return alert("Valid Description and Amount required.");
    db.expenses.push({ id: Date.now(), desc, amt, cat, date: new Date().toLocaleDateString('en-GB') });
    saveData(); document.getElementById('fExpDesc').value = ''; document.getElementById('fExpAmt').value = ''; renderFinances();
};
window.renderFinances = () => {
    const dash = document.getElementById('FIN-dashboard'); const ledger = document.getElementById('FIN-ledger'); if(!dash || !ledger) return;
    let income = 0, spend = 0, expected = 0, arrears = 0; let arrearsListHtml = '';
    db.customers.forEach(c => {
        const paid = parseFloat(c.paidThisMonth) || 0; const price = parseFloat(c.price) || 0;
        income += paid; expected += price;
        if(paid < price) { const owed = price - paid; arrears += owed; arrearsListHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.2); font-size:16px; font-weight:800;"><span>${c.name}</span><span>£${owed.toFixed(2)}</span></div>`; }
    });
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));
    const progressPct = expected > 0 ? Math.min((income / expected) * 100, 100) : 0;
    let arrearsSection = ''; if (arrears > 0) { arrearsSection = `<div class="FIN-arrears-card"><div style="font-size:20px; margin-bottom:15px;">⚠️ OUTSTANDING: £${arrears.toFixed(2)}</div><div style="text-align:left; background:rgba(0,0,0,0.15); padding:15px; border-radius:20px; max-height:150px; overflow-y:auto;">${arrearsListHtml}</div></div>`; }
    dash.innerHTML = `<div class="FIN-hero-iron"><small style="opacity:0.5; font-weight:900;">NET PROFIT</small><div>£${(income - spend).toFixed(2)}</div></div>${arrearsSection}<div style="padding: 0 25px; margin-bottom: 5px; font-weight: 950; font-size: 14px; color: var(--accent); display: flex; justify-content: space-between;"><span>COLLECTION PROGRESS</span><span>${Math.round(progressPct)}%</span></div><div class="FIN-progress-wrap"><div class="FIN-progress-fill" style="width: ${progressPct}%;"></div></div><div class="FIN-bubble-row"><div class="FIN-bubble"><small style="font-weight:800;">INCOME</small><br><strong style="font-size:22px;">£${income.toFixed(2)}</strong></div><div class="FIN-bubble"><small style="font-weight:800;">SPENT</small><br><strong style="font-size:22px; color:var(--danger);">£${spend.toFixed(2)}</strong></div></div>`;
    const categories = {}; db.expenses.forEach(e => { const cat = e.cat || 'Other'; if(!categories[cat]) categories[cat] = { total: 0, items: [] }; categories[cat].total += parseFloat(e.amt); categories[cat].items.push(e); });
    let statementHtml = ''; if (Object.keys(categories).length === 0) { statementHtml = '<div class="ADM-card"><p style="text-align:center; opacity:0.5; font-weight:800; margin:0;">No expenses logged.</p></div>'; } else { for (const [cat, data] of Object.entries(categories)) { let catIcon = "🏢"; if(cat === 'Fuel') catIcon = "⛽"; if(cat === 'Equipment') catIcon = "🧽"; if(cat === 'Food') catIcon = "🍔"; if(cat === 'Marketing') catIcon = "📣"; let itemsHtml = ''; data.items.slice().reverse().forEach(item => { itemsHtml += `<div class="FIN-exp-row"><span>${item.desc} <small style="opacity:0.5; font-size:12px;">(${item.date})</small></span><span style="color:var(--danger);">-£${parseFloat(item.amt).toFixed(2)}</span></div>`; }); statementHtml += `<div class="FIN-cat-card"><div class="FIN-cat-hdr"><span>${catIcon} ${cat.toUpperCase()}</span><span style="color:var(--danger);">£${data.total.toFixed(2)}</span></div>${itemsHtml}</div>`; } }
    ledger.innerHTML = statementHtml;
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    const cachedW = localStorage.getItem('HP_Weather_Cache'); const wText = document.getElementById('w-text'); if(cachedW && wText) wText.innerText = cachedW;
    navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); const data = await res.json(); const temp = `${Math.round(data.main.temp)}°C`; if (wText) wText.innerText = temp; localStorage.setItem('HP_Weather_Cache', temp); } catch (e) { if(!cachedW && wText) wText.innerText = "OFFLINE"; } });
}
