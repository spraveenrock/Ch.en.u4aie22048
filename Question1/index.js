const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const affordmedAPI = require('./services/affordmedAPI');
const { calculateAverage } = require('./utils/average');
const { calculateCorrelation } = require('./utils/correlation');

app.get('/stocks', async (req, res) => {
  try {
    const data = await affordmedAPI.getAllStocks();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stocks/:ticker', async (req, res) => {
  console.log("stock request" , req.params)
  const { ticker } = req.params;
  const { minutes, aggregation } = req.query;

  try {
    const data = await affordmedAPI.getStockPrices(ticker, minutes);
    const average = calculateAverage(data);
    res.json({ averageStockPrice: average, priceHistory: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stockcorrelation', async (req, res) => {
  const { minutes, ticker: tickers } = req.query;
  console.log("stock correlation request", req.query)

  if (!Array.isArray(tickers) || tickers.length !== 2) {
    return res.status(400).json({ error: "Provide exactly two tickers" });
  }

  try {
    const [dataX, dataY] = await Promise.all([
      affordmedAPI.getStockPrices(tickers[0], minutes),
      affordmedAPI.getStockPrices(tickers[1], minutes),
    ]);

    const result = calculateCorrelation(dataX, dataY);

    res.json({
      correlation: result.correlation,
      stocks: {
        [tickers[0]]: {
          averagePrice: result.avgX,
          priceHistory: dataX,
        },
        [tickers[1]]: {
          averagePrice: result.avgY,
          priceHistory: dataY,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Backend listening on http://localhost:3001');
});