// Calendar State
let currentExchange = 'binance';
let currentDate = new Date();

// Sample Data Structure (Will be populated by scanner pattern matching later)
const mockEventsData = {
    binance: {
        '2026-08-05': [
            { symbol: 'BTCUSDT', type: 'bullish', winRate: '85%', label: '50-Candle Bounce' },
            { symbol: 'ETHUSDT', type: 'bullish', winRate: '78%', label: 'Resistance Retest' },
            { symbol: 'SOLUSDT', type: 'bearish', winRate: '60%', label: 'Pullback Zone' },
            { symbol: 'AVAXUSDT', type: 'bullish', winRate: '72%', label: 'Breakout Setup' }
        ],
        '2026-08-08': [
            { symbol: 'BNBUSDT', type: 'bullish', winRate: '90%', label: 'Support Bounce' }
        ]
    },
    okx: {
        '2026-08-05': [
            { symbol: 'OKBUSDT', type: 'bullish', winRate: '80%', label: 'Cycle Target' }
        ]
    },
    bingx: {
        '2026-08-12': [
            { symbol: 'DOGEUSDT', type: 'bearish', winRate: '65%', label: 'High Vol Reversal' }
        ]
    }
};

// Initialize Calendar
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    setupTabSwitching();
    setupDrawerControls();
});

function initCalendar() {
    renderGridForExchange('binance', 'grid-binance');
    renderGridForExchange('okx', 'grid-okx');
    renderGridForExchange('bingx', 'grid-bingx');
}

// Add Icon Helpers to Calendar (Matches Scanner Logic)
function getCalIconUrl(symbol) {
    const baseAsset = symbol.replace('USDT', '').replace('BUSD', '').toLowerCase().trim();
    return `https://assets.coincap.io/assets/icons/${baseAsset}@2x.png`;
}

// Render Calendar Grid (Updated with Icon Chips)
function renderGridForExchange(exchangeKey, containerId) {
    const gridContainer = document.getElementById(containerId);
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Render Previous Month Padding Days
    for (let i = firstDayIndex; i > 0; i--) {
        const dayCell = document.createElement('div');
        dayCell.className = 'cal-day-cell other-month';
        gridContainer.appendChild(dayCell);
    }

    // Render Days of Current Month
    for (let day = 1; day <= totalDays; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.className = 'cal-day-cell';

        const todayStr = new Date().toISOString().split('T')[0];
        if (dateKey === todayStr) dayCell.classList.add('today');

        const dayNum = document.createElement('span');
        dayNum.className = 'day-number';
        dayNum.innerText = day;
        dayCell.appendChild(dayNum);

        // Render Tokens with Icons
        const dayEvents = mockEventsData[exchangeKey]?.[dateKey] || [];
        if (dayEvents.length > 0) {
            const tokensWrapper = document.createElement('div');
            tokensWrapper.className = 'cell-tokens-wrapper';

            const maxVisible = 2;
            // Inside renderGridForExchange() in calendar.js
            dayEvents.slice(0, maxVisible).forEach(token => {
                const baseSymbol = token.symbol.replace('USDT', '');
                const iconUrl = getCalIconUrl(token.symbol);

                const chip = document.createElement('div');
                chip.className = `token-chip ${token.type} ${token.isHot ? 'hot-token' : ''}`;
                chip.innerHTML = `
        <div class="chip-icon-wrapper">
            <img src="${iconUrl}" 
                 alt="${baseSymbol}" 
                 class="chip-icon" 
                 onerror="if(window.handleIconError) window.handleIconError(this, '${baseSymbol}');" />
        </div>
        <span>${baseSymbol}</span>
        ${token.isHot ? '<span class="hot-badge">🔥</span>' : ''}
    `;
                tokensWrapper.appendChild(chip);
            });

            if (dayEvents.length > maxVisible) {
                const overflow = document.createElement('div');
                overflow.className = 'token-more-count';
                overflow.innerText = `+${dayEvents.length - maxVisible} more`;
                tokensWrapper.appendChild(overflow);
            }

            dayCell.appendChild(tokensWrapper);
        }

        dayCell.addEventListener('click', () => openSlideDrawer(dateKey, exchangeKey, dayEvents));
        gridContainer.appendChild(dayCell);
    }
}

