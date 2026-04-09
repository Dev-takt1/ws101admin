// ADMIN_API and MAIN_API are declared in reporting.html inline script — do NOT redeclare here

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    addPDFButton();

    const select = document.querySelector('.time-select');
    loadAll(select.value);

    select.addEventListener('change', function () {
        loadAll(this.value);
    });
});

// ════════════════════════════════════════════════════════════════
//  LOAD ALL
// ════════════════════════════════════════════════════════════════
async function loadAll(range) {
    showLoading();
    try {
        const [summary, growth, stats, topBuyer] = await Promise.all([
            fetch(`${ADMIN_API}/reporting-summary?range=${range}`).then(r => r.json()),
            fetch(`${ADMIN_API}/growth-stats?filter=monthly&range=${range}`).then(r => r.json()),
            fetch(`${ADMIN_API}/top-stats`).then(r => r.json()),
            fetch(`${ADMIN_API}/top-buyer`).then(r => r.json())
        ]);

        updateStats(summary, stats);
        updateRevenueChart(growth);
        updateDonutChart(summary, stats);
        updateBarChart(growth);

    } catch (err) {
        console.error('[reporting] load error:', err);
        showError();
    }
}

// ════════════════════════════════════════════════════════════════
//  STAT CARDS
// ════════════════════════════════════════════════════════════════
function updateStats(summary, stats) {
    const revenue  = parseFloat(summary.totalRevenue)     || 0;
    const events   = parseInt(summary.eventsServiced)     || 0;
    const profits  = parseFloat(summary.estimatedProfits) || 0;
    const bookings = parseInt(stats.totalBookings)        || 0;

    const revEl = document.querySelector('.title-group h1');
    if (revEl) animateNumber(revEl, revenue, true);

    const statCards = document.querySelectorAll('.stat-card .stat-text h2');
    if (statCards[0]) animateNumber(statCards[0], events,  false);
    if (statCards[1]) animateNumber(statCards[1], profits, true);

    const managedLabel = document.getElementById('managedCountLabel');
    if (managedLabel) animateNumber(managedLabel, bookings, false);

    const otherLabel = document.querySelectorAll('.legend-number')[1];
    if (otherLabel) animateNumber(otherLabel, Math.max(0, events - bookings), false);
}

// ════════════════════════════════════════════════════════════════
//  REVENUE CHART  — smooth bezier curves
// ════════════════════════════════════════════════════════════════
function updateRevenueChart(data) {
    const pathPurple = document.getElementById('pathPurple');
    const pathGreen  = document.getElementById('pathGreen');
    const xLabels    = document.getElementById('revenueXLabels');

    if (!pathPurple || !pathGreen) return;

    if (!data || !data.length) {
        pathPurple.setAttribute('d', '');
        pathGreen.setAttribute('d',  '');
        if (xLabels) xLabels.innerHTML = '<span>No data</span>';
        return;
    }

    const SVG_W = 600, SVG_H = 220;
    const padL  = 35,  padR  = 20, padT = 20, padB = 30;
    const plotW = SVG_W - padL - padR;
    const plotH = SVG_H - padT - padB;
    const n     = data.length;

    const actuals = data.map(d => parseFloat(d.total) || 0);
    const forecast = actuals.map((v, i) => {
        if (i === 0) return v * 1.06;
        if (i === 1) return ((actuals[0] + v) / 2) * 1.09;
        return ((actuals[i - 1] + actuals[i - 2]) / 2) * 1.12;
    });

    const globalMax = Math.max(...actuals, ...forecast, 1);

    function toX(i) { return padL + (i / Math.max(n - 1, 1)) * plotW; }
    function toY(v) { return padT + plotH - (v / globalMax) * plotH; }

    function buildPath(vals) {
        return vals.map((v, i) => {
            const x = toX(i), y = toY(v);
            if (i === 0) return `M ${x} ${y}`;
            const px = toX(i - 1), py = toY(vals[i - 1]);
            const cx = (px + x) / 2;
            return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
        }).join(' ');
    }

    pathPurple.setAttribute('d', buildPath(actuals));
    pathGreen.setAttribute('d',  buildPath(forecast));

    if (xLabels) {
        const labels = data.map(d => d.label || '');
        const step   = Math.max(1, Math.ceil(n / 6));
        xLabels.innerHTML = labels
            .map((l, i) => (i % step === 0 || i === n - 1) ? `<span>${l}</span>` : '')
            .join('');
    }

    const yEl = document.querySelector('.y-labels');
    if (yEl) {
        yEl.innerHTML =
            `<span>${fmtK(globalMax)}</span>` +
            `<span>${fmtK(globalMax / 2)}</span>` +
            `<span>${fmtK(globalMax / 4)}</span>`;
    }

    setupTooltip(actuals, forecast, data.map(d => d.label || ''), toX, toY);
}

