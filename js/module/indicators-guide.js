// Dataset for Technical Indicators
const indicatorData = [
    {
        id: "indicator-rsi",
        title: "Relative Strength Index (RSI)",
        tag: "RSI (14, close)",
        tagline: "Measures price momentum and speed to identify overbought (>70) and oversold (<30) regions.",
        settings: "Length: 14 Period | Source: Close | Upper Band: 70 | Lower Band: 30 | Timeframe: 1H / 4H / Daily",
        signals: "Look for Bullish/Bearish Divergence! If price makes a lower low but RSI makes a higher low, a sharp trend reversal is imminent.",
        traps: [
            "Never short purely because RSI is > 70 in a strong uptrend; RSI can stay overbought for weeks during strong bull runs.",
            "Always wait for RSI to cross back inside the 70/30 boundary before taking an execution signal."
        ],
        svgVisual: `
            <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" class="tv-svg-chart">
                <rect width="100%" height="100%" fill="#131722"/>
                <!-- Upper / Lower Bands -->
                <line x1="0" y1="35" x2="500" y2="35" stroke="#f6465d" stroke-width="1" stroke-dasharray="4,4"/>
                <text x="460" y="30" font-family="sans-serif" font-size="10" fill="#f6465d">70 OB</text>
                <line x1="0" y1="125" x2="500" y2="125" stroke="#0ecb81" stroke-width="1" stroke-dasharray="4,4"/>
                <text x="460" y="140" font-family="sans-serif" font-size="10" fill="#0ecb81">30 OS</text>
                <!-- RSI Oscillation Wave -->
                <path d="M10 80 Q60 20 120 100 T220 135 T320 40 T420 100 L490 60" fill="none" stroke="#a855f7" stroke-width="3"/>
                <!-- Divergence Highlight Line -->
                <line x1="220" y1="135" x2="420" y2="100" stroke="#fcd535" stroke-width="2" stroke-dasharray="3,3"/>
                <text x="300" y="140" font-family="sans-serif" font-size="11" fill="#fcd535" font-weight="bold">Bullish Divergence</text>
            </svg>`
    },
    {
        id: "indicator-macd",
        title: "MACD (Moving Average Convergence Divergence)",
        tag: "MACD (12, 26, close, 9)",
        tagline: "Trend-following momentum indicator showing the relationship between two exponential moving averages.",
        settings: "Fast Length: 12 | Slow Length: 26 | Signal Smoothing: 9 | Source: Close",
        signals: "Signal Crossover: Long when the MACD Line (Blue) crosses above the Signal Line (Orange) below the zero axis.",
        traps: [
            "MACD lags price action. Avoid taking MACD signals in choppy sideways/ranging markets—it produces frequent whip-saws.",
            "Histogram decay (fading bars) indicates momentum exhaustion before price actually turns."
        ],
        svgVisual: `
            <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" class="tv-svg-chart">
                <rect width="100%" height="100%" fill="#131722"/>
                <!-- Zero Axis Line -->
                <line x1="0" y1="80" x2="500" y2="80" stroke="#434651" stroke-width="1"/>
                <!-- Histogram Bars -->
                <rect x="180" y="80" width="12" height="20" fill="#f6465d"/>
                <rect x="200" y="80" width="12" height="10" fill="#f6465d"/>
                <rect x="220" y="60" width="12" height="20" fill="#0ecb81"/>
                <rect x="240" y="40" width="12" height="40" fill="#0ecb81"/>
                <rect x="260" y="30" width="12" height="50" fill="#0ecb81"/>
                <!-- MACD & Signal Line -->
                <path d="M20 110 Q120 120 220 80 T400 30 L480 50" fill="none" stroke="#2962ff" stroke-width="3"/>
                <path d="M20 100 Q120 110 220 88 T400 45 L480 60" fill="none" stroke="#ff6d00" stroke-width="2"/>
                <circle cx="220" cy="80" r="5" fill="#fcd535"/>
                <text x="230" y="95" font-family="sans-serif" font-size="11" fill="#fcd535" font-weight="bold">Bullish Cross</text>
            </svg>`
    },
    {
        id: "indicator-ema-cross",
        title: "EMA Trend Ribbon (20 / 50 / 200 EMA)",
        tag: "EMA (20, 50, 200)",
        tagline: "Dynamic support/resistance dynamic lines that filter macro trend direction.",
        settings: "EMA Fast: 20 (Yellow) | EMA Medium: 50 (Blue) | Trend Line: 200 (Purple)",
        signals: "200 EMA Rules the World: Only look for LONGS when price is ABOVE the 200 EMA; only look for SHORTS when price is BELOW the 200 EMA.",
        traps: [
            "Do not buy when price is over-extended far away from the 20 EMA; wait for price to pull back to the EMA line like a magnet.",
            "Death Cross (50 EMA crossing below 200 EMA) is a lagging confirmation—do not panic sell at the bottom."
        ],
        svgVisual: `
            <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" class="tv-svg-chart">
                <rect width="100%" height="100%" fill="#131722"/>
                <!-- 200 EMA (Purple) -->
                <path d="M10 130 C150 120 300 90 490 70" fill="none" stroke="#a855f7" stroke-width="3"/>
                <text x="420" y="60" font-family="sans-serif" font-size="10" fill="#a855f7">200 EMA</text>
                <!-- 50 EMA (Blue) -->
                <path d="M10 110 C150 100 280 60 490 40" fill="none" stroke="#3b82f6" stroke-width="2"/>
                <!-- 20 EMA (Yellow) -->
                <path d="M10 90 C120 80 250 30 490 20" fill="none" stroke="#fcd535" stroke-width="2"/>
                <!-- Price Candle Pullback Bounce -->
                <circle cx="270" cy="46" r="6" fill="#0ecb81"/>
                <text x="285" y="42" font-family="sans-serif" font-size="11" fill="#0ecb81" font-weight="bold">EMA Pullback Entry</text>
            </svg>`
    }
];

// DOM Hooks
const indicatorNavList = document.getElementById('indicator-nav-list');
const tvIndicatorTag = document.getElementById('tv-indicator-tag');
const tvChartViewport = document.getElementById('tv-chart-viewport');
const indicatorTitle = document.getElementById('indicator-title');
const indicatorTagline = document.getElementById('indicator-tagline');
const indicatorSettings = document.getElementById('indicator-settings');
const indicatorSignals = document.getElementById('indicator-signals');
const indicatorTrapsList = document.getElementById('indicator-traps-list');

let activeIndicatorId = indicatorData[0].id;

/**
 * Render Sidebar Buttons
 */
function renderSidebar() {
    if (!indicatorNavList) return;

    indicatorNavList.innerHTML = indicatorData.map(ind => `
        <button class="indicator-nav-item ${ind.id === activeIndicatorId ? 'active' : ''}" onclick="selectIndicator('${ind.id}')">
            <span class="nav-ind-title">${ind.title}</span>
            <span class="nav-ind-tag">${ind.tag}</span>
        </button>
    `).join('');
}

/**
 * Select Indicator & Render View
 */
window.selectIndicator = function (indicatorId) {
    const ind = indicatorData.find(i => i.id === indicatorId);
    if (!ind) return;

    activeIndicatorId = indicatorId;
    renderSidebar();

    // Render Content & TradingView Mock Visualizer
    tvIndicatorTag.textContent = ind.tag;
    tvChartViewport.innerHTML = ind.svgVisual;
    indicatorTitle.textContent = ind.title;
    indicatorTagline.textContent = ind.tagline;
    indicatorSettings.textContent = ind.settings;
    indicatorSignals.textContent = ind.signals;

    indicatorTrapsList.innerHTML = ind.traps
        .map(trap => `<li><i data-lucide="alert-triangle"></i> <span>${trap}</span></li>`)
        .join('');

    if (window.lucide) window.lucide.createIcons();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    selectIndicator(indicatorData[0].id);
});