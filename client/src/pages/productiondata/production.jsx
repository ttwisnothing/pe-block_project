import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Grid,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactoryIcon from '@mui/icons-material/Factory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import './production.css';
import th from 'date-fns/locale/th';

const Production = () => {
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const navigate = useNavigate();

  const fetchProductionData = async (searchParams = {}) => {
    try {
      setLoading(true);
      
      let url = '/api/get/production/all';
      
      // สร้าง query parameters สำหรับ GET request
      if (searchParams.dateFrom && searchParams.dateTo) {
        const params = new URLSearchParams({
          dateFrom: format(searchParams.dateFrom, 'yyyy-MM-dd'),
          dateTo: format(searchParams.dateTo, 'yyyy-MM-dd')
        });
        url += `?${params.toString()}`;
        
        console.log('Searching with URL:', url); // debug log
      }
      
      const response = await axios.get(url);
      console.log('Response data:', response.data); // debug log
      setProductionData(response.data || []);
      
    } catch (err) {
      console.error('Failed to fetch production data:', err);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองอีกครั้งในภายหลัง');
      setProductionData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionData();
  }, []);

  const handleSearch = () => {
    // ตรวจสอบความถูกต้องของวันที่
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด');
      return;
    }
    
    // ตรวจสอบว่ามีการเลือกวันที่ทั้งคู่หรือไม่
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast.warning('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดให้ครบถ้วน');
      return;
    }
    
    if (dateFrom && dateTo) {
      fetchProductionData({ dateFrom, dateTo });
      toast.success('ค้นหาข้อมูลสำเร็จ');
    } else {
      fetchProductionData();
    }
  };

  const handleReset = () => {
    setDateFrom(null);
    setDateTo(null);
    fetchProductionData();
    toast.info('รีเซ็ตการค้นหาเรียบร้อย');
  };

  const handleCreateRecord = () => {
    // เปลี่ยนไปหน้าสร้างการบันทึกใหม่
    navigate('/production-foam/create');
  };

  // ฟังก์ชันสำหรับตรวจสอบสถานะการผลิต
  const getProductionStatus = (startTime, endTime) => {
    if (!startTime) {
      return { label: 'ไม่มีข้อมูล', color: 'default' };
    }

    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (now < start) {
      return { label: 'รอผลิต', color: 'warning' };
    } else if (!end || now <= end) {
      return { label: 'กำลังผลิต', color: 'primary' };
    } else {
      return { label: 'สิ้นสุดการผลิต', color: 'success' };
    }
  };

  return (
    <Container maxWidth="xl" className="production-container">
      <Box className="page-header">
        <Box className="header-content">
          <FactoryIcon className="header-icon" />
          <Typography variant="h4" component="h1" className="page-title">
            ข้อมูลการผลิต
          </Typography>
        </Box>
        <Typography variant="subtitle1" className="page-subtitle">
          ติดตามและจัดการข้อมูลการผลิต
        </Typography>
      </Box>

      <Paper elevation={0} className="search-card">
        <Box className="search-header">
          <CalendarTodayIcon className="search-icon" />
          <Typography variant="h6" className="search-title">
            ค้นหาข้อมูล
          </Typography>
        </Box>
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="วันที่เริ่มต้น"
                value={dateFrom}
                onChange={(date) => setDateFrom(date)}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    className: "date-field",
                    placeholder: "dd/mm/yyyy"
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="วันที่สิ้นสุด"
                value={dateTo}
                onChange={(date) => setDateTo(date)}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    className: "date-field",
                    placeholder: "dd/mm/yyyy"
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="action-buttons">
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  className="search-button"
                  disabled={loading}
                >
                  ค้นหา
                </Button>
                
                <IconButton
                  onClick={handleReset}
                  className="reset-button"
                  disabled={loading}
                  title="รีเซ็ตการค้นหา"
                > 
                  <RefreshIcon />
                </IconButton>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRecord}
                  className="create-button"
                >
                  สร้างการบันทึก
                </Button>
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      <Paper elevation={0} className="data-card">
        {loading ? (
          <Box className="loading-container">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" className="loading-text">
              กำลังโหลดข้อมูล...
            </Typography>
          </Box>
        ) : productionData.length > 0 ? (
          <>
            <Box className="table-header">
              <Typography variant="h6" className="table-title">
                ผลการค้นหา ({productionData.length} รายการ)
              </Typography>
            </Box>
            <TableContainer className="table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header-cell">No.</TableCell>
                    <TableCell className="table-header-cell">Create Date</TableCell>
                    <TableCell className="table-header-cell">Product Name</TableCell>
                    <TableCell className="table-header-cell">Start Time</TableCell>
                    <TableCell className="table-header-cell">End Time</TableCell>
                    <TableCell className="table-header-cell">Total Batch</TableCell>
                    <TableCell className="table-header-cell">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productionData.map((row, index) => {
                    const status = getProductionStatus(row.start_time, row.end_time);
                    
                    return (
                      <TableRow key={row.id} className="table-row">
                        <TableCell className="table-cell">{index + 1}</TableCell>
                        <TableCell className="table-cell date-cell">
                          {row.create_date ? format(new Date(row.create_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="table-cell product-cell">
                          {row.product_name || '-'}
                        </TableCell>
                        <TableCell className="table-cell">
                          {row.start_time ? format(new Date(row.start_time), 'dd/MM/yyyy HH:mm:ss') : '-'}
                        </TableCell>
                        <TableCell className="table-cell">
                          {row.end_time ? format(new Date(row.end_time), 'dd/MM/yyyy HH:mm:ss') : '-'}
                        </TableCell>
                        <TableCell className="table-cell batch-cell">
                          <Chip label={row.total_batch || '0'} variant="outlined" size="small" />
                        </TableCell>
                        <TableCell className="table-cell">
                          <Chip 
                            label={status.label}
                            color={status.color}
                            size="small"
                            className="status-chip"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box className="no-data-container">
            <FactoryIcon className="no-data-icon" />
            <Typography variant="h6" className="no-data-title">
              ไม่พบข้อมูล
            </Typography>
            <Typography variant="body2" className="no-data-subtitle">
              ลองปรับเปลี่ยนช่วงวันที่หรือรีเซ็ตการค้นหา
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Production;
