const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

window.openTab = (name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(name).classList.add("active");
    
    const nav = document.getElementById('subpageNav');
    if (name === 'home') {
        nav.classList.add('hidden');
        document.body.classList.remove('sub-page-active'); // Logo goes LARGE
    } else {
        nav.classList.remove('hidden');
        document.body.classList.add('sub-page-active'); // Logo slims down
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return;
    db.customers.push({
        id: Date.now().toString(), name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        cleaned: false, paidThisMonth: 0
    });
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    location.reload();
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
            card.innerHTML = `<strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small>`;
            container.appendChild(card);
        });
    }
};

window.renderAll = () => { renderWeekLists(); };
