/* --- 🧠 THE MASTER ENGINE --- */
const DB_KEY = 'HydroPro_Gold_V36';
let db = { customers: [], expenses: [], history: [] };
let curWeek = 1; let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    updateHeader(); renderAll();
});

/* --- 💰 FINANCES ENGINE --- */
window.renderFinances = () => {
    const dash = document.getElementById('FIN-dashboard-iron');
    const ledger = document.getElementById('FIN-ledger-iron');
    if(!dash) return;

    let income = 0, spend = 0;
    db.customers.forEach(c => income += (parseFloat(c.paidThisMonth) || 0));
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));

    dash.innerHTML = `
        <div class="FIN-hero"><small style="opacity:0.5; font-weight:900;">NET PROFIT</small><div>£${(income - spend).toFixed(2)}</div></div>
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
            <div style="background:var(--card); padding:20px; border-radius:25px; width:170px; text-align:center;"><small>INCOME</small><br><strong>£${income.toFixed(2)}</strong></div>
            <div style="background:var(--card); padding:20px; border-radius:25px; width:170px; text-align:center;"><small>SPENT</small><br><strong>£${spend.toFixed(2)}</strong></div>
        </div>`;
    
    let htm = '<div style="background:var(--card); margin:0 20px; padding:25px; border-radius:35px;"><h3>Statement</h3>';
    db.expenses.slice().reverse().forEach(e => {
        htm += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;"><span>${e.desc}</span><span style="color:var(--danger); font-weight:900;">-£${parseFloat(e.amt).toFixed(2)}</span></div>`;
    });
    ledger.innerHTML = htm + '</div>';
};

/* --- 📅 WEEKS ENGINE --- */
window.viewWeek = (w) => { curWeek = w; openTab('week-view-root'); renderWeek(); };
window.setWorkingDay = (day, btn) => { workingDay = day; document.querySelectorAll('.WEE-day-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWeek(); };

window.renderWeek = () => {
    const list = document.getElementById('WEE-list-iron'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div');
        div.className = 'WEE-cust-card';
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned?'✅':''}</strong><br><small>${c.houseNum} ${c.street}</small></div>
            <div style="display:flex; gap:8px;">
                <button onclick="toggleClean('${c.id}')" style="background:var(--ios-grey); border:none; padding:12px; border-radius:15px;">🧼</button>
                <button onclick="settlePaid('${c.id}')" style="background:var(--ios-grey); border:none; padding:12px; border-radius:15px;">£</button>
            </div>`;
        list.appendChild(div);
    });
};

window.toggleClean = (id) => { const c = db.customers.find(x => x.id === id); c.cleaned = !c.cleaned; save(); renderWeek(); };
window.settlePaid = (id) => { const c = db.customers.find(x => x.id === id); const a = prompt("Paid?", c.price); if(a) { c.paidThisMonth = a; db.history.push({custId:id, amt:a, date:new Date().toLocaleDateString()}); save(); renderWeek(); } };

/* --- ⚙️ CORE --- */
window.save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};
window.renderAll = () => {
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
};
window.updateHeader = () => { if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
