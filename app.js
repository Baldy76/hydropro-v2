const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Integrity Checks from v13.3 baseline
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

// --- NAVIGATION HUB LOGIC ---
window.openTab = (name) => {
    // Hide all contents
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    
    // Show target
    const target = document.getElementById(name);
    if (target) target.style.display = "block";
    
    // Global Back Button Logic
    const hubPages = ['home', 'weeksHub'];
    const navBar = document.getElementById('globalNav');
    if (navBar) {
        navBar.style.display = hubPages.includes(name) ? "none" : "block";
    }

    renderAll();
    window.scrollTo(0,0);
};

window.handleBackNavigation = () => {
    // Logic to determine if we go back to Weeks Hub or Home
    const activeWeek = Array.from(document.querySelectorAll('.tab-content'))
        .find(c => c.id.startsWith('week') && c.id !== 'weeksHub' && c.style.display === 'block');
    
    if (activeWeek) openTab('weeksHub');
    else openTab('home');
};

// --- DATA INTEGRITY (v13.3 Baseline) ---
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

window.renderWeekLists = () => {
    // Loop updated for Weeks 1-5
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
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const d = (c.debtHistory||[]).reduce((s,x)=>s+n(x.amount),0);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div onclick="showCustDetails('${c.id}')"><strong style="font-size:19px; color:var(--accent);">${c.name}</strong><br><small>${c.address}</small></div>
                <div class="workflow-grid">
                    <div class="status-row">
                        <button class="action-btn-main ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done' : 'Clean'}</button>
                        <button class="action-btn-main ${isPaid ? 'btn-paid-active' : ''}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid' : 'Pay'}</button>
                    </div>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
// Remaining functions (MarkAsPaid, Expenses, Archive) remain identical to v13.3
