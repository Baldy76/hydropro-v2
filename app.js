const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: {} };

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);

    // Initial Theme Load
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggleBtn').innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggleBtn').innerText = '🌙';
    }

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

window.renderStatsFence = () => {
    const container = document.getElementById('stats-dashboard-container');
    if (!container) return;

    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += (parseFloat(c.price) || 0);
        paid += (parseFloat(c.paidThisMonth) || 0);
        if (c.cleaned && (parseFloat(c.paidThisMonth)||0) < parseFloat(c.price)) {
            arrears += (parseFloat(c.price) - parseFloat(c.paidThisMonth));
        }
    });
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));
    
    const profit = paid - spend;
    const progress = target > 0 ? Math.round((paid / target) * 100) : 0;

    container.innerHTML = `
        <div class="stats-hero">
            <small style="font-weight:700; opacity:0.6;">Summary</small>
            <span class="main-amt">£${profit.toFixed(2)}</span>
            <small style="font-weight:600; opacity:0.7">💰 Total Profit in Pocket</small>
        </div>
        
        <div class="progress-bubble">
            <strong style="font-size:18px;">Monthly Progress ${progress}%</strong>
            <div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; opacity:0.5; text-transform:uppercase;">
                <span>TARGET: £${target.toFixed(2)}</span>
                <span>REMAINING: £${(target - paid).toFixed(2)}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; padding:0 20px 20px;">
            <div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;">
                <small style="font-size:11px; font-weight:800; opacity:0.5; display:block; margin-bottom:5px;">INCOME 🔍</small>
                <div style="color:var(--success); font-size:26px; font-weight:800">£${paid.toFixed(2)}</div>
            </div>
            <div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;">
                <small style="font-size:11px; font-weight:800; opacity:0.5; display:block; margin-bottom:5px;">SPEND 🔍</small>
                <div style="color:var(--danger); font-size:26px; font-weight:800">£${spend.toFixed(2)}</div>
            </div>
        </div>

        <div class="arrears-bubble">Arrears 🔍 £${arrears.toFixed(2)}</div>
        
        <h3 style="color:var(--success); font-size:22px; font-weight:900; margin-left:25px; margin-bottom:15px;">🏆 The Hall of Fame</h3>
        <div class="progress-bubble" style="text-align:center; opacity:0.5; font-weight:700;">Snapshots appear here.</div>
    `;
};

window.renderAll = () => {
    renderStatsFence();
};

window.updateHeader = () => {
    const dt = new Date();
    document.getElementById('dateText').innerText = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
