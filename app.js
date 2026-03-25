const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 
let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
let curWeek = 1; let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Boot
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', acc: '' };

    // 2. Theme Boot
    applyTheme(localStorage.getItem('HP_Theme') === 'true');
    const cb = document.getElementById('themeCheckbox');
    if(cb) {
        cb.checked = localStorage.getItem('HP_Theme') === 'true';
        cb.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
            localStorage.setItem('HP_Theme', e.target.checked);
        });
    }

    // 3. Admin Bank Pre-fill
    if(document.getElementById('bName')) document.getElementById('bName').value = db.bank.name || '';
    if(document.getElementById('bAcc')) document.getElementById('bAcc').value = db.bank.acc || '';

    // 4. Init Systems
    updateHeader(); 
    renderAll(); 
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
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
    updateHeader();
};

window.updateHeader = () => {
    if(el = document.getElementById('dateText')) {
        el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    }
};

/* --- ⚙️ ADMIN LOGIC --- */
window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Customer Name is required!");
    
    db.customers.push({
        id: Date.now().toString(),
        name: name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        cleaned: false,
        paidThisMonth: 0,
        week: "1",
        day: "Mon"
    });
    
    saveData();
    alert("Customer Added Successfully! ✨");
    location.reload();
};

window.saveBank = () => {
    db.bank.name = document.getElementById('bName').value;
    db.bank.acc = document.getElementById('bAcc').value;
    saveData();
    alert("Bank Details Secured! 🔒");
};