// Slide Drawer Logic (Updated with Icons in Drawer Cards)
// Slide Drawer Logic with Forced Icon Rendering
function openSlideDrawer(dateStr, exchange, events) {
    const drawer = document.getElementById('calendar-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const titleEl = document.getElementById('drawer-date-title');
    const tagEl = document.getElementById('drawer-exchange-tag');
    const listEl = document.getElementById('drawer-tokens-list');

    if (titleEl) titleEl.innerText = `Events: ${dateStr}`;
    if (tagEl) tagEl.innerText = exchange.toUpperCase();
    if (listEl) listEl.innerHTML = '';

    if (!events || events.length === 0) {
        if (listEl) listEl.innerHTML = '<p style="color:#848e9c; font-size:13px;">No scanner signals detected for this day.</p>';
    } else {
        events.forEach(evt => {
            // Clean symbol for image lookup (e.g. "BTCUSDT" -> "btc")
            const cleanSymbol = evt.symbol.replace('/USDT', '').replace('-USDT', '').replace('USDT', '').trim();
            const iconUrl = `https://assets.coincap.io/assets/icons/${cleanSymbol.toLowerCase()}@2x.png`;

            const isBullish = evt.type === 'bullish' || evt.type === 'BULLISH';
            const colorClass = isBullish ? '#0ecb81' : '#f6465d';

            const card = document.createElement('div');
            card.className = 'drawer-token-card';
            card.innerHTML = `
                <div class="card-top" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div class="drawer-symbol-wrap" style="display:flex; align-items:center; gap:8px;">
                        <div class="drawer-icon-wrapper" style="width:22px; height:22px; min-width:22px; border-radius:50%; overflow:hidden; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
                            <img src="${iconUrl}" 
                                 alt="${cleanSymbol}" 
                                 style="width:100%; height:100%; object-fit:cover;"
                                 onerror="if(window.handleIconError){ window.handleIconError(this, '${cleanSymbol}'); } else { this.style.display='none'; }" />
                        </div>
                        <span style="color: ${colorClass}; font-weight:700; font-size:14px;">${evt.symbol}</span>
                    </div>
                    <span style="font-size:11px; color:#fcd535; font-weight:600;">${evt.winRate || '75%'} Bounce Rate</span>
                </div>
                <div style="font-size:12px; color:#848e9c; margin-bottom:8px;">${evt.label || 'Pattern Match'}</div>
                
                ${evt.details ? `
                    <div style="font-size:11px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                        <div><span style="color:#848e9c">Support:</span> $${evt.details.support}</div>
                        <div><span style="color:#848e9c">Resistance:</span> $${evt.details.resistance}</div>
                        <div><span style="color:#848e9c">Cycle Speed:</span> ${evt.details.cycle}</div>
                        <div><span style="color:#848e9c">Current:</span> $${evt.details.price}</div>
                    </div>
                ` : ''}
            `;
            if (listEl) listEl.appendChild(card);
        });
    }

    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

// Tab Carousel Switching
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab-btn');
    const track = document.getElementById('calendar-track');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            currentExchange = tab.dataset.exchange;
            // Translate Track (0%, -33.333%, -66.666%)
            track.style.transform = `translateX(-${index * 33.3333}%)`;
        });
    });
}

// Slide Drawer Logic
function openSlideDrawer(dateStr, exchange, events) {
    const drawer = document.getElementById('calendar-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const titleEl = document.getElementById('drawer-date-title');
    const tagEl = document.getElementById('drawer-exchange-tag');
    const listEl = document.getElementById('drawer-tokens-list');

    titleEl.innerText = `Events: ${dateStr}`;
    tagEl.innerText = exchange.toUpperCase();
    listEl.innerHTML = '';

    if (events.length === 0) {
        listEl.innerHTML = '<p style="color:#848e9c; font-size:13px;">No scanner signals detected for this day.</p>';
    } else {
        // Enhanced Drawer Card Rendering
        events.forEach(evt => {
            const card = document.createElement('div');
            card.className = 'drawer-token-card';
            card.innerHTML = `
        <div class="card-top">
            <span style="color: ${evt.type === 'bullish' ? '#0ecb81' : '#f6465d'}">${evt.symbol}</span>
            <span style="font-size:11px; color:#fcd535;">${evt.winRate} Bounce Rate</span>
        </div>
        <div style="font-size:12px; color:#848e9c; margin-bottom:8px;">${evt.label}</div>
        
        ${evt.details ? `
            <div style="font-size:11px; background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                <div><span style="color:#848e9c">Support:</span> $${evt.details.support}</div>
                <div><span style="color:#848e9c">Resistance:</span> $${evt.details.resistance}</div>
                <div><span style="color:#848e9c">Cycle Speed:</span> ${evt.details.cycle}</div>
                <div><span style="color:#848e9c">Current:</span> $${evt.details.price}</div>
            </div>
        ` : ''}
    `;
            listEl.appendChild(card);
        });
    }

    drawer.classList.add('open');
    overlay.classList.add('open');
}

function setupDrawerControls() {
    const drawer = document.getElementById('calendar-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.getElementById('drawer-close-btn');

    const close = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
}

// Append at the bottom of calendar.js

/**
 * Bridge function to receive scanner results and update calendar dates
 */
// Updated Bridge Function inside calendar.js
// Enhanced Calendar Bridge with Historical Memory & Hot Token Tracking
window.pushScanResultsToCalendar = function (scanResults) {
    if (!scanResults || !Array.isArray(scanResults) || scanResults.length === 0) return;

    const today = new Date();
    const tokenOccurrenceMap = {}; // Tracks how many times a token appears across dates

    scanResults.forEach((item, index) => {
        const exchangeKey = (item.exchange || 'binance').toLowerCase();
        const symbolClean = (item.symbol || '').replace('/', '').replace('-', '').trim();
        if (!symbolClean) return;

        // 1. Calculate Historical Date (7 to 15 days in the PAST)
        const pastOffset = (index % 9) + 7;
        const pastDateObj = new Date(today);
        pastDateObj.setDate(today.getDate() - pastOffset);
        const pastDateStr = formatDate(pastDateObj);

        // 2. Calculate Projected Date (1 to 7 days in the FUTURE)
        const futureOffset = (index % 6) + 1;
        const futureDateObj = new Date(today);
        futureDateObj.setDate(today.getDate() + futureOffset);
        const futureDateStr = formatDate(futureDateObj);

        // Track occurrences for "Hot Token" highlighting
        if (!tokenOccurrenceMap[symbolClean]) tokenOccurrenceMap[symbolClean] = [];
        tokenOccurrenceMap[symbolClean].push({ exchange: exchangeKey, date: pastDateStr, status: 'PAST' });
        tokenOccurrenceMap[symbolClean].push({ exchange: exchangeKey, date: futureDateStr, status: 'FUTURE' });

        // Helper to push event into mockEventsData
        const pushEvent = (dateStr, isPast) => {
            if (!mockEventsData[exchangeKey]) mockEventsData[exchangeKey] = {};
            if (!mockEventsData[exchangeKey][dateStr]) mockEventsData[exchangeKey][dateStr] = [];

            const existing = mockEventsData[exchangeKey][dateStr].find(e => e.symbol === symbolClean);
            if (!existing) {
                mockEventsData[exchangeKey][dateStr].push({
                    symbol: symbolClean,
                    type: item.change24h >= 0 ? 'bullish' : 'bearish',
                    winRate: `${Math.min(95, 70 + Math.floor(Math.abs(item.change24h || 0)))}%`,
                    label: isPast ? 'Historical Breakout' : 'Projected Setup',
                    isHot: false, // Will be upgraded below if repeated
                    details: {
                        price: item.price ? (item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)) : 'N/A',
                        support: item.price ? (item.price * 0.96).toFixed(4) : 'N/A',
                        resistance: item.price ? (item.price * 1.04).toFixed(4) : 'N/A',
                        cycle: isPast ? 'Completed Cycle' : 'Upcoming Cycle'
                    }
                });
            }
        };

        pushEvent(pastDateStr, true);
        pushEvent(futureDateStr, false);
    });

    // 3. Upgrade Tokens to "HOT / REPEATING" if they appear in both Past & Future
    Object.keys(tokenOccurrenceMap).forEach(symbol => {
        const records = tokenOccurrenceMap[symbol];
        if (records.length >= 2) {
            records.forEach(rec => {
                const dayEvents = mockEventsData[rec.exchange]?.[rec.date];
                if (dayEvents) {
                    const tokenEvt = dayEvents.find(e => e.symbol === symbol);
                    if (tokenEvt) tokenEvt.isHot = true;
                }
            });
        }
    });

    if (typeof initCalendar === 'function') initCalendar();
};

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}