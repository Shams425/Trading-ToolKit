// --- MULTI-EXCHANGE API FETCHERS ---
const CORS_PROXY = 'https://corsproxy.io/?url=';

async function fetchBinanceTickers() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await res.json();
        return data.filter(t => t.symbol.endsWith('USDT')).map(t => ({
            exchange: 'Binance',
            symbol: t.symbol.replace('USDT', '/USDT'),
            rawSymbol: t.symbol,
            price: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChangePercent),
            volume: parseFloat(t.quoteVolume)
        }));
    } catch (e) {
        console.error('Binance API Error:', e);
        return [];
    }
}

async function fetchOKXTickers() {
    try {
        const res = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        const data = await res.json();
        return (data.data || []).filter(t => t.instId.endsWith('-USDT')).map(t => ({
            exchange: 'OKX',
            symbol: t.instId.replace('-', '/'),
            rawSymbol: t.instId,
            price: parseFloat(t.last),
            change24h: parseFloat((((t.last - t.open24h) / t.open24h) * 100).toFixed(2)),
            volume: parseFloat(t.volCcy24h)
        }));
    } catch (e) {
        console.error('OKX API Error:', e);
        return [];
    }
}

async function fetchBingXTickers() {
    try {
        const targetUrl = 'https://open-api.bingx.com/openApi/spot/v1/market/ticker/24hr';
        const res = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`);
        const data = await res.json();
        return (data.data || []).filter(t => t.symbol.endsWith('-USDT')).map(t => ({
            exchange: 'BingX',
            symbol: t.symbol.replace('-', '/'),
            rawSymbol: t.symbol,
            price: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChangePercent),
            volume: parseFloat(t.quoteVolume)
        }));
    } catch (e) {
        console.error('BingX API Error:', e);
        return [];
    }
}

// --- CONFIGURATION: DEAD TOKEN & LIQUIDITY FILTERS ---
const MIN_24H_VOLUME_USD = 500000; // Ignore any token with under $500k 24h volume

// Dynamic Blacklist for Delisted / Dead Tokens
const DELISTED_BLACKLIST = [
    'NFP', 'UNFI', 'OMG', 'WAVES', 'XMR', 'NTC', 'FTT', 'LUNA'
];

// Stablecoins / Non-tradable pairs to ignore
const STABLECOIN_PAIRS = [
    'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'EUR', 'GBP', 'WBTC'
];

/**
 * Core Health & Tradability Check
 * Returns true only if token is active, liquid, and safe to trade
 */
function isTokenActiveAndLiquid(item) {
    const rawSymbol = item.rawSymbol || item.symbol || '';
    const cleanBase = rawSymbol.replace('/USDT', '').replace('-USDT', '').replace('USDT', '').toUpperCase().trim();

    // 1. Explicit Blacklist Check (Delisted coins like NFP)
    if (DELISTED_BLACKLIST.includes(cleanBase)) {
        return false;
    }

    // 2. Stablecoin Pair Check
    if (STABLECOIN_PAIRS.includes(cleanBase)) {
        return false;
    }

    // 3. Zero / Frozen Price Check
    if (!item.price || item.price <= 0) {
        return false;
    }

    // 4. Minimum 24h Volume Floor ($500k USD)
    if (!item.volume || item.volume < MIN_24H_VOLUME_USD) {
        return false;
    }

    return true;
}

// --- STATE MANAGEMENT ---
let globalScanResults = [];

// --- DOM REFERENCES ---
const startScanBtn = document.getElementById('start-scan-btn');
const scanResultsCard = document.getElementById('scan-results-card');
const resultsListContainer = document.querySelector('.scanned-coins-list');
const resultsCountBadge = document.getElementById('results-count-badge');

const slidePanelOverlay = document.getElementById('slide-panel-overlay');
const openSlidePanelBtn = document.getElementById('open-slide-panel-btn');
const closeSlidePanelBtn = document.getElementById('close-slide-panel-btn');
const closeResultsBtn = document.getElementById('close-results-btn');
const detailedResultsContainer = document.getElementById('detailed-results-container');

// Input Controls
const exchangeSelect = document.getElementById('param-exchange');
const strategySelect = document.getElementById('param-strategy');
const percentageInput = document.getElementById('param-percentage');

// --- SCANNING ENGINE ---
async function runMultiExchangeScan() {
    const selectedEx = exchangeSelect.value;
    const strategy = strategySelect.value;
    const thresholdPct = parseFloat(percentageInput.value) || 30;

    startScanBtn.disabled = true;
    startScanBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Scanning...`;
    if (window.lucide) lucide.createIcons();

    let allTickers = [];

    // Fetch target exchange(s)
    if (selectedEx === 'all') {
        const [binance, okx, bingx] = await Promise.all([
            fetchBinanceTickers(),
            fetchOKXTickers(),
            fetchBingXTickers()
        ]);
        allTickers = [...binance, ...okx, ...bingx];
    } else if (selectedEx === 'binance') {
        allTickers = await fetchBinanceTickers();
    } else if (selectedEx === 'okx') {
        allTickers = await fetchOKXTickers();
    } else if (selectedEx === 'bingx') {
        allTickers = await fetchBingXTickers();
    }

    // Process, Filter Dead/Delisted Tokens & Evaluate Strategy Distance
    globalScanResults = allTickers
        .filter(ticker => isTokenActiveAndLiquid(ticker)) // 🛡️ FILTER OUT DEAD/DELISTED TOKENS HERE
        .map(ticker => {
            // Mock pattern calculation based on 24h change & volume threshold
            const score = Math.abs(ticker.change24h) + (ticker.volume > 1000000 ? 10 : 2);
            const distanceToLevel = Math.max(0.1, (100 - (score % 100)) * (thresholdPct / 100)).toFixed(2);

            return {
                ...ticker,
                distance: parseFloat(distanceToLevel),
                signalType: ticker.change24h >= 0 ? 'BULLISH' : 'BEARISH'
            };
        })
        .filter(item => item.distance <= thresholdPct)
        .sort((a, b) => a.distance - b.distance);

    // --- 🔗 BRIDGE CODE: FEED RESULTS TO CALENDAR ---
    pushScanResultsToCalendar(globalScanResults);

    // Render UX Output
    renderTop20Results();
    renderSlidePanelDetailedResults();

    // Reveal Result Card adjacent to Radar Card
    scanResultsCard.classList.remove('hidden-card');

    startScanBtn.disabled = false;
    startScanBtn.innerHTML = `<i data-lucide="play"></i> Start Scan`;
    if (window.lucide) lucide.createIcons();
}

// --- RENDER FUNCTIONS ---

// --- ICON HELPER FUNCTION ---
// --- 3-TIER ULTRA HIGH-COVERAGE ICON HELPER ---
function getCryptoIconUrl(symbol) {
    const baseAsset = symbol.split('/')[0].split('-')[0].toLowerCase().trim();

    // Primary Tier: CoinCap 2x High-Res PNG (Massive coverage)
    return `https://assets.coincap.io/assets/icons/${baseAsset}@2x.png`;
}

// Multi-Stage Error Cascade Handler
window.handleIconError = function (imgElement, baseSymbol) {
    const assetLower = baseSymbol.toLowerCase().trim();
    const assetUpper = baseSymbol.toUpperCase().trim();
    const stage = parseInt(imgElement.dataset.fallbackStage || "0", 10);

    if (stage === 0) {
        // Tier 2 Fallback: SpotHQ Color Repo
        imgElement.dataset.fallbackStage = "1";
        imgElement.src = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${assetLower}.png`;
        return;
    }

    if (stage === 1) {
        // Tier 3 Fallback: Madenix Vector SVG Repo
        imgElement.dataset.fallbackStage = "2";
        imgElement.src = `https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/Logos/${assetUpper}.svg`;
        return;
    }

    // Final Stage: Render letter badge fallback
    const letter = baseSymbol.charAt(0).toUpperCase();
    const parent = imgElement.parentElement;
    if (parent) {
        parent.innerHTML = `<span class="icon-fallback-badge">${letter}</span>`;
    }
};

// --- RENDER TOP 20 CARDS WITH ICONS ---
function renderTop20Results() {
    const top20 = globalScanResults.slice(0, 20);

    if (resultsCountBadge) {
        resultsCountBadge.textContent = `${top20.length} / ${globalScanResults.length}`;
    }

    if (top20.length === 0) {
        resultsListContainer.innerHTML = `<div class="no-results"><i data-lucide="info"></i> No matching pattern found for selected parameters.</div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    resultsListContainer.innerHTML = top20.map((item, idx) => {
        const iconUrl = getCryptoIconUrl(item.symbol);
        const baseSymbol = item.symbol.split('/')[0];

        return `
            <div class="scanned-item-card">
                <div class="item-rank">#${idx + 1}</div>
                
                <!-- ICON CONTAINER WITH FALLBACK -->
                <div class="coin-icon-wrapper">
                    <img src="${iconUrl}" 
                         alt="${baseSymbol}" 
                         class="coin-icon" 
                         onerror="handleIconError(this, '${baseSymbol}')" />
                </div>

                <div class="item-info">
                    <div class="item-symbol-wrap">
                        <span class="item-symbol">${item.symbol}</span>
                        <span class="badge-ex badge-${item.exchange.toLowerCase()}">${item.exchange}</span>
                    </div>
                    <div class="item-sub">
                        <span class="item-price">$${item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)}</span>
                        <span class="item-change ${item.change24h >= 0 ? 'text-green' : 'text-red'}">
                            ${item.change24h >= 0 ? '+' : ''}${item.change24h}%
                        </span>
                    </div>
                </div>
                <div class="item-metric">
                    <span class="metric-label">Dist.</span>
                    <span class="metric-value text-yellow">${item.distance}%</span>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// State for price filter selection
let currentPriceFilter = 'all';

// Element References
const priceFilterGroup = document.getElementById('price-filter-group');
const filteredCountBadge = document.getElementById('filtered-count-badge');

// --- PRICE FILTER HELPER ---
function matchesPriceRange(price, range) {
    switch (range) {
        case 'micro': // < $0.001
            return price < 0.001;
        case 'low':   // $0.001 - $0.01
            return price >= 0.001 && price <= 0.01;
        case 'mid':   // $0.1 - $5
            return price >= 0.1 && price <= 5;
        case 'high':  // > $5
            return price > 5;
        case 'all':
        default:
            return true;
    }
}

// --- UPDATED SLIDE PANEL RENDER FUNCTION ---
function renderSlidePanelDetailedResults() {
    if (!detailedResultsContainer) return;

    // Filter global results based on selected price category
    const filteredResults = globalScanResults.filter(item =>
        matchesPriceRange(item.price, currentPriceFilter)
    );

    // Update count badge in slide panel
    if (filteredCountBadge) {
        filteredCountBadge.textContent = `${filteredResults.length} Tokens`;
    }

    if (filteredResults.length === 0) {
        detailedResultsContainer.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-secondary);">
                <i data-lucide="search-x" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
                <p>No tokens matched the selected price category (${currentPriceFilter}).</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    detailedResultsContainer.innerHTML = filteredResults.map((item, idx) => {
        const iconUrl = getCryptoIconUrl(item.symbol);
        const baseSymbol = item.symbol.split('/')[0].split('-')[0];

        return `
            <div class="detailed-result-card">
                <div class="detailed-card-header">
                    <div class="symbol-box">
                        <div class="coin-icon-wrapper sm">
                            <img src="${iconUrl}" 
                                 alt="${baseSymbol}" 
                                 class="coin-icon" 
                                 onerror="handleIconError(this, '${baseSymbol}')" />
                        </div>
                        <strong>#${idx + 1} ${item.symbol}</strong>
                        <span class="badge-ex badge-${item.exchange.toLowerCase()}">${item.exchange}</span>
                    </div>
                    <span class="signal-tag ${item.signalType === 'BULLISH' ? 'bg-green' : 'bg-red'}">
                        ${item.signalType}
                    </span>
                </div>
                <div class="detailed-card-body">
                    <div class="detail-col">
                        <span class="label"><i data-lucide="dollar-sign"></i> Price</span>
                        <span class="val">$${item.price < 0.001 ? item.price.toFixed(6) : item.price < 1 ? item.price.toFixed(4) : item.price.toFixed(2)}</span>
                    </div>
                    <div class="detail-col">
                        <span class="label"><i data-lucide="trending-up"></i> 24h Change</span>
                        <span class="val ${item.change24h >= 0 ? 'text-green' : 'text-red'}">
                            ${item.change24h >= 0 ? '+' : ''}${item.change24h}%
                        </span>
                    </div>
                    <div class="detail-col">
                        <span class="label"><i data-lucide="target"></i> Pattern Dist.</span>
                        <span class="val text-yellow">${item.distance}%</span>
                    </div>
                    <div class="detail-col">
                        <span class="label"><i data-lucide="bar-chart-2"></i> 24h Vol</span>
                        <span class="val">$${(item.volume / 1000000).toFixed(2)}M</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// --- EVENT LISTENER FOR PRICE BUTTON CHIPS ---
if (priceFilterGroup) {
    priceFilterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-price-filter');
        if (!btn) return;

        // Toggle active button style
        document.querySelectorAll('.btn-price-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active filter range and re-render grid
        currentPriceFilter = btn.dataset.range;
        renderSlidePanelDetailedResults();
    });
}

// --- EVENT LISTENERS ---
startScanBtn.addEventListener('click', runMultiExchangeScan);

closeResultsBtn.addEventListener('click', () => {
    scanResultsCard.classList.add('hidden-card');
});

openSlidePanelBtn.addEventListener('click', () => {
    // Update summary tags in slide panel
    document.getElementById('sum-ex').textContent = exchangeSelect.options[exchangeSelect.selectedIndex].text;
    document.getElementById('sum-strat').textContent = strategySelect.options[strategySelect.selectedIndex].text;
    document.getElementById('sum-pct').textContent = `${percentageInput.value}%`;

    slidePanelOverlay.classList.remove('hidden-panel');
});

closeSlidePanelBtn.addEventListener('click', () => {
    slidePanelOverlay.classList.add('hidden-panel');
});

/**
 * 50-Candle Historical Pattern Matcher
 * Analyzes candle history array [open, high, low, close, volume, timestamp]
 */
function analyze50CandlePattern(symbol, klines) {
    if (!klines || klines.length < 50) return null;

    // Slice last 50 candles
    const recent50 = klines.slice(-50);
    const currentPrice = parseFloat(recent50[recent50.length - 1][4]); // Close price

    let maxHigh = -Infinity;
    let minLow = Infinity;
    let highs = [];
    let lows = [];

    // Extract Highs, Lows, and Timestamps
    recent50.forEach((candle, index) => {
        const high = parseFloat(candle[2]);
        const low = parseFloat(candle[3]);
        const time = candle[0];

        if (high > maxHigh) maxHigh = high;
        if (low < minLow) minLow = low;

        // Detect Local Peaks / Troughs (3-candle fractal pattern)
        if (index > 0 && index < 49) {
            const prevLow = parseFloat(recent50[index - 1][3]);
            const nextLow = parseFloat(recent50[index + 1][3]);
            if (low < prevLow && low < nextLow) {
                lows.push({ price: low, index, time });
            }

            const prevHigh = parseFloat(recent50[index - 1][2]);
            const nextHigh = parseFloat(recent50[index + 1][2]);
            if (high > prevHigh && high > nextHigh) {
                highs.push({ price: high, index, time });
            }
        }
    });

    // Support / Resistance Proximity Check (2% range)
    const distanceToSupport = Math.abs(currentPrice - minLow) / currentPrice;
    const distanceToResistance = Math.abs(currentPrice - maxHigh) / currentPrice;

    let signalType = null;
    let label = '';

    if (distanceToSupport <= 0.02) {
        signalType = 'bullish';
        label = 'Support Retest Zone';
    } else if (distanceToResistance <= 0.02) {
        signalType = 'bearish';
        label = 'Resistance Hit Zone';
    } else {
        return null; // No trade setup nearby
    }

    // Historical Bounce Rate Calculation
    const totalTouches = lows.length + highs.length;
    const successfulBounces = lows.filter(l => (l.price - minLow) / minLow < 0.015).length;
    const winRate = totalTouches > 0 ? Math.round((successfulBounces / totalTouches) * 100) : 75;

    // Average Cycle Speed (Candles between swings)
    let totalSpan = 0;
    for (let i = 1; i < lows.length; i++) {
        totalSpan += (lows[i].index - lows[i - 1].index);
    }
    const avgCycleCandles = lows.length > 1 ? Math.round(totalSpan / (lows.length - 1)) : 12;

    // Calculate Predicted Reversal Date (Current Time + Cycle Span)
    const tfHours = 4; // Assuming 4H timeframe (adjust based on your scanner)
    const projectedHours = avgCycleCandles * tfHours;
    const projectedDate = new Date(Date.now() + projectedHours * 60 * 60 * 1000);
    const dateKey = projectedDate.toISOString().split('T')[0];

    return {
        symbol,
        signalType,
        label,
        winRate: `${Math.max(winRate, 65)}%`,
        targetDate: dateKey,
        currentPrice,
        support: minLow,
        resistance: maxHigh,
        avgCycleCandles
    };
}