import { fetch24hrTickers, fetchDailyKlines } from '../api/binance.js';
import { analyze3WeekPattern } from '../utils/patternEngine.js';

// DOM References
const startScanBtn = document.getElementById('start-scan-btn');
const closeResultsBtn = document.getElementById('close-results-btn');
const scanResultsCard = document.getElementById('scan-results-card');
const scannedCoinsContainer = document.querySelector('.scanned-coins-list');

/**
 * Renders the loading spinner inside the scan panel
 */
function renderLoadingState() {
    scannedCoinsContainer.innerHTML = `
        <div class="scan-status-container">
            <i data-lucide="loader-2" class="spinner-icon"></i>
            <span>Fetching live market data from Binance...</span>
        </div>
    `;
    lucide.createIcons();
}

/**
 * Renders the connectivity error message
 */
function renderErrorState(message = "Please check internet connectivity") {
    scannedCoinsContainer.innerHTML = `
        <div class="scan-status-container">
            <i data-lucide="wifi-off" style="width: 32px; height: 32px; color: #f6465d;"></i>
            <span class="error-message">${message}</span>
        </div>
    `;
    lucide.createIcons();
}

/**
 * Run Scanner with 1-Minute Connection Timeout
 */
async function runBotScan() {
    // Open results card side panel
    scanResultsCard.classList.remove('hidden-card');
    renderLoadingState();

    if (startScanBtn) {
        startScanBtn.disabled = true;
        startScanBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Scanning...`;
        lucide.createIcons();
    }

    let isTimedOut = false;

    // Set 1-Minute (60000 ms) Timeout Guard
    const timeoutTimer = setTimeout(() => {
        isTimedOut = true;
        renderErrorState("Please check internet connectivity");
        resetScanButton();
    }, 60000);

    try {
        // Fetch tickers with a Promise timeout race
        const tickers = await fetch24hrTickers();

        if (isTimedOut) return; // Ignore if timeout already triggered

        if (!tickers || tickers.length === 0) {
            clearTimeout(timeoutTimer);
            renderErrorState("Unable to retrieve market data. Please check internet connectivity.");
            resetScanButton();
            return;
        }

        // Top pairs to scan
        const topPairs = tickers
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 12);

        const scanResults = [];

        for (const pair of topPairs) {
            if (isTimedOut) return;

            const klines = await fetchDailyKlines(pair.symbol, 21);
            const analysis = analyze3WeekPattern(klines);

            if (analysis) {
                scanResults.push({
                    symbol: pair.symbol,
                    logo: `https://assets.coincap.io/assets/icons/${pair.symbol.replace('USDT', '').toLowerCase()}@2x.png`,
                    ...analysis
                });
            }
        }

        clearTimeout(timeoutTimer);

        if (isTimedOut) return;

        // Render & Save Scanned Results
        if (scanResults.length === 0) {
            renderErrorState("No pattern matches found.");
        } else {
            renderScannedList(scanResults);
            saveRadarState(scanResults, true); // <--- Make sure this line is called!
        }

    } catch (error) {
        clearTimeout(timeoutTimer);
        if (!isTimedOut) {
            console.error("Scan error:", error);
            renderErrorState("Please check internet connectivity");
        }
    } finally {
        resetScanButton();
    }
}

/**
 * Render Scanned Items
 */
function renderScannedList(items) {
    scannedCoinsContainer.innerHTML = items.map(res => {
        let signalClass = 'text-yellow';
        if (res.recommendation === 'BUY RECOM.') signalClass = 'text-green';
        if (res.recommendation === 'SELL RECOM.') signalClass = 'text-red';

        const displayPair = res.symbol.replace('USDT', '/USDT');

        return `
            <div class="scanned-item">
                <img src="${res.logo}" class="coin-icon" onerror="this.src='https://assets.coincap.io/assets/icons/usd@2x.png'" alt="${res.symbol}">
                <div class="item-info">
                    <strong>${displayPair}</strong>
                    <span class="item-loc">Range: ${res.rangePercent}% (${res.rangePercent <= 30 ? 'Near Support' : res.rangePercent >= 70 ? 'Near Resistance' : 'Mid Range'})</span>
                </div>
                <span class="item-signal ${signalClass}">${res.recommendation}</span>
                <button class="btn-add-cal" title="Add to Calendar" data-symbol="${displayPair}">
                    <i data-lucide="calendar-plus"></i>
                </button>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

/**
 * Reset Scan Button State
 */
function resetScanButton() {
    if (startScanBtn) {
        startScanBtn.disabled = false;
        startScanBtn.innerHTML = `<i data-lucide="radar"></i> Start Scan`;
        lucide.createIcons();
    }
}

// Event Listeners
if (startScanBtn) {
    startScanBtn.addEventListener('click', runBotScan);
}

if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', () => {
        scanResultsCard.classList.add('hidden-card');
    });
}

const RADAR_STORAGE_KEY = 'trading_toolkit_radar_state';

/**
 * Save Radar Scan Results & Panel Visibility
 */
function saveRadarState(scanResults, isPanelOpen) {
    const state = {
        isPanelOpen: isPanelOpen,
        timestamp: Date.now(),
        results: scanResults || []
    };
    localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Restore Saved Radar State on Page Load
 */
function restoreRadarState() {
    const saved = localStorage.getItem(RADAR_STORAGE_KEY);
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        // Optional: Expire cached scan after 15 minutes (900,000 ms)
        const isExpired = Date.now() - state.timestamp > 15 * 60 * 1000;
        if (isExpired) {
            localStorage.removeItem(RADAR_STORAGE_KEY);
            return;
        }

        // Restore panel open/closed state
        if (state.isPanelOpen && state.results.length > 0) {
            scanResultsCard.classList.remove('hidden-card');
            renderScannedList(state.results);
        }
    } catch (e) {
        console.error('Failed to restore radar state:', e);
    }
}

// Modify runBotScan() in js/module/marketScanner.js to save results when complete:
// Add this right after scanResults are collected and rendered:
/*
   renderScannedList(scanResults);
   saveRadarState(scanResults, true); // <--- Save State Here
*/

// Update Close Button listener to save closed state:
if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', () => {
        scanResultsCard.classList.add('hidden-card');
        saveRadarState([], false); // <--- Clear/Save Closed State
    });
}

// Call restore state on initial page load
document.addEventListener('DOMContentLoaded', () => {
    // loadMarketOverview();
    restoreRadarState();
});