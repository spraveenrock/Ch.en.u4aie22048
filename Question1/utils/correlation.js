/**
 * Calculate the mean (average) of an array of numbers
 * @param {number[]} arr - Array of numeric values
 * @returns {number} - The mean value or 0 for empty arrays
 */
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate the standard deviation of an array of numbers
 * @param {number[]} arr - Array of numeric values
 * @param {number} avg - The mean value of the array
 * @returns {number} - The standard deviation or 0 for arrays with fewer than 2 elements
 */
function standardDeviation(arr, avg) {
  if (!arr || arr.length <= 1) return 0;
  return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (arr.length - 1));
}

/**
 * Calculate the Pearson correlation coefficient between two datasets
 * @param {Array<{price: number, lastUpdatedAt: string}>} dataX - First stock price history
 * @param {Array<{price: number, lastUpdatedAt: string}>} dataY - Second stock price history
 * @returns {Object} - Object containing correlation coefficient and average prices
 */
function calculateCorrelation(dataX, dataY) {
  // Input validation
  if (!Array.isArray(dataX) || !Array.isArray(dataY) || dataX.length === 0 || dataY.length === 0) {
    return { correlation: 0, avgX: 0, avgY: 0 };
  }

  // Sort both datasets by timestamp to ensure proper time alignment
  const sortedX = [...dataX].sort((a, b) => 
    new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt)
  );
  
  const sortedY = [...dataY].sort((a, b) => 
    new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt)
  );

  // Take the minimum length of both datasets
  const len = Math.min(sortedX.length, sortedY.length);
  
  // Handle case where we have fewer than 2 data points
  if (len < 2) {
    return { 
      correlation: 0, 
      avgX: sortedX.length ? sortedX[0].price : 0, 
      avgY: sortedY.length ? sortedY[0].price : 0 
    };
  }

  // Extract price values
  const pricesX = sortedX.slice(0, len).map(p => p.price);
  const pricesY = sortedY.slice(0, len).map(p => p.price);

  // Calculate statistics
  const avgX = mean(pricesX);
  const avgY = mean(pricesY);
  const stdX = standardDeviation(pricesX, avgX);
  const stdY = standardDeviation(pricesY, avgY);

  // Handle case where standard deviation is zero (all prices identical)
  if (stdX === 0 || stdY === 0) {
    return { 
      correlation: stdX === stdY ? 1 : 0, // If both are constant, correlation is 1; otherwise 0
      avgX, 
      avgY 
    };
  }

  // Calculate covariance
  const covariance = pricesX.reduce((sum, x, i) => {
    return sum + (x - avgX) * (pricesY[i] - avgY);
  }, 0) / (len - 1);

  // Calculate correlation coefficient
  const correlation = covariance / (stdX * stdY);

  // Ensure correlation is within valid range [-1, 1]
  const boundedCorrelation = Math.max(-1, Math.min(1, correlation));

  return { 
    correlation: boundedCorrelation, 
    avgX, 
    avgY 
  };
}

module.exports = { calculateCorrelation };