import React, { useState, useEffect } from 'react';
import { fetchStockData, fetchAllStocks } from '../api';
import {
  TextField,
  Button,
  Typography,
  Container,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const StockPage = () => {
  const [ticker, setTicker] = useState('NVDA');
  const [minutes, setMinutes] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockOptions, setStockOptions] = useState({});
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [error, setError] = useState(null);

  // Fallback stock options in case API fails
  const fallbackStocks = {
    'NVDA': 'NVDA',
    'AAPL': 'AAPL',
    'MSFT': 'MSFT',
    'GOOGL': 'GOOGL',
    'PYPL': 'PYPL'
  };

  useEffect(() => {
    const loadStockOptions = async () => {
      try {
        console.log("Fetching stock options...");
        const result = await fetchAllStocks();
        console.log("Stock options result:", result);
        
        if (result && result.stocks) {
          setStockOptions(result.stocks);
        } else {
          console.warn("API returned unexpected format, using fallback stocks");
          setStockOptions(fallbackStocks);
          setError("Could not load stock options from API, using default values");
        }
      } catch (error) {
        console.error("Failed to load stock options:", error);
        setStockOptions(fallbackStocks);
        setError("Failed to load stock options: " + (error.message || "Unknown error"));
      } finally {
        setLoadingStocks(false);
      }
    };

    loadStockOptions();
  }, []);

  const handleFetch = async () => {
    if (!ticker) {
      setError("Please select a ticker");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchStockData(ticker, minutes);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
      setError("Failed to fetch stock data: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5">Stock Chart Viewer</Typography>
      
      {error && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="ticker-select-label">Ticker</InputLabel>
          <Select
            labelId="ticker-select-label"
            id="ticker-select"
            value={ticker}
            label="Ticker"
            onChange={(e) => setTicker(e.target.value)}
            disabled={loadingStocks}
          >
            {loadingStocks ? (
              <MenuItem value="">
                <em>Loading...</em>
              </MenuItem>
            ) : (
              Object.entries(stockOptions).map(([name, symbol]) => (
                <MenuItem key={symbol} value={symbol}>
                  {symbol}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        <TextField 
          label="Minutes" 
          type="number" 
          value={minutes} 
          onChange={e => setMinutes(e.target.value)} 
          sx={{ width: 120 }}
        />
        <Button 
          variant="contained" 
          onClick={handleFetch} 
          disabled={loadingStocks || loading}
        >
          {loading ? 'Loading...' : 'Fetch'}
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ mt: 4 }} />}

      {data && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Average Price: ₹{data.averageStockPrice.toFixed(2)}</Typography>
          <Line
            data={{
              labels: data.priceHistory.map(p => new Date(p.lastUpdatedAt).toLocaleTimeString()),
              datasets: [
                {
                  label: 'Price',
                  data: data.priceHistory.map(p => p.price),
                  fill: false,
                  borderColor: 'blue',
                },
                {
                  label: 'Average',
                  data: Array(data.priceHistory.length).fill(data.averageStockPrice),
                  borderDash: [5, 5],
                  borderColor: 'green',
                  fill: false,
                }
              ]
            }}
          />
        </Box>
      )}
    </Container>
  );
};

export default StockPage;