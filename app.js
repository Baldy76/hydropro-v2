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
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
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

// --- SAVE & CLEAR LOGIC ---
window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) { alert("Please enter a name! ✨"); return; }
    
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false,
        paidThisMonth: ex ? ex.paidThisMonth : 0
    };

    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData();
    window.resetForm(); // Clears entry screen after save
    alert("Customer Saved Successfully! ✅");
};

window.resetForm = () => {
    document.getElementById('editId').value = "";
    document.getElementById('cName').value = "";
    document.getElementById('cHouseNum').value = "";
    document.getElementById('cStreet').value = "";
    document.getElementById('cPostcode').value = "";
    document.getElementById('cPrice').value = "";
    document.getElementById('cWeek').value = "1";
    document.getElementById('cDay').value = "Monday";
    document.getElementById('cNotes').value = "";
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a<=0) return;
    db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')});
    saveData(); renderAll();
    document.getElementById('expDesc').value = ""; // Clears description
    document.getElementById('expAmt').value = ""; // Clears amount
};

// --- RENDER LOGIC ---
window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `<button class="back-pill" onclick="openTab('weeksHub')">⬅️ Back to Weeks Hub</button>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="editCust('${c.id}')"><strong style="color:var(--accent); font-size:18px;">${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div>`;
            container.appendChild(card);
        });
    }
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return;
    body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'card'; div.style.display = 'flex'; div.style.justifyContent = 'space-between';
            div.innerHTML = `<div onclick="editCust('${c.id}')"><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div>£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(div);
        }
    });
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    openTab('admin');
    document.getElementById('editId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cHouseNum').value = c.houseNum;
    document.getElementById('cStreet').value = c.street;
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week;
    document.getElementById('cDay').value = c.day;
    document.getElementById('cNotes').value = c.notes;
};

// --- EXPORTS & SYNC ---
window.exportQBIncome = () => {
    let csv = "Customer,Invoice Date,Invoice No,Service,Amount,Tax Amount\n";
    db.customers.forEach(c => { (c.paymentLogs || []).forEach((log, idx) => {
        csv += `"${c.name}",${log.date.replace(/\//g, '-')},INV-${c.id}-${idx},"Window Clean",${n(log.amount).toFixed(2)},0\n`;
    }); });
    const b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `QB_Income.csv`; a.click();
};

window.exportQBExpenses = () => {
    let csv = "Vendor,Date,Description,Amount,Account\n";
    db.expenses.forEach(e => { csv += `"Vendor",${e.date.replace(/\//g, '-')},"${e.desc}",${n(e.amt).toFixed(2)},"Expenses"\n`; });
    const b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `QB_Expenses.csv`; a.click();
};

window.completeCycle = () => {
    if(!confirm("Start New Month?")) return;
    db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; });
    saveData(); location.reload();
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderWeekLists(); renderMasterTable(); renderLedger(); };
window.renderLedger = () => {
    const list = document.getElementById('expenseList'); if(!list) return;
    list.innerHTML = '<h3 class="section-title">💸 Spend History</h3>';
    db.expenses.forEach(e => {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<div style="display:flex; justify-content:space-between"><div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger)">-£${n(e.amt).toFixed(2)}</div></div>`;
        list.appendChild(div);
    });
};
window.updateGreeting = () => {
    const hr = new Date().getHours();
    document.getElementById('greetingMsg').innerText = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
};
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