function setupTooltip(actuals, forecast, labels, toX, toY) {
    const area    = document.getElementById('revenueChartArea');
    const tooltip = document.getElementById('revenueTooltip');
    if (!area || !tooltip) return;

    const svg = area.querySelector('svg');
    const n   = labels.length;

    const newSvg = svg.cloneNode(true);
    svg.parentNode.replaceChild(newSvg, svg);

    newSvg.addEventListener('mousemove', e => {
        const rect = newSvg.getBoundingClientRect();
        const xRel = e.clientX - rect.left;

        let closest = 0, minDist = Infinity;
        for (let i = 0; i < n; i++) {
            const px   = (toX(i) / 600) * rect.width;
            const dist = Math.abs(px - xRel);
            if (dist < minDist) { minDist = dist; closest = i; }
        }

        const px = (toX(closest) / 600) * rect.width;
        const py = (toY(actuals[closest]) / 220) * rect.height;

        tooltip.style.opacity = '1';
        tooltip.style.left    = (px + 14) + 'px';
        tooltip.style.top     = Math.max(0, py - 24) + 'px';

        document.getElementById('tooltipDate').textContent   = labels[closest];
        document.getElementById('earnedValue').textContent   = '₱' + Number(actuals[closest]).toLocaleString('en-PH');
        document.getElementById('forecastValue').textContent = '₱' + Math.round(forecast[closest]).toLocaleString('en-PH');
    });

    newSvg.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
}

// ════════════════════════════════════════════════════════════════
//  DONUT CHART
// ════════════════════════════════════════════════════════════════
function updateDonutChart(summary, stats) {
    const purpleCircle = document.getElementById('purpleDonutCircle');
    const greenCircle  = document.getElementById('greenDonutCircle');
    if (!purpleCircle || !greenCircle) return;

    const managed = parseInt(stats.totalBookings) || 0;
    const total   = Math.max(managed + 5, 10);

    const outerFill = Math.min((managed / total) * 251.3, 251.3);
    purpleCircle.style.transition      = 'stroke-dasharray 1s ease-in-out';
    purpleCircle.style.strokeDasharray = `${outerFill} 251.3`;

    const innerFill = managed > 0 ? Math.min((managed / total) * 144.5 * 0.75, 130) : 0;
    greenCircle.style.transition      = 'stroke-dasharray 1s ease-in-out';
    greenCircle.style.strokeDasharray = `${innerFill} 144.5`;
}

