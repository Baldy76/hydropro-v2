const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: {} };

window.onload = () => {
    // 1. Load Data
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);

    // 2. Load Theme
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️ LIGHT' : '🌙 DARK';

    // 3. Init Header
    updateHeader();
    renderAll();
};

// --- NAMESPACE: NAVIGATION ---
window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(fenceId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

// --- NAMESPACE: STATS (RESTORATION ROBOT) ---
window.renderStatsFence = () => {
    const container = document.getElementById('stats-dashboard-container');
    if (!container) return;

    // Calculation Logic
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
            <small style="font-weight:700">Summary</small>
            <span class="main-amt">£${profit.toFixed(2)}</span>
            <small style="opacity:0.7">💰 Total Profit in Pocket</small>
        </div>
        
        <div class="progress-bubble">
            <strong>Monthly Progress ${progress}%</strong>
            <div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; opacity:0.6">
                <span>TARGET: £${target.toFixed(2)}</span>
                <span>REMAINING: £${(target - paid).toFixed(2)}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; padding:0 20px 20px;">
            <div class="progress-bubble" style="margin:0; text-align:center;">
                <small style="font-size:10px; font-weight:800; opacity:0.5">INCOME</small>
                <div style="color:var(--success); font-size:24px; font-weight:800">£${paid.toFixed(2)}</div>
            </div>
            <div class="progress-bubble" style="margin:0; text-align:center;">
                <small style="font-size:10px; font-weight:800; opacity:0.5">SPEND</small>
                <div style="color:var(--danger); font-size:24px; font-weight:800">£${spend.toFixed(2)}</div>
            </div>
        </div>

        <div class="arrears-bubble">Arrears 🔍 £${arrears.toFixed(2)}</div>
    `;
};

// --- GLOBAL UTILS ---
window.renderAll = () => {
    renderStatsFence();
    // We will add renderSetupFence(), renderMasterFence() etc one by one
};

window.updateHeader = () => {
    const dt = new Date();
    document.getElementById('dateText').innerText = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.toggleDarkMode = () => {
    const isDark = !document.body.classList.contains('dark-mode');
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('HP_Theme', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️ LIGHT' : '🌙 DARK';
};
