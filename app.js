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

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const existing = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, name, 
        houseNum: document.getElementById('cHouseNum').value, 
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(), 
        price: n(document.getElementById('cPrice').value),
        notes: document.getElementById('cNotes').value, 
        week: existing ? existing.week : "1", 
        cleaned: existing ? existing.cleaned : false, 
        paidThisMonth: existing ? existing.paidThisMonth : 0
    };

    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData();
    
    // RESTORED POPUP
    alert("Customer Saved Successfully! ✨");
    
    // Clear Form
    document.getElementById('editId').value = "";
    document.getElementById('cName').value = "";
    document.getElementById('cHouseNum').value = "";
    document.getElementById('cStreet').value = "";
    document.getElementById('cPostcode').value = "";
    document.getElementById('cPrice').value = "";
    document.getElementById('cNotes').value = "";
    
    openTab('home');
};

window.renderStats = () => {
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += n(c.price);
        paid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const progress = target > 0 ? (paid / target) * 100 : 0;

    if(document.getElementById('currProfit')) document.getElementById('currProfit').innerText = `£${(paid - spend).toFixed(2)}`;
    if(document.getElementById('statsIncome')) document.getElementById('statsIncome').innerText = `£${paid.toFixed(2)}`;
    if(document.getElementById('statsSpend')) document.getElementById('statsSpend').innerText = `£${spend.toFixed(2)}`;
    if(document.getElementById('statsArrears')) document.getElementById('statsArrears').innerText = `£${arrears.toFixed(2)}`;
    if(document.getElementById('statsTarget')) document.getElementById('statsTarget').innerText = `£${target.toFixed(2)}`;
    if(document.getElementById('statsRemaining')) document.getElementById('statsRemaining').innerText = `£${(target - paid).toFixed(2)}`;
    if(document.getElementById('progressPercent')) document.getElementById('progressPercent').innerText = `${Math.round(progress)}%`;
    if(document.getElementById('progressBarFill')) document.getElementById('progressBarFill').style.width = `${progress}%`;
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return;
    body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble bounce-on-tap';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `<div><strong>${c.name}</strong><small>${c.houseNum} ${c.street}</small></div><div class="cust-price-pill" style="font-weight:900; color:var(--success)">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = '';
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.innerHTML = `<div onclick="editCust('${c.id}')"><strong style="color:var(--accent)">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street} ${isPaid ? '💰' : ''}</small></div>
                <div style="display:flex; gap:10px;">
                    <button class="tile" style="height:44px; padding:0 15px; font-weight:800; ${c.cleaned ? 'background:var(--success); color:white;' : ''}" onclick="toggleCleaned('${c.id}')">Clean</button>
                    <button class="tile" style="height:44px; padding:0 15px; font-weight:800; ${isPaid ? 'background:var(--accent); color:white;' : ''}" onclick="markAsPaid('${c.id}')">Pay</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.updateGreeting = () => { const hr = new Date().getHours(); document.getElementById('greetingMsg').innerText = (hr < 12) ? "Good Morning, Jonathan! ☕" : (hr < 18) ? "Good Afternoon, Jonathan! ☀️" : "Good Evening, Jonathan! 🌙"; };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
