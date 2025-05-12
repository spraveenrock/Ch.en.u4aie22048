/**
 * Calculate the average price from stock price history
 * @param {Array<{price: number, lastUpdatedAt: string}>} data - Array of stock price data points
 * @param {Object} [options] - Optional configuration options
 * @param {number} [options.minutes] - Optional time window in minutes to consider
 * @param {string} [options.aggregation] - Aggregation method ('average', 'weighted', 'median')
 * @returns {number} - The calculated average price or 0 if no valid data
 */
function calculateAverage(data, options = {}) {
  // Basic input validation
  if (!Array.isArray(data) || data.length === 0) return 0;
  
  // Filter by time if minutes parameter is provided
  let filteredData = data;
  if (options.minutes) {
    const cutoffTime = new Date(Date.now() - options.minutes * 60 * 1000);
    filteredData = data.filter(item => 
      item && item.lastUpdatedAt && new Date(item.lastUpdatedAt) >= cutoffTime
    );
    
    // Return 0 if no data points in the specified time window
    if (filteredData.length === 0) return 0;
  }
  
  // Filter out invalid data points
  const validData = filteredData.filter(
    item => item && typeof item.price === 'number' && !isNaN(item.price)
  );
  
  if (validData.length === 0) return 0;
  
  // Choose aggregation method based on options
  const aggregation = options.aggregation || 'average';
  
  switch (aggregation.toLowerCase()) {
    case 'median': {
      // Sort prices and find the middle value
      const sortedPrices = validData.map(item => item.price).sort((a, b) => a - b);
      const mid = Math.floor(sortedPrices.length / 2);
      
      // If even number of elements, average the two middle values
      if (sortedPrices.length % 2 === 0) {
        return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
      }
      
      // If odd number of elements, return the middle value
      return sortedPrices[mid];
    }
    
    case 'weighted': {
      // Calculate time-weighted average (newer prices have more weight)
      const now = new Date();
      let totalWeight = 0;
      let weightedSum = 0;
      
      validData.forEach(item => {
        // Calculate weight based on recency (more recent = higher weight)
        const timestamp = new Date(item.lastUpdatedAt);
        const ageInMinutes = (now - timestamp) / (60 * 1000);
        const weight = Math.max(1, options.minutes ? (options.minutes - ageInMinutes) : 1);
        
        weightedSum += item.price * weight;
        totalWeight += weight;
      });
      
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    case 'average':
    default: {
      // Simple arithmetic mean
      const sum = validData.reduce((total, item) => total + item.price, 0);
      return sum / validData.length;
    }
  }
}

/**
 * Calculate the standard deviation of stock prices
 * @param {Array<{price: number}>} data - Array of stock price data points
 * @returns {number} - The standard deviation or 0 if insufficient data
 */
function calculateStandardDeviation(data) {
  if (!Array.isArray(data) || data.length <= 1) return 0;
  
  const validData = data.filter(
    item => item && typeof item.price === 'number' && !isNaN(item.price)
  );
  
  if (validData.length <= 1) return 0;
  
  const avg = calculateAverage(validData);
  const squaredDiffs = validData.map(item => Math.pow(item.price - avg, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (validData.length - 1);
  
  return Math.sqrt(variance);
}

module.exports = { 
  calculateAverage,
  calculateStandardDeviation
};