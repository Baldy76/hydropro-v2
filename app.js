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
    const globalNav = document.getElementById('globalNav');
    if (name === 'home') globalNav.classList.add('hidden');
    else globalNav.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.handleBackNavigation = () => {
    const active = document.querySelector('.tab-content.active').id;
    if (active.startsWith('week') && active !== 'weeksHub') openTab('weeksHub');
    else openTab('home');
};

// --- STATS RESTORATION ENGINE ---
window.renderStats = () => {
    const monthYearEl = document.getElementById('currentMonthYear');
    if (monthYearEl) monthYearEl.innerText = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + " Summary";

    let totalTarget = 0, totalPaid = 0, totalArrears = 0, totalSpend = 0;
    
    db.customers.forEach(c => {
        totalTarget += n(c.price);
        totalPaid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) {
            totalArrears += (n(c.price) - n(c.paidThisMonth));
        }
    });
    
    db.expenses.forEach(e => totalSpend += n(e.amt));

    const profit = totalPaid - totalSpend;
    const progress = totalTarget > 0 ? (totalPaid / totalTarget) * 100 : 0;

    document.getElementById('currProfit').innerText = `£${profit.toFixed(2)}`;
    document.getElementById('statsIncome').innerText = `£${totalPaid.toFixed(2)}`;
    document.getElementById('statsSpend').innerText = `£${totalSpend.toFixed(2)}`;
    document.getElementById('statsArrears').innerText = `£${totalArrears.toFixed(2)}`;
    document.getElementById('statsTarget').innerText = `£${totalTarget.toFixed(2)}`;
    document.getElementById('statsRemaining').innerText = `£${(totalTarget - totalPaid).toFixed(2)}`;
    document.getElementById('progressPercent').innerText = `${Math.round(progress)}%`;
    document.getElementById('progressBarFill').style.width = `${progress}%`;

    const histBox = document.getElementById('monthlyHistoryContainer');
    histBox.innerHTML = '';
    if (db.history.length === 0) {
        histBox.innerHTML = '<div class="empty-history-msg">Month-end snapshots appear here.</div>';
    } else {
        [...db.history].reverse().forEach(h => {
            const div = document.createElement('div');
            div.className = 'customer-tile';
            div.innerHTML = `<div><strong>${h.month} ${h.year}</strong><small>SNAPSHOT</small></div><div class="cust-price-pill">£${n(h.profit).toFixed(2)}</div>`;
            histBox.appendChild(div);
        });
    }
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;
    db.customers.push({
        id, name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value),
        notes: document.getElementById('cNotes').value, week: ex ? ex.week : "1", cleaned: ex ? ex.cleaned : false, paidThisMonth: ex ? ex.paidThisMonth : 0
    });
    if(idx > -1) db.customers.splice(idx, 1);
    saveData(); openTab('home');
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return;
    body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-tile bounce-on-tap';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `<div class="cust-info"><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div class="cust-price-pill">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `<button class="back-pill" onclick="openTab('home')">🏠 Back to Home</button>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="editCust('${c.id}')"><strong style="color:var(--accent)">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street} ${isPaid ? '💰' : ''}</small></div>
                <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="tile" style="height:44px; font-weight:800; ${c.cleaned ? 'background:var(--success); color:white;' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done' : 'Clean'}</button>
                    <button class="tile" style="height:44px; font-weight:800; ${isPaid ? 'background:var(--accent); color:white;' : ''}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay'}</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.completeCycle = () => {
    if(!confirm("Start New Month? History will be archived.")) return;
    let inc = 0, exp = 0;
    db.customers.forEach(c => inc += n(c.paidThisMonth));
    db.expenses.forEach(e => exp += n(e.amt));
    db.history.push({ month: new Date().toLocaleDateString('en-GB', {month:'long'}), year: new Date().getFullYear(), profit: (inc - exp) });
    db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; });
    db.expenses = [];
    saveData(); location.reload();
};

window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.renderLedger = () => {
    const list = document.getElementById('expenseList'); if(!list) return;
    list.innerHTML = '<h3 class="hall-of-fame-title">💸 Spend History</h3>';
    db.expenses.forEach(e => {
        const div = document.createElement('div'); div.className = 'customer-tile';
        div.innerHTML = `<div style="display:flex; justify-content:space-between; width:100%"><div><strong>${e.desc}</strong><small>${e.date}</small></div><div class="amt-red" style="font-size:16px">-£${n(e.amt).toFixed(2)}</div></div>`;
        list.appendChild(div);
    });
};
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a<=0) return;
    db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString('en-GB')});
    saveData(); renderAll();
    document.getElementById('expDesc').value = ""; document.getElementById('expAmt').value = "";
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
