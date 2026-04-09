// ── Login handler ─────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const email    = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    try {
        const res  = await fetch(`http://localhost:4000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // Store admin info so dashboard can read it
            const adminUser = { name: 'Admin', email, profilePic: '' };
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed.');
        }
    } catch {
        alert('Admin server unreachable.');
    }
}

// ── Global onclick handlers (used by HTML dropdown items) ─────────
window.changeSort = async function(e, type) {
    if (e) e.preventDefault();
    const el = document.getElementById('currentSort');
    if (el) el.innerHTML = (type === 'newest' ? 'Sort by Newest' : 'Sort by Oldest') +
        " <i class='bx bx-chevron-down'></i>";
    await loadLatestCustomers(type);
};

window.changeGrowthFilter = async function(e, filterType) {
    if (e) e.preventDefault();
    const el = document.getElementById('growthSortText');
    if (el) el.innerHTML = filterType.charAt(0).toUpperCase() + filterType.slice(1) +
        " <i class='bx bx-chevron-down'></i>";
    await updateGrowthChart(filterType);
};

window.loadAllCustomers = async function(e) {
    if (e) e.preventDefault();
    try {
        const res   = await fetch(`${ADMIN_API}/all-customers`);
        const users = await res.json();
        const list  = document.getElementById('dynamicCustomerList');
        if (!list) return;
        list.innerHTML = '';
        users.forEach(user => {
            const d  = new Date(user.verification_date);
            const dt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const li = document.createElement('li');
            li.className = 'customer-item';
            li.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f2f8;';
            li.innerHTML = `
                <img src="assets/img/Profile-PNG-Photo.png" alt="User"
                     style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                <div class="customer-info" style="flex:1;">
                    <h4 style="margin:0;font-size:13px;font-weight:600;">${user.fName}</h4>
                    <p style="margin:0;font-size:11px;color:#888;">${dt}</p>
                </div>`;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Failed to load all customers', err);
    }
};

// ── Revenue card ──────────────────────────────────────────────────
async function loadRevenueCard() {
    try {
        const res  = await fetch(`${ADMIN_API}/dashboard`);
        const data = await res.json();

        const percentEl = document.getElementById('revenuePercent');
        const arrowEl   = document.getElementById('revenueArrow');
        const textEl    = document.getElementById('revenueText');
        if (!percentEl) return;

        const value = Number(data.percentage) || 0;
        percentEl.textContent = Math.abs(value) + '%';

        if (value > 0) {
            arrowEl.className    = 'bx bx-up-arrow-alt arrow-icon';
            percentEl.style.color = '#2ecc71';
            arrowEl.style.color   = '#2ecc71';
        } else if (value < 0) {
            arrowEl.className    = 'bx bx-down-arrow-alt arrow-icon';
            percentEl.style.color = '#e74c3c';
            arrowEl.style.color   = '#e74c3c';
        } else {
            arrowEl.className    = 'bx bx-minus arrow-icon';
            percentEl.style.color = '#888';
            arrowEl.style.color   = '#888';
        }

        if (textEl) {
            const tw = '₱' + (data.thisWeek || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
            const lw = '₱' + (data.lastWeek || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
            textEl.innerHTML = `<strong>${tw}</strong> this week vs <strong>${lw}</strong> last week`;
        }
    } catch (err) {
        console.error('Revenue load failed', err);
        const el = document.getElementById('revenuePercent');
        if (el) el.textContent = '0%';
        const t = document.getElementById('revenueText');
        if (t) t.textContent = 'Unable to load revenue data';
    }
}

// ── Latest customers ──────────────────────────────────────────────
async function loadLatestCustomers(order = 'newest') {
    try {
        const res   = await fetch(`${ADMIN_API}/latest-customers?order=${order}`);
        const users = await res.json();
        const list  = document.getElementById('dynamicCustomerList');
        if (!list) return;
        list.innerHTML = '';
        users.forEach(user => {
            const d  = new Date(user.verification_date);
            const dt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const li = document.createElement('li');
            li.className = 'customer-item';
            li.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f2f8;';
            li.innerHTML = `
                <img src="assets/img/Profile-PNG-Photo.png" alt="User"
                     style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                <div class="customer-info" style="flex:1;">
                    <h4 style="margin:0;font-size:13px;font-weight:600;">${user.fName}</h4>
                    <p style="margin:0;font-size:11px;color:#888;">${dt}</p>
                </div>
                <div class="actions" style="display:flex;align-items:center;gap:6px;">
                    <div class="separator" style="width:1px;height:18px;background:#e0e0e0;"></div>
                    <i class='bx bx-dots-vertical-rounded' style="font-size:18px;color:#aaa;cursor:pointer;"></i>
                </div>`;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Failed to load customers', err);
    }
}

// ── Growth chart ──────────────────────────────────────────────────
let chartPoints = [];

async function updateGrowthChart(filter = 'yearly') {
    try {
        const res  = await fetch(`${ADMIN_API}/growth-stats?filter=${filter}`);
        const data = await res.json();

        const gLine          = document.getElementById('growthLine');
        const gArea          = document.getElementById('growthArea');
        const xAxisContainer = document.getElementById('growth-x-labels');
        const chartArea      = document.querySelector('.chart-area');

        if (!gLine || !gArea) return;

        if (!data || data.length === 0) {
            if (xAxisContainer) xAxisContainer.innerHTML =
                '<span style="color:#999;font-size:12px;">No data available</span>';
            gLine.setAttribute('d', '');
            gArea.setAttribute('d', '');
            return;
        }

        const W = 600, H = 200;
        const maxRevenue = Math.max(...data.map(d => parseFloat(d.total || 0)), 1) * 1.2;

        let lp = '', ap = '';
        chartPoints = [];
        if (xAxisContainer) xAxisContainer.innerHTML = '';

        data.forEach((point, i) => {
            const val = parseFloat(point.total || 0);
            const x   = data.length > 1 ? (i / (data.length - 1)) * W : W / 2;
            const y   = H - (val / maxRevenue) * H;

            chartPoints.push({ x, y, label: point.label || '—', value: val, bookings: point.bookings || 0 });

            if (i === 0) { lp += `M ${x} ${y} `; ap += `M ${x} ${H} L ${x} ${y} `; }
            else         { lp += `L ${x} ${y} `; ap += `L ${x} ${y} `; }

            if (xAxisContainer) {
                const span = document.createElement('span');
                span.textContent = point.label || '';
                span.style.cssText = 'font-size:11px;color:#888;';
                xAxisContainer.appendChild(span);
            }
        });

        ap += `L ${W} ${H} L 0 ${H} Z`;
        gLine.setAttribute('d', lp);
        gArea.setAttribute('d', ap);

        // Hover tooltip
        if (chartArea) {
            chartArea.onmousemove = (e) => {
                const rect   = chartArea.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (W / rect.width);
                const closest = chartPoints.reduce((prev, curr) =>
                    Math.abs(curr.x - mouseX) < Math.abs(prev.x - mouseX) ? curr : prev);

                const tooltip = document.getElementById('chart-tooltip');
                const hLine   = document.getElementById('hover-line');
                if (!tooltip || !hLine) return;

                tooltip.style.opacity = '1';
                tooltip.style.left    = `${(closest.x / W) * 100}%`;
                tooltip.style.top     = `${Math.max(0, (closest.y / H) * 100 - 14)}%`;
                tooltip.innerHTML = `
                    <div style="font-weight:700;border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:4px;padding-bottom:3px;">
                        ${closest.label}
                    </div>
                    <div>Revenue: ₱${closest.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                    <div>Bookings: ${closest.bookings}</div>`;

                hLine.style.opacity = '1';
                hLine.style.left    = `${(closest.x / W) * 100}%`;
            };
            chartArea.onmouseleave = () => {
                const t = document.getElementById('chart-tooltip');
                const h = document.getElementById('hover-line');
                if (t) t.style.opacity = '0';
                if (h) h.style.opacity = '0';
            };
        }
    } catch (err) {
        console.error('Chart error:', err);
        const xAxis = document.getElementById('growth-x-labels');
        if (xAxis) xAxis.innerHTML = '<span style="color:#e74c3c;font-size:12px;">Error loading chart</span>';
    }
}

// ── Top stats ─────────────────────────────────────────────────────
async function loadTopStats() {
    try {
        const res  = await fetch(`${ADMIN_API}/top-stats`);
        const data = await res.json();

        const mName     = document.getElementById('topMonthName');
        const mYear     = document.getElementById('topMonthYear');
        const yValue    = document.getElementById('topYearValue');
        const yBookings = document.getElementById('topYearBookings');

        if (mName) mName.textContent = data.topMonth    || 'No Data';
        if (mYear) mYear.textContent = data.topMonthYear || '—';
        if (yValue) yValue.textContent = data.overallTopYear || '—';
        if (yBookings) {
            const b = data.totalBookings || 0;
            yBookings.textContent = `${b} Booking${b !== 1 ? 's' : ''} so far`;
        }
    } catch (err) {
        console.error('Top stats error:', err);
    }
}

// ── Top buyer ─────────────────────────────────────────────────────
async function loadTopBuyer() {
    try {
        const res  = await fetch(`${ADMIN_API}/top-buyer`);
        const data = res.ok ? await res.json() : null;

        const nameEl  = document.getElementById('topBuyerName');
        const spentEl = document.getElementById('topBuyerSpent');

        if (data?.fName) {
            if (nameEl)  nameEl.textContent  = data.fName;
            if (spentEl) spentEl.textContent = data.totalSpent
                ? '₱' + parseFloat(data.totalSpent).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                : 'No sales yet';
        } else {
            if (nameEl)  nameEl.textContent  = 'No data yet';
            if (spentEl) spentEl.textContent = '—';
        }
    } catch (err) {
        console.error('Top buyer error:', err);
        const nameEl  = document.getElementById('topBuyerName');
        const spentEl = document.getElementById('topBuyerSpent');
        if (nameEl)  nameEl.textContent  = 'Unavailable';
        if (spentEl) spentEl.textContent = '—';
    }
}

// ── Single DOMContentLoaded ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Login page
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Dashboard page — load all data
    if (document.getElementById('revenuePercent')) {
        loadRevenueCard();
        loadLatestCustomers('newest');
        updateGrowthChart('yearly');
        loadTopStats();
        loadTopBuyer();
    }
});