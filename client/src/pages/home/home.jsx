import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Container } from '@mui/material';
import { 
  Timeline, 
  Analytics, 
  Inventory, 
  TrendingUp,
  Schedule,
  Assessment
} from '@mui/icons-material';
import './home.css';

const Home = () => {
  const features = [
    {
      icon: <Timeline />,
      title: 'การจัดการแผนผลิต',
      description: 'วางแผนและติดตามการผลิตแบบเรียลไทม์',
      color: '#667eea'
    },
    {
      icon: <Analytics />,
      title: 'วิเคราะห์ข้อมูล',
      description: 'รายงานและสถิติการผลิตที่แม่นยำ',
      color: '#764ba2'
    },
    {
      icon: <Inventory />,
      title: 'จัดการสินค้า',
      description: 'ติดตามสินค้าและสีต่างๆ ในระบบ',
      color: '#f093fb'
    },
    {
      icon: <Schedule />,
      title: 'ตารางเวลา',
      description: 'กำหนดเวลาเริ่มต้นและสิ้นสุดการผลิต',
      color: '#f5576c'
    }
  ];

  const stats = [
    { label: 'โปรดักส์ทั้งหมด', value: '150+', icon: <Inventory /> },
    { label: 'แผนผลิตสำเร็จ', value: '98%', icon: <TrendingUp /> },
    { label: 'เวลาเฉลี่ย', value: '2.5 ชม.', icon: <Schedule /> },
    { label: 'ประสิทธิภาพ', value: '95%', icon: <Assessment /> }
  ];

  return (
    <Box className="home-container">
      {/* Hero Section */}
      <Box className="hero-section">
        <Container maxWidth="lg">
          <Box className="hero-content">
            <Typography variant="h2" component="h1" className="hero-title">
              ระบบจัดการ PE Block
            </Typography>
            <Typography variant="h5" className="hero-subtitle">
              จัดการการผลิตและแผนเวลาอย่างมีประสิทธิภาพ
            </Typography>
            <Typography variant="body1" className="hero-description">
              ระบบที่ช่วยให้คุณสามารถวางแผนการผลิต ติดตามความคืบหน้า 
              และจัดการสินค้าได้อย่างง่ายดายและแม่นยำ
            </Typography>
            <Box className="hero-buttons">
              <Button 
                variant="contained" 
                size="large" 
                className="primary-button"
                onClick={() => window.location.href = '/listplan'}
              >
                เริ่มใช้งาน
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                className="secondary-button"
              >
                เรียนรู้เพิ่มเติม
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box className="stats-section">
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <Box className="stat-icon">
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" className="stat-value">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" className="stat-label">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className="features-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title">
            ฟีเจอร์หลัก
          </Typography>
          <Typography variant="body1" className="section-subtitle">
            เครื่องมือที่จำเป็นสำหรับการจัดการการผลิตที่มีประสิทธิภาพ
          </Typography>
          
          <Grid container spacing={4} className="features-grid">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card className="feature-card">
                  <CardContent className="feature-content">
                    <Box 
                      className="feature-icon" 
                      style={{ backgroundColor: feature.color }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" className="feature-title">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" className="feature-description">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="cta-section">
        <Container maxWidth="md">
          <Typography variant="h4" className="cta-title">
            พร้อมเริ่มต้นแล้วหรือยัง?
          </Typography>
          <Typography variant="body1" className="cta-description">
            เริ่มใช้ระบบจัดการ PE Block วันนี้ และเพิ่มประสิทธิภาพการผลิตของคุณ
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            className="cta-button"
            onClick={() => window.location.href = '/listplan'}
          >
            เริ่มใช้งานทันที
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box className="home-footer">
        <Container maxWidth="lg">
          <Typography variant="body2">
            &copy; 2025 PE Block Management System. สงวนลิขสิทธิ์.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
