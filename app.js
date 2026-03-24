const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    updateGreeting(); renderAll();
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:20px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `
            <div class="iron-spaced-stack" style="padding-top:10px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 20px;">
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#25d366; color:white" onclick="messageAll(${i}, 'whatsapp')">WA ALL</button>
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#ff9500; color:white" onclick="messageAll(${i}, 'sms')">SMS ALL</button>
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#e5e5ea; color:#000" onclick="openTab('weeksHub')">⬅️ Hub</button>
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#e5e5ea; color:#000" onclick="openTab('home')">🏠 Home</button>
                </div>
                <div id="weekBody${i}" class="iron-spaced-stack"></div>
            </div>`;
        const body = document.getElementById(`weekBody${i}`);
        db.customers.filter(c => c.week == i).forEach(c => {
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.style.flexDirection = 'column'; card.style.alignItems = 'stretch';
            const isPaid = n(c.paidThisMonth) > 0;
            card.innerHTML = `
                <div><strong style="font-size:22px;">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street}</small></div>
                <div class="week-action-grid">
                    <button class="btn-job-action" style="background:${c.cleaned ? 'var(--success)' : '#aaa'}" onclick="toggleCleaned('${c.id}')">CLEAN</button>
                    <button class="btn-job-action" style="background:${isPaid ? 'var(--accent)' : '#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button>
                    <button class="btn-job-action btn-job-edit" onclick="editCust('${c.id}')">EDIT</button>
                    <button class="btn-job-action btn-job-edit" onclick="showActionModal('${c.id}')">DETAILS</button>
                </div>`;
            body.appendChild(card);
        });
    }
};

window.renderStats = () => {
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += n(c.price); paid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend;
    const progress = target > 0 ? (paid / target) * 100 : 0;

    document.getElementById('currProfit').innerText = `£${profit.toFixed(2)}`;
    document.getElementById('statsIncome').innerText = `£${paid.toFixed(2)}`;
    document.getElementById('statsSpend').innerText = `£${spend.toFixed(2)}`;
    document.getElementById('statsArrears').innerText = `£${arrears.toFixed(2)}`;
    document.getElementById('statsTarget').innerText = `£${target.toFixed(2)}`;
    document.getElementById('statsRemaining').innerText = `£${(target - paid).toFixed(2)}`;
    document.getElementById('progressPercent').innerText = `${Math.round(progress)}%`;
    document.getElementById('progressBarFill').style.width = `${progress}%`;
};

window.openTab = (name) => { closeModal(); document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active")); const t = document.getElementById(name); if(t) t.classList.add("active"); const nav = document.getElementById('globalNav'); if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden'); else nav.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'instant' }); renderAll(); };
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); };
window.toggleDarkMode = () => { const isDark = !document.body.classList.contains('dark-mode'); document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); document.getElementById('themeToggleBtn').innerText = isDark ? '☀️ Light' : '🌙 Dark'; };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetingMsg').innerText = `${g}, PARTNER! ☕`; document.getElementById('headerDate').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
window.showActionModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('modalCustomerName').innerText = c.name; document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`; document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); }; document.getElementById('actionModal').classList.remove('hidden'); };
window.closeModal = () => document.getElementById('actionModal').classList.add('hidden');
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); /* Add field fillers here */ };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; c.paidThisMonth = (n(c.paidThisMonth) > 0) ? 0 : c.price; saveData(); renderAll(); };
