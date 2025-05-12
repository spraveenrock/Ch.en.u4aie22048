import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StockPage from './pages/StockPage';
import HeatmapPage from './pages/HeatmapPage';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const App = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Stock Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/stocks">Stock Chart</Button>
          <Button color="inherit" component={Link} to="/heatmap">Correlation Heatmap</Button>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/stocks" element={<StockPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
      </Routes>
    </Router>
  );
};

export default App;