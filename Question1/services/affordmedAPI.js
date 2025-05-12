const axios = require('axios');
require('dotenv').config();

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;

  const res = await axios.post('http://20.244.56.144/evaluation-service/auth', {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  accessToken = res.data.access_token;
  return accessToken;
}

async function getStockPrices(ticker, minutes) {
  const token = await getAccessToken();

  const url = `http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

async function getAllStocks() {
  const token = await getAccessToken();

  const url = 'http://20.244.56.144/evaluation-service/stocks';

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

module.exports = { getStockPrices, getAllStocks };