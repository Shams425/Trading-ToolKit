/**
 * Binance Public API Service
 * Endpoint Base: https://api.binance.com
 */

const BASE_URL = 'https://api.binance.com/api/v3';

// List of stablecoins to exclude from technical scans & volume rankings
const STABLECOINS = ['USDC', 'FDUSD', 'TUSD', 'BUSD', 'DAI', 'USDE', 'PYUSD', 'USD1', 'AEUR', 'EUR'];

/**
 * Fetch 24-hour ticker data for all trading pairs (with Smart Filtering)
 */
export async function fetch24hrTickers() {
    try {
        const response = await fetch(`${BASE_URL}/ticker/24hr`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        return data.filter(item => {
            const symbol = item.symbol;
            const quoteVol = parseFloat(item.quoteVolume);

            // Basic validity: Must be USDT spot pair
            if (!symbol.endsWith('USDT')) return false;

            // Exclude Stablecoin base assets (USDC, USD1, etc.)
            const baseAsset = symbol.replace('USDT', '');
            if (STABLECOINS.includes(baseAsset)) return false;

            // Exclude leveraged tokens (UP, DOWN, BEAR, BULL)
            if (symbol.includes('UP') || symbol.includes('DOWN') || symbol.includes('BEAR') || symbol.includes('BULL')) return false;

            // Filter out dead/low liquidity pairs (Minimum $50,000 24h volume)
            if (isNaN(quoteVol) || quoteVol < 50000) return false;

            return true;
        });
    } catch (error) {
        console.error('Failed to fetch 24hr tickers:', error);
        return [];
    }
}

/**
 * Fetch daily Kline/Candlestick data for a specific symbol
 * @param {string} symbol - e.g., 'BTCUSDT'
 * @param {number} limit - Number of daily candles (default 21 for 3 weeks)
 */
export async function fetchDailyKlines(symbol, limit = 21) {
    try {
        const response = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=1d&limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const rawData = await response.json();

        // Map raw arrays to clean OHLC objects
        return rawData.map(c => ({
            openTime: c[0],
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5])
        }));
    } catch (error) {
        console.error(`Failed to fetch klines for ${symbol}:`, error);
        return [];
    }
}