window.exportToQuickBooks = () => {
    let csv = "Date,Description,Amount,Type\n";
    const today = new Date().toLocaleDateString('en-GB');
    
    db.customers.forEach(c => {
        if(parseFloat(c.paidThisMonth) > 0) {
            csv += `${today},Income: ${c.name},${c.paidThisMonth},Income\n`;
        }
    });
    db.expenses.forEach(e => {
        csv += `${e.date},${e.desc},${e.amt},Expense\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "HydroPro_QuickBooks.csv"; link.click();
};

window.exportData = () => {
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "HydroPro_Backup.json"; link.click();
};

window.importData = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            db = JSON.parse(e.target.result);
            saveData();
            alert("Backup Restored! 📥");
            location.reload();
        } catch (err) { alert("Invalid File."); }
    };
    reader.readAsText(event.target.files[0]);
};

window.completeCycle = () => {
    if(confirm("Start a new month? This resets all 'Cleaned' and 'Paid' statuses.")) {
        db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; });
        db.expenses = [];
        saveData();
        location.reload();
    }
};

window.nuclearReset = () => {
    if(confirm("☢️ DANGER: Delete ALL data? This cannot be undone.")) {
        localStorage.removeItem(DB_KEY);
        location.reload();
    }
};

/* --- 👥 CUSTOMERS & BRIEFING LOGIC --- */
window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); 
    if(!list) return; 
    list.innerHTML = '';
    
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `
                <div>
                    <strong style="font-size:20px;">${c.name}</strong><br>
                    <small style="color:var(--accent); font-weight:800;">${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:950; color:var(--success); font-size:22px;">£${parseFloat(c.price).toFixed(2)}</div>
            `;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const container = document.getElementById('briefingData');
    
    const paid = (parseFloat(c.paidThisMonth) || 0);
    const price = (parseFloat(c.price) || 0);
    
    const arrearsHtml = paid < price ? 
        `<div style="background:var(--danger); color:white; padding:15px; border-radius:20px; text-align:center; font-weight:950; margin:15px 0; font-size:18px;">⚠️ PAYMENT MISSED (£${(price-paid).toFixed(2)})</div>` : 
        `<div style="color:var(--success); text-align:center; font-weight:950; margin:15px 0; font-size:18px;">✅ PAID THIS MONTH</div>`;

    const history = (db.history || []).filter(h => h.custId === id).slice(-3).reverse();
    let historyHtml = history.map(h => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800;">
            <span>${h.date}</span><span>£${parseFloat(h.amt).toFixed(2)}</span>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.4;">No history found</p>';

    container.innerHTML = `
        <div style="border-bottom:3px solid var(--accent); padding-bottom:15px; margin-bottom:20px;">
            <h2 style="margin:0; font-size:32px; font-weight:950;">${c.name}</h2>
            <div style="font-size:18px; opacity:0.6; font-weight:800; margin-top:5px;">${c.houseNum} ${c.street}</div>
        </div>
        
        <div class="CST-brief-item"><span class="CST-brief-icon">📍</span><span style="flex:1; font-weight:800;">Postcode</span><span style="font-weight:950; color:var(--accent);">${c.postcode || 'N/A'}</span></div>
        <div class="CST-brief-item" onclick="window.location.href='tel:${c.phone}'"><span class="CST-brief-icon">📞</span><span style="flex:1; font-weight:800;">Contact</span><span style="font-weight:950; color:var(--accent); text-decoration:underline;">${c.phone || 'N/A'}</span></div>
        <div class="CST-brief-item"><span class="CST-brief-icon">💰</span><span style="flex:1; font-weight:800;">Service Price</span><span style="font-weight:950; color:var(--accent);">£${price.toFixed(2)}</span></div>
        
        ${arrearsHtml}
        
        <div style="margin-top:25px;">
            <h3 style="font-size:12px; opacity:0.5; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Rolling 3-Month History</h3>
            <div style="background:var(--ios-grey); padding:15px; border-radius:20px;">${historyHtml}</div>
        </div>
    `;
    
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

/* --- 💰 FINANCES LOGIC --- */
window.addFinanceExpense = () => {
    const desc = document.getElementById('fExpDesc').value;
    const amt = parseFloat(document.getElementById('fExpAmt').value);
    
    if(!desc || !amt || amt <= 0) return alert("Valid Description and Amount required.");
    
    db.expenses.push({
        id: Date.now(),
        desc: desc,
        amt: amt,
        date: new Date().toLocaleDateString('en-GB')
    });
    
    saveData();
    document.getElementById('fExpDesc').value = '';
    document.getElementById('fExpAmt').value = '';
    renderFinances();
};

window.renderFinances = () => {
    const dash = document.getElementById('FIN-dashboard');
    const ledger = document.getElementById('FIN-ledger');
    if(!dash || !ledger) return;

    let income = 0;
    let spend = 0;

    db.customers.forEach(c => income += (parseFloat(c.paidThisMonth) || 0));
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));

    dash.innerHTML = `
        <div class="FIN-hero-iron">
            <small style="opacity:0.5; font-weight:900;">NET PROFIT</small>
            <div>£${(income - spend).toFixed(2)}</div>
        </div>
        <div class="FIN-bubble-row">
            <div class="FIN-bubble"><small style="font-weight:800;">INCOME</small><br><strong style="font-size:22px;">£${income.toFixed(2)}</strong></div>
            <div class="FIN-bubble"><small style="font-weight:800;">SPENT</small><br><strong style="font-size:22px; color:var(--danger);">£${spend.toFixed(2)}</strong></div>
        </div>
    `;

    let statementHtml = '<div class="ADM-card"><h3 class="ADM-hdr">Transaction Ledger</h3>';
    if (db.expenses.length === 0) {
        statementHtml += '<p style="text-align:center; opacity:0.5; font-weight:800;">No expenses logged this month.</p>';
    } else {
        db.expenses.slice().reverse().forEach(e => {
            statementHtml += `
                <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:800; font-size:18px;">
                    <span>${e.desc}</span>
                    <span style="color:var(--danger);">-£${parseFloat(e.amt).toFixed(2)}</span>
                </div>
            `;
        });
    }
    statementHtml += '</div>';
    ledger.innerHTML = statementHtml;
};

/* --- 📅 WEEKS LOGIC --- */
window.viewWeek = (num) => { 
    curWeek = num; 
    openTab('week-view-root'); 
    renderWeek(); 
};

window.setWorkingDay = (day, btn) => { 
    workingDay = day; 
    document.querySelectorAll('.WEE-day-btn').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    renderWeek(); 
};

window.renderWeek = () => {
    const list = document.getElementById('WEE-list-container'); 
    if(!list) return; 
    list.innerHTML = '';
    
    let customersToday = db.customers.filter(c => c.week == curWeek && c.day == workingDay);
    
    if(customersToday.length === 0)
