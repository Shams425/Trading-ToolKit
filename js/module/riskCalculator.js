/**
 * Dynamic Risk Calculator & Trade Journal Module with Slide Toast & PnL Tracking
 */

const CALCULATOR_KEY = 'trading_toolkit_calc_inputs';
const JOURNAL_KEY = 'trading_toolkit_journal_logs';

let journalLogs = [];
let currentCalculation = null;
let toastTimeoutId = null;

// DOM References
const accountSizeInput = document.getElementById('account-size');
const riskPercentInput = document.getElementById('risk-percent');
const entryPriceInput = document.getElementById('entry-price');
const stopLossInput = document.getElementById('stop-loss');
const takeProfitInput = document.getElementById('take-profit');

const positionSizeEl = document.getElementById('calc-position-size');
const riskAmountEl = document.getElementById('calc-risk-amount');
const rrRatioEl = document.getElementById('calc-rr-ratio');
const totalPnlDisplay = document.getElementById('total-pnl-display');
const pnlStatusField = document.getElementById('pnl-status-field');

const btnCalculate = document.getElementById('btn-calculate');
const btnClearJournal = document.getElementById('btn-clear-journal');
const journalBody = document.getElementById('journal-table-body');
const toastContainer = document.getElementById('toast-container');

/**
 * 1. Perform Risk Calculation (Triggered ON BUTTON CLICK only)
 */
function handleCalculateClick() {
    const accountSize = parseFloat(accountSizeInput?.value) || 0;
    const riskPercent = parseFloat(riskPercentInput?.value) || 0;
    const entryPrice = parseFloat(entryPriceInput?.value) || 0;
    const stopLoss = parseFloat(stopLossInput?.value) || 0;
    const takeProfit = parseFloat(takeProfitInput?.value) || 0;

    if (accountSize <= 0 || riskPercent <= 0 || entryPrice <= 0 || stopLoss <= 0) {
        alert('Please fill out Account Balance, Risk %, Entry Price, and Stop Loss with valid positive numbers.');
        return;
    }

    // Save current inputs to LocalStorage
    saveInputsToStorage();

    // Risk Calculation Math
    const maxRiskAmount = accountSize * (riskPercent / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);

    if (riskPerUnit === 0) {
        alert('Entry price and Stop Loss cannot be identical.');
        return;
    }

    const positionUnits = maxRiskAmount / riskPerUnit;
    const totalPositionSize = positionUnits * entryPrice;

    let rrRatio = '0.00 : 1';
    let rewardPerUnit = 0;
    if (takeProfit > 0) {
        rewardPerUnit = Math.abs(takeProfit - entryPrice);
        rrRatio = `${(rewardPerUnit / riskPerUnit).toFixed(2)} : 1`;
    }

    // Cache calculation result
    currentCalculation = {
        entryPrice,
        stopLoss,
        takeProfit,
        maxRiskAmount,
        positionUnits,
        totalPositionSize,
        rrRatio
    };

    // Update Output Displays
    if (positionSizeEl) positionSizeEl.innerText = `$${totalPositionSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (riskAmountEl) riskAmountEl.innerText = `$${maxRiskAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (rrRatioEl) rrRatioEl.innerText = rrRatio;

    // Trigger Slide-in Toast Alert
    showLogToJournalToast();
}

/**
 * 2. Sliding Toast Notification with 1-Minute Timeout
 */
function showLogToJournalToast() {
    if (!toastContainer) return;

    // Clear existing toast if present
    toastContainer.innerHTML = '';
    if (toastTimeoutId) clearTimeout(toastTimeoutId);

    const toast = document.createElement('div');
    toast.className = 'toast-notification slide-in';
    toast.innerHTML = `
        <div class="toast-content">
            <i data-lucide="check-circle" class="toast-icon"></i>
            <div class="toast-text">
                <strong>Calculation Ready!</strong>
                <span>Would you like to log this trade setup to your journal?</span>
            </div>
        </div>
        <div class="toast-actions">
            <button id="toast-btn-yes" class="btn-toast-confirm">Log Trade</button>
            <button id="toast-btn-dismiss" class="btn-toast-cancel"><i data-lucide="x"></i></button>
        </div>
        <div class="toast-progress-bar"></div>
    `;

    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Confirm button event
    document.getElementById('toast-btn-yes')?.addEventListener('click', () => {
        addCurrentTradeToJournal();
        dismissToast(toast);
    });

    // Dismiss button event
    document.getElementById('toast-btn-dismiss')?.addEventListener('click', () => {
        dismissToast(toast);
    });

    // 1-Minute Auto Dismiss (60,000 ms)
    toastTimeoutId = setTimeout(() => {
        dismissToast(toast);
    }, 60000);
}

function dismissToast(toastEl) {
    if (!toastEl) return;
    toastEl.classList.remove('slide-in');
    toastEl.classList.add('slide-out');
    setTimeout(() => {
        toastEl.remove();
    }, 400);
}

/**
 * 3. Log Trade & Manage Trade Lifecycles (Active -> Closed)
 */
function addCurrentTradeToJournal() {
    if (!currentCalculation) return;

    const newTrade = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        entry: currentCalculation.entryPrice,
        stop: currentCalculation.stopLoss,
        target: currentCalculation.takeProfit || 0,
        risk: currentCalculation.maxRiskAmount,
        units: currentCalculation.positionUnits,
        status: 'OPEN', // 'OPEN', 'WIN', 'LOSS'
        pnl: 0
    };

    journalLogs.unshift(newTrade);
    saveJournalToStorage();
    renderJournalTable();
    updateTotalPnL();
}

let pendingCloseTradeId = null;

// Modal Elements
const closeTradeModal = document.getElementById('close-trade-modal');
const modalTradeInfo = document.getElementById('modal-trade-info');
const exitPriceInput = document.getElementById('exit-price-input');
const btnConfirmClose = document.getElementById('btn-confirm-close-trade');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnCloseModalX = document.getElementById('btn-close-modal-x');

/**
 * Open Custom Modal to Close Trade
 */
window.openCloseTradeModal = function (id) {
    const trade = journalLogs.find(t => t.id === id);
    if (!trade || !closeTradeModal) return;

    pendingCloseTradeId = id;

    if (modalTradeInfo) {
        modalTradeInfo.innerHTML = `Closing trade entry at <strong style="color: #fff;">$${trade.entry.toLocaleString()}</strong>`;
    }

    if (exitPriceInput) {
        exitPriceInput.value = trade.target || trade.entry;
    }

    closeTradeModal.classList.remove('hidden');
};

/**
 * Close Modal Function
 */
function hideCloseModal() {
    if (closeTradeModal) closeTradeModal.classList.add('hidden');
    pendingCloseTradeId = null;
}

/**
 * Process Trade Execution on Modal Confirm
 */
function confirmCloseTradeExecution() {
    if (!pendingCloseTradeId) return;

    const trade = journalLogs.find(t => t.id === pendingCloseTradeId);
    if (!trade) return;

    const exitPrice = parseFloat(exitPriceInput?.value);
    if (isNaN(exitPrice) || exitPrice <= 0) {
        alert('Please enter a valid exit price.');
        return;
    }

    const isLong = trade.entry > trade.stop;
    let realizedPnl = 0;

    if (isLong) {
        realizedPnl = (exitPrice - trade.entry) * trade.units;
    } else {
        realizedPnl = (trade.entry - exitPrice) * trade.units;
    }

    trade.status = realizedPnl >= 0 ? 'WIN' : 'LOSS';
    trade.pnl = realizedPnl;

    saveJournalToStorage();
    renderJournalTable();
    updateTotalPnL();
    hideCloseModal();
}

// Bind Modal Listeners
document.addEventListener('DOMContentLoaded', () => {
    btnConfirmClose?.addEventListener('click', confirmCloseTradeExecution);
    btnCancelModal?.addEventListener('click', hideCloseModal);
    btnCloseModalX?.addEventListener('click', hideCloseModal);
});


/**
 * 4. PnL Aggregation Engine
 */
function updateTotalPnL() {
    const closedTrades = journalLogs.filter(t => t.status !== 'OPEN');
    const netPnL = closedTrades.reduce((acc, trade) => acc + trade.pnl, 0);

    if (totalPnlDisplay) {
        totalPnlDisplay.innerText = `${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)}`;
        totalPnlDisplay.className = `pnl-value ${netPnL > 0 ? 'positive' : netPnL < 0 ? 'negative' : 'neutral'}`;
    }

    if (pnlStatusField) {
        pnlStatusField.value = `${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)} (${closedTrades.length} Closed Trades)`;
        pnlStatusField.className = `readonly-pnl-input ${netPnL > 0 ? 'text-green' : netPnL < 0 ? 'text-red' : ''}`;
    }
}

/**
 * 5. LocalStorage State Engine
 */
function saveInputsToStorage() {
    const inputs = {
        accountSize: accountSizeInput?.value || '',
        riskPercent: riskPercentInput?.value || '',
        entryPrice: entryPriceInput?.value || '',
        stopLoss: stopLossInput?.value || '',
        takeProfit: takeProfitInput?.value || ''
    };
    localStorage.setItem(CALCULATOR_KEY, JSON.stringify(inputs));
}

