import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export const fetchStockData = async (ticker, minutes) => {
  const res = await axios.get(`${API_BASE}/stocks/${ticker}?minutes=${minutes}&aggregation=average`);
  console.log("stock result : " , res);
  
  return res.data;
};

export const fetchCorrelation = async (ticker1, ticker2, minutes) => {
  const res = await axios.get(`${API_BASE}/stockcorrelation?minutes=${minutes}&ticker=${ticker1}&ticker=${ticker2}`);
  return res.data;
};

export const fetchAllStocks = async () => {
  const res = await axios.get(`${API_BASE}/stocks`);
  return res.data;
};

// Calculate standard deviation from price history
export const calculateStdDev = (priceHistory) => {
  if (!priceHistory || priceHistory.length === 0) return 0;
  
  const prices = priceHistory.map(p => p.price);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
  
  return Math.sqrt(variance);
};