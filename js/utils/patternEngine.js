/**
 * 3-Week Pattern & Support/Resistance Calculation Engine
 */

/**
 * Analyzes a coin's 3-week candle history to locate range position and generate recommendations
 * @param {Array} klines - Array of 21 daily candle objects
 * @returns {Object} Analysis results including range %, support, resistance, and recommendation
 */
export function analyze3WeekPattern(klines) {
    if (!klines || klines.length === 0) return null;

    const currentPrice = klines[klines.length - 1].close;

    // Find 3-week Highest High and Lowest Low
    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    klines.forEach(candle => {
        if (candle.high > highestHigh) highestHigh = candle.high;
        if (candle.low < lowestLow) lowestLow = candle.low;
    });

    // Prevent division by zero if flat
    const rangeSpan = highestHigh - lowestLow;
    if (rangeSpan === 0) {
        return { rangePercent: 50, recommendation: 'NEUTRAL', currentPrice, highestHigh, lowestLow };
    }

    // Calculate percentage location in the 3-week range (0% = at support, 100% = at resistance)
    const rangePercent = Math.round(((currentPrice - lowestLow) / rangeSpan) * 100);

    // Recommendation logic
    let recommendation = 'NEUTRAL';
    if (rangePercent <= 20) {
        recommendation = 'BUY RECOM.';
    } else if (rangePercent >= 80) {
        recommendation = 'SELL RECOM.';
    }

    return {
        currentPrice,
        highestHigh,
        lowestLow,
        rangePercent,
        recommendation
    };
}