const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    updateGreeting();
    renderAll();
};

/* ---------------------------------- */
/* 👥 MASTER LIST RESTORATION      */
/* ---------------------------------- */
window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); 
    if(!body) return; 
    body.innerHTML = '';
    
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); 
            tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            
            // Hard-coded typography for the Master List Restoration
            tile.innerHTML = `
                <div>
                    <strong style="display:block; font-size:22px; margin-bottom:4px;">${c.name}</strong>
                    <small style="color:var(--accent); font-weight:700; font-size:16px; text-transform:uppercase;">${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:900; color:var(--success); font-size:20px;">
                    £${n(c.price).toFixed(2)}
                </div>`;
            body.appendChild(tile);
        }
    });
};

window.openTab = (name) => {
    closeModal();
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    
    const nav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAll();
};

window.updateGreeting = () => {
    const hr = new Date().getHours();
    const g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING";
    const msg = document.getElementById('greetingMsg');
    if(msg) msg.innerText = `${g}, PARTNER! ☕`;
    const dt = document.getElementById('headerDate');
    if(dt) dt.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); if(window.renderWeekLists) renderWeekLists(); if(window.renderStats) renderStats(); if(window.renderLedger) renderLedger(); };

// Modal & Interaction Logic (Ironclad Baseline)
window.showActionModal = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('modalCustomerName').innerText = c.name;
    document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`;
    document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); };
    document.getElementById('actionModal').classList.remove('hidden');
};
window.closeModal = () => { const m = document.getElementById('actionModal'); if(m) m.classList.add('hidden'); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone||""; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
