const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let currentDayFilter = 'All';
let activePayId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    renderAll();
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
        contents[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }
    document.getElementById(name).style.display = "block";
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");

    // UI DYNAMICS: Toggle Search Bar and Day Filters
    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') searchBar.classList.remove('hidden');
    else searchBar.classList.add('hidden');

    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
    window.scrollTo(0,0);
};

window.setDayFilter = function(day) {
    currentDayFilter = day;
    const pills = document.getElementsByClassName('day-pill');
    for (let p of pills) {
        p.classList.remove('active');
        const map = {"Monday":"M", "Tuesday":"T", "Wednesday":"W", "Thursday":"T", "Friday":"F", "All":"All"};
        if(map[day] === p.innerText || day === p.innerText) p.classList.add('active');
    }
    renderAll();
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        db.customers.filter(c => {
            const weekMatch = String(c.week) === String(i);
            const dayMatch = currentDayFilter === 'All' || c.day === currentDayFilter;
            return weekMatch && dayMatch;
        }).forEach(c => {
            const debt = calculateTrueDebt(c);
            let card = document.createElement('div');
            card.className = `customer-card ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div class="card-status-bar"></div>
                <div class="card-main-content" onclick="openCustomerModal('${c.id}')">
                    <div class="card-title-row"><strong>${c.name}</strong><strong class="card-price">£${n(c.price).toFixed(2)}</strong></div>
                    <small style="opacity:0.5">${c.day} - ${c.address}</small>
                </div>
                <div class="card-actions-wrapper">
                    <div class="action-sub-grid">
                        <button class="btn-admin-small" onclick="openMessageTemplates('${c.id}')">💬 Msg</button>
                        <button class="btn-admin-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    </div>
                    <div class="action-sub-grid">
                        <button class="btn-main" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button>
                        <button class="btn-alt" style="background:var(--success); color:white;" onclick="initQuickPay('${c.id}')">Payment</button>
                    </div>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.renderMasterTable = function() {
    const body = document.getElementById('masterTableBody');
    if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase().trim();
    db.customers.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(search === "" || c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const debt = calculateTrueDebt(c);
            const row = document.createElement('div');
            row.style = "padding:15px 20px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); margin-bottom:8px; border-radius:15px; box-shadow:var(--shadow);";
            row.onclick = () => openCustomerModal(c.id);
            row.innerHTML = `<div><div style="font-weight:700;">${c.name}</div><div style="font-size:12px; opacity:0.5;">${c.address}</div></div><div style="text-align:right;"><div style="font-weight:800; color:${debt > 0 ? 'var(--danger)' : 'var(--success)'};">£${debt.toFixed(2)}</div></div>`;
            body.appendChild(row);
        }
    });
};

// ... [Remainder of helper functions from v9.3 remain same] ...
window.calculateTrueDebt = (c) => {
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};
window.saveData = () => { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };
window.handleSearch = () => { renderMasterTable(); };
window.closeCustomerModal = () => { document.getElementById('customerModal').style.display = 'none'; };
