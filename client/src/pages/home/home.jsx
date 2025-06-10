import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Container,
  Fade,
  Grow,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Timeline, 
  Analytics, 
  Inventory, 
  TrendingUp,
  Schedule,
  Assessment,
  PlayArrow,
  KeyboardArrowDown,
  AutoAwesome
} from '@mui/icons-material';
import './home.css';

const Home = () => {
  const [loaded, setLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setLoaded(true);
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Timeline />,
      title: 'การจัดการแผนผลิต',
      description: 'วางแผนและติดตามการผลิตแบบเรียลไทม์ด้วยระบบที่ทันสมัย',
      color: '#004D8A',
      link: '/plantime'
    },
    {
      icon: <Analytics />,
      title: 'วิเคราะห์ข้อมูล',
      description: 'รายงานและสถิติการผลิตที่แม่นยำพร้อมกราฟแสดงผล',
      color: '#FFCD00',
      link: '/compare'
    },
    {
      icon: <Inventory />,
      title: 'จัดการสินค้า',
      description: 'ติดตามสินค้าและสีต่างๆ ในระบบอย่างมีประสิทธิภาพ',
      color: '#004D8A',
      link: '/product'
    },
    {
      icon: <Schedule />,
      title: 'ตารางเวลา',
      description: 'กำหนดเวลาเริ่มต้นและสิ้นสุดการผลิตอย่างแม่นยำ',
      color: '#FFCD00',
      link: '/plantime-list'
    }
  ];

  const stats = [
    { 
      label: 'โปรดักส์ทั้งหมด', 
      value: '150+', 
      icon: <Inventory />,
      description: 'ชนิดผลิตภัณฑ์ในระบบ'
    },
    { 
      label: 'แผนผลิตสำเร็จ', 
      value: '98%', 
      icon: <TrendingUp />,
      description: 'อัตราความสำเร็จ'
    },
    { 
      label: 'เวลาเฉลี่ย', 
      value: '4.6 ชม.', 
      icon: <Schedule />,
      description: 'เวลาผลิตเฉลี่ย'
    },
    { 
      label: 'ประสิทธิภาพ', 
      value: '95%', 
      icon: <Assessment />,
      description: 'ประสิทธิภาพการผลิต'
    }
  ];

  const scrollToFeatures = () => {
    document.querySelector('.home-features-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box className="home-page-container">
      {/* Hero Section */}
      <Box className="home-hero-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={1000}>
            <Box className="home-hero-content">
              <Chip 
                label="INOAC Production System v2.0" 
                className="home-hero-chip"
                icon={<AutoAwesome />}
              />
              <Typography variant="h1" component="h1" className="home-hero-title">
                PE-BLOCK DEPARTMENT
              </Typography>
              <Typography variant="h4" className="home-hero-subtitle">
                ระบบจัดการการผลิตที่ทันสมัยและมีประสิทธิภาพ
              </Typography>
              <Typography variant="h6" className="home-hero-description">
                จัดการแผนการผลิต ติดตามข้อมูล และวิเคราะห์ผลผลิตแบบเรียลไทม์
                <br />
                เพื่อประสิทธิภาพสูงสุดในการผลิต PE Block
              </Typography>

              {/* Digital Clock */}
              <Box className="home-digital-clock-container">
                <Typography variant="h5" className="home-current-time">
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="body1" className="home-current-date">
                  {formatDate(currentTime)}
                </Typography>
              </Box>

              <Box className="home-hero-buttons">
                <Button 
                  variant="contained" 
                  size="large" 
                  className="home-primary-button"
                  startIcon={<PlayArrow />}
                  onClick={() => window.location.href = '/plantime'}
                >
                  เริ่มสร้างแผนการผลิต
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  className="home-secondary-button"
                  startIcon={<Analytics />}
                  onClick={() => window.location.href = '/plantime-list'}
                >
                  ดูรายการแผนผลิต
                </Button>
              </Box>

              <IconButton 
                className="home-scroll-down-btn"
                onClick={scrollToFeatures}
              >
                <KeyboardArrowDown />
              </IconButton>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box className="home-stats-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={1500}>
            <Typography variant="h4" className="home-stats-title">
              สถิติการผลิต
            </Typography>
          </Fade>
          
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Grow in={loaded} timeout={1000 + (index * 200)}>
                  <Card className="home-stat-card">
                    <CardContent className="home-stat-content">
                      <Box className="home-stat-icon">
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" className="home-stat-value">
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" className="home-stat-label">
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" className="home-stat-description">
                        {stat.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className="home-features-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={2000}>
            <Box>
              <Typography variant="h3" className="home-section-title">
                ฟีเจอร์หลัก
              </Typography>
              <Typography variant="h6" className="home-section-subtitle">
                เครื่องมือที่จำเป็นสำหรับการจัดการการผลิตที่มีประสิทธิภาพสูงสุด
              </Typography>
            </Box>
          </Fade>
          
          <Grid container spacing={4} className="home-features-grid">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Grow in={loaded} timeout={2000 + (index * 200)}>
                  <Card 
                    className="home-feature-card"
                    onClick={() => window.location.href = feature.link}
                  >
                    <CardContent className="home-feature-content">
                      <Box 
                        className="home-feature-icon" 
                        style={{ backgroundColor: feature.color }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" className="home-feature-title">
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" className="home-feature-description">
                        {feature.description}
                      </Typography>
                      <Button 
                        className="home-feature-button"
                        size="small"
                        startIcon={<PlayArrow />}
                      >
                        เริ่มใช้งาน
                      </Button>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Quick Actions Section */}
      <Box className="home-quick-actions-section">
        <Container maxWidth="lg">
          <Typography variant="h4" className="home-section-title-footer">
            การดำเนินการด่วน
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card className="home-action-card home-action-production">
                <CardContent>
                  <Typography variant="h6">บันทึกข้อมูลการผลิต</Typography>
                  <Typography variant="body2">
                    บันทึกข้อมูลการผลิต Foaming และ Slice
                  </Typography>
                  <Button 
                    className="home-action-button"
                    onClick={() => window.location.href = '/production-foam'}
                  >
                    เริ่มบันทึก
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card className="home-action-card home-action-product">
                <CardContent>
                  <Typography variant="h6">จัดการผลิตภัณฑ์</Typography>
                  <Typography variant="body2">
                    เพิ่มผลิตภัณฑ์ใหม่และจัดการข้อมูลสินค้า
                  </Typography>
                  <Button 
                    className="home-action-button"
                    onClick={() => window.location.href = '/product'}
                  >
                    จัดการสินค้า
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card className="home-action-card home-action-report">
                <CardContent>
                  <Typography variant="h6">รายงานสถานะ</Typography>
                  <Typography variant="body2">
                    ดูรายงานและเปรียบเทียบข้อมูลการผลิต
                  </Typography>
                  <Button 
                    className="home-action-button"
                    onClick={() => window.location.href = '/compare'}
                  >
                    ดูรายงาน
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box className="home-page-footer">
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" className="home-footer-title">
                PE Block Department
              </Typography>
              <Typography variant="body2" className="home-footer-text">
                ระบบจัดการการผลิตที่ทันสมัยสำหรับแผนก PE Block
                <br />
                INOAC Industries (Thailand) Co., Ltd.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="home-footer-copyright">
                &copy; 2025 PE Block Department, Inoac Industries (Thailand) Co., Ltd.
                <br />
                สงวนลิขสิทธิ์ทุกประการ
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
