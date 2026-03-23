window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) {
        alert("Please enter a customer name! ✨");
        return;
    }

    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, 
        name,
        houseNum: document.getElementById('cHouseNum').value, // NEW
        street: document.getElementById('cStreet').value,     // NEW
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false, 
        paidThisMonth: ex ? ex.paidThisMonth : 0, 
        debtHistory: ex ? ex.debtHistory : [], 
        paymentLogs: ex ? ex.paymentLogs : []
    };

    if(idx > -1) db.customers[idx] = entry; 
    else db.customers.push(entry);
    
    saveData(); 
    openTab('home'); // Send them back to the Hub after saving
};
