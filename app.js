const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Baseline data check
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(name).classList.add("active");
    
    const nav = document.getElementById('subpageNav');
    const header = document.querySelector('.app-header');
    
    if (name === 'home') {
        nav.classList.add('hidden');
        header.classList.remove('hidden');
    } else {
        nav.classList.remove('hidden');
        header.classList.add('hidden');
    }
    window.scrollTo(0,0);
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return;
    db.customers.push({
        id: Date.now().toString(),
        name,
        address: document.getElementById('cAddr').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        cleaned: false,
        paidThisMonth: 0
    });
    saveData(); location.reload();
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue;
        container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        weekCusts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<strong>${c.name}</strong><br><small>${c.address}</small>`;
            container.appendChild(card);
        });
    }
};

window.renderAll = () => { renderWeekLists(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.closeModal = () => document.getElementById('globalModal').style.display = 'none';
