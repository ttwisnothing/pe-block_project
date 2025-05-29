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
  Alert,
  Grid,
  Box,
  Chip,
  IconButton,
  Tooltip
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
import './production.css';

const Production = () => {
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const navigate = useNavigate();

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {};
      if (dateFrom && dateTo) {
        payload.dateFrom = dateFrom.toISOString();
        payload.dateTo = dateTo.toISOString();
      }
      
      const response = await axios.post('/api/get/production/all', payload);
      setProductionData(response.data);
    } catch (err) {
      console.error('Failed to fetch production data:', err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองอีกครั้งในภายหลัง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionData();
  }, []);

  const handleSearch = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด');
      return;
    }
    fetchProductionData();
  };

  const handleReset = () => {
    setDateFrom(null);
    setDateTo(null);
    setError(null);
    fetchProductionData();
  };

  const getShiftColor = (shift) => {
    switch (shift?.toLowerCase()) {
      case 'day':
      case 'กลางวัน':
        return 'primary';
      case 'night':
      case 'กลางคืน':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleCreateRecord = () => {
    // เปลี่ยนไปหน้าสร้างการบันทึกใหม่
    navigate('/production-foam/create');
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
        
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="วันที่เริ่มต้น"
                value={dateFrom}
                onChange={(date) => setDateFrom(date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    variant="outlined"
                    className="date-field"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="วันที่สิ้นสุด"
                value={dateTo}
                onChange={(date) => setDateTo(date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    variant="outlined"
                    className="date-field"
                  />
                )}
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
                <Tooltip title="รีเซ็ตการค้นหา">
                  <IconButton
                    onClick={handleReset}
                    className="reset-button"
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
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

      {error && (
        <Alert severity="error" className="error-alert" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                    <TableCell className="table-header-cell">Record Date</TableCell>
                    <TableCell className="table-header-cell">Batch No</TableCell>
                    <TableCell className="table-header-cell">Product Name</TableCell>
                    <TableCell className="table-header-cell">Status</TableCell>
                    <TableCell className="table-header-cell">Operator</TableCell>
                    <TableCell className="table-header-cell">Shift</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productionData.map((row, index) => (
                    <TableRow key={row.id} className="table-row">
                      <TableCell className="table-cell">{index + 1}</TableCell>
                      <TableCell className="table-cell date-cell">
                        {row.record_date ? format(new Date(row.record_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="table-cell batch-cell">
                        <Chip label={row.batch_no || '-'} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell className="table-cell product-cell">
                        {row.product_name || '-'}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Chip 
                          label={row.product_status || 'Unknown'} 
                          size="small"
                          className="status-chip"
                        />
                      </TableCell>
                      <TableCell className="table-cell operator-cell">
                        {row.weighing_staff || '-'}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Chip 
                          label={row.employee_shift || '-'} 
                          color={getShiftColor(row.employee_shift)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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
