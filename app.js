const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    db.customers.forEach(c => { 
        if(!c.paymentLogs) c.paymentLogs = []; 
        if(!c.debtHistory) c.debtHistory = [];
    });
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    
    const nav = document.getElementById('subpageNav');
    const hubPages = ['home', 'weeksHub'];
    if (hubPages.includes(name)) nav.classList.add('hidden');
    else nav.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.handleBackNavigation = () => {
    const active = document.querySelector('.tab-content.active').id;
    if (active.startsWith('week') && active !== 'weeksHub') openTab('weeksHub');
    else openTab('home');
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false,
        paidThisMonth: ex ? ex.paidThisMonth : 0,
        debtHistory: ex ? ex.debtHistory : [],
        paymentLogs: ex ? ex.paymentLogs : []
    };

    if(idx > -1) db.customers[idx] = entry;
    else db.customers.push(entry);
    
    saveData();
    openTab('home');
};

// QUICKBOOKS EXPORTS (Baseline Recovery)
window.exportQBIncome = () => {
    let csv = "Customer,Invoice Date,Invoice No,Service,Amount,Tax Amount\n";
    db.customers.forEach(c => { (c.paymentLogs || []).forEach((log, idx) => {
        const dateStr = log.date.split(',')[0].replace(/\//g, '-');
        csv += `"${c.name}",${dateStr},INV-${c.id}-${idx},"Window Clean",${n(log.amount).toFixed(2)},0\n`;
    }); });
    const b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `QB_Income.csv`; a.click();
};

window.exportQBExpenses = () => {
    let csv = "Vendor,Date,Description,Amount,Account\n";
    db.expenses.forEach(e => {
        const dateStr = e.date.replace(/\//g, '-');
        csv += `"Vendor",${dateStr},"${e.desc}",${n(e.amt).toFixed(2)},"Expenses"\n`;
    });
    const b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `QB_Expenses.csv`; a.click();
};

window.addExpense = () => { 
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); 
    if(!d || a<=0) return; 
    db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')}); 
    saveData(); renderLedger();
};

window.renderLedger = () => {
    const list = document.getElementById('expenseList'); if(!list) return;
    list.innerHTML = '<h3 class="section-title">💸 Spend History</h3>';
    db.expenses.forEach(e => {
        const div = document.createElement('div'); div.className = 'card'; div.style.padding = '18px'; div.style.marginBottom = '10px';
        div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="font-weight:900; color:var(--danger);">£${n(e.amt).toFixed(2)}</div></div>`;
        list.appendChild(div);
    });
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderLedger(); };
window.updateGreeting = () => {
    const hr = new Date().getHours();
    document.getElementById('greetingMsg').innerText = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
};
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
