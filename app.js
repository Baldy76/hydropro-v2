const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    
    // Sync the slider checkbox and LOGO on load
    const themeCheckbox = document.getElementById('themeCheckbox');
    if(themeCheckbox) themeCheckbox.checked = isDark;
    
    const mainLogo = document.getElementById('mainLogo');
    if(mainLogo) mainLogo.src = isDark ? 'Logo-Dark.png' : 'Logo.png';

    updateHeader();
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isDark);
    
    // Sync checkbox
    const themeCheckbox = document.getElementById('themeCheckbox');
    if(themeCheckbox) themeCheckbox.checked = isDark;

    // v30.1 LOGO SWAP logic with v30.2 smooth transition targeting
    const mainLogo = document.getElementById('mainLogo');
    if(mainLogo) {
        mainLogo.style.opacity = '0';
        setTimeout(() => {
            mainLogo.src = isDark ? 'Logo-Dark.png' : 'Logo.png';
            mainLogo.style.opacity = '1';
        }, 200);
    }
};

/* --- FULL SHARED CODEBASE PRESERVED --- */
window.openTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

window.copyBankDetails = () => {
    const details = `${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`;
    navigator.clipboard.writeText(details).then(() => {
        const btn = document.getElementById('copyBankBtn');
        const oldText = btn.innerText;
        btn.innerText = "COPIED! ✅";
        btn.style.background = "var(--success)";
        setTimeout(() => { btn.innerText = oldText; btn.style.background = "#8e8e93"; }, 2000);
    });
};

window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            let badgeHtml = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badgeHtml}<div><strong style="font-size:20px; display:block;">${c.name}</strong><small style="color:var(--accent);font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:18px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'), totalEl = document.getElementById('ledgerTotal');
    if(!container) return; container.innerHTML = ''; let total = 0;
    db.expenses.forEach(e => total += n(e.amt)); if(totalEl) totalEl.innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.ondblclick = () => deleteExpense(e.id);
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>📅 ${e.date}</small></div><div style="color:var(--danger); font-weight:900; font-size:18px;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.deleteExpense = (id) => { if(confirm("Delete this expense?")) { db.expenses = db.expenses.filter(e => e.id !== id); saveData(); renderLedger(); renderStats(); } };

window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.round((paid/target)*100) : 0;
    container.innerHTML = `<div class="stats-hero"><div>£${profit.toFixed(2)}</div><small style="font-weight:700; opacity:0.6;">PROFIT IN POCKET</small></div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;"><div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5; font-size:10px;">MONTH INCOME</small><div style="color:var(--success); font-weight:900; font-size:20px;">£${paid.toFixed(2)}</div></div><div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5; font-size:10px;">MONTH SPEND</small><div style="color:var(--danger); font-weight:900; font-size:20px;">£${spend.toFixed(2)}</div></div></div><div style="background:var(--card); padding:25px; border-radius:35px; margin-bottom:20px;"><strong>Progress ${progress}%</strong><div style="background:#eee; height:14px; border-radius:7px; margin:10px 0; overflow:hidden;"><div style="background:var(--accent); height:100%; width:${progress}%"></div></div><div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.6; font-weight:700;"><span>TARGET £${target.toFixed(2)}</span><span>REMAINING £${(target - paid).toFixed(2)}</span></div></div><div style="background:var(--danger); color:white; padding:25px; border-radius:30px; text-align:center; font-weight:900; font-size:20px;">ARREARS: £${arrears.toFixed(2)}</div>`;
};

window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); };
window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container'); if(!list) return;
    bulk.innerHTML = `<button class="btn-wa" onclick="messageAll(${curWeek},'wa')">WA Message all W${curWeek}</button><button class="btn-sms" onclick="messageAll(${curWeek},'sms')">SMS Message all W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div class="job-actions"><button class="btn-job btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button><button class="btn-job" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button><button class="btn-job" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button></div>`;
        list.appendChild(div);
    });
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    if(n(c.paidThisMonth) > 0) { if(confirm(`Current paid: £${n(c.paidThisMonth)}. Reset to £0?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; }
    const amt = prompt(`Enter amount paid for ${c.name}:`, c.price); if(amt === null) return;
    const val = n(amt); if(val >= 0) { c.paidThisMonth = val; saveData(); renderWeek(); renderStats(); } else { alert("Valid amount please."); }
};

window.openMap = (addr) => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank'); };
window.toggleBankLock = () => { const fields = document.querySelectorAll('.bank-field-fixed'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn'); const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked); lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked); };
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName
