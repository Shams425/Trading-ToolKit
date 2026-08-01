/**
 * Risk Calculator & Journal Module
 */

// Selectors
const accountInput = document.getElementById('account-balance');
const riskInput = document.getElementById('risk-percent');
const entryInput = document.getElementById('entry-price');
const stopPercentInput = document.getElementById('stop-loss-percent');
const stopPriceInput = document.getElementById('stop-loss');
const takeProfitInput = document.getElementById('take-profit');
const calculateBtn = document.getElementById('calculate-btn');
const addTradeBtn = document.getElementById('add-trade-btn');
const tradeLogTbody = document.getElementById('trade-log-tbody');

let tradeLog = [];

// Custom Notification Alert
function showCustomAlert(message) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <span class="toast-close">&times;</span>
        <strong>System Note:</strong><br>${message}
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => { if (toast) toast.remove(); }, 6000);
}

// Auto-calculate Stop Loss Price based on %
function updateCalculatedStopLoss() {
    const entryPrice = parseFloat(entryInput.value);
    const stopPercent = parseFloat(stopPercentInput.value);

    if (!isNaN(entryPrice) && !isNaN(stopPercent)) {
        const calculatedStopPrice = entryPrice * (1 - (stopPercent / 100));
        stopPriceInput.value = calculatedStopPrice.toFixed(4);
    }
}

// Auto-update % when Stop Loss Price changes
function updateStopLossPercent() {
    const entryPrice = parseFloat(entryInput.value);
    const stopPrice = parseFloat(stopPriceInput.value);

    if (!isNaN(entryPrice) && !isNaN(stopPrice) && entryPrice > stopPrice) {
        const percent = ((entryPrice - stopPrice) / entryPrice) * 100;
        stopPercentInput.value = percent.toFixed(2);
    }
}

// Main Calculator Engine
export function calculateRisk() {
    const accountBalance = parseFloat(accountInput.value);
    const riskPercent = parseFloat(riskInput.value);
    const entryPrice = parseFloat(entryInput.value);
    const stopLoss = parseFloat(stopPriceInput.value);
    const takeProfit = parseFloat(takeProfitInput.value);

    if (isNaN(accountBalance) || isNaN(riskPercent) || isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit)) {
        return null;
    }

    if (stopLoss >= entryPrice) {
        showCustomAlert("Stop loss must sit strictly below the Token Entry Price.");
        return null;
    }

    if (takeProfit <= entryPrice) {
        showCustomAlert("Take profit target must sit strictly above the Token Entry Price.");
        return null;
    }

    const dollarRisk = accountBalance * (riskPercent / 100);
    const priceRiskPerUnit = entryPrice - stopLoss;
    const positionUnits = dollarRisk / priceRiskPerUnit;
    const requiredCapital = positionUnits * entryPrice;

    const priceRewardPerUnit = takeProfit - entryPrice;
    const dollarReward = positionUnits * priceRewardPerUnit;
    const rrRatio = dollarReward / dollarRisk;

    // Update UI Output
    document.getElementById('res-position-size').innerText = `${positionUnits.toFixed(2)} units`;
    document.getElementById('res-notional').innerText = `$${requiredCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} required capital`;

    document.getElementById('res-dollar-risk').innerText = `$${dollarRisk.toFixed(2)}`;
    document.getElementById('res-risk-percentage').innerText = `${riskPercent.toFixed(2)}% of account`;

    document.getElementById('res-dollar-reward').innerText = `+$${dollarReward.toFixed(2)}`;
    document.getElementById('res-rr-ratio').innerText = `R:R Ratio - 1 : ${rrRatio.toFixed(2)}`;

    document.getElementById('res-summary-text').innerText =
        `With a $${accountBalance.toLocaleString()} account risking ${riskPercent}%, your max loss is limited to $${dollarRisk.toFixed(2)}. ` +
        `Buying ${positionUnits.toFixed(2)} units at $${entryPrice} costs $${requiredCapital.toFixed(2)} capital. Your profit target pays $${dollarReward.toFixed(2)}.`;

    return { entryPrice, stopLoss, takeProfit, positionUnits, requiredCapital, dollarRisk, dollarReward, rrRatio };
}

