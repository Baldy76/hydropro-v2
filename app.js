const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙';
    updateHeader();
    renderAll();
};

window.toggleDarkMode = () => {
    const isNowDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isNowDark);
    document.getElementById('themeToggleBtn').innerText = isNowDark ? '☀️' : '🌙';
};

window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(fenceId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

/* --- FENCE: LEDGER ROBOTS --- */

window.renderLedgerFence = () => {
    const container = document.getElementById('expense-list-container');
    if(!container) return;
    container.innerHTML = '';
    
    if(db.expenses.length === 0) {
        container.innerHTML = '<div class="expense-tile" style="justify-content:center; opacity:0.5">No expenses logged this month.</div>';
        return;
    }

    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div');
        div.className = 'expense-tile';
        div.innerHTML = `
            <div>
                <strong style="display:block; font-size:18px;">${e.desc}</strong>
                <small style="opacity:0.6; font-weight:700;">${e.date}</small>
            </div>
            <div style="color:var(--danger); font-weight:900; font-size:20px;">
                -£${n(e.amt).toFixed(2)}
            </div>`;
        container.appendChild(div);
    });
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value;
    const a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return alert("Enter description and amount.");
    
    db.expenses.push({
        id: Date.now(),
        desc: d,
        amt: a,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    });
    
    saveData();
    document.getElementById('expDesc').value = '';
    document.getElementById('expAmt').value = '';
    renderLedgerFence();
};

window.exportToCSV = (type) => {
    let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n';
    if(type === 'income') {
        db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`);
    } else {
        db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`);
    }
    const b = new Blob([csv], { type: 'text/csv' });
    const u = window.URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = `HydroPro_${type}.csv`;
    a.click();
};

/* --- GLOBAL CORE --- */
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.renderAll = () => {
    if(document.getElementById('master-list-container')) renderMasterFence();
    if(document.getElementById('stats-dashboard-container')) renderStatsFence();
    renderLedgerFence();
};
window.updateHeader = () => {
    const hr = new Date().getHours();
    const g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING";
    document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`;
    document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
