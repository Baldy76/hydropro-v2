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
    if (!db.history) db.history = [];
    
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
    if (name === 'home') nav.classList.add('hidden');
    else nav.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.handleBackNavigation = () => {
    const active = document.querySelector('.tab-content.active').id;
    if (active.startsWith('week') && active !== 'weeksHub') openTab('weeksHub');
    else openTab('home');
};

// --- STATS LOGIC (Restored) ---
window.renderStats = () => {
    const profitEl = document.getElementById('currProfit');
    const historyBox = document.getElementById('monthlyHistoryContainer');
    if (!profitEl) return;

    let totalIncome = 0;
    db.customers.forEach(c => { totalIncome += n(c.paidThisMonth); });
    
    let totalSpend = 0;
    db.expenses.forEach(e => { totalSpend += n(e.amt); });

    const liveProfit = totalIncome - totalSpend;
    profitEl.innerText = `£${liveProfit.toFixed(2)}`;

    // Render History
    historyBox.innerHTML = '';
    if (db.history.length === 0) {
        historyBox.innerHTML = '<div style="text-align:center; opacity:0.3; padding:20px;">No archived months yet.</div>';
    } else {
        [...db.history].reverse().forEach(h => {
            const div = document.createElement('div');
            div.className = 'history-row';
            div.innerHTML = `
                <div><strong>${h.month}</strong><br><small style="opacity:0.5">${h.year}</small></div>
                <div style="font-weight:900; color:var(--success)">+£${n(h.profit).toFixed(2)}</div>
            `;
            historyBox.appendChild(div);
        });
    }
};

window.completeCycle = () => {
    if(!confirm("Archive current month and start new? This cannot be undone.")) return;
    
    let totalIncome = 0;
    db.customers.forEach(c => { totalIncome += n(c.paidThisMonth); });
    let totalSpend = 0;
    db.expenses.forEach(e => { totalSpend += n(e.amt); });
    
    const finalProfit = totalIncome - totalSpend;
    const date = new Date();
    
    db.history.push({
        month: date.toLocaleDateString('en-GB', { month: 'long' }),
        year: date.getFullYear(),
        profit: finalProfit
    });

    // Reset Monthly Data
    db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; });
    db.expenses = [];
    
    saveData();
    location.reload();
};

// --- WORKFLOW ENGINE ---
window.toggleCleaned = (id) => {
    const c = db.customers.find(x => x.id === id);
    if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); }
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id); if (!c) return;
    const isPaid = n(c.paidThisMonth) >= n(c.price);
    c.paidThisMonth = isPaid ? 0 : c.price;
    saveData(); renderAll();
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue;
        container.innerHTML = `<button class="back-pill" onclick="openTab('home')">🏠 Back to Home</button>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div onclick="editCust('${c.id}')"><strong style="color:var(--accent)">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street} ${isPaid ? '💰' : ''}</small></div>
                <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="tile" style="height:44px; font-weight:800; ${c.cleaned ? 'background:var(--success); color:white;' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done' : 'Clean'}</button>
                    <button class="tile" style="height:44px; font-weight:800; ${isPaid ? 'background:var(--accent); color:white;' : ''}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay'}</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(),
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        cleaned: ex ? ex.cleaned : false,
        paidThisMonth: ex ? ex.paidThisMonth : 0
    };

    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); location.reload();
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a<=0) return;
    db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')});
    saveData(); renderAll();
    document.getElementById('expDesc').value = ""; document.getElementById('expAmt').value = "";
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return;
    body.innerHTML = '';
    db.customers.forEach(c => {
        const div = document.createElement('div'); div.className = 'card'; div.style.display = 'flex'; div.style.justifyContent = 'space-between';
        div.innerHTML = `<div onclick="editCust('${c.id}')"><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div>£${n(c.price).toFixed(2)}</div>`;
        body.appendChild(div);
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
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderWeekLists(); renderMasterTable(); renderStats(); renderLedger(); };
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
    document.getElementById('greetingMsg').innerText = (hr < 12) ? "Good Morning, Jonathan! ☕" : (hr < 18) ? "Good Afternoon, Jonathan! ☀️" : "Good Evening, Jonathan! 🌙";
};
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
