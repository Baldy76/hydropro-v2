const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Baseline Integrity
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    db.customers.forEach(c => { 
        if(!c.paymentLogs) c.paymentLogs = []; 
        if(!c.debtHistory) c.debtHistory = [];
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// REPAIRED NAVIGATION
window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => {
        c.classList.remove("active");
        c.style.display = "none";
    });
    
    const target = document.getElementById(name);
    if (target) {
        target.classList.add("active");
        target.style.display = "block";
    }
    
    const hubPages = ['home', 'weeksHub'];
    const navBar = document.getElementById('globalNav');
    const mainHeader = document.getElementById('mainHeader');
    
    if (navBar) {
        navBar.style.display = hubPages.includes(name) ? "none" : "block";
    }

    renderAll();
    window.scrollTo(0,0);
};

window.handleBackNavigation = () => {
    const activeContent = document.querySelector('.tab-content.active');
    if (activeContent && activeContent.id.startsWith('week') && activeContent.id !== 'weeksHub') {
        openTab('weeksHub');
    } else {
        openTab('home');
    }
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue;
        container.innerHTML = `<button class="back-pill" onclick="openTab('weeksHub')">⬅️ Back to Weeks</button>`;
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) {
            container.innerHTML += `<div class="card" style="text-align:center; opacity:0.5; padding:40px;">Week ${i} is empty</div>`;
            continue;
        }
        weekCusts.forEach(c => {
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div onclick="showCustDetails('${c.id}')"><strong style="color:var(--accent); font-size:19px;">${c.name}</strong><br><small>${c.address}</small></div>`;
            container.appendChild(card);
        });
    }
};

window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, name: nameVal, address: (document.getElementById('cAddr').value || ""),
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false, 
        paidThisMonth: ex ? ex.paidThisMonth : 0, 
        debtHistory: ex ? ex.debtHistory : [], 
        paymentLogs: ex ? ex.paymentLogs : []
    };

    if(idx > -1) db.customers[idx] = entry; 
    else db.customers.push(entry);
    
    saveData(); location.reload(); 
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderWeekLists(); renderStats(); renderMasterTable(); };
window.toggleDarkMode = () => { const d = document.getElementById('darkModeToggle').checked; document.body.className = d ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', d); };
window.updateGreeting = () => {
    const hr = new Date().getHours();
    let g = (hr < 12) ? "Good Morning, Jonathan! ☕" : (hr < 18) ? "Good Afternoon, Jonathan! ☀️" : "Good Evening, Jonathan! 🌙";
    document.getElementById('greetingMsg').innerText = g;
};
