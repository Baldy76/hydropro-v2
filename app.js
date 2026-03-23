// ... existing boot and data logic ...

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        
        db.customers.filter(c => String(c.week) === String(i)).forEach(c => {
            const debt = calculateTrueDebt(c);
            const card = document.createElement('div');
            card.className = `customer-card fade-in`;
            
            card.innerHTML = `
                <div onclick="openCustomerModal('${c.id}')">
                    <div class="card-title-row">
                        <span class="card-name">${c.name}</span>
                        <span class="card-price">£${n(c.price).toFixed(2)}</span>
                    </div>
                    <span class="card-addr">${c.address}</span>
                    <div class="card-tags">
                        ${c.nextDue ? `<span class="pill pill-blue">🗓 ${c.nextDue}</span>` : ''}
                        ${debt > 0 ? `<span class="pill pill-red">💰 £${debt.toFixed(2)} OWED</span>` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-small-ghost" onclick="openMessageTemplates('${c.id}')">💬 MESSAGE</button>
                    <button class="btn-small-ghost" onclick="editCustomer('${c.id}')">⚙️ EDIT</button>
                    <button class="btn-main" onclick="markJobAsCleaned('${c.id}')">${c.cleaned ? 'DONE ✅' : 'CLEANED'}</button>
                    <button class="btn-alt" onclick="processPayment('${c.id}')">PAYMENT</button>
                </div>
            `;
            div.appendChild(card);
        });
    }
};

window.renderMasterTable = function() {
    const body = document.getElementById('masterTableBody');
    if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase().trim();
    
    [...db.customers].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(search === "" || c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const debt = calculateTrueDebt(c);
            const row = document.createElement('div');
            row.className = 'master-row-card fade-in';
            row.onclick = () => openCustomerModal(c.id);
            row.style = "padding: 18px; border-bottom: 1px solid rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center;";
            row.innerHTML = `
                <div>
                    <div style="font-weight: 700; font-size: 16px;">${c.name}</div>
                    <div style="font-size: 12px; opacity: 0.4;">${c.address}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 900; color: ${debt > 0 ? 'var(--stat-owed)' : 'var(--accent)'}; font-size: 18px;">£${debt.toFixed(2)}</div>
                    <small style="font-size: 9px; opacity: 0.3; font-weight: 800; text-transform: uppercase;">Balance</small>
                </div>
            `;
            body.appendChild(row);
        }
    });
};

// ... remaining logic (Stats, Cycle, Expenses) remains identical to v8.3 ...
