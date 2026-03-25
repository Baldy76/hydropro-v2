const DB_KEY = 'HydroPro_Gold_V36';
const W_API_KEY = "4c00e61833ea94d3c4a1bff9d2c32969"; 

let db = { customers: [], expenses: [], history: [], bank: { name: '', acc: '' } };
let curWeek = 1; let workingDay = 'Mon';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            db.customers = parsed.customers || [];
            db.expenses = parsed.expenses || [];
            db.history = parsed.history || [];
            db.bank = parsed.bank || { name: '', acc: '' };
        }
    } catch(err) { console.error("Database Error."); }

    applyTheme(localStorage.getItem('HP_Theme') === 'true');
    const cb = document.getElementById('themeCheckbox');
    if(cb) {
        cb.checked = localStorage.getItem('HP_Theme') === 'true';
        cb.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
            localStorage.setItem('HP_Theme', e.target.checked);
        });
    }

    updateHeaderDate(); 
    renderAllSafe(); 
    initWeather();
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    const logo = document.getElementById('mainLogo');
    if(logo) logo.src = isDark ? "Logo-Dark.png" : "Logo.png";
}

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    renderAllSafe();
};

window.updateHeaderDate = () => {
    const el = document.getElementById('dateText');
    if(el) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.renderAllSafe = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
    if(document.getElementById('finances-root').classList.contains('active')) renderFinances();
    if(document.getElementById('week-view-root').classList.contains('active')) renderWeek();
};

/* --- ADM LOGIC --- */
window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Name required!");
    db.customers.push({
        id: Date.now().toString(),
        name,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        cleaned: false,
        paidThisMonth: 0,
        week: "1", day: "Mon"
    });
    saveData(); alert("Saved!"); location.reload();
};

/* --- CST LOGIC --- */
window.renderMaster = () => {
    const list = document.getElementById('CST-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CST-card-item';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `<div><strong style="font-size:20px;">${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success); font-size:22px;">£${parseFloat(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const container = document.getElementById('briefingData');
    const paid = parseFloat(c.paidThisMonth) || 0;
    const price = parseFloat(c.price) || 0;
    const arrearsHtml = paid < price ? `<div style="background:var(--danger); color:white; padding:15px; border-radius:20px; text-align:center; font-weight:950; margin:15px 0;">⚠️ UNPAID £${(price-paid).toFixed(2)}</div>` : `<div style="color:var(--success); text-align:center; font-weight:950; margin:15px 0;">✅ PAID</div>`;

    container.innerHTML = `<h2 style="font-size:32px; font-weight:950;">${c.name}</h2>${arrearsHtml}
        <div class="CST-brief-item"><span class="CST-brief-icon">📍</span>${c.postcode || 'N/A'}</div>
        <div class="CST-brief-item" onclick="window.location.href='tel:${c.phone}'"><span class="CST-brief-icon">📞</span>${c.phone || 'N/A'}</div>
        <div class="CST-brief-item"><span class="CST-brief-icon">💰</span>£${price.toFixed(2)}</div>`;
    document.getElementById('briefingModal').classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

/* --- WEE LOGIC --- */
window.viewWeek = (num) => { curWeek = num; openTab('week-view-root'); };
window.setWorkingDay = (day, btn) => { 
    workingDay = day; 
    document.querySelectorAll('.WEE-day-btn').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    renderWeek(); 
};
window.renderWeek = () => {
    const list = document.getElementById('WEE-list-container'); if(!list) return; list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek && c.day == workingDay).forEach(c => {
        const div = document.createElement('div'); div.className = 'CST-card-item';
        div.innerHTML = `<div><strong>${c.name} ${c.cleaned ? '✅' : ''}</strong><br><small>${c.houseNum} ${c.street}</small></div>
            <div><button class="WEE-action-btn" onclick="toggleClean('${c.id}')">🧼</button><button class="WEE-action-btn" onclick="settlePaid('${c.id}')">£</button></div>`;
        list.appendChild(div);
    });
};
window.toggleClean = (id) => { const c = db.customers.find(x => x.id === id); c.cleaned = !c.cleaned; saveData(); renderWeek(); };
window.settlePaid = (id) => { 
    const c = db.customers.find(x => x.id === id); 
    const amt = prompt("Amount Paid?", c.price);
    if(amt !== null) { 
        c.paidThisMonth = parseFloat(amt); 
        db.history.push({ custId: id, amt, date: new Date().toLocaleDateString('en-GB') });
        saveData(); renderWeek(); 
    }
};

/* --- 🌦️ WEATHER --- */
async function initWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${W_API_KEY}&units=metric`);
            const data = await res.json();
            document.getElementById('w-text').innerText = `${Math.round(data.main.temp)}°C`;
        } catch (e) { document.getElementById('w-text').innerText = "OFFLINE"; }
    });
}
