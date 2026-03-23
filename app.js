/* ... Keep all existing v13.3 styles ... */

/* HUB TILE SYSTEM */
.home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    padding: 15px;
}

.tile {
    height: 120px;
    border-radius: 28px;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.tile span { font-size: 32px; }
.tile small { font-size: 13px; font-weight: 800; text-transform: uppercase; color: var(--text); }

.tile-main { background: var(--card-bg); border: 1px solid rgba(0,0,0,0.02); }
.tile-weekly-hub { background: var(--accent); grid-column: 1 / -1; height: 100px; }
.tile-weekly-hub small { color: white; }
.tile-week { background: var(--card-bg); border: 1px solid var(--accent); }

/* NAVIGATION PILLS */
.back-pill {
    width: calc(100% - 30px);
    margin: 10px 15px 20px 15px;
    height: 50px;
    border-radius: 25px;
    border: none;
    background: var(--card-bg);
    color: var(--accent);
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.hidden { display: none !important; }
