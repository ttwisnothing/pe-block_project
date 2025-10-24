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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
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
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";
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
  const [runDetails, setRunDetails] = useState({});
  const [runStatuses, setRunStatuses] = useState({});
  
  // Modal States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    productName: '',
    startDate: null,
    startTime: null,
    totalBlock: '',
    programName: '',
    blockRound: '',
    blockUsed: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  
  const navigate = useNavigate();

  // ดึงรายการสินค้า
  const fetchProductList = async () => {
    try {
      const response = await axios.get("/api/get/products");
      setProductList(response.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  // เปิด Modal
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    fetchProductList();
  };

  // ปิด Modal
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateFormData({
      productName: '',
      startDate: null,
      startTime: null,
      totalBlock: '',
      programName: '',
      blockRound: '',
      blockUsed: '',
    });
  };

  // จัดการการเปลี่ยนแปลงใน Form
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formattedStartDate = createFormData.startDate
    ? format(createFormData.startDate, "yyyy-MM-dd")
    : null;

  // ตรวจสอบและส่งข้อมูล
  const handleCreateSubmit = async () => {
    try {
      // Validation
      if (!createFormData.productName) {
        toast.error("กรุณาเลือกชื่อสินค้า");
        return;
      }
      if (!createFormData.startDate || !createFormData.startTime) {
        toast.error("กรุณาระบุวันที่และเวลาเริ่มต้น");
        return;
      }
      if (!createFormData.totalBlock) {
        toast.error("กรุณาระบุจำนวนบล็อค");
        return;
      }
      if (!createFormData.programName) {
        toast.error("กรุณาระบุโปรแกรม");
        return;
      }
      if (!createFormData.blockRound) {
        toast.error("กรุณาระบุบล็อคต่อรอบ");
        return;
      }
      if (!createFormData.blockUsed) {
        toast.error("กรุณาระบุบล็อคที่ใช้");
        return;
      }

      setCreateLoading(true);

      // เตรียมข้อมูลสำหรับ plantime
      let fristStart = createFormData.startTime;
      const timeParts = fristStart.split(":");
      const formattedTime = `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`;

      const machineNames = [
        createFormData.machine1 || "",
        createFormData.machine2 || "",
        createFormData.machine3 || "",
        createFormData.machine4 || "",
      ].filter((name) => name.trim() !== "");

      if (machineNames.length === 0) {
        toast.error("กรุณาระบุชื่อเครื่องจักรอย่างน้อย 1 เครื่อง");
        setCreateLoading(false);
        return;
      }

      const plantimePayload = {
        fristStart: formattedTime,
        blockTotal: parseInt(createFormData.totalBlock, 10),
        blockRound: parseInt(createFormData.blockRound, 10),
        blockUsed: parseInt(createFormData.blockUsed, 10),
        programName: createFormData.programName,
        mcNames: machineNames.map((name) =>
          name.trim().startsWith("M") ? name.trim() : `M${name.trim()}`
        ),
        startDate: formattedStartDate,
        startTime: formattedTime,
      };     

      const plantimeRes = await axios.post(
        `/api/post/plantime/add/${createFormData.productName}`,
        plantimePayload
      );

      const plantime_id = plantimeRes.data.plantime_id;
      toast.success(plantimeRes.data.message || "✅ สร้างแผนเวลา (Plantime) สำเร็จ");

      const productionPayload = {
        plantime_id: plantime_id,
        blockTotal: parseInt(createFormData.totalBlock, 10),
        startDate: formattedStartDate,
        startTime: formattedTime,
        blockUsed: parseInt(createFormData.blockUsed, 10)
      };

      const prodRes = await axios.post('/api/post/new-production/head', productionPayload);

      toast.success(prodRes.data.message || "✅ สร้าง Production สำเร็จ");
      handleCloseCreateDialog();
      await fetchProductionData();

    } catch (err) {
      console.error("Failed to create plantime/production:", err);
      toast.error(
        err.response?.data?.message ||
          "เกิดข้อผิดพลาดในการสร้างแผนเวลา/production"
      );
    } finally {
      setCreateLoading(false);
    }
  };

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

  // ดึง run records
  const fetchRunDetails = async (productionId) => {
    try {
      const response = await axios.get(
        `/api/get/production/${productionId}/run`
      );
      setRunDetails((prev) => ({
        ...prev,
        [productionId]: response.data || [],
      }));

      // ดึง run status
      await fetchRunStatuses(productionId);
    } catch (err) {
      console.error("Failed to fetch run details:", err);
      toast.error("ไม่สามารถดึงข้อมูล Run ได้");
    }
  };

  // ดึง run statuses
  const fetchRunStatuses = async (productionId) => {
    try {
      const response = await axios.get(
        `/api/get/production/run/status/${productionId}`
      );
      setRunStatuses((prev) => ({
        ...prev,
        [productionId]: response.data || [],
      }));
    } catch (err) {
      console.error("Failed to fetch run statuses:", err);
    }
  };

  // สร้าง/ดูข้อมูล Run Record
  const handleCreateRunRecord = async (
    productionId,
    productName,
    runNo,
    runId,
    openInNewTab = false
  ) => {
    try {
      const dataResponse = await axios.get(
        `/api/get/production/record-data/run/${runId}`
      );
      const existingData = dataResponse.data?.[0];

      if (!existingData) {
        navigate(`/production-foam/create/${encodeURIComponent(productName)}`, {
          state: {
            productionId,
            productName,
            runNo,
            runId,
            existingData: null,
            isEdit: false,
            hasExistingData: false,
          },
        });
        toast.info(`เริ่มบันทึกข้อมูลใหม่สำหรับ Run ${runNo}`);
        return;
      }

      const statuses = runStatuses[productionId] || [];
      const runStatus = statuses.find((status) => status.runId === runId);

      if (!runStatus) {
        toast.error("ไม่พบข้อมูลสถานะ Run");
        return;
      }

      const { completedSteps, totalSteps, isCompleteData, hasSignificantData } =
        runStatus;

      const url = `/production-foam/create/${encodeURIComponent(productName)}`;
      const state = {
        productionId,
        productName,
        runNo,
        runId,
        existingData: existingData,
        isEdit: isCompleteData,
        hasExistingData: true,
        completedSteps,
        totalSteps,
        autoNavigateToIncomplete: true,
      };

      if (openInNewTab) {
        window.open(
          `${url}?state=${encodeURIComponent(JSON.stringify(state))}`,
          "_blank"
        );
      } else {
        navigate(url, { state });
      }

      if (isCompleteData) {
        toast.success(
          `✅ Run ${runNo} บันทึกครบแล้ว (${completedSteps}/${totalSteps} steps) - โหมดดูข้อมูล`
        );
      } else if (hasSignificantData) {
        toast.info(
          `⚠️ Run ${runNo} มีข้อมูลบางส่วน (${completedSteps}/${totalSteps} steps) - ไปยัง step ที่ยังไม่เสร็จ`
        );
      } else {
        toast.info(
          `🆕 Run ${runNo} เพิ่งเริ่มบันทึก (${completedSteps}/${totalSteps} steps) - เริ่มจากขั้นตอนแรก`
        );
      }
    } catch (err) {
      console.error("Failed to fetch run data:", err);
      navigate(`/production-foam/create/${encodeURIComponent(productName)}`, {
        state: {
          runNo,
          productionId,
          productName,
          runId,
          existingData: null,
          isEdit: false,
          hasExistingData: false,
        },
      });
      toast.info(`เริ่มบันทึกข้อมูลใหม่สำหรับ Run ${runNo}`);
    }
  };

  const handleRowExpand = async (productionId) => {
    const isExpanded = expandedRows[productionId];

    setExpandedRows((prev) => ({
      ...prev,
      [productionId]: !isExpanded,
    }));

    if (!isExpanded) {
      // ถ้ายังไม่มี batch details ให้ดึงข้อมูลมาก่อน
      if (!runDetails[productionId]) {
        await fetchRunDetails(productionId);
      }

      // รอให้ state อัปเดตแล้วเช็คจาก response โดยตรง
      try {
        const response = await axios.get(
          `/api/get/production/${productionId}/run`
        );
        const currentRuns = response.data || [];

        // เช็คจาก response ล่าสุด แทนการเช็คจาก state
        if (currentRuns.length === 0) {
          // เรียก API เพื่อสร้าง batch records
          const createResponse = await axios.post(
            `/api/post/production/${productionId}/run-record/add`
          );

          if (createResponse.status === 201) {
            toast.success(
              `✅ สร้าง Run Records สำเร็จ (${createResponse.data.totalRunsCreated} รายการ)`
            );

            // ดึงข้อมูล batch details ใหม่หลังจากสร้างเสร็จ
            await fetchRunDetails(productionId);
          }
        } else {
          console.log("ℹ️ Runs already exist:", currentRuns.length);
        }
      } catch (error) {
        console.error("Failed to check/create run records:", error);
        if (error.response?.status === 404) {
          toast.error("ไม่พบข้อมูลการผลิตที่ระบุ");
        } else {
          toast.error("เกิดข้อผิดพลาดในการสร้าง Run Records");
        }
      }
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
    setRunDetails({});
    setRunStatuses({});
    try {
      await fetchProductionData();
      toast.info("รีเซ็ตการค้นหาเรียบร้อย");
    } finally {
      setSearchLoading(false);
    }
  };

  // เปลี่ยนชื่อฟังก์ชัน
  const getRunStatusFromAPI = (productionId, runId) => {
    const statuses = runStatuses[productionId] || [];
    const runStatus = statuses.find((status) => status.runId === runId);

    if (!runStatus) {
      return { label: "ไม่มีข้อมูล", color: "default", icon: "❓" };
    }

    return runStatus.statusDisplay;
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
              <Box className="production-search-header-left">
                <CalendarTodayIcon className="production-search-icon" />
                <Typography variant="h6" className="production-search-title">
                  ค้นหาข้อมูล
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                className="production-create-button"
              >
                สร้างข้อมูลใหม่
              </Button>
            </Box>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={th}
            >
              <Grid container spacing={3} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 4 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
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

        {/* Create Production Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={handleCloseCreateDialog}
          maxWidth="md"
          fullWidth
          className="production-create-dialog"
        >
          <DialogTitle className="production-dialog-title">
            <Box display="flex" alignItems="center" gap={1}>
              <BusinessIcon color="primary" />
              <Typography variant="h6" component="span">
                สร้างข้อมูลการผลิตใหม่
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseCreateDialog}
              className="production-dialog-close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers className="production-dialog-content">
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth variant="outlined" className="production-form-field">
                    <InputLabel>ชื่อสินค้า</InputLabel>
                    <Select
                      label="ชื่อสินค้า"
                      value={createFormData.productName}
                      onChange={(e) => handleCreateFormChange('productName', e.target.value)}
                    >
                      <MenuItem value="">
                        -- เลือกชื่อสินค้า --
                      </MenuItem>
                      {productList.map((product, idx) => (
                        <MenuItem key={product.id || idx} value={product.name}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="จำนวนบล็อค"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={createFormData.totalBlock}
                    onChange={(e) => handleCreateFormChange('totalBlock', e.target.value)}
                    className="production-form-field"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="โปรแกรม"
                    value={createFormData.programName}
                    onChange={(e) => handleCreateFormChange('programName', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="วันที่เริ่มต้น"
                    value={createFormData.startDate}
                    onChange={(date) => handleCreateFormChange('startDate', date)}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        className: "production-form-field",
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="เวลาเริ่มต้น"
                    value={createFormData.startTime || ""}
                    onChange={(e) => handleCreateFormChange('startTime', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                    placeholder="เช่น 08:00"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="บล็อคต่อรอบ"
                    type="text"
                    value={createFormData.blockRound}
                    onChange={(e) => handleCreateFormChange('blockRound', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="บล็อคที่ใช้"
                    type="text"
                    value={createFormData.blockUsed}
                    onChange={(e) => handleCreateFormChange('blockUsed', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Machine 1"
                    value={createFormData.machine1 || ""}
                    onChange={(e) => handleCreateFormChange('machine1', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Machine 2"
                    value={createFormData.machine2 || ""}
                    onChange={(e) => handleCreateFormChange('machine2', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Machine 3"
                    value={createFormData.machine3 || ""}
                    onChange={(e) => handleCreateFormChange('machine3', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Machine 4"
                    value={createFormData.machine4 || ""}
                    onChange={(e) => handleCreateFormChange('machine4', e.target.value)}
                    fullWidth
                    variant="outlined"
                    className="production-form-field"
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </DialogContent>

          <DialogActions className="production-dialog-actions">
            <Button
              onClick={handleCloseCreateDialog}
              variant="outlined"
              className="production-cancel-button"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateSubmit}
              variant="contained"
              startIcon={createLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={createLoading}
              className="production-save-button"
            >
              {createLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogActions>
        </Dialog>

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
                          จำนวนบล็อค
                        </TableCell>
                        <TableCell className="production-table-header-cell">
                          สถานะ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productionData.map((row, index) => {
                        const status = row.production_status;
                        const isExpanded = expandedRows[row.id];
                        const runs = runDetails[row.id] || [];

                        return (
                          <React.Fragment key={row.id}>
                            {/* Main Row */}
                            <TableRow 
                              className="production-table-row"
                              onClick={() => handleRowExpand(row.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <TableCell className="production-table-cell">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowExpand(row.id);
                                  }}
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
                                {row.formatted_create_date}
                              </TableCell>
                              <TableCell className="production-table-cell production-product-cell">
                                {row.product_name || "-"}
                              </TableCell>
                              <TableCell className="production-table-cell production-datetime-cell">
                                {row.formatted_start_time}
                              </TableCell>
                              <TableCell className="production-table-cell production-datetime-cell">
                                {row.formatted_end_time}
                              </TableCell>
                              <TableCell className="production-table-cell production-batch-cell">
                                <Chip
                                  label={row.total_block || "0"}
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

                            {/* Expanded Row - Run Details */}
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
                                  <Box className="production-run-details">
                                    <Box className="production-run-details-header">
                                      <Typography
                                        variant="h6"
                                        className="production-run-details-title"
                                      >
                                        <BatchPredictionIcon className="production-run-icon" />
                                        รายละเอียด Run ({runs.length} รายการ)
                                      </Typography>
                                    </Box>

                                    {runs.length > 0 ? (
                                      <Table
                                        size="small"
                                        className="production-run-table"
                                      >
                                        <TableHead>
                                          <TableRow>
                                            <TableCell className="production-run-header-cell">
                                              Run No.
                                            </TableCell>
                                            <TableCell className="production-run-header-cell">
                                              วันที่บันทึก
                                            </TableCell>
                                            <TableCell className="production-run-header-cell">
                                              ชื่อผลิตภัณฑ์
                                            </TableCell>
                                            <TableCell className="production-run-header-cell">
                                              พนักงานที่บันทึก
                                            </TableCell>
                                            <TableCell className="production-run-header-cell">
                                              สถานะ
                                            </TableCell>
                                            <TableCell
                                              className="production-run-header-cell"
                                              style={{ width: "120px" }}
                                            >
                                              การจัดการ
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {runs.map((run) => {
                                            const runStatus =
                                              getRunStatusFromAPI(
                                                row.id,
                                                run.id
                                              );
                                            const isCompleteData =
                                              runStatus.label ===
                                              "บันทึกครบแล้ว";

                                            return (
                                              <TableRow
                                                key={run.id}
                                                className="production-run-row"
                                              >
                                                <TableCell className="production-run-cell production-run-number">
                                                  <Chip
                                                    label={run.run_no}
                                                    size="small"
                                                    variant="outlined"
                                                    className="production-run-number-chip"
                                                  />
                                                </TableCell>
                                                <TableCell className="production-run-cell">
                                                  {run.record_date
                                                    ? new Date(run.record_date)
                                                        .toLocaleDateString(
                                                          "th-TH",
                                                          {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                          }
                                                        )
                                                        .replace(/\//g, "-")
                                                    : "-"}
                                                </TableCell>
                                                <TableCell className="production-run-cell">
                                                  {run.product_name || "-"}
                                                </TableCell>
                                                <TableCell className="production-run-cell production-run-time">
                                                  {run.operator_name || "-"}
                                                </TableCell>
                                                <TableCell className="production-run-cell">
                                                  <Chip
                                                    label={`${runStatus.icon} ${runStatus.label}`}
                                                    color={runStatus.color}
                                                    size="small"
                                                    className="production-run-status-chip"
                                                  />
                                                </TableCell>
                                                <TableCell className="production-run-cell">
                                                  <Button
                                                    variant={
                                                      isCompleteData
                                                        ? "text"
                                                        : "outlined"
                                                    }
                                                    size="small"
                                                    startIcon={
                                                      isCompleteData ? (
                                                        <AssessmentIcon />
                                                      ) : (
                                                        <AddIcon />
                                                      )
                                                    }
                                                    onClick={() =>
                                                      isCompleteData
                                                        ? handleCreateRunRecord(
                                                            row.id,
                                                            row.product_name,
                                                            run.run_no,
                                                            run.id,
                                                            true
                                                          )
                                                        : handleCreateRunRecord(
                                                            row.id,
                                                            row.product_name,
                                                            run.run_no,
                                                            run.id,
                                                            true
                                                          )
                                                    }
                                                    className="production-run-create-button"
                                                    color={
                                                      isCompleteData
                                                        ? "info"
                                                        : "primary"
                                                    }
                                                  >
                                                    {isCompleteData
                                                      ? "ดูข้อมูล"
                                                      : "บันทึก"}
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <Box className="production-no-run-data">
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          ไม่มีข้อมูล Run
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
