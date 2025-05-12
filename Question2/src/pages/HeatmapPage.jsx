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
  Divider,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import * as d3 from 'd3-scale-chromatic';
import { fetchCorrelation, fetchStockData, calculateStdDev, fetchAllStocks } from '../api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EqualizerIcon from '@mui/icons-material/Equalizer';

const HeatmapPage = () => {
  const theme = useTheme();
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
    if (value === null) return theme.palette.grey[100];
    
    // Custom color scale for better visual distinction
    if (value >= 0.8) return '#1b5e20'; // Strong positive - dark green
    if (value >= 0.5) return '#4caf50'; // Moderate positive - medium green
    if (value >= 0.2) return '#a5d6a7'; // Weak positive - light green
    if (value >= -0.2) return '#f5f5f5'; // No correlation - white/light gray
    if (value >= -0.5) return '#ffcdd2'; // Weak negative - light red
    if (value >= -0.8) return '#ef5350'; // Moderate negative - medium red
    return '#b71c1c'; // Strong negative - dark red
  };

  // Get correlation description
  const getCorrelationDescription = (value) => {
    if (value === null) return 'Unknown';
    const absValue = Math.abs(value);
    
    if (absValue >= 0.8) return value > 0 ? 'Strong Positive' : 'Strong Negative';
    if (absValue >= 0.5) return value > 0 ? 'Moderate Positive' : 'Moderate Negative';
    if (absValue >= 0.2) return value > 0 ? 'Weak Positive' : 'Weak Negative';
    return 'No Correlation';
  };

  // Load available stocks
  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      try {
        const result = await fetchAllStocks();
        if (result && result.stocks) {
          // Get just the ticker symbols and limit to 10
          const stockSymbols = Object.values(result.stocks).slice(0, 10);
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
    if (!data) return { avg: 'N/A', stdDev: 'N/A', priceChange: 'N/A', isPositive: true };
    
    const stdDev = calculateStdDev(data.priceHistory);
    
    // Calculate price change
    let priceChange = 'N/A';
    let percentChange = 'N/A';
    let isPositive = true;
    
    if (data.priceHistory && data.priceHistory.length >= 2) {
      const firstPrice = data.priceHistory[0].price;
      const lastPrice = data.priceHistory[data.priceHistory.length - 1].price;
      const change = lastPrice - firstPrice;
      priceChange = change.toFixed(2);
      percentChange = ((change / firstPrice) * 100).toFixed(2);
      isPositive = change >= 0;
    }
    
    return {
      avg: data.averageStockPrice.toFixed(2),
      stdDev: stdDev.toFixed(2),
      priceChange,
      percentChange,
      isPositive
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
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            gap: 1
          }}>
            <EqualizerIcon color="secondary" fontSize="large" />
            <Typography variant="h4" component="h1">
              Stock Correlation Heatmap
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                boxShadow: theme.shadows[1]
              }}
            >
              {error}
            </Alert>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Card elevation={0} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Period
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={minutes}
                  onChange={(_, newValue) => setMinutes(newValue)}
                  aria-labelledby="minutes-slider"
                  valueLabelDisplay="auto"
                  step={10}
                  marks={[
                    { value: 10, label: '10m' },
                    { value: 30, label: '30m' },
                    { value: 60, label: '1h' },
                    { value: 90, label: '1.5h' },
                    { value: 120, label: '2h' }
                  ]}
                  min={10}
                  max={120}
                  disabled={loading}
                  sx={{
                    '& .MuiSlider-thumb': {
                      height: 24,
                      width: 24,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.primary.main, 0.16)}`
                      }
                    }
                  }}
                />
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center"
                sx={{ mt: 1 }}
              >
                Analyzing stock correlations over the last {minutes} minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 8,
              backgroundColor: 'background.paper',
              borderRadius: 2
            }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" color="text.secondary">
                Loading Correlation Data...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This may take a moment
              </Typography>
            </Box>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                overflow: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.background.paper,
                        zIndex: 3,
                        minWidth: '100px'
                      }}
                    />
                    {stocks.map((stock, i) => (
                      <TableCell 
                        key={i} 
                        align="center"
                        sx={{ 
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          bgcolor: stock === activeStock 
                            ? theme.palette.primary.main 
                            : theme.palette.background.paper,
                          color: stock === activeStock ? 'white' : 'inherit',
                          zIndex: 2,
                          minWidth: '80px',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: stock === activeStock 
                              ? theme.palette.primary.main 
                              : theme.palette.action.hover
                          }
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
                          bgcolor: stock === activeStock 
                            ? theme.palette.primary.main 
                            : theme.palette.background.paper,
                          color: stock === activeStock ? 'white' : 'inherit',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: stock === activeStock 
                              ? theme.palette.primary.main 
                              : theme.palette.action.hover
                          }
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
                            <Box sx={{ p: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {stocks[i]} ↔ {stocks[j]}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                Correlation: {value === null ? 'N/A' : value}
                              </Typography>
                              <Chip 
                                size="small"
                                label={getCorrelationDescription(value)}
                                color={
                                  value === null ? "default" :
                                  value >= 0.5 ? "success" :
                                  value <= -0.5 ? "error" :
                                  "default"
                                }
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          } 
                          key={j}
                          arrow
                          placement="top"
                        >
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: getCorrelationColor(value),
                              color: value !== null && Math.abs(value) > 0.5 ? 'white' : 'black',
                              minWidth: '60px',
                              height: '60px',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                              }
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
          <Card 
            elevation={0} 
            sx={{ 
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoOutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
                Correlation Legend
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                height: '24px', 
                mb: 1,
                mt: 2,
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      flex: 1, 
                      height: '100%', 
                      bgcolor: getCorrelationColor(-1 + (i * 0.33))
                    }} 
                  />
                ))}
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>Strong Negative</Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>Strong Positive</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                What do these colors mean?
              </Typography>
              
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: getCorrelationColor(0.9),
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  <Typography variant="body2">
                    <strong>Strong positive:</strong> Stocks move together
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: getCorrelationColor(0),
                    borderRadius: '50%',
                    mr: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }} />
                  <Typography variant="body2">
                    <strong>No correlation:</strong> Independent movement
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: getCorrelationColor(-0.9),
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  <Typography variant="body2">
                    <strong>Strong negative:</strong> Opposite movement
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Stock Statistics */}
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, fontSize: 20 }} />
                Stock Statistics
              </Typography>
              
              {activeStock ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 2
                  }}>
                    <Chip 
                      label={activeStock} 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                    {getStockStats(activeStock).percentChange !== 'N/A' && (
                      <Chip
                        icon={getStockStats(activeStock).isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={`${getStockStats(activeStock).isPositive ? '+' : ''}${getStockStats(activeStock).percentChange}%`}
                        color={getStockStats(activeStock).isPositive ? "success" : "error"}
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    p: 1.5,
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Average Price:</Typography>
                      <Typography variant="subtitle2" color="primary.main">
                        ₹{getStockStats(activeStock).avg}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Standard Deviation:</Typography>
                      <Typography variant="subtitle2">
                        ₹{getStockStats(activeStock).stdDev}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Price Change:</Typography>
                    <Typography 
                      variant="subtitle2" 
                      color={getStockStats(activeStock).isPositive ? "success.main" : "error.main"}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {getStockStats(activeStock).isPositive ? 
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                      }
                      ₹{getStockStats(activeStock).priceChange}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      textAlign: 'center',
                      mt: 2
                    }}
                  >
                    Data from the last {minutes} minutes
                  </Typography>
                </>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  mt: 2
                }}>
                  <InfoOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Hover over or click on a stock symbol to view detailed statistics
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeatmapPage;