// ════════════════════════════════════════════════════════════════
//  BAR CHART
// ════════════════════════════════════════════════════════════════
function updateBarChart(data) {
    if (!data || !data.length) return;

    const bars     = document.querySelectorAll('.bar-col .bar');
    const daySpans = document.querySelectorAll('.bar-col > span');
    const slice    = data.slice(-bars.length);
    const maxVal   = Math.max(...slice.map(d => parseFloat(d.total) || 0), 1);

    slice.forEach((item, i) => {
        if (!bars[i]) return;
        const pct = Math.max(5, (parseFloat(item.total) / maxVal) * 100);
        bars[i].style.height     = `${pct}%`;
        bars[i].style.transition = 'height 0.6s ease';
        if (daySpans[i]) {
            daySpans[i].textContent = (item.label || '').substring(0, 3);
        }
    });

    const yAxis = document.querySelector('.bar-y-axis');
    if (yAxis) {
        yAxis.innerHTML =
            `<span>${fmtK(maxVal)}</span>` +
            `<span>${fmtK(maxVal * 2 / 3)}</span>` +
            `<span>${fmtK(maxVal / 3)}</span>` +
            `<span>0</span>`;
    }
}

// ════════════════════════════════════════════════════════════════
//  LOADING / ERROR
// ════════════════════════════════════════════════════════════════
function showLoading() {
    const revEl = document.querySelector('.title-group h1');
    if (revEl) revEl.textContent = 'Loading…';
    document.querySelectorAll('.stat-card .stat-text h2').forEach(el => el.textContent = '…');
}

function showError() {
    const revEl = document.querySelector('.title-group h1');
    if (revEl) revEl.textContent = 'Error loading data';
    document.querySelectorAll('.stat-card .stat-text h2').forEach(el => el.textContent = '—');
}

// ════════════════════════════════════════════════════════════════
//  PDF EXPORT  — real text-based document (no screenshot)
// ════════════════════════════════════════════════════════════════
function addPDFButton() {
    const btn = document.createElement('button');
    btn.className = 'download-pdf-btn';
    btn.innerHTML = '<i class="bx bx-download"></i> Export as PDF';
    btn.onclick = downloadPDF;

    const wrap = document.createElement('div');
    wrap.className = 'pdf-button-container';
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
}

