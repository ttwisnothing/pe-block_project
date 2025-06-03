import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Grid,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Fade,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Science as ScienceIcon,
  Blender as BlenderIcon,
  ContentCut as CutIcon,
  Compress as CompressIcon,
  CheckCircle as CheckIcon,
  AccountBox as AccountIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import axios from "axios";
import "./foam.css";

const steps = [
  "ข้อมูลพื้นฐาน",
  "Chemical Name",
  "Chemical Weight",
  "Mixing Step",
  "Cutting Step",
  "Pre Press",
  "Secondary Press",
  "Foam Check",
];

const FoamRecord = () => {
  const { productName } = useParams();
  const location = useLocation();
  const productionId = location.state?.productionId;
  const existingData = location.state?.existingData; // เพิ่มบรรทัดนี้
  const isEdit = location.state?.isEdit || false; // เพิ่มบรรทัดนี้
  const batchNo = location.state?.batchNo; // เพิ่มบรรทัดนี้
  const batchId = location.state?.batchId; // เพิ่มบรรทัดนี้

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Production Record State
  const [productionData, setProductionData] = useState({
    batchNo: "",
    recordDate: new Date().toISOString().split("T")[0],
    productStatus: "",
    programNo: "",
    productName: productName || "",
    shiftTime: "",
    operatorName: "",
  });

  const getDataMaster = async () => {
    try {
      // productName ที่รับมาคือ "rp-300s (wh)"
      const colorMatch = productName.match(/^(.+?)\s*\((.+)\)$/);
      let extractedProductName, extractedColor;
      if (colorMatch) {
        extractedProductName = colorMatch[1].trim();
        extractedColor = colorMatch[2].trim();
      } else {
        extractedProductName = productName;
        extractedColor = null;
      }

      const params = new URLSearchParams({ product_name: extractedProductName });
      if (extractedColor) params.append("color", extractedColor);

      const response = await axios.get(`/api/get/all-products?${params.toString()}`);
      const data = response.data;

      setProductionData((prev) => ({
        ...prev,
        productName: data.productName || productName,
        productStatus: data.status || prev.productStatus,
      }));

      if (Array.isArray(data.chemicals)) {
        const newChemicalNames = Array(15)
          .fill("")
          .map((_, i) => {
            const chemicalName = data.chemicals[i] || "";
            return { [`chemistry_${i + 1}`]: chemicalName };
          });
        setChemicalNames(newChemicalNames);
      }
    } catch (error) {
      // handle error
    }
  };

  // Chemical Name State
  const [chemicalNames, setChemicalNames] = useState(
    Array(15)
      .fill("")
      .map((_, i) => ({ [`chemistry_${i + 1}`]: "" }))
  );

  // Chemical Weight State
  const [chemicalWeights, setChemicalWeights] = useState({
    ref: "",
    weights: Array(15).fill(""),
  });

  // Mixing Step State
  const [mixingData, setMixingData] = useState({
    programNo: "",
    hopperWeight: "",
    actualTime: "",
    mixingFinish: "",
    lipHeat: "",
    casingA: "",
    casingB: "",
    tempHopper: "",
    longScrew: "",
    shortScrew: "",
    waterHeat: "",
  });

  // Cutting Step State
  const [cuttingData, setCuttingData] = useState({
    wb1: "",
    wb2: "",
    wb3: "",
    wb4: "",
    wb5: "",
    wb6: "",
    wb7: "",
    wb8: "",
    wb9: "",
    weightRemain: "",
    staffSave: "",
    startPress: "",
    mixFinish: "",
  });

  // Pre Press State
  const [prePressData, setPrePressData] = useState({
    prePressHeat: "",
    waterHeat1: "",
    waterHeat2: "",
    bakeTimePre: "",
    topHeat: "",
    layerHeat1: "",
    layerHeat2: "",
    layerHeat3: "",
    layerHeat4: "",
    layerHeat5: "",
    layerHeat6: "",
    injectorStaff: "",
    bakeTimePrimary: "",
  });

  // Secondary Press State
  const [secondaryPressData, setSecondaryPressData] = useState({
    machineNo: "",
    streamInPress: "",
    foamWidth: "",
    foamLength: "",
    bakeTimeSecondary: "",
    sprayAgent: "",
    heatCheckA: "",
    heatCheckB: "",
    heatExit: "",
  });

  // Foam Check State
  const [foamCheckData, setFoamCheckData] = useState({
    runNo: "",
    layer1: "",
    layer2: "",
    layer3: "",
    layer4: "",
    layer5: "",
    layer6: "",
    entryData: "",
  });

  // เพิ่ม state สำหรับเก็บข้อมูล chemicals
  const [allChemicals, setAllChemicals] = useState([]);
  const [chemicalsLoading, setChemicalsLoading] = useState(false);

  useEffect(() => {
    loadChemicals();

    if (productName) {
      setProductionData(prev => ({
        ...prev,
        productName: decodeURIComponent(productName),
        batchNo: batchNo || prev.batchNo,
      }));
      
      // ถ้าเป็นการแก้ไขและมีข้อมูลเดิม
      if (isEdit && existingData) {
        loadExistingData(existingData);
        // ยังต้องเรียก getDataMaster เพื่อเซ็ต chemicals ที่ไม่มีในข้อมูลเดิม
        getDataMaster();
      } else {
        // สำหรับกรณีอื่นๆ ให้เรียก getDataMaster เสมอ
        getDataMaster();
        
        // ถ้ามี batchId ให้ลองเช็คข้อมูลเดิมด้วย
        if (batchId) {
          fetchBatchData();
        }
      }
    }
  }, [productName, existingData, isEdit, batchNo, batchId]);

  // เพิ่มฟังก์ชันใหม่สำหรับ fetch batch data
  const fetchBatchData = async () => {
    try {
      const response = await axios.get(`/api/get/production/record-data/batches/${batchId}`);
      const data = response.data?.[0];
      
      if (data) {
        loadExistingData(data);
      } else {
        // ถ้าไม่มีข้อมูล ให้โหลด master data
        getDataMaster();
      }
    } catch (error) {
      console.error("Error fetching batch data:", error);
      // ถ้า error ให้โหลด master data
      getDataMaster();
    }
  };

  const loadChemicals = async () => {
    setChemicalsLoading(true);
    try {
      const response = await axios.get("/api/get/chemicals");
      setAllChemicals(response.data.chemicals || []);
    } catch (error) {
      console.error("Error loading chemicals:", error);
      showAlert("❌ เกิดข้อผิดพลาดในการโหลดรายการสารเคมี", "error");
    } finally {
      setChemicalsLoading(false);
    }
  };

  const showAlert = (message, severity = "success") => {
    setAlert({ open: true, message, severity });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmitStep = async (stepIndex) => {
    setLoading(true);
    try {
      let response;
      const currentBatchNo = parseInt(productionData.batchNo);
      const recordId = batchId; // ใช้ batchId ที่ส่งมาจาก production

      switch (stepIndex) {
        case 0:
          if (recordId) {
            response = await axios.put(
              `/api/put/production/update/record/${recordId}`,
              {
                batchNo: productionData.batchNo,
                recordDate: productionData.recordDate,
                productStatus: productionData.productStatus,
                programNo: productionData.programNo,
                productName: productionData.productName,
                shiftTime: productionData.shiftTime,
                operatorName: productionData.operatorName,
              }
            );
          } else {
            showAlert("ไม่พบ batchId สำหรับอัพเดทข้อมูล", "error");
            return;
          }
          break;

        case 1: {
          const chemistryNames = chemicalNames.map((obj) => {
            const val = Object.values(obj)[0];
            return val === "" ? null : val;
          });

          response = await axios.post(
            `/api/post/production/${recordId}/chemical-name/add`,
            {
              productionId: productionId,
              chemistryName: chemistryNames,
            }
          );
          break;
        }

        case 2:
          response = await axios.post(
            "/api/post/production/chemical-weight/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              Ref: parseFloat(chemicalWeights.ref),
              chemistryWeight: chemicalWeights.weights.map(
                (w) => parseFloat(w) || null
              ),
            }
          );
          break;

        case 3:
          response = await axios.post(
            "/api/post/production/mixing-step/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              ...mixingData,
            }
          );
          break;

        case 4:
          response = await axios.post(
            "/api/post/production/cutting-step/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              ...cuttingData,
            }
          );
          break;

        case 5:
          response = await axios.post(
            "/api/post/production/pre-press-step/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              ...prePressData,
            }
          );
          break;

        case 6:
          response = await axios.post(
            "/api/post/production/second-press/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              ...secondaryPressData,
            }
          );
          break;

        case 7:
          response = await axios.post(
            "/api/post/production/foam-check/add",
            {
              batchNo: currentBatchNo,
              productionId: productionId,
              ...foamCheckData,
            }
          );
          break;
      }

      showAlert(`✅ ${steps[stepIndex]} บันทึกสำเร็จ!`);
      if (stepIndex < steps.length - 1) {
        handleNext();
      }
    } catch (error) {
      console.error("Error saving step:", error);
      showAlert(`❌ เกิดข้อผิดพลาดในการบันทึก ${steps[stepIndex]}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    const icons = [
      <AccountIcon />,
      <ScienceIcon />,
      <InventoryIcon />,
      <BlenderIcon />,
      <CutIcon />,
      <CompressIcon />,
      <CompressIcon />,
      <CheckIcon />,
    ];
    return icons[step];
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <AccountIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  ข้อมูลพื้นฐานการผลิต
                  {isEdit && (
                    <Chip
                      label="โหมดดูข้อมูล"
                      color="info"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Batch Number"
                    type="number"
                    value={productionData.batchNo}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        batchNo: e.target.value,
                      })
                    }
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อผลิตภัณฑ์"
                    value={productionData.productName}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        productName: e.target.value,
                      })
                    }
                    className="foam-text-field foam-disabled-field"
                    disabled
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="สถานะ"
                    value={productionData.productStatus}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        productStatus: e.target.value,
                      })
                    }
                    className="foam-text-field foam-disabled-field"
                    disabled
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="โปรแกรมหมายเลข"
                    type="number"
                    value={productionData.programNo}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        programNo: e.target.value,
                      })
                    }
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="วันที่บันทึก"
                    type="text" // เปลี่ยนจาก "date" เป็น "text"
                    value={formatDateForDisplay(productionData.recordDate)} // แสดงเป็น dd/MM/yyyy
                    onChange={(e) => {
                      // ถ้าต้องการให้แก้ไขได้ ต้องเพิ่ม validation และ conversion
                      if (!isEdit) {
                        setProductionData({
                          ...productionData,
                          recordDate: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${isEdit ? "foam-disabled-field" : ""}`}
                    disabled={isEdit}
                    placeholder="dd/MM/yyyy"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อผู้ปฏิบัติงาน"
                    value={productionData.operatorName}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        operatorName: e.target.value,
                      })
                    }
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="กะ"
                    value={productionData.shiftTime}
                    onChange={(e) =>
                      setProductionData({
                        ...productionData,
                        shiftTime: e.target.value,
                      })
                    }
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <ScienceIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Chemical Names (15 สารเคมี)
                  {isEdit && (
                    <Chip
                      label="โหมดดูข้อมูล"
                      color="info"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={2} className="foam-form-grid">
                {chemicalNames.map((item, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <FormControl
                      fullWidth
                      className={`foam-text-field ${
                        isEdit ? "foam-disabled-field" : ""
                      }`}
                    >
                      <InputLabel id={`chemistry-${index}-label`}>
                        Chemistry {index + 1}
                      </InputLabel>
                      <Select
                        labelId={`chemistry-${index}-label`}
                        value={Object.values(item)[0]}
                        label={`Chemistry ${index + 1}`}
                        onChange={(e) => {
                          if (!isEdit) {
                            const newChemicals = [...chemicalNames];
                            newChemicals[index] = {
                              [`chemistry_${index + 1}`]: e.target.value,
                            };
                            setChemicalNames(newChemicals);
                          }
                        }}
                        disabled={isEdit || chemicalsLoading}
                      >
                        <MenuItem value="">
                          <em>-- เลือกสารเคมี --</em>
                        </MenuItem>
                        {allChemicals.map((chemical, chemIndex) => (
                          <MenuItem
                            key={`chemical-${chemIndex}`}
                            value={chemical.name}
                          >
                            {chemical.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ))}
              </Grid>

              {chemicalsLoading && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    กำลังโหลดรายการสารเคมี...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <InventoryIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Chemical Weights
                  {isEdit && (
                    <Chip
                      label="โหมดดูข้อมูล"
                      color="info"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reference Weight"
                    type="number"
                    value={chemicalWeights.ref}
                    onChange={(e) =>
                      setChemicalWeights({
                        ...chemicalWeights,
                        ref: e.target.value,
                      })
                    }
                    className={`foam-text-field foam-ref-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>
                {chemicalWeights.weights.map((weight, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <TextField
                      fullWidth
                      label={`Weight ${index + 1}`}
                      type="number"
                      value={weight}
                      onChange={(e) => {
                        if (!isEdit) {
                          const newWeights = [...chemicalWeights.weights];
                          newWeights[index] = e.target.value;
                          setChemicalWeights({
                            ...chemicalWeights,
                            weights: newWeights,
                          });
                        }
                      }}
                      className={`foam-text-field ${
                        isEdit ? "foam-disabled-field" : ""
                      }`}
                      disabled={isEdit}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        );

      case 3:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <BlenderIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Mixing Step
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                {Object.entries(mixingData).map(([key, value]) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      type={
                        [
                          "programNo",
                          "hopperWeight",
                          "lipHeat",
                          "casingA",
                          "casingB",
                          "tempHopper",
                          "longScrew",
                          "shortScrew",
                          "waterHeat",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={value}
                      onChange={(e) =>
                        setMixingData({
                          ...mixingData,
                          [key]: e.target.value,
                        })
                      }
                      className="foam-text-field"
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        );

      case 4:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CutIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Cutting Step
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    className="foam-section-title"
                  >
                    Weight Blocks (1-9)
                  </Typography>
                </Grid>
                {[
                  "wb1",
                  "wb2",
                  "wb3",
                  "wb4",
                  "wb5",
                  "wb6",
                  "wb7",
                  "wb8",
                  "wb9",
                ].map((key) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={`Weight Block ${key.slice(-1)}`}
                      type="number"
                      value={cuttingData[key]}
                      onChange={(e) =>
                        setCuttingData({
                          ...cuttingData,
                          [key]: e.target.value,
                        })
                      }
                      className="foam-text-field"
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    className="foam-section-title"
                  >
                    Additional Information
                  </Typography>
                </Grid>
                {["weightRemain", "staffSave", "startPress", "mixFinish"].map(
                  (key) => (
                    <Grid item xs={12} md={6} key={key}>
                      <TextField
                        fullWidth
                        label={key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                        type={key === "weightRemain" ? "number" : "text"}
                        value={cuttingData[key]}
                        onChange={(e) =>
                          setCuttingData({
                            ...cuttingData,
                            [key]: e.target.value,
                          })
                        }
                        className="foam-text-field"
                      />
                    </Grid>
                  )
                )}
              </Grid>
            </Paper>
          </Fade>
        );

      case 5:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CompressIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Pre Press Step
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                {Object.entries(prePressData).map(([key, value]) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      type={
                        [
                          "prePressHeat",
                          "waterHeat1",
                          "waterHeat2",
                          "topHeat",
                          "layerHeat1",
                          "layerHeat2",
                          "layerHeat3",
                          "layerHeat4",
                          "layerHeat5",
                          "layerHeat6",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={value}
                      onChange={(e) =>
                        setPrePressData({
                          ...prePressData,
                          [key]: e.target.value,
                        })
                      }
                      className="foam-text-field"
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        );

      case 6:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CompressIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Secondary Press Step
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                {Object.entries(secondaryPressData).map(([key, value]) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      type={
                        [
                          "machineNo",
                          "foamWidth",
                          "foamLength",
                          "heatCheckA",
                          "heatCheckB",
                          "heatExit",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={value}
                      onChange={(e) =>
                        setSecondaryPressData({
                          ...secondaryPressData,
                          [key]: e.target.value,
                        })
                      }
                      className="foam-text-field"
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        );

      case 7:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CheckIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Foam Check Step
                </Typography>
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Run Number"
                    type="number"
                    value={foamCheckData.runNo}
                    onChange={(e) =>
                      setFoamCheckData({
                        ...foamCheckData,
                        runNo: e.target.value,
                      })
                    }
                    className="foam-text-field"
                    required
                  />
                </Grid>
                {[
                  "layer1",
                  "layer2",
                  "layer3",
                  "layer4",
                  "layer5",
                  "layer6",
                ].map((key) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={`Layer ${key.slice(-1)}`}
                      value={foamCheckData[key]}
                      onChange={(e) =>
                        setFoamCheckData({
                          ...foamCheckData,
                          [key]: e.target.value,
                        })
                      }
                      className="foam-text-field"
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Entry Data"
                    multiline
                    rows={4}
                    value={foamCheckData.entryData}
                    onChange={(e) =>
                      setFoamCheckData({
                        ...foamCheckData,
                        entryData: e.target.value,
                      })
                    }
                    className="foam-text-field foam-textarea"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      default:
        return "Unknown step";
    }
  };

  const loadExistingData = (data) => {
    try {
      // ฟังก์ชันแปลงวันที่จาก dd/MM/yyyy เป็น yyyy-MM-dd สำหรับ input type="date"
      const convertDateForInput = (dateString) => {
        if (!dateString) return "";

        if (dateString.includes("/")) {
          const parts = dateString.split("/");
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }
        }

        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        } catch {
          return "";
        }

        return "";
      };

      // โหลดข้อมูลพื้นฐาน (Step 0)
      setProductionData(prev => ({
        ...prev,
        batchNo: data.batch_no || prev.batchNo,
        recordDate: convertDateForInput(data.record_date) || prev.recordDate,
        productStatus: data.product_status || prev.productStatus,
        programNo: data.program_no || prev.programNo,
        productName: data.product_name || prev.productName,
        shiftTime: data.shift_time || prev.shiftTime,
        operatorName: data.operator_name || prev.operatorName,
      }));

      // โหลดข้อมูล chemical names (Step 1)
      const chemicalNames = [];
      for (let i = 1; i <= 15; i++) {
        const chemicalValue = data[`chemistry_${i}`] || "";
        chemicalNames.push({ [`chemistry_${i}`]: chemicalValue });
      }
      setChemicalNames(chemicalNames);

      // โหลดข้อมูล chemical weights (Step 2)
      if (data.ref || data.chemistry_weight_1) {
        const weights = [];
        for (let i = 1; i <= 15; i++) {
          weights.push(data[`chemistry_weight_${i}`] || "");
        }
        setChemicalWeights({
          ref: data.ref || "",
          weights: weights
        });
      }

      // โหลดข้อมูล mixing step (Step 3)
      if (data.program_no_mixing || data.hopper_weight) {
        setMixingData({
          programNo: data.program_no_mixing || "",
          hopperWeight: data.hopper_weight || "",
          actualTime: data.actual_time || "",
          mixingFinish: data.mixing_finish || "",
          lipHeat: data.lip_heat || "",
          casingA: data.casing_a || "",
          casingB: data.casing_b || "",
          tempHopper: data.temp_hopper || "",
          longScrew: data.long_screw || "",
          shortScrew: data.short_screw || "",
          waterHeat: data.water_heat || "",
        });
      }

      showAlert(`✅ โหลดข้อมูลเดิมของ Batch ${data.batch_no} สำเร็จ`, "info");
    } catch (error) {
      console.error("Error loading existing data:", error);
      showAlert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูลเดิม", "error");
    }
  };

  // ฟังก์ชันแปลงวันที่เป็น dd/MM/yyyy สำหรับการแสดงผล
  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      // ถ้า dateValue เป็น yyyy-MM-dd
      if (dateValue.includes("-") && dateValue.length === 10) {
        const [year, month, day] = dateValue.split("-");
        return `${day}/${month}/${year}`;
      }
      
      // ถ้าเป็นรูปแบบอื่น
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return dateValue;
    } catch {
      return dateValue;
    }
  };

  return (
    <div className="foam-main-container">
      <Container maxWidth="xl" className="foam-container">
        <Fade in timeout={800}>
          <Paper elevation={0} className="foam-paper">
            <Box className="foam-header">
              <Typography
                variant="h4"
                component="h1"
                className="foam-page-title"
              >
                {isEdit
                  ? "บันทึกข้อมูลเพิ่มเติมการผลิต Foam"
                  : "บันทึกข้อมูลการผลิต Foam"}
              </Typography>
              <Typography variant="subtitle1" className="foam-page-subtitle">
                สำหรับผลิตภัณฑ์: {decodeURIComponent(productName || "")}
                {batchNo && ` | Batch: ${batchNo}`}
                {isEdit && <Chip label="ฉบับร่าง" color="warning" size="small" sx={{ ml: 1 }} />}
              </Typography>
            </Box>

            <Box className="foam-stepper-container">
              <Stepper
                activeStep={activeStep}
                className="foam-stepper"
                alternativeLabel
              >
                {steps.map((label, index) => (
                  <Step key={label} className="foam-step">
                    <StepLabel
                      icon={getStepIcon(index)}
                      className="foam-step-label"
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box className="foam-step-content-container">
              {renderStepContent(activeStep)}
            </Box>

            <Box className="foam-navigation-buttons">
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<BackIcon />}
                className="foam-back-button"
                variant="outlined"
              >
                ย้อนกลับ
              </Button>

              {/* ซ่อนปุ่มบันทึกเมื่อเป็นโหมดดูข้อมูล */}
              {!isEdit && (
                <Button
                  variant="contained"
                  onClick={() => handleSubmitStep(activeStep)}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  className="foam-save-button"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              )}

              {activeStep < steps.length - 1 && (
                <Button
                  onClick={handleNext}
                  endIcon={<NextIcon />}
                  className="foam-next-button"
                  variant="contained"
                >
                  ถัดไป
                </Button>
              )}
            </Box>
          </Paper>
        </Fade>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
          className="foam-snackbar"
        >
          <Alert
            onClose={() => setAlert({ ...alert, open: false })}
            severity={alert.severity}
            className="foam-alert"
            sx={{ width: "100%" }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default FoamRecord;
