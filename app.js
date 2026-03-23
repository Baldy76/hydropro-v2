const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Baseline Integrity Checks
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    db.customers.forEach(c => { 
        if(!c.paymentLogs) c.paymentLogs = []; 
        if(!c.debtHistory) c.debtHistory = [];
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(name).classList.add("active");
    
    const nav = document.getElementById('subpageNav');
    const hubPages = ['home', 'weeksHub'];
    
    if (hubPages.includes(name)) {
        nav.classList.add('hidden');
        document.body.classList.remove('sub-page-active');
    } else {
        nav.classList.remove('hidden');
        document.body.classList.add('sub-page-active');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.handleBackNavigation = () => {
    const active = document.querySelector('.tab-content.active').id;
    if (active.startsWith('week') && active !== 'weeksHub') {
        openTab('weeksHub');
    } else {
        openTab('home');
    }
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

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue;
        container.innerHTML = `<button class="back-pill" onclick="openTab('weeksHub')">⬅️ Back to Weeks Hub</button>`;
        const weekCusts = db.customers.filter(c => c.week == i);
        weekCusts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div onclick="editCust('${c.id}')"><strong style="color:var(--accent); font-size:18px;">${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div>`;
            container.appendChild(card);
        });
    }
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    openTab('admin');
    document.getElementById('editId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cHouseNum').value = c.houseNum;
    document.getElementById('cStreet').value = c.street;
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week;
    document.getElementById('cDay').value = c.day;
    document.getElementById('cNotes').value = c.notes;
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderWeekLists(); };
window.updateGreeting = () => {
    const hr = new Date().getHours();
    document.getElementById('greetingMsg').innerText = (hr < 12) ? "Good Morning! ☕" : (hr < 18) ? "Good Afternoon! ☀️" : "Good Evening! 🌙";
};
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