function restoreInputsFromStorage() {
    const saved = localStorage.getItem(CALCULATOR_KEY);
    if (!saved) return;

    try {
        const inputs = JSON.parse(saved);
        if (accountSizeInput && inputs.accountSize !== undefined) accountSizeInput.value = inputs.accountSize;
        if (riskPercentInput && inputs.riskPercent !== undefined) riskPercentInput.value = inputs.riskPercent;
        if (entryPriceInput && inputs.entryPrice !== undefined) entryPriceInput.value = inputs.entryPrice;
        if (stopLossInput && inputs.stopLoss !== undefined) stopLossInput.value = inputs.stopLoss;
        if (takeProfitInput && inputs.takeProfit !== undefined) takeProfitInput.value = inputs.takeProfit;
    } catch (e) {
        console.error('Failed restoring calculator inputs:', e);
    }
}

function saveJournalToStorage() {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journalLogs));
}

function restoreJournalFromStorage() {
    const saved = localStorage.getItem(JOURNAL_KEY);
    if (!saved) return;

    try {
        journalLogs = JSON.parse(saved);
        renderJournalTable();
        updateTotalPnL();
    } catch (e) {
        console.error('Failed restoring journal logs:', e);
    }
}

function renderJournalTable() {
    if (!journalBody) return;

    if (journalLogs.length === 0) {
        journalBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-journal">No logged trades. Fill out inputs above and click "Calculate Risk".</td>
            </tr>
        `;
        return;
    }

    journalBody.innerHTML = journalLogs.map(trade => {
        let statusBadge = '<span class="status-tag open">OPEN</span>';
        if (trade.status === 'WIN') statusBadge = '<span class="status-tag win">WIN</span>';
        if (trade.status === 'LOSS') statusBadge = '<span class="status-tag loss">LOSS</span>';

        let pnlDisplay = trade.status === 'OPEN' ? '--' : `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`;
        let pnlClass = trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : '';

        return `
            <tr>
                <td>${trade.date}</td>
                <td>$${trade.entry.toLocaleString()}</td>
                <td>$${trade.stop.toLocaleString()}</td>
                <td>${trade.target ? '$' + trade.target.toLocaleString() : 'N/A'}</td>
                <td class="text-red">$${trade.risk.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td class="${pnlClass}">${pnlDisplay}</td>
                <td class="action-cell">
                    ${trade.status === 'OPEN'
                ? `<button class="btn-close-trade" onclick="window.openCloseTradeModal(${trade.id})">Close Trade</button>`
                : `<button class="btn-delete-log" onclick="window.deleteTradeLog(${trade.id})"><i data-lucide="trash-2"></i></button>`
            }
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

window.deleteTradeLog = function (id) {
    journalLogs = journalLogs.filter(trade => trade.id !== id);
    saveJournalToStorage();
    renderJournalTable();
    updateTotalPnL();
};

/**
 * 6. Attach Event Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    restoreInputsFromStorage();
    restoreJournalFromStorage();

    // Inputs now ONLY save to state when changed (No live calculations)
    [accountSizeInput, riskPercentInput, entryPriceInput, stopLossInput, takeProfitInput].forEach(input => {
        input?.addEventListener('input', saveInputsToStorage);
    });

    if (btnCalculate) btnCalculate.addEventListener('click', handleCalculateClick);

    if (btnClearJournal) {
        // Unbind any inline handlers and trigger our custom modal directly
        btnClearJournal.addEventListener('click', (e) => {
            e.preventDefault();
            openClearHistoryModal();
        });
    }
});

// Add DOM references for new buttons & clear history modal
const btnDeleteUntriggered = document.getElementById('btn-delete-untriggered');

const clearHistoryModal = document.getElementById('clear-history-modal');
const btnCancelClear = document.getElementById('btn-cancel-clear');
const btnConfirmClear = document.getElementById('btn-confirm-clear');
const btnClearModalX = document.getElementById('btn-clear-modal-x');

/**
 * Delete Untriggered Trade Action from Modal
 */
function deleteUntriggeredTrade() {
    if (!pendingCloseTradeId) return;

    journalLogs = journalLogs.filter(t => t.id !== pendingCloseTradeId);
    saveJournalToStorage();
    renderJournalTable();
    updateTotalPnL();
    hideCloseModal();
}

/**
 * Clear History Custom Modal Handlers
 */
function openClearHistoryModal() {
    if (clearHistoryModal) clearHistoryModal.classList.remove('hidden');
}

function hideClearHistoryModal() {
    if (clearHistoryModal) clearHistoryModal.classList.add('hidden');
}

function executeClearHistory() {
    journalLogs = [];
    saveJournalToStorage();
    renderJournalTable();
    updateTotalPnL();
    hideClearHistoryModal();
}

// Bind Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Delete untriggered order listener
    btnDeleteUntriggered?.addEventListener('click', deleteUntriggeredTrade);

    // Clear History Modal Listeners
    if (btnClearJournal) {
        btnClearJournal.addEventListener('click', openClearHistoryModal);
    }
    btnCancelClear?.addEventListener('click', hideClearHistoryModal);
    btnClearModalX?.addEventListener('click', hideClearHistoryModal);
    btnConfirmClear?.addEventListener('click', executeClearHistory);
});