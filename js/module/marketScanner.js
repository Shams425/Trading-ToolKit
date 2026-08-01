/**
 * Market Scanner Row 2 Split Logic
 */

const startScanBtn = document.getElementById('start-scan-btn');
const closeResultsBtn = document.getElementById('close-results-btn');
const radarRowContainer = document.getElementById('radar-row-container');
const scanResultsCard = document.getElementById('scan-results-card');

// Trigger Scan: Shrink Radar and Fade In Results Card (50 / 50)
if (startScanBtn && radarRowContainer && scanResultsCard) {
    startScanBtn.addEventListener('click', () => {
        radarRowContainer.classList.add('split-active');
        scanResultsCard.classList.remove('hidden-card');
    });
}

// Close Results: Restore Radar to 100% width
if (closeResultsBtn && radarRowContainer && scanResultsCard) {
    closeResultsBtn.addEventListener('click', () => {
        radarRowContainer.classList.remove('split-active');
        scanResultsCard.classList.add('hidden-card');
    });
}