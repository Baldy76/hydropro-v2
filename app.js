const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    const bN = document.getElementById('bankName'), bS = document.getElementById('bankSort'), bA = document.getElementById('bankAcc');
    if(bN) bN.value = db.bank.name || "";
    if(bS) {
        bS.value = db.bank.sort || "";
        bS.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 6) val = val.substring(0, 6);
            let formatted = val.match(/.{1,2}/g)?.join('-') || val;
            e.target.value = formatted;
        });
    }
    if(bA) bA.value = db.bank.acc || "";

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    updateGreeting();
    renderAll();
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:22px;">${c.name}</strong><small style="color:var(--accent); font-weight:700; font-size:16px;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:20px;">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 5; i++) {
        const container = document.getElementById(`week${i}`); if (!container) continue;
        container.innerHTML = `
            <div class="iron-spaced-stack">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#25d366; color:white" onclick="messageAll(${i}, 'whatsapp')">WA ALL</button>
                    <button class="tile-restore" style="height:60px; font-size:14px; background:#ff9500; color:white" onclick="messageAll(${i}, 'sms')">SMS ALL</button>
                </div>
                <div id="weekBody${i}" class="iron-spaced-stack"></div>
            </div>`;
        const body = document.getElementById(`weekBody${i}`);
        db.customers.filter(c => c.week == i).forEach(c => {
            const card = document.createElement('div'); card.className = 'customer-pill-bubble';
            card.innerHTML = `<div onclick="showActionModal('${c.id}')"><strong style="font-size:20px;">${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street}</small></div>`;
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
    document.getElementById('progressPercent').innerText = `${Math.round(progress)}%`;
    document.getElementById('progressBarFill').style.width = `${progress}%`;
};

window.renderLedger = () => {
    const list = document.getElementById('expenseList'); if(!list) return; list.innerHTML = '';
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'customer-pill-bubble';
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900">-£${n(e.amt).toFixed(2)}</div>`;
        list.appendChild(div);
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: "1", cleaned: false, paidThisMonth: 0 };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = {...db.customers[idx], ...entry}; else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('home');
};

window.openTab = (name) => {
    closeModal();
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    const target = document.getElementById(name);
    if(target) target.classList.add("active");
    const nav = document.getElementById('globalNav');
    if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden'); else nav.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' }); renderAll();
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); renderLedger(); };
window.showActionModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('modalCustomerName').innerText = c.name; document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`; document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); }; document.getElementById('actionModal').classList.remove('hidden'); };
window.closeModal = () => { const m = document.getElementById('actionModal'); if(m) m.classList.add('hidden'); };
window.editCust = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; openTab('admin'); document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone||""; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes; };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-field'); const lockBtn = document.getElementById('bankLockBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 Lock" : "🔓 Unlock"; document.getElementById('bankSaveBtn').classList.toggle('hidden'); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Details Saved! 🏦"); };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); saveData(); renderAll(); };
window.toggleDarkMode = () => { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetingMsg').innerText = `${g}, PARTNER! ☕`; document.getElementById('headerDate').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(!confirm("Start New Month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