// Add to Journal
function addTradeToJournal() {
    const tradeData = calculateRisk();
    if (!tradeData) {
        showCustomAlert("Cannot log invalid trade setup. Check entry, stop loss, and take profit numbers.");
        return;
    }

    const trade = {
        id: Date.now(),
        entry: tradeData.entryPrice,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        units: tradeData.positionUnits,
        capital: tradeData.requiredCapital,
        dollarRisk: tradeData.dollarRisk,
        dollarReward: tradeData.dollarReward,
        status: 'pending',
        actualPnl: 0
    };

    tradeLog.push(trade);
    renderJournalTable();
    showCustomAlert(`Logged trade: ${trade.units.toFixed(2)} units at $${trade.entry}`);
}

// Render Journal Table
function renderJournalTable() {
    tradeLogTbody.innerHTML = '';
    let totalPnl = 0;

    tradeLog.forEach((trade) => {
        const tr = document.createElement('tr');

        if (trade.status === 'win') trade.actualPnl = trade.dollarReward;
        else if (trade.status === 'loss') trade.actualPnl = -trade.dollarRisk;
        else trade.actualPnl = 0;

        totalPnl += trade.actualPnl;

        tr.innerHTML = `
            <td>$${trade.entry.toFixed(4)}</td>
            <td>$${trade.stopLoss.toFixed(4)}</td>
            <td>$${trade.takeProfit.toFixed(4)}</td>
            <td>${trade.units.toFixed(1)}</td>
            <td>$${trade.capital.toFixed(2)}</td>
            <td>
                <select class="status-select status-${trade.status}" data-id="${trade.id}">
                    <option value="pending" ${trade.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="win" ${trade.status === 'win' ? 'selected' : ''}>WIN (+ $${trade.dollarReward.toFixed(2)})</option>
                    <option value="loss" ${trade.status === 'loss' ? 'selected' : ''}>LOSS (- $${trade.dollarRisk.toFixed(2)})</option>
                </select>
            </td>
            <td>
                SL: <input type="number" class="adj-input adj-sl" data-id="${trade.id}" value="${trade.stopLoss}" step="0.001">
                TP: <input type="number" class="adj-input adj-tp" data-id="${trade.id}" value="${trade.takeProfit}" step="0.001">
            </td>
            <td>
                <button class="btn-danger btn-delete" data-id="${trade.id}">Delete</button>
            </td>
        `;

        tradeLogTbody.appendChild(tr);
    });

    document.getElementById('total-trades-count').innerText = tradeLog.length;
    const pnlEl = document.getElementById('total-pnl');
    pnlEl.innerText = `$${totalPnl.toFixed(2)}`;
    pnlEl.style.color = totalPnl >= 0 ? '#0ecb81' : '#f6465d';

    attachTableEvents();
}

function attachTableEvents() {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = Number(e.target.dataset.id);
            const trade = tradeLog.find(t => t.id === id);
            if (trade) {
                trade.status = e.target.value;
                renderJournalTable();
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.target.dataset.id);
            tradeLog = tradeLog.filter(t => t.id !== id);
            renderJournalTable();
        });
    });
}

// Event Listeners
entryInput.addEventListener('input', () => { updateCalculatedStopLoss(); calculateRisk(); });
stopPercentInput.addEventListener('input', () => { updateCalculatedStopLoss(); calculateRisk(); });
stopPriceInput.addEventListener('input', () => { updateStopLossPercent(); calculateRisk(); });
takeProfitInput.addEventListener('input', calculateRisk);
accountInput.addEventListener('input', calculateRisk);
riskInput.addEventListener('input', calculateRisk);

calculateBtn.addEventListener('click', calculateRisk);
addTradeBtn.addEventListener('click', addTradeToJournal);

// Initial Execution
updateCalculatedStopLoss();
calculateRisk();