async function downloadPDF() {
    const btn  = document.querySelector('.download-pdf-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Generating PDF…';
    btn.disabled  = true;

    try {
        const range = document.querySelector('.time-select').value;

        const [summary, growth, stats, topBuyer] = await Promise.all([
            fetch(`${ADMIN_API}/reporting-summary?range=${range}`).then(r => r.json()),
            fetch(`${ADMIN_API}/growth-stats?filter=monthly&range=${range}`).then(r => r.json()),
            fetch(`${ADMIN_API}/top-stats`).then(r => r.json()),
            fetch(`${ADMIN_API}/top-buyer`).then(r => r.json())
        ]);

        const revenue   = parseFloat(summary.totalRevenue)     || 0;
        const events    = parseInt(summary.eventsServiced)      || 0;
        const profits   = parseFloat(summary.estimatedProfits)  || 0;
        const bookings  = parseInt(stats.totalBookings)         || 0;
        const topMonth  = stats.topMonth    || 'N/A';
        const topYear   = stats.topMonthYear || '';
        const buyerName = topBuyer.fName    || 'N/A';
        const buyerAmt  = parseFloat(topBuyer.totalSpent) || 0;

        const rangeLabel = range === 'all' ? 'All Time'
            : range === '3'  ? 'Last 3 Months'
            : range === '6'  ? 'Last 6 Months'
            : 'Last 12 Months';

        const today   = new Date();
        const dateStr = today.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

        // ── jsPDF setup ───────────────────────────────────────
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const PW = 210, PH = 297, ML = 18, MR = 18;
        const CW = PW - ML - MR;
        let   Y  = 0;

        // ── Colors ────────────────────────────────────────────
        const NAVY   = [25, 39, 111];
        const DARK   = [30, 30, 50];
        const MID    = [90, 90, 110];
        const LIGHT  = [150, 150, 170];
        const SILVER = [220, 222, 235];
        const WHITE  = [255, 255, 255];
        const GREEN  = [46, 204, 113];
        const PURPLE = [108, 92, 231];
        const GOLD   = [230, 180, 30];
        const BGROW  = [246, 247, 252];

        // ── Helpers ───────────────────────────────────────────
        function fc(rgb)  { doc.setFillColor(...rgb); }
        function dc(rgb)  { doc.setDrawColor(...rgb); }
        function tc(rgb)  { doc.setTextColor(...rgb); }

        function rule(y, color) {
            dc(color || SILVER);
            doc.setLineWidth(0.2);
            doc.line(ML, y, PW - MR, y);
        }

        function sectionHeading(label, y) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            tc(LIGHT);
            doc.text(label.toUpperCase(), ML, y);
            rule(y + 2);
            return y + 8;
        }

        function statBox(x, y, w, h, label, value, accent) {
            fc(BGROW);
            doc.roundedRect(x, y, w, h, 2, 2, 'F');
            fc(accent);
            doc.rect(x, y, 1.5, h, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            tc(MID);
            doc.text(label, x + 5, y + 7);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            tc(DARK);
            doc.text(value, x + 5, y + 17);
        }

        // ── Header band ───────────────────────────────────────
        fc(NAVY);
        doc.rect(0, 0, PW, 38, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        tc(WHITE);
        doc.text('DE LAS ARMAS', ML, 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        tc([180, 190, 220]);
        doc.text('Catering & Event Services', ML, 22);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        tc(WHITE);
        doc.text('Financial Report', ML, 32);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        tc([180, 190, 220]);
        doc.text(`${rangeLabel}  ·  Generated ${dateStr}`, PW - MR, 32, { align: 'right' });

        Y = 48;

        // ── KPI Cards ─────────────────────────────────────────
        Y = sectionHeading('Key Performance Indicators', Y);

        const CARD_H = 22, GAP = 4;
        const CARD_W = (CW - GAP * 2) / 3;

        statBox(ML,                      Y, CARD_W, CARD_H, 'Total Revenue',     `P ${revenue.toLocaleString('en-PH')}`, NAVY);
        statBox(ML + CARD_W + GAP,       Y, CARD_W, CARD_H, 'Events Serviced',    events.toLocaleString('en-PH'),        PURPLE);
        statBox(ML + (CARD_W + GAP) * 2, Y, CARD_W, CARD_H, 'Estimated Profits',  `P ${profits.toLocaleString('en-PH')}`, GREEN);
        Y += CARD_H + 4;

        const CARD_W2 = (CW - GAP * 3) / 4;
        statBox(ML,                       Y, CARD_W2, CARD_H, 'Total Bookings', bookings.toString(),                                    GOLD);
        statBox(ML + (CARD_W2 + GAP),     Y, CARD_W2, CARD_H, 'Best Month',    `${topMonth} ${topYear}`,                               PURPLE);
        statBox(ML + (CARD_W2 + GAP) * 2, Y, CARD_W2, CARD_H, 'Top Client',    buyerName,                                              NAVY);
        statBox(ML + (CARD_W2 + GAP) * 3, Y, CARD_W2, CARD_H, 'Client Spent',  `P ${buyerAmt.toLocaleString('en-PH')}`,                GREEN);
        Y += CARD_H + 10;

        // ── Revenue Line Chart ────────────────────────────────
        if (growth && growth.length) {
            Y = sectionHeading('Monthly Revenue Trend', Y);

            const CH  = 55;
            const CL  = ML;
            const CR  = PW - MR;
            const CT  = Y;
            const CB  = Y + CH;
            const CWW = CR - CL;

            const values = growth.map(d => parseFloat(d.total) || 0);
            const maxV   = Math.max(...values, 1);
            const n      = values.length;

            // Gridlines + Y labels
            [1, 0.75, 0.5, 0.25, 0].forEach(frac => {
                const gy = CT + CH - frac * CH;
                dc(SILVER);
                doc.setLineWidth(0.15);
                doc.line(CL, gy, CR, gy);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6);
                tc(LIGHT);
                doc.text(fmtK(maxV * frac), CL - 1, gy + 1, { align: 'right' });
            });

            // Build point coordinates
            const pts = values.map((v, i) => ({
                x: CL + (n === 1 ? CWW / 2 : (i / (n - 1)) * CWW),
                y: CT + CH - (v / maxV) * CH
            }));

            // ── Filled area under the line using doc.lines() ──
            // Build a closed polygon path: start bottom-left, go along points, end bottom-right
            if (pts.length >= 2) {
                // Use lines() which accepts an array of [dx, dy] segments
                // First move to starting point (bottom-left corner)
                const startX = pts[0].x;
                const startY = CB;

                // Build segments array for doc.lines()
                // Each entry: [x1, y1, x2, y2, x3, y3] for cubic bezier, or [x, y] for line
                const lineSegments = [];

                // From bottom-left up to first data point
                lineSegments.push([pts[0].x - startX, pts[0].y - startY]);

                // Along each data point (straight lines for area fill)
                for (let i = 1; i < pts.length; i++) {
                    lineSegments.push([pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y]);
                }

                // Down to bottom-right
                lineSegments.push([0, CB - pts[pts.length-1].y]);

                // Back to start (closes the shape)
                lineSegments.push([startX - pts[pts.length-1].x, 0]);

                // Draw filled area
                doc.setFillColor(108, 92, 231);
                doc.setGState(doc.GState({ opacity: 0.12 }));
                doc.lines(lineSegments, startX, startY, [1, 1], 'F', true);
                doc.setGState(doc.GState({ opacity: 1 }));
            }

            // ── Draw the line using individual line segments ───
            dc(PURPLE);
            doc.setLineWidth(0.7);
            for (let i = 1; i < pts.length; i++) {
                doc.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
            }

            // ── Dots at each data point ───────────────────────
            pts.forEach(({ x, y }) => {
                fc(WHITE);
                dc(PURPLE);
                doc.setLineWidth(0.5);
                doc.circle(x, y, 1.2, 'FD');
            });

            // ── Value labels above dots ───────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            tc(PURPLE);
            pts.forEach(({ x, y }, i) => {
                const v = values[i];
                if (v > 0) doc.text('₱' + fmtK(v), x, y - 2.5, { align: 'center' });
            });

            // X-axis labels
            const step = Math.max(1, Math.ceil(n / 8));
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            tc(MID);
            growth.forEach((d, i) => {
                if (i % step !== 0 && i !== n - 1) return;
                const x = CL + (n === 1 ? CWW / 2 : (i / (n - 1)) * CWW);
                doc.text((d.label || '').substring(0, 6), x, CB + 5, { align: 'center' });
            });

            Y = CB + 12;
        }

        // ── Revenue Breakdown Table ───────────────────────────
        if (growth && growth.length) {
            Y = sectionHeading('Revenue Breakdown by Period', Y);

            const COL_WIDTHS = [60, 45, 45, 24];
            const HEADERS    = ['Period', 'Revenue (PHP)', 'Running Total (PHP)', 'vs Prev'];
            const ROW_H      = 7;

            // Header row
            fc(NAVY);
            doc.rect(ML, Y, CW, ROW_H, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            tc(WHITE);
            let colX = ML;
            HEADERS.forEach((col, i) => {
                doc.text(col, colX + 3, Y + 5);
                colX += COL_WIDTHS[i];
            });
            Y += ROW_H;

            let running = 0;
            growth.forEach((row, idx) => {
                const val  = parseFloat(row.total) || 0;
                const prev = growth[idx - 1] ? parseFloat(growth[idx - 1].total) || 0 : null;
                const diff = prev !== null ? val - prev : null;
                running   += val;

                if (idx % 2 === 0) {
                    fc(BGROW);
                    doc.rect(ML, Y, CW, ROW_H, 'F');
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);

                colX = ML;
                const cells = [
                    row.label || '',
                    val.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
                    running.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
                    diff === null ? '—' : (diff >= 0 ? '+' : '') + diff.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                ];

                cells.forEach((cell, i) => {
                    if (i === 3 && diff !== null) tc(diff >= 0 ? [46, 139, 87] : [188, 65, 65]);
                    else tc(DARK);
                    doc.text(cell, colX + 3, Y + 5);
                    colX += COL_WIDTHS[i];
                });

                rule(Y + ROW_H, SILVER);
                Y += ROW_H;

                if (Y > PH - 30) { doc.addPage(); Y = 20; }
            });

            Y += 8;
        }

        // ── Summary Section ───────────────────────────────────
        Y = sectionHeading('Summary', Y);

        const summaryLines = [
            ['Report Period',     rangeLabel],
            ['Total Revenue',     `PHP ${revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
            ['Events Serviced',   events.toString()],
            ['Estimated Profits', `PHP ${profits.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
            ['Total Bookings',    bookings.toString()],
            ['Best Month',        `${topMonth} ${topYear}`],
            ['Top Client',        `${buyerName} (PHP ${buyerAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 })})`],
        ];

        summaryLines.forEach(([label, value], i) => {
            if (Y > PH - 30) { doc.addPage(); Y = 20; }
            if (i % 2 === 0) { fc(BGROW); doc.rect(ML, Y, CW, 7, 'F'); }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            tc(MID);
            doc.text(label, ML + 3, Y + 5);
            doc.setFont('helvetica', 'normal');
            tc(DARK);
            doc.text(value, ML + 65, Y + 5);
            rule(Y + 7, SILVER);
            Y += 7;
        });

        Y += 10;

        // ── Footer on every page ──────────────────────────────
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            fc(BGROW);
            doc.rect(0, PH - 12, PW, 12, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            tc(LIGHT);
            doc.text('De Las Armas Catering & Event Services  ·  Confidential', ML, PH - 5);
            doc.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 5, { align: 'right' });
        }

        // ── Save ──────────────────────────────────────────────
        doc.setProperties({
            title:   `De Las Armas Report - ${dateStr}`,
            subject: 'Financial Report',
            author:  'De Las Armas Catering',
            creator: 'De Las Armas System'
        });
        doc.save(`De-Las-Armas-Report-${today.toISOString().split('T')[0]}.pdf`);

    } catch (err) {
        console.error('[PDF]', err);
        alert('Failed to generate PDF. Please try again.\n\n' + err.message);
    }

    btn.innerHTML = orig;
    btn.disabled  = false;
}

// ════════════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════════════
function animateNumber(el, target, isCurrency) {
    const duration = 900;
    const start    = performance.now();
    (function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const v = Math.round(target * e);
        el.textContent = isCurrency ? ('₱ ' + v.toLocaleString('en-PH')) : v.toLocaleString('en-PH');
        if (p < 1) requestAnimationFrame(step);
    })(start);
}

function fmtK(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return Math.round(n / 1_000) + 'k';
    return Math.round(n).toString();
}

// ════════════════════════════════════════════════════════════════
//  STYLES (injected)
// ════════════════════════════════════════════════════════════════
const reportingStyle = document.createElement('style');
reportingStyle.textContent = `
    .pdf-button-container {
        position: fixed; bottom: 28px; right: 28px; z-index: 200; display: flex;
    }
    .download-pdf-btn {
        background: #19276F; color: #fff; border: none; padding: 12px 22px;
        border-radius: 9px; cursor: pointer; display: flex; align-items: center;
        gap: 8px; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 18px rgba(25,39,111,0.28);
        transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .download-pdf-btn:hover:not(:disabled) {
        background: #0f1a4a; transform: translateY(-2px);
        box-shadow: 0 7px 22px rgba(25,39,111,0.38);
    }
    .download-pdf-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .bx-spin { animation: _spin 0.9s linear infinite; }
    @keyframes _spin { to { transform: rotate(360deg); } }
    .bottom-right-logo { position: relative; width: 100%; max-width: 150px; z-index: 90; }
`;
document.head.appendChild(reportingStyle);