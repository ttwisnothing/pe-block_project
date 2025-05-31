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
  IconButton
} from '@mui/material';
import { 
  Timeline, 
  Analytics, 
  Inventory, 
  TrendingUp,
  Schedule,
  Assessment,
  PlayArrow,
  KeyboardArrowDown
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
      value: '2.5 ชม.', 
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
    document.querySelector('.features-section').scrollIntoView({ 
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
    <Box className="home-container">
      {/* Hero Section */}
      <Box className="hero-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={1000}>
            <Box className="hero-content">
              <Typography variant="h1" component="h1" className="hero-title">
                PE-BLOCK DEPARTMENT
              </Typography>
              <Typography variant="h4" className="hero-subtitle">
                ระบบจัดการการผลิตที่ทันสมัยและมีประสิทธิภาพ
              </Typography>
              <Typography variant="h6" className="hero-description">
                จัดการแผนการผลิต ติดตามข้อมูล และวิเคราะห์ผลผลิตแบบเรียลไทม์
                <br />
                เพื่อประสิทธิภาพสูงสุดในการผลิต PE Block
              </Typography>

              {/* Digital Clock */}
              <Box className="digital-clock-container">
                <Typography variant="h5" className="current-time">
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="body1" className="current-date">
                  {formatDate(currentTime)}
                </Typography>
              </Box>

              <Box className="hero-buttons">
                <Button 
                  variant="contained" 
                  size="large" 
                  className="primary-button"
                  startIcon={<PlayArrow />}
                  onClick={() => window.location.href = '/plantime'}
                >
                  เริ่มสร้างแผนการผลิต
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  className="secondary-button"
                  startIcon={<Analytics />}
                  onClick={() => window.location.href = '/plantime-list'}
                >
                  ดูรายการแผนผลิต
                </Button>
              </Box>

              <IconButton 
                className="scroll-down-btn"
                onClick={scrollToFeatures}
              >
                <KeyboardArrowDown />
              </IconButton>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box className="stats-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={1500}>
            <Typography variant="h4" className="stats-title">
              สถิติการผลิต
            </Typography>
          </Fade>
          
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Grow in={loaded} timeout={1000 + (index * 200)}>
                  <Card className="stat-card">
                    <CardContent className="stat-content">
                      <Box className="stat-icon">
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" className="stat-value">
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" className="stat-label">
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" className="stat-description">
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
      <Box className="features-section">
        <Container maxWidth="lg">
          <Fade in={loaded} timeout={2000}>
            <Box>
              <Typography variant="h3" className="section-title">
                ฟีเจอร์หลัก
              </Typography>
              <Typography variant="h6" className="section-subtitle">
                เครื่องมือที่จำเป็นสำหรับการจัดการการผลิตที่มีประสิทธิภาพสูงสุด
              </Typography>
            </Box>
          </Fade>
          
          <Grid container spacing={4} className="features-grid">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Grow in={loaded} timeout={2000 + (index * 200)}>
                  <Card 
                    className="feature-card"
                    onClick={() => window.location.href = feature.link}
                  >
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
                      <Typography variant="body1" className="feature-description">
                        {feature.description}
                      </Typography>
                      <Button 
                        className="feature-button"
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
      <Box className="quick-actions-section">
        <Container maxWidth="lg">
          <Typography variant="h4" className="section-title">
            การดำเนินการด่วน
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card className="action-card production">
                <CardContent>
                  <Typography variant="h6">บันทึกข้อมูลการผลิต</Typography>
                  <Typography variant="body2">
                    บันทึกข้อมูลการผลิต Foaming และ Slice
                  </Typography>
                  <Button 
                    className="action-button"
                    onClick={() => window.location.href = '/production-foam'}
                  >
                    เริ่มบันทึก
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card className="action-card product">
                <CardContent>
                  <Typography variant="h6">จัดการผลิตภัณฑ์</Typography>
                  <Typography variant="body2">
                    เพิ่มผลิตภัณฑ์ใหม่และจัดการข้อมูลสินค้า
                  </Typography>
                  <Button 
                    className="action-button"
                    onClick={() => window.location.href = '/product'}
                  >
                    จัดการสินค้า
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card className="action-card report">
                <CardContent>
                  <Typography variant="h6">รายงานสถานะ</Typography>
                  <Typography variant="body2">
                    ดูรายงานและเปรียบเทียบข้อมูลการผลิต
                  </Typography>
                  <Button 
                    className="action-button"
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
      <Box className="home-footer">
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" className="footer-title">
                PE Block Department
              </Typography>
              <Typography variant="body2" className="footer-text">
                ระบบจัดการการผลิตที่ทันสมัยสำหรับแผนก PE Block
                <br />
                INOAC Industries (Thailand) Co., Ltd.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="footer-copyright">
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
