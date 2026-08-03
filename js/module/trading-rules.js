// Dynamic Rules Dataset
const tradingRulesData = [
    {
        id: "rule-2percent-risk",
        title: "The 2% Capital Preservation Rule",
        category: "RISK MANAGEMENT",
        tagline: "Never risk more than 1% to 2% of your account balance on a single trade.",
        svgVisual: `
            <svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" class="rule-svg-img">
                <rect width="100%" height="100%" rx="10" fill="#14181d"/>
                <circle cx="200" cy="70" r="45" fill="none" stroke="#fcd535" stroke-width="7" stroke-dasharray="283" stroke-dashoffset="50"/>
                <text x="200" y="75" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">2% MAX</text>
                <path d="M60 110 L120 80 L170 100 L340 30" fill="none" stroke="#0ecb81" stroke-width="4" stroke-linecap="round"/>
                <circle cx="340" cy="30" r="5" fill="#0ecb81"/>
            </svg>`,
        concept: "A streak of 10 losses with 2% risk leaves you with ~81% of your balance. The same streak risking 10% drains over 65% of your total capital. Staying alive in the market gives probability time to turn in your favor.",
        failureReason: "FOMO and revenge trading. After a loss, traders scale up lot sizes to 'get back even' fast, leading to catastrophic account drawdowns.",
        execution: [
            "Calculate your exact trade lot/units before placing an order.",
            "Always set your hard Stop Loss prior to order execution.",
            "Never widen or remove your stop loss once the trade is active."
        ]
    },
    {
        id: "rule-cut-losses",
        title: "Cut Losses Fast, Let Winners Run",
        category: "EXECUTION & PSYCHOLOGY",
        tagline: "Your win rate matters far less than your average win-to-loss ratio.",
        svgVisual: `
            <svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" class="rule-svg-img">
                <rect width="100%" height="100%" rx="10" fill="#14181d"/>
                <path d="M40 70 L110 110" stroke="#f6465d" stroke-width="4" stroke-linecap="round" stroke-dasharray="6,6"/>
                <text x="75" y="55" font-family="sans-serif" font-size="12" fill="#f6465d" font-weight="bold">QUICK CUT</text>
                <path d="M170 110 L250 60 L350 20" fill="none" stroke="#0ecb81" stroke-width="4" stroke-linecap="round"/>
                <polygon points="340,20 355,18 350,30" fill="#0ecb81"/>
                <text x="260" y="100" font-family="sans-serif" font-size="12" fill="#0ecb81" font-weight="bold">LET RUN (3R+)</text>
            </svg>`,
        concept: "A trader with a 40% win rate is highly profitable if their average win is $300 (3R) and average loss is $100 (1R). Let strong market trends do the work for you.",
        failureReason: "Ego and anxiety. Human psychology naturally wants to lock in tiny gains quickly to feel 'successful', while holding onto losing trades hoping they return to break-even.",
        execution: [
            "Move Stop Loss to Break-Even (BE) once price reaches 1.5R target.",
            "Take partial profits at key structural levels and leave a runner.",
            "If market structure breaks against your bias, exit manually—don't wait for hard SL."
        ]
    },
    {
        id: "rule-no-fomo",
        title: "Never Chase Parabolic Green Candles",
        category: "DISCIPLINE",
        tagline: "If you missed the initial entry breakout, wait for the retest or skip the trade completely.",
        svgVisual: `
            <svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" class="rule-svg-img">
                <rect width="100%" height="100%" rx="10" fill="#14181d"/>
                <rect x="110" y="25" width="22" height="85" fill="#0ecb81" rx="3"/>
                <line x1="121" y1="10" x2="121" y2="125" stroke="#0ecb81" stroke-width="3"/>
                <line x1="170" y1="15" x2="170" y2="125" stroke="#fcd535" stroke-width="2" stroke-dasharray="4,4"/>
                <text x="270" y="65" font-family="sans-serif" font-size="12" fill="#fcd535" font-weight="bold" text-anchor="middle">WAIT FOR RETEST</text>
                <path d="M210 40 Q240 100 270 90" fill="none" stroke="#3b82f6" stroke-width="3" stroke-dasharray="5,5"/>
            </svg>`,
        concept: "Buying at the top of an extended candle means entering where institutional smart money is taking profits. Your risk-to-reward ratio becomes mathematically terrible.",
        failureReason: "Emotional impulse from watching prices spike and fearing you're missing out on free profit.",
        execution: [
            "Pre-draw key Support & Resistance zones before trading sessions.",
            "Only enter when price is at or testing your pre-planned zones.",
            "Remember: High-probability setups present themselves every single day."
        ]
    }
];

// DOM Elements
const ruleNavList = document.getElementById('rule-nav-list');
const ruleCategory = document.getElementById('rule-category');
const ruleVisual = document.getElementById('rule-visual-container');
const ruleTitle = document.getElementById('rule-title');
const ruleTagline = document.getElementById('rule-tagline');
const ruleConcept = document.getElementById('rule-concept');
const ruleFailure = document.getElementById('rule-failure');
const ruleExecution = document.getElementById('rule-execution-list');
const ruleCountBadge = document.getElementById('rule-count');

let activeRuleId = tradingRulesData[0].id;

/**
 * Render Sidebar Rule Navigation Buttons
 */
function renderSidebarNav() {
    if (!ruleNavList) return;

    if (ruleCountBadge) ruleCountBadge.textContent = `${tradingRulesData.length} Rules`;

    ruleNavList.innerHTML = tradingRulesData.map(rule => `
        <button class="rule-nav-item ${rule.id === activeRuleId ? 'active' : ''}" onclick="selectRule('${rule.id}')">
            <span class="nav-rule-title">${rule.title}</span>
            <span class="nav-rule-cat">${rule.category}</span>
        </button>
    `).join('');
}

/**
 * Select & Render Active Rule Details
 */
window.selectRule = function (ruleId) {
    const rule = tradingRulesData.find(r => r.id === ruleId);
    if (!rule) return;

    activeRuleId = ruleId;
    renderSidebarNav();

    // Update Content View
    ruleCategory.textContent = rule.category;
    ruleVisual.innerHTML = rule.svgVisual;
    ruleTitle.textContent = rule.title;
    ruleTagline.textContent = rule.tagline;
    ruleConcept.textContent = rule.concept;
    ruleFailure.textContent = rule.failureReason;

    ruleExecution.innerHTML = rule.execution
        .map(item => `<li><i data-lucide="check"></i> <span>${item}</span></li>`)
        .join('');

    if (window.lucide) window.lucide.createIcons();
};

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    selectRule(tradingRulesData[0].id);
});