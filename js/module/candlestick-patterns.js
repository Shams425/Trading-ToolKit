// Dataset for Candlestick Patterns
const candlestickData = [
    {
        id: "pattern-bullish-engulfing",
        title: "Bullish Engulfing",
        bias: "BULLISH REVERSAL",
        biasColor: "green",
        tagline: "A small red candle completely swallowed by a massive green expansion candle.",
        psychology: "Sellers were initially in control pushing price lower. However, overwhelming buyer volume enters on the next session, opening low and closing well above the previous candle's open.",
        entry: "Wait for the green engulfing candle to close. Enter Market or place a Limit Order at 50% retracement of the engulfing body. Stop Loss sits right below the lowest wick.",
        invalidations: [
            "Pattern fails if price breaks and closes below the lowest wick of the engulfing candle.",
            "Avoid trading engulfing candles in the middle of a tight consolidation range; best used at key support zones."
        ],
        // HTML candle structure for pure CSS rendering
        candles: [
            { type: "red", height: "45px", topWick: "8px", bottomWick: "10px", delay: "0.1s" },
            { type: "green", height: "105px", topWick: "12px", bottomWick: "6px", delay: "0.7s" }
        ]
    },
    {
        id: "pattern-hammer",
        title: "Bullish Hammer",
        bias: "REJECTION / REVERSAL",
        biasColor: "green",
        tagline: "Long lower wick testing extreme low prices, followed by an aggressive buyer rebound.",
        psychology: "Sellers attempted to push price down hard during the session, but met aggressive institutional liquidity. Buyers drove price all the way back up to close near the top of the range.",
        entry: "Enter on the open of the following confirmation candle. Place Stop Loss just below the tip of the long lower tail (wick).",
        invalidations: [
            "The lower wick MUST be at least 2 to 3 times the size of the real body.",
            "If the candle has a long upper wick, it is NOT a hammer—it indicates upper resistance."
        ],
        candles: [
            { type: "red", height: "55px", topWick: "6px", bottomWick: "8px", delay: "0.1s" },
            { type: "hammer-green", height: "28px", topWick: "4px", bottomWick: "90px", delay: "0.7s" }
        ]
    },
    {
        id: "pattern-morning-star",
        title: "Morning Star",
        bias: "3-CANDLE BOTTOM REVERSAL",
        biasColor: "yellow",
        tagline: "A 3-candle bottoming setup: Strong Downtrend -> Indecision Doji -> Strong Bullish Burst.",
        psychology: "Candle 1 confirms seller dominance. Candle 2 shows momentum drying up into a tight doji. Candle 3 confirms buyers taking complete control of the market.",
        entry: "Enter on the close of Candle 3 (the strong green candle). Stop Loss goes beneath the lowest point of Candle 2 (the doji).",
        invalidations: [
            "Candle 3 must close at least past the 50% midpoint of Candle 1.",
            "Weak volume on Candle 3 signals a false reversal."
        ],
        candles: [
            { type: "red", height: "90px", topWick: "10px", bottomWick: "10px", delay: "0.1s" },
            { type: "doji", height: "12px", topWick: "25px", bottomWick: "25px", delay: "0.6s" },
            { type: "green", height: "95px", topWick: "8px", bottomWick: "6px", delay: "1.1s" }
        ]
    }
];

// DOM Hooks
const patternNavList = document.getElementById('pattern-nav-list');
const candlesContainer = document.getElementById('candles-container');
const patternBias = document.getElementById('pattern-bias');
const patternTitle = document.getElementById('pattern-title');
const patternTagline = document.getElementById('pattern-tagline');
const patternPsychology = document.getElementById('pattern-psychology');
const patternEntry = document.getElementById('pattern-entry');
const patternInvalList = document.getElementById('pattern-invalidation-list');
const btnReplay = document.getElementById('btn-replay-anim');

let activePatternId = candlestickData[0].id;

/**
 * Render Sidebar Buttons
 */
function renderSidebar() {
    if (!patternNavList) return;

    patternNavList.innerHTML = candlestickData.map(p => `
        <button class="pattern-nav-item ${p.id === activePatternId ? 'active' : ''}" onclick="selectPattern('${p.id}')">
            <span class="nav-pattern-title">${p.title}</span>
            <span class="nav-pattern-bias text-${p.biasColor}">${p.bias}</span>
        </button>
    `).join('');
}

/**
 * Render Candlestick Elements & Trigger CSS Draw Animations
 */
function renderCandleChart(pattern) {
    if (!candlesContainer) return;

    // Clear old candles
    candlesContainer.innerHTML = '';

    // Build Candlestick DOM Nodes
    pattern.candles.forEach(c => {
        const candleWrapper = document.createElement('div');
        candleWrapper.className = `candle-wrapper ${c.type}`;
        candleWrapper.style.setProperty('--delay', c.delay);

        candleWrapper.innerHTML = `
            <div class="wick top-wick" style="height: ${c.topWick}"></div>
            <div class="candle-body" style="height: ${c.height}"></div>
            <div class="wick bottom-wick" style="height: ${c.bottomWick}"></div>
        `;

        candlesContainer.appendChild(candleWrapper);
    });
}

/**
 * Select Pattern Event
 */
window.selectPattern = function (patternId) {
    const pattern = candlestickData.find(p => p.id === patternId);
    if (!pattern) return;

    activePatternId = patternId;
    renderSidebar();

    // Update Text Content
    patternBias.textContent = pattern.bias;
    patternTitle.textContent = pattern.title;
    patternTagline.textContent = pattern.tagline;
    patternPsychology.textContent = pattern.psychology;
    patternEntry.textContent = pattern.entry;

    patternInvalList.innerHTML = pattern.invalidations
        .map(inv => `<li><i data-lucide="x-circle"></i> <span>${inv}</span></li>`)
        .join('');

    if (window.lucide) window.lucide.createIcons();

    // Trigger Chart Render
    renderCandleChart(pattern);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    selectPattern(candlestickData[0].id);

    btnReplay?.addEventListener('click', () => {
        const currentPattern = candlestickData.find(p => p.id === activePatternId);
        if (currentPattern) renderCandleChart(currentPattern);
    });
});