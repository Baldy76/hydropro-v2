const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- CORE DATA FUNCTIONS ---
window.saveCustomer = function() {
    const nameInput = document.getElementById('cName');
    if(!nameInput.value) { alert("Please enter a name"); return; }
    
    const id = document.getElementById('editId').value || Date.now().toString();
    const newCust = {
        id: id,
        name: nameInput.value,
        address: document.getElementById('cAddr').value || "",
        postcode: document.getElementById('cPostcode').value || "",
        phone: document.getElementById('cPhone').value || "",
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value || "",
        cleaned: false,
        paidThisMonth: 0,
        debtHistory: []
    };

    const idx = db.customers.findIndex(x => x.id === id);
    if (idx > -1) {
        db.customers[idx] = newCust;
    } else {
        db.customers.push(newCust);
    }

    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    alert("Customer Saved Successfully!");
    location.reload(); // Hard refresh to ensure UI update
};

window.runUATClear = function() {
    if(confirm("🛑 ARE YOU SURE? This wipes EVERYTHING.")) {
        if(confirm("Final check: Delete all customers and settings?")) {
            localStorage.clear();
            location.reload();
        }
    }
};

window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Notes\n";
    db.customers.forEach(c => {
        csv += `${c.id},"${c.name}","${c.address}","${c.postcode}","${c.phone}",${c.price},${c.week},"${c.day}","${c.notes}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HydroPro_Backup.csv`;
    a.click();
};

window.importFullCSV = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1);
        let imported = [];
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(cols.length > 5) {
                imported.push({
                    id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''),
                    postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''),
                    price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : ""
                });
            }
        });
        db.customers = imported;
        localStorage.setItem(MASTER_KEY, JSON.stringify(db));
        location.reload();
    };
    reader.readAsText(file);
};

// --- UI FUNCTIONS ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(name).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.renderAll = () => {
    // Logic for Week Lists...
};
