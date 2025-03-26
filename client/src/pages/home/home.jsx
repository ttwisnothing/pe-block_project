import React from 'react';
import { Box, Typography, Button } from '@mui/material'; // ใช้ Material-UI
import './home.css'; // Import CSS file

const Home = () => {
  return (
    <Box className="home-container">
      {/* Header Section */}
      <Box className="home-header">
        <Typography variant="h4" component="h1">
          Welcome to the Home Page
        </Typography>
      </Box>

      {/* Main Content Section */}
      <Box className="home-main">
        <Typography variant="body1" className="home-text">
          This is the home page of your application. You can customize this section to display
          any content you want.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          className="home-button"
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </Button>
      </Box>

      {/* Footer Section */}
      <Box className="home-footer">
        <Typography variant="body2" component="p">
          &copy; 2025 Your Company. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
