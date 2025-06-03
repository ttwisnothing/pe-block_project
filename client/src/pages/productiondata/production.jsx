import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
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
  IconButton,
  Fade,
  Collapse,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FactoryIcon from "@mui/icons-material/Factory";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssessmentIcon from "@mui/icons-material/Assessment";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import BatchPredictionIcon from "@mui/icons-material/BatchPrediction";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./production.css";
import th from "date-fns/locale/th";

const Production = () => {
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [batchDetails, setBatchDetails] = useState({});
  const navigate = useNavigate();

  const fetchProductionData = async (searchParams = {}) => {
    try {
      setLoading(true);

      let url = "/api/get/production/all";

      if (searchParams.dateFrom && searchParams.dateTo) {
        const params = new URLSearchParams({
          dateFrom: format(searchParams.dateFrom, "yyyy-MM-dd"),
          dateTo: format(searchParams.dateTo, "yyyy-MM-dd"),
        });
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setProductionData(response.data || []);
    } catch (err) {
      console.error("Failed to fetch production data:", err);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองอีกครั้งในภายหลัง");
      setProductionData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (productionId) => {
    try {
      const response = await axios.get(
        `/api/get/production/${productionId}/batches`
      );
      setBatchDetails((prev) => ({
        ...prev,
        [productionId]: response.data || [],
      }));
    } catch (err) {
      console.error("Failed to fetch batch details:", err);
      toast.error("ไม่สามารถดึงข้อมูล batch ได้");
    }
  };

  const handleCreateBatchRecord = async (productionId, productName, batchNo, batchId) => {
    try {
      // ดึงข้อมูลเดิม (ถ้ามี)
      const dataResponse = await axios.get(`/api/get/production/record-data/batches/${batchId}`);
      const existingData = dataResponse.data?.[0];

      // เช็คว่ามีข้อมูลสำคัญหรือไม่เพื่อตัดสินใจ mode
      const hasBasicData = existingData && (
        existingData.operator_name || 
        existingData.product_status || 
        existingData.program_no ||
        existingData.shift_time
      );

      // เช็คว่ามี chemical data หรือไม่
      const hasChemicalData = existingData && (
        existingData.chemistry_1 || existingData.chemistry_2 || 
        existingData.chemistry_3 || existingData.chemistry_4 || 
        existingData.chemistry_5
      );

      // ถ้ามีข้อมูลครบถ้วน = view mode, ถ้าไม่ครบ = edit mode
      const isCompleteData = hasBasicData && hasChemicalData;

      navigate(`/production-foam/create/${encodeURIComponent(productName)}`, { 
        state: { 
          productionId,
          productName,
          batchNo,
          batchId,
          existingData: existingData || null,
          isEdit: isCompleteData, // view mode เมื่อข้อมูลครบ
          hasExistingData: !!existingData
        }
      });

      // แสดง toast ตามสถานะ
      if (isCompleteData) {
        toast.info(`Batch ${batchNo} บันทึกครบแล้ว - โหมดดูข้อมูล`);
      } else if (hasBasicData) {
        toast.info(`Batch ${batchNo} มีข้อมูลบางส่วน - ดำเนินการบันทึกต่อ`);
      } else {
        toast.info(`เริ่มบันทึกข้อมูลใหม่สำหรับ Batch ${batchNo}`);
      }
      
    } catch (err) {
      console.error("Failed to fetch batch data:", err);
      
      // ถ้า error = ไม่มีข้อมูลเดิม ให้สร้างใหม่
      navigate(`/production-foam/create/${encodeURIComponent(productName)}`, { 
        state: { 
          productionId,
          productName,
          batchNo,
          batchId,
          existingData: null,
          isEdit: false,
          hasExistingData: false
        }
      });
      
      toast.info(`เริ่มบันทึกข้อมูลใหม่สำหรับ Batch ${batchNo}`);
    }
  };

  const handleRowExpand = async (productionId) => {
    const isExpanded = expandedRows[productionId];

    setExpandedRows((prev) => ({
      ...prev,
      [productionId]: !isExpanded,
    }));

    if (!isExpanded && !batchDetails[productionId]) {
      await fetchBatchDetails(productionId);
    }
  };

  useEffect(() => {
    fetchProductionData();
  }, []);

  const handleSearch = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error("วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return;
    }

    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast.warning("กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดให้ครบถ้วน");
      return;
    }

    setSearchLoading(true);

    try {
      if (dateFrom && dateTo) {
        await fetchProductionData({ dateFrom, dateTo });
        toast.success("ค้นหาข้อมูลสำเร็จ");
      } else {
        await fetchProductionData();
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleReset = async () => {
    setDateFrom(null);
    setDateTo(null);
    setSearchLoading(true);
    setExpandedRows({});
    setBatchDetails({});

    try {
      await fetchProductionData();
      toast.info("รีเซ็ตการค้นหาเรียบร้อย");
    } finally {
      setSearchLoading(false);
    }
  };

  const getProductionStatus = (startTime, endTime) => {
    if (!startTime) {
      return { label: "ไม่มีข้อมูล", color: "default", icon: "❓" };
    }

    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (now < start) {
      return { label: "รอผลิต", color: "warning", icon: "⏳" };
    } else if (!end || now <= end) {
      return { label: "กำลังผลิต", color: "primary", icon: "🔄" };
    } else {
      return { label: "สิ้นสุดการผลิต", color: "success", icon: "✅" };
    }
  };

  const getBatchStatus = (batchData) => {
    // เช็คข้อมูลพื้นฐาน
    const hasBasicData = batchData.operator_name || 
                        batchData.product_status || 
                        batchData.program_no ||
                        batchData.shift_time;

    // เช็คข้อมูล chemistry (ใช้ดู chemistry ที่อาจมีจาก join)
    const hasChemicalData = batchData.chemistry_1 || batchData.chemistry_2;

    if (!hasBasicData) {
      return { label: "ยังไม่เริ่ม", color: "default", icon: "⭕" };
    } else if (hasBasicData && !hasChemicalData) {
      return { label: "กำลังบันทึก", color: "warning", icon: "⚠️" };
    } else if (hasBasicData && hasChemicalData) {
      return { label: "บันทึกครบแล้ว", color: "success", icon: "✅" };
    } else {
      return { label: "กำลังผลิต", color: "primary", icon: "🔄" };
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "-";
    try {
      return format(new Date(dateTime), "dd/MM/yyyy HH:mm:ss");
    } catch (error) {
      return "-";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch (error) {
      return "-";
    }
  };

  const formatTime = (time) => {
    if (!time) return "-";
    try {
      return format(new Date(time), "HH:mm:ss");
    } catch (error) {
      return "-";
    }
  };

  return (
    <div className="production-main-container">
      <Container maxWidth="xl" className="production-container">
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Box className="production-page-header">
            <Box className="production-header-content">
              <FactoryIcon className="production-header-icon" />
              <Typography
                variant="h4"
                component="h1"
                className="production-page-title"
              >
                ข้อมูลการผลิต
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              className="production-page-subtitle"
            >
              ติดตามและจัดการข้อมูลการผลิต
            </Typography>
          </Box>
        </Fade>

        {/* Search Section */}
        <Fade in={true} timeout={1000}>
          <Paper elevation={0} className="production-search-card">
            <Box className="production-search-header">
              <CalendarTodayIcon className="production-search-icon" />
              <Typography variant="h6" className="production-search-title">
                ค้นหาข้อมูล
              </Typography>
            </Box>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={th}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="วันที่เริ่มต้น"
                    value={dateFrom}
                    onChange={(date) => setDateFrom(date)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        className: "production-date-field",
                        placeholder: "dd/mm/yyyy",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="วันที่สิ้นสุด"
                    value={dateTo}
                    onChange={(date) => setDateTo(date)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        className: "production-date-field",
                        placeholder: "dd/mm/yyyy",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box className="production-action-buttons">
                    <Button
                      variant="contained"
                      startIcon={
                        searchLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SearchIcon />
                        )
                      }
                      onClick={handleSearch}
                      className="production-search-button"
                      disabled={loading || searchLoading}
                    >
                      {searchLoading ? "กำลังค้นหา..." : "ค้นหา"}
                    </Button>

                    <IconButton
                      onClick={handleReset}
                      className="production-reset-button"
                      disabled={loading || searchLoading}
                      title="รีเซ็ตการค้นหา"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Paper>
        </Fade>

        {/* Data Section */}
        <Fade in={true} timeout={1200}>
          <Paper elevation={0} className="production-data-card">
            {loading ? (
              <Box className="production-loading-container">
                <CircularProgress
                  size={60}
                  thickness={4}
                  className="production-loading-spinner"
                />
                <Typography variant="h6" className="production-loading-text">
                  กำลังโหลดข้อมูล...
                </Typography>
              </Box>
            ) : productionData.length > 0 ? (
              <>
                <Box className="production-table-header">
                  <AssessmentIcon className="production-table-header-icon" />
                  <Typography variant="h6" className="production-table-title">
                    ผลการค้นหา ({productionData.length} รายการ)
                  </Typography>
                </Box>
                <TableContainer className="production-table-container">
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          className="production-table-header-cell"
                          style={{ width: "50px" }}
                        >
                          รายละเอียด
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          ลำดับ
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          วันที่สร้าง
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          ชื่อสินค้า
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          เวลาเริ่ม
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          เวลาสิ้นสุด
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          จำนวนแบทช์
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          สถานะ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productionData.map((row, index) => {
                        const status = getProductionStatus(
                          row.start_time,
                          row.end_time
                        );
                        const isExpanded = expandedRows[row.id];
                        const batches = batchDetails[row.id] || [];

                        return (
                          <React.Fragment key={row.id}>
                            {/* Main Row */}
                            <TableRow className="production-table-row">
                              <TableCell className="production-table-cell">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRowExpand(row.id)}
                                  className="production-expand-button"
                                >
                                  {isExpanded ? (
                                    <KeyboardArrowUpIcon />
                                  ) : (
                                    <KeyboardArrowDownIcon />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell className="production-table-cell production-index-cell">
                                {index + 1}
                              </TableCell>
                              <TableCell className="production-table-cell production-date-cell">
                                {formatDate(row.create_date)}
                              </TableCell>
                              <TableCell className="production-table-cell production-product-cell">
                                {row.product_name || "-"}
                              </TableCell>
                              <TableCell className="production-table-cell production-datetime-cell">
                                {formatDateTime(row.start_time)}
                              </TableCell>
                              <TableCell className="production-table-cell production-datetime-cell">
                                {formatDateTime(row.end_time)}
                              </TableCell>
                              <TableCell className="production-table-cell production-batch-cell">
                                <Chip
                                  label={row.total_batch || "0"}
                                  variant="outlined"
                                  size="small"
                                  className="production-batch-chip"
                                />
                              </TableCell>
                              <TableCell className="production-table-cell production-status-cell">
                                <Chip
                                  label={`${status.icon} ${status.label}`}
                                  color={status.color}
                                  size="small"
                                  className="production-status-chip"
                                />
                              </TableCell>
                            </TableRow>

                            {/* Expanded Row - Batch Details */}
                            <TableRow>
                              <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={8}
                              >
                                <Collapse
                                  in={isExpanded}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box className="production-batch-details">
                                    <Box className="production-batch-details-header">
                                      <Typography
                                        variant="h6"
                                        className="production-batch-details-title"
                                      >
                                        <BatchPredictionIcon className="production-batch-icon" />
                                        รายละเอียด Batch ({batches.length} รายการ)
                                      </Typography>
                                    </Box>

                                    {batches.length > 0 ? (
                                      <Table
                                        size="small"
                                        className="production-batch-table"
                                      >
                                        <TableHead>
                                          <TableRow>
                                            <TableCell className="production-batch-header-cell">
                                              Batch No.
                                            </TableCell>
                                            <TableCell className="production-batch-header-cell">
                                              วันที่บันทึก
                                            </TableCell>
                                            <TableCell className="production-batch-header-cell">
                                              ชื่อผลิตภัณฑ์
                                            </TableCell>
                                            <TableCell className="production-batch-header-cell">
                                              พนักงานที่บันทึก
                                            </TableCell>
                                            <TableCell className="production-batch-header-cell">
                                              สถานะ
                                            </TableCell>
                                            <TableCell className="production-batch-header-cell" style={{ width: "120px" }}>
                                              การจัดการ
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {batches.map((batch) => {
                                            const batchStatus = getBatchStatus(batch);
                                            const isCompleteData = batchStatus.label === "บันทึกครบแล้ว";
                                            
                                            return (
                                              <TableRow key={batch.id} className="production-batch-row">
                                                <TableCell className="production-batch-cell production-batch-number">
                                                  <Chip
                                                    label={batch.batch_no}
                                                    size="small"
                                                    variant="outlined"
                                                    className="production-batch-number-chip"
                                                  />
                                                </TableCell>
                                                <TableCell className="production-batch-cell">
                                                  {formatDate(batch.record_date) || "-"}
                                                </TableCell>
                                                <TableCell className="production-batch-cell">
                                                  {batch.product_name || "-"}
                                                </TableCell>
                                                <TableCell className="production-batch-cell production-batch-time">
                                                  {batch.operator_name || "-"}
                                                </TableCell>
                                                <TableCell className="production-batch-cell">
                                                  <Chip
                                                    label={`${batchStatus.icon} ${batchStatus.label}`}
                                                    color={batchStatus.color}
                                                    size="small"
                                                    className="production-batch-status-chip"
                                                  />
                                                </TableCell>
                                                <TableCell className="production-batch-cell">
                                                  <Button
                                                    variant={isCompleteData ? "text" : "outlined"}
                                                    size="small"
                                                    startIcon={isCompleteData ? <AssessmentIcon /> : <AddIcon />}
                                                    onClick={() => handleCreateBatchRecord(row.id, row.product_name, batch.batch_no, batch.id)}
                                                    className="production-batch-create-button"
                                                    color={isCompleteData ? "info" : "primary"}
                                                  >
                                                    {isCompleteData ? "ดูข้อมูล" : "บันทึก"}
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <Box className="production-no-batch-data">
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          ไม่มีข้อมูล Batch
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box className="production-no-data-container">
                <FactoryIcon className="production-no-data-icon" />
                <Typography variant="h6" className="production-no-data-title">
                  ไม่พบข้อมูลการผลิต
                </Typography>
                <Typography
                  variant="body2"
                  className="production-no-data-subtitle"
                >
                  ลองปรับเปลี่ยนช่วงวันที่หรือรีเซ็ตการค้นหา
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  className="production-no-data-button"
                  startIcon={<RefreshIcon />}
                >
                  รีเซ็ตการค้นหา
                </Button>
              </Box>
            )}
          </Paper>
        </Fade>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Container>
    </div>
  );
};

export default Production;
