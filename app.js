const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    // Bank Detail Loader
    const bN = document.getElementById('bankName'), bS = document.getElementById('bankSort'), bA = document.getElementById('bankAcc');
    if(bN) bN.value = db.bank.name || "";
    if(bS) bS.value = db.bank.sort || "";
    if(bA) bA.value = db.bank.acc || "";

    // Sort Code Formatter
    if(bS) bS.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 6) val = val.substring(0, 6);
        let formatted = val.match(/.{1,2}/g)?.join('-') || val;
        e.target.value = formatted;
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    const dmT = document.getElementById('darkModeToggle'); if(dmT) dmT.checked = isDark;
    
    updateGreeting();
    renderAll();
};

window.openTab = (name) => {
    // 🛡️ EMERGENCY LOCK RELEASE: If switching tabs, always close modals
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

window.showActionModal = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    document.getElementById('modalCustomerName').innerText = c.name;
    document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`;
    document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); };
    document.getElementById('actionModal').classList.remove('hidden');
};

window.closeModal = () => {
    const m = document.getElementById('actionModal');
    if(m) m.classList.add('hidden');
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:19px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success)">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `
            <div class="bulk-dual-bar" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 15px 15px;">
                <button class="btn-bulk-wa" style="background:#25d366; color:white; height:55px; border-radius:18px; border:none; font-weight:900;" onclick="messageAllInWeek(${i}, 'whatsapp')">🚀 WA ALL</button>
                <button class="btn-bulk-sms" style="background:#ff9500; color:white; height:55px; border-radius:18px; border:none; font-weight:900;" onclick="messageAllInWeek(${i}, 'sms')">🚀 SMS ALL</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 15px 15px;">
                <button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('weeksHub')">⬅️ Weekly Hub</button>
                <button class="tile" style="height:44px; font-size:13px; font-weight:800; background:#e5e5ea; border:none; border-radius:20px;" onclick="openTab('home')">🏠 Home Hub</button>
            </div>`;
        db.customers.filter(c => c.week == i).forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.style.flexDirection = 'column'; card.style.alignItems = 'stretch';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div onclick="showActionModal('${c.id}')">
                        <strong style="color:var(--accent); display:block; font-size:19px;">${c.name} ${c.cleaned ? '✅' : ''}</strong>
                        <small style="display:block; margin-top:2px;">${c.houseNum} ${c.street}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-comm" style="background:#0084ff; color:white; border:none; height:44px; padding:0 15px; border-radius:15px; font-weight:800;" onclick="sendReminder('${c.id}', 'whatsapp')">WA</button>
                        <button class="btn-comm" style="background:#ff9500; color:white; border:none; height:44px; padding:0 15px; border-radius:15px; font-weight:800;" onclick="sendReminder('${c.id}', 'sms')">SMS</button>
                    </div>
                </div>
                <div class="week-card-actions" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px;">
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; ${c.cleaned ? 'background:var(--success); color:white;' : 'background:var(--input-bg)'}" onclick="toggleCleaned('${c.id}')">Clean</button>
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; ${isPaid ? 'background:var(--accent); color:white;' : 'background:var(--input-bg)'}" onclick="markAsPaid('${c.id}')">Pay</button>
                    <button class="btn-week-action" style="height:44px; border-radius:12px; font-weight:800; border:none; background:var(--input-bg)" onclick="showActionModal('${c.id}')">Edit</button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.renderStats = () => {
    // Basic implementation for summary
    const container = document.getElementById('stats'); if(!container) return;
    container.innerHTML = '<div class="customer-pill-bubble" style="justify-content:center">Stats loading...</div>';
};

window.renderLedger = () => {
    const container = document.getElementById('expenseList'); if(!container) return;
    container.innerHTML = '';
    [...db.expenses].reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'customer-pill-bubble';
        div.innerHTML = `<div><strong style="display:block; font-size:18px">${e.desc}</strong><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:18px">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx > -1) ? db.customers[idx].week : "1", cleaned: (idx > -1) ? db.customers[idx].cleaned : false, paidThisMonth: (idx > -1) ? db.customers[idx].paidThisMonth : 0 };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('home');
};

window.saveBankDetails = () => {
    db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value };
    saveData(); toggleBankLock(); alert("Bank Details Secured! 🏦");
};

window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field');
    const lockBtn = document.getElementById('bankLockBtn');
    const saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly;
    fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 Lock" : "🔓 Unlock";
    if(isLocked) saveBtn.classList.remove('hidden'); else saveBtn.classList.add('hidden');
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening"; const el = document.getElementById('greetingMsg'); if (el) el.innerText = `${g}, Partner! ☕`; };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone||""; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleCleaned = (id) => { const c = db.customers.find(x => x.id === id); if (c) { c.cleaned = !c.cleaned; saveData(); renderAll(); } };
window.markAsPaid = (id) => { const c = db.customers.find(x => x.id === id); if (!c) return; const isPaid = n(c.paidThisMonth) >= n(c.price); c.paidThisMonth = isPaid ? 0 : c.price; saveData(); renderAll(); };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
