import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Slider,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import * as d3 from 'd3-scale-chromatic';
import { fetchCorrelation, fetchStockData, calculateStdDev, fetchAllStocks } from '../api';

const HeatmapPage = () => {
  const [stocks, setStocks] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minutes, setMinutes] = useState(60);
  const [hoveredStock, setHoveredStock] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  // Function to get color based on correlation value
  const getCorrelationColor = (value) => {
    if (value === null) return '#f5f5f5'; // Light gray for null values
    const norm = (value + 1) / 2; // Normalize -1 to 1 → 0 to 1
    return d3.interpolateRdYlGn(norm); // Red-Yellow-Green
  };

  // Load available stocks
  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      try {
        const result = await fetchAllStocks();
        if (result && result.stocks) {
          // Get just the ticker symbols and limit to 10
          const stockSymbols = Object.values(result.stocks).slice(0, 15);
          setStocks(stockSymbols);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Failed to load stocks:", err);
        setError("Failed to load available stocks: " + (err.message || "Unknown error"));
        
        // Fallback to some default stocks if API fails
        const fallbackStocks = ['NVDA', 'PYPL', 'AAPL', 'GOOGL', 'MSFT'];
        setStocks(fallbackStocks);
      }
    };

    loadStocks();
  }, []);

  // Fetch correlations and stock data when stocks or minutes change
  useEffect(() => {
    if (stocks.length === 0) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stock data for statistics
        const stockDataPromises = stocks.map(ticker => 
          fetchStockData(ticker, minutes)
            .then(data => [ticker, data])
            .catch(err => {
              console.error(`Error fetching data for ${ticker}:`, err);
              return [ticker, null];
            })
        );
        
        const stockDataResults = await Promise.all(stockDataPromises);
        const stockDataMap = Object.fromEntries(stockDataResults);
        setStockData(stockDataMap);
        
        // Fetch correlation matrix
        const matrix = [];
        for (let i = 0; i < stocks.length; i++) {
          const row = [];
          for (let j = 0; j < stocks.length; j++) {
            if (i === j) {
              row.push(1.0); // Perfect correlation with self
            } else {
              try {
                const data = await fetchCorrelation(stocks[i], stocks[j], minutes);
                row.push(parseFloat(data.correlation.toFixed(2)));
              } catch (err) {
                console.error(`Error fetching correlation for ${stocks[i]}-${stocks[j]}:`, err);
                row.push(null); // API error fallback
              }
            }
          }
          matrix.push(row);
        }
        
        setCorrelations(matrix);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to fetch correlation data: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [stocks, minutes]);

  // Get statistics for a stock
  const getStockStats = (ticker) => {
    const data = stockData[ticker];
    if (!data) return { avg: 'N/A', stdDev: 'N/A' };
    
    const stdDev = calculateStdDev(data.priceHistory);
    
    return {
      avg: data.averageStockPrice.toFixed(2),
      stdDev: stdDev.toFixed(2)
    };
  };

  // Handle stock hover
  const handleStockHover = (ticker) => {
    setHoveredStock(ticker);
  };

  // Handle stock selection
  const handleStockSelect = (ticker) => {
    setSelectedStock(ticker === selectedStock ? null : ticker);
  };

  // Get the stock to display stats for (selected or hovered)
  const activeStock = selectedStock || hoveredStock;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Stock Correlation Heatmap
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3 }}>
            <Typography id="minutes-slider" gutterBottom>
              Time Period: {minutes} minutes
            </Typography>
            <Slider
              value={minutes}
              onChange={(_, newValue) => setMinutes(newValue)}
              aria-labelledby="minutes-slider"
              valueLabelDisplay="auto"
              step={10}
              marks
              min={10}
              max={120}
              disabled={loading}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    {stocks.map((stock, i) => (
                      <TableCell 
                        key={i} 
                        align="center"
                        sx={{ 
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          bgcolor: stock === activeStock ? 'primary.light' : 'inherit',
                          color: stock === activeStock ? 'white' : 'inherit'
                        }}
                        onMouseEnter={() => handleStockHover(stock)}
                        onMouseLeave={() => setHoveredStock(null)}
                        onClick={() => handleStockSelect(stock)}
                      >
                        {stock}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((stock, i) => (
                    <TableRow key={i}>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          bgcolor: stock === activeStock ? 'primary.light' : 'inherit',
                          color: stock === activeStock ? 'white' : 'inherit'
                        }}
                        onMouseEnter={() => handleStockHover(stock)}
                        onMouseLeave={() => setHoveredStock(null)}
                        onClick={() => handleStockSelect(stock)}
                      >
                        {stock}
                      </TableCell>
                      {correlations[i]?.map((value, j) => (
                        <Tooltip 
                          title={
                            <React.Fragment>
                              <Typography variant="body2">
                                {stocks[i]} - {stocks[j]}
                              </Typography>
                              <Typography variant="body2">
                                Correlation: {value === null ? 'N/A' : value}
                              </Typography>
                            </React.Fragment>
                          } 
                          key={j}
                        >
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: getCorrelationColor(value),
                              color: value !== null && Math.abs(value) > 0.8 ? 'white' : 'black',
                              minWidth: '60px',
                              height: '60px'
                            }}
                          >
                            {value === null ? 'N/A' : value}
                          </TableCell>
                        </Tooltip>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={3}>
          {/* Color Legend */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Correlation Legend
              </Typography>
              <Box sx={{ display: 'flex', height: '20px', mb: 1 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      flex: 1, 
                      height: '100%', 
                      bgcolor: getCorrelationColor(-1 + (i / 10))
                    }} 
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Strong Negative (-1)</Typography>
                <Typography variant="caption">No Correlation (0)</Typography>
                <Typography variant="caption">Strong Positive (1)</Typography>
              </Box>
            </CardContent>
          </Card>
          
          {/* Stock Statistics */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Statistics
              </Typography>
              
              {activeStock ? (
                <>
                  <Typography variant="subtitle1">
                    {activeStock}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Average Price: ₹{getStockStats(activeStock).avg}
                  </Typography>
                  <Typography variant="body2">
                    Standard Deviation: ₹{getStockStats(activeStock).stdDev}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last {minutes} minutes
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Hover over or click on a stock symbol to view statistics
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HeatmapPage;
