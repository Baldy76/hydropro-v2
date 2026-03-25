"use strict";

const DB_KEY = 'HydroPro_Gold_V36'; 
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
let curWeek = 1; 
let workingDay = 'Mon';

/* --- 🛡️ SECURITY: XSS SANITIZER --- */
const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
};

/* --- 📊 CORE ARREARS CALCULATION ENGINE --- */
window.getArrearsData = (c) => {
    const currentMonthStr = new Date().toLocaleString('en-GB', { month: 'short' });
    let pastLog = c.pastArrears || [];
    let currentOwed = (parseFloat(c.price) || 0) - (parseFloat(c.paidThisMonth) || 0);
    
    let breakdown = pastLog.map(a => ({ month: a.month, amt: parseFloat(a.amt) }));
    
    if (currentOwed > 0.01) {
        breakdown.push({ month: currentMonthStr, amt: currentOwed });
    }
    
    const totalOwed = breakdown.reduce((sum, item) => sum + item.amt, 0);
    
    return {
        isOwed: totalOwed > 0.01,
        total: totalOwed,
        monthsString: breakdown.map(b => b.month).join(', '),
        breakdown: breakdown
    };
};

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
    } catch(err) { console.error("Database Boot Error.", err); }

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

/* --- ⚓ ENGINE NAVIGATION --- */
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
    const name = document.getElementById('cName').value.trim();
    if(!name) return alert("Name required!");
    db.customers.push({
        id: Date.now().toString(), 
        name,
        houseNum: document.getElementById('cHouseNum').value.trim(),
        street: document.getElementById('cStreet').value.trim(),
        postcode: document.getElementById('cPostcode').value.trim(),
        phone: document.getElementById('cPhone').value.trim(),
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        cleaned: false, paidThisMonth: 0, pastArrears: [], week: "1", day: "Mon"
    });
    saveData(); alert("Saved!"); location.reload();
};

window.saveBank = () => { db.bank.name = document.getElementById('bName').value; db.bank.acc = document.getElementById('bAcc').value; saveData(); alert("Secured!"); };

window.completeCycle = () => {
    const cycleMonth = new Date().toLocaleString('en-GB', { month: 'short', year: '2-digit' });
    if(confirm(`Start new month? This will log unpaid customers as arrears for ${cycleMonth}.`)) {
        db.customers.forEach(c => {
            const paid = parseFloat(c.paidThisMonth) || 0;
            const price = parseFloat(c.price) || 0;
            if (paid < price) {
                if (!c.pastArrears) c.pastArrears = [];
                c.pastArrears.push({ month: cycleMonth, amt: price - paid });
            }
            c.cleaned = false; 
            c.paidThisMonth = 0; 
        });
        db.expenses = [];
        saveData(); location.reload();
    }
};

window.exportToQuickBooks = () => {
    let csv = "Date,Description,Amount,Type,Category\n";
    const today = new Date().toLocaleDateString('en-GB');
    db.customers.forEach(c => { if(parseFloat(c.paidThisMonth) > 0) csv += `${today},Income: ${escapeHTML(c.name)},${c.paidThisMonth},Income,Service\n`; });
    db.expenses.forEach(e => { csv += `${e.date},${escapeHTML(e.desc)},${e.amt},Expense,${escapeHTML(e.cat) || 'Other'}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "HydroPro_QuickBooks.csv"; link.click();
};

window.exportData = () => { const blob = new Blob([JSON.stringify(db)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "HydroPro_Backup.json"; link.click(); };

window.importData = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try { const imported = JSON.parse(e.target.result); db.customers = imported.customers || []; db.expenses = imported.expenses || []; db.history = imported.history || []; db.bank = imported.bank || { name: '', acc: '' }; saveData(); alert("Restored!"); location.reload(); } catch (err) { alert("Invalid Format."); }
    }; reader.readAsText(event.target.files[0]);
};

window.nuclearReset = () => { if(confirm("☢️ DELETE ALL?")) { localStorage.removeItem(DB_KEY); location.reload(); } };

/* --- 👥 MASTER LIST GENERATOR (CUSTOMER CARDS) --- */
window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const arrData = window.getArrearsData(c);
            const arrearsBadge = arrData.isOwed ? `<span class="CST-badge badge-unpaid">OWES £${arrData.total.toFixed(2)}</span>` : `<span class="CST-badge badge-paid">PAID</span>`;
            
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showCustomerBriefing(c.id);
            div.innerHTML = `
                <div class="CST-card-top">
                    <div><strong style="font-size:20px;">${escapeHTML(c.name)}</strong><br><small style="color:var(--accent); font-weight:800;">${escapeHTML(c.houseNum)} ${escapeHTML(c.street)}</small></div>
                    <div style="font-weight:950; font-size:22px;">£${(parseFloat(c.price)||0).toFixed(2)}</div>
                </div>
                <div class="CST-card-badges">${arrearsBadge}</div>
            `;
            list.appendChild(div);
        }
    });
};

/* --- 📅 WEEKS LIST GENERATOR (JOB CARDS) --- */
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
        const arrData = window.getArrearsData(c);
        const cleanBadge = c.cleaned ? `<span class="CST-badge badge-clean">✅ CLEANED</span>` : '';
        const arrearsBadge = arrData.isOwed ? `<span class="CST-badge badge-unpaid">❌ OWES £${arrData.total.toFixed(2)}</span>` : `<span class="CST-badge badge-paid">✅ PAID</span>`;

        const div = document.createElement('div'); 
        div.className = 'CST-card-item';
        div.onclick = () => showJobBriefing(c.id);
        div.innerHTML = `
            <div class="CST-card-top">
                <div><strong style="font-size:20px;">${escapeHTML(c.name)}</strong><br><small style="color:var(--accent); font-weight:800;">${escapeHTML(c.houseNum)} ${escapeHTML(c.street)}</small></div>
                <div style="font-weight:950; font-size:22px;">£${(parseFloat(c.price)||0).toFixed(2)}</div>
            </div>
            <div class="CST-card-badges">${cleanBadge} ${arrearsBadge}</div>
        `;
        list.appendChild(div);
    });
};

/* --- 💡 COMMAND VAULT (MODAL LOGIC) --- */

const generateHistoryHtml = (id) => {
    const history = db.history.filter(h => h.custId === id).slice(-3).reverse();
    if (history.length === 0) return '<p class="CMD-history-empty">No history</p>';
    return history.map(h => `<div class="CMD-history-row"><span>${escapeHTML(h.date)}</span><span>£${parseFloat(h.amt).toFixed(2)}</span></div>`).join('');
};

const generateArrearsHtml = (arrData) => {
    if (!arrData.isOwed) return `<div class="CMD-alert-success">✅ FULLY PAID UP</div>`;
    
    let listHtml = arrData.breakdown.map(b => `<li>£${b.amt.toFixed(2)} - ${escapeHTML(b.month)}</li>`).join('');
    return `
        <div class="CMD-alert-danger">
            <div class="CMD-alert-danger-title">⚠️ TOTAL OUTSTANDING: £${arrData.total.toFixed(2)}</div>
            <ul class="CMD-arrears-list">${listHtml}</ul>
        </div>
    `;
};

// 1. JOB CARD (Includes Actions, No Details, Updated Arrears List)
window.showJobBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const container = document.getElementById('briefingData');
    
    const arrData = window.getArrearsData(c);
    const mapQuery = encodeURIComponent(`${c.houseNum} ${c.street}, ${c.postcode || ''}`);

    container.innerHTML = `
        <div class="CMD-header">
            <h2>${escapeHTML(c.name)}</h2>
            <div class="CMD-header-sub">${escapeHTML(c.houseNum)} ${escapeHTML(c.street)}</div>
        </div>
        
        ${generateArrearsHtml(arrData)}

        <div class="CMD-action-grid">
            <button class="CMD-action-btn clean" onclick="cmdToggleClean('${c.id}')"><span style="font-size:24px;">🧼</span> ${c.cleaned ? 'UNDO CLEAN' : 'MARK CLEAN'}</button>
            <button class="CMD-action-btn pay" onclick="cmdSettlePaid('${c.id}', 'job')"><span style="font-size:24px;">💰</span> COLLECT £</button>
            <button class="CMD-action-btn route" onclick="window.open('http://googleusercontent.com/maps.google.com/3{mapQuery}', '_blank')"><span style="font-size:24px;">📍</span> NAVIGATE</button>
            <button class="CMD-action-btn call" onclick="window.location.href='tel:${escapeHTML(c.phone)}'"><span style="font-size:24px;">📞</span> CALL</button>
        </div>

        <h3 class="CMD-history-hdr">Rolling History</h3>
        <div class="CMD-history-box">${generateHistoryHtml(c.id)}</div>
    `;
    document.getElementById('briefingModal').classList.remove('hidden');
};

// 2. CUSTOMER CARD (No Actions, Full Details, Updated Arrears List, NO Payment Button)
window.showCustomerBriefing = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const container = document.getElementById('briefingData');
    const arrData = window.getArrearsData(c);

    container.innerHTML = `
        <div class="CMD-header">
            <h2>${escapeHTML(c.name)}</h2>
            <div class="CMD-header-sub">${escapeHTML(c.houseNum)} ${escapeHTML(c.street)} <br>${escapeHTML(c.postcode || '')}</div>
        </div>
        
        <div class="CMD-details-box">
            <div class="CMD-detail-row"><span>📞 Phone</span><span>${escapeHTML(c.phone) || 'N/A'}</span></div>
            <div class="CMD-detail-row"><span>💰 Price</span><span>£${parseFloat(c.price).toFixed(2)}</span></div>
            <div class="CMD-detail-row"><span>📅 Week</span><span>Week ${escapeHTML(c.week)}</span></div>
            <div class="CMD-detail-row"><span>📆 Day</span><span>${escapeHTML(c.day)}</span></div>
        </div>

        ${generateArrearsHtml(arrData)}

        <h3 class="CMD-history-hdr">Rolling History</h3>
        <div class="CMD-history-box">${generateHistoryHtml(c.id)}</div>
    `;
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

window.cmdToggleClean = (id) => { 
    const c = db.customers.find(x => x.id === id); 
    c.cleaned = !c.cleaned; 
    window.saveData(); 
    window.renderAllSafe(); 
    window.showJobBriefing(id); 
};

window.cmdSettlePaid = (id, context) => { 
    const c = db.customers.find(x => x.id === id); 
    const arrData = window.getArrearsData(c);
    
    const amtStr = prompt(`Process payment for ${c.name}?\nTotal Owed: £${arrData.total.toFixed(2)}`, arrData.total.toFixed(2)); 
    if(amtStr !== null && amtStr !== "") { 
        let amtPaid = parseFloat(amtStr); 
        if (isNaN(amtPaid) || amtPaid <= 0) return alert("Invalid amount.");

        c.paidThisMonth = (parseFloat(c.paidThisMonth) || 0) + amtPaid; 
        
        let overpay = c.paidThisMonth - parseFloat(c.price);
        if(overpay > 0.01 && c.pastArrears && c.pastArrears.length > 0) {
            let remaining = overpay;
            for(let i=0; i<c.pastArrears.length; i++) {
                if(remaining >= c.pastArrears[i].amt) {
                    remaining -= c.pastArrears[i].amt;
                    c.pastArrears[i].amt = 0;
                } else {
                    c.pastArrears[i].amt -= remaining;
                    remaining = 0; 
                    break;
                }
            }
            c.pastArrears = c.pastArrears.filter(a => a.amt > 0.01);
        }

        if(!db.history) db.history = [];
        db.history.push({ custId: id, amt: amtPaid, date: new Date().toLocaleDateString('en-GB') }); 
        
        window.saveData(); 
        window.renderAllSafe(); 
        
        if (context === 'job') window.showJobBriefing(id);
        else window.showCustomerBriefing(id);
    } 
};

/* --- 💰 FINANCES VAULT LOGIC --- */
window.addFinanceExpense = () => {
    const desc = document.getElementById('fExpDesc').value.trim(); 
    const amt = parseFloat(document.getElementById('fExpAmt').value); 
    const cat = document.getElementById('fExpCat').value;
    
    if(!desc || isNaN(amt) || amt <= 0) return alert("Valid Description and Amount required.");
    
    db.expenses.push({ id: Date.now(), desc, amt, cat, date: new Date().toLocaleDateString('en-GB') });
    saveData(); 
    document.getElementById('fExpDesc').value = ''; 
    document.getElementById('fExpAmt').value = ''; 
    renderFinances();
};

window.renderFinances = () => {
    const dash = document.getElementById('FIN-dashboard'); const ledger = document.getElementById('FIN-ledger'); if(!dash || !ledger) return;
    
    let income = 0, spend = 0, expected = 0, totalArrears = 0; 
    let arrearsListHtml = '';

    db.customers.forEach(c => {
        income += (parseFloat(c.paidThisMonth) || 0);
        expected += (parseFloat(c.price) || 0);
        const arrData = window.getArrearsData(c);
        if(arrData.isOwed) {
            totalArrears += arrData.total;
            arrearsListHtml += `<div class="CMD-detail-row"><span>${escapeHTML(c.name)} <small style="opacity:0.7;">${escapeHTML(arrData.monthsString)}</small></span><span>£${arrData.total.toFixed(2)}</span></div>`;
        }
    });

    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));
    const progressPct = expected > 0 ? Math.min((income / expected) * 100, 100) : 0;

    let arrearsSection = ''; 
    if (totalArrears > 0) { 
        arrearsSection = `<div class="FIN-arrears-card"><div style="font-size:20px; margin-bottom:15px;">⚠️ OUTSTANDING: £${totalArrears.toFixed(2)}</div><div style="text-align:left; background:rgba(0,0,0,0.15); padding:15px; border-radius:20px; max-height:150px; overflow-y:auto;">${arrearsListHtml}</div></div>`; 
    }
    
    let htmlBuilder = `<div class="FIN-hero-iron"><small style="opacity:0.5; font-weight:900;">NET PROFIT</small><div>£${(income - spend).toFixed(2)}</div></div>`;
    htmlBuilder += arrearsSection;
    htmlBuilder += `<div style="padding: 0 25px; margin-bottom: 5px; font-weight: 950; font-size: 14px; color: var(--accent); display: flex; justify-content: space-between;"><span>COLLECTION PROGRESS</span><span>${Math.round(progressPct)}%</span></div>`;
    htmlBuilder += `<div class="FIN-progress-wrap"><div class="FIN-progress-fill" style="width: ${progressPct}%;"></div></div>`;
    htmlBuilder += `<div class="FIN-bubble-row"><div class="FIN-bubble"><small style="font-weight:800;">INCOME</small><br><strong style="font-size:22px;">£${income.toFixed(2)}</strong></div><div class="FIN-bubble"><small style="font-weight:800;">SPENT</small><br><strong style="font-size:22px; color:var(--danger);">£${spend.toFixed(2)}</strong></div></div>`;
    
    dash.innerHTML = htmlBuilder;
    
    const categories = {}; 
    db.expenses.forEach(e => { const cat = e.cat || 'Other'; if(!categories[cat]) categories[cat] = { total: 0, items: [] }; categories[cat].total += parseFloat(e.amt); categories[cat].items.push(e); });
    
    let statementHtml = ''; 
    if (Object.keys(categories).length === 0) { 
        statementHtml = '<div class="ADM-card"><p style="text-align:center; opacity:0.5; font-weight:800; margin:0;">No expenses logged.</p></div>'; 
    } else { 
        for (const [cat, data] of Object.entries(categories)) { 
            let catIcon = "🏢"; if(cat === 'Fuel') catIcon = "⛽"; if(cat === 'Equipment') catIcon = "🧽"; if(cat === 'Food') catIcon = "🍔"; if(cat === 'Marketing') catIcon = "📣"; 
            let itemsHtml = ''; 
            data.items.slice().reverse().forEach(item => { itemsHtml += `<div class="FIN-exp-row"><span>${escapeHTML(item.desc)} <small style="opacity:0.5; font-size:12px;">(${escapeHTML(item.date)})</small></span><span style="color:var(--danger);">-£${parseFloat(item.amt).toFixed(2)}</span></div>`; }); 
            statementHtml += `<div class="FIN-cat-card"><div class="FIN-cat-hdr"><span>${catIcon} ${escapeHTML(cat).toUpperCase()}</span><span style="color:var(--danger);">£${data.total.toFixed(2)}</span></div>${itemsHtml}</div>`; 
        } 
    }
    ledger.innerHTML = statementHtml;
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    const cachedW = localStorage.getItem('HP_Weather_Cache'); const wText = document.getElementById('w-text'); if(cachedW && wText) wText.innerText = cachedW;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => { 
            try { 
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`); 
                const data = await res.json(); 
                const temp = `${Math.round(data.main.temp)}°C`; 
                if (wText) wText.innerText = temp; 
                localStorage.setItem('HP_Weather_Cache', temp); 
            } catch (e) { 
                if(!cachedW && wText) wText.innerText = "OFFLINE"; 
            } 
        });
    }
}
