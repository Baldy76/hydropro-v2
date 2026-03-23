const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const target = document.getElementById(name); if(target) target.style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    renderAll();
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        weekCusts.forEach(c => {
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div><strong style="font-size:19px; color:var(--accent);">${c.name}</strong><br><small>${c.address}</small></div>
                <div class="workflow-grid"><div class="comms-row"><button class="icon-btn-large" onclick="handleWhatsApp('${c.id}')">💬</button><button class="icon-btn-large" onclick="handleSMS('${c.id}')">📱</button><a href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=0{encodeURIComponent(c.address)}" target="_blank" class="icon-btn-large">📍</a></div>
                <div class="status-row"><button class="action-btn-main ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Done ✅' : 'Clean'}</button><button class="action-btn-main ${n(c.paidThisMonth)>0 ? 'btn-paid-active' : ''}" onclick="markAsPaid('${c.id}')">Pay</button></div></div>`;
            container.appendChild(card);
        });
    }
};

window.saveCustomer = () => {
    const nVal = document.getElementById('cName').value; if(!nVal) return;
    db.customers.push({ id: Date.now().toString(), name: nVal, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, cleaned: false, paidThisMonth: 0, debtHistory: [] });
    saveData(); location.reload();
};

window.renderAll = () => { renderWeekLists(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); c.cleaned = !c.cleaned; saveData(); renderWeekLists(); };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); c.paidThisMonth = c.price; saveData(); renderWeekLists(); };
