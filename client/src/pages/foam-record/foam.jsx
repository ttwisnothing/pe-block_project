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
  const existingData = location.state?.existingData;
  const isEdit = location.state?.isEdit || false;
  const batchNo = location.state?.batchNo;
  const batchId = location.state?.batchId;

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

      const params = new URLSearchParams({
        product_name: extractedProductName,
      });
      if (extractedColor) params.append("color", extractedColor);

      const response = await axios.get(
        `/api/get/all-products?${params.toString()}`
      );
      const data = response.data;

      setProductionData((prev) => ({
        ...prev,
        productName: data.productName || productName,
        productStatus: data.status || prev.productStatus,
      }));

      // เช็คว่าเป็นการโหลดข้อมูลใหม่หรือมีข้อมูลเดิมแล้ว
      if (Array.isArray(data.chemicals)) {
        setChemicalNames((prevChemicals) => {
          // เช็คว่ามีข้อมูล Chemical Names เดิมไหม
          const hasExistingData = prevChemicals.some(
            (chemical) =>
              Object.values(chemical)[0] &&
              Object.values(chemical)[0].trim() !== ""
          );

          if (hasExistingData) {
            return prevChemicals;
          }

          const newChemicalNames = Array(15)
            .fill("")
            .map((_, i) => {
              const chemicalName = data.chemicals[i] || "";
              return { [`chemistry_${i + 1}`]: chemicalName };
            });
          return newChemicalNames;
        });
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      showAlert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูลผลิตภัณฑ์", "error");
    }
  };

  // Chemical Name State
  const [chemicalNames, setChemicalNames] = useState(
    Array(15)
      .fill("")
      .map((_, i) => ({ [`chemistry_${i + 1}`]: "" }))
  );

  // Chemical Weight State - ลบ ref field
  const [chemicalWeights, setChemicalWeights] = useState({
    weights: Array(15).fill(""), // เก็บไว้ 15 ตัว
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
    // โหลด chemicals list ก่อนเสมอ
    loadChemicals();

    if (productName) {
      setProductionData((prev) => ({
        ...prev,
        productName: decodeURIComponent(productName),
        batchNo: batchNo || prev.batchNo,
      }));

      // ถ้าเป็นการแก้ไขและมีข้อมูลเดิม
      if (isEdit && existingData) {
        loadExistingData(existingData);

        // *** เพิ่มการเซ็ต active step ไปที่ step ที่ยังไม่เสร็จ ***
        const incompleteStep = findFirstIncompleteStep(existingData);
        setActiveStep(incompleteStep);
        console.log(
          `🎯 ไปที่ step ${incompleteStep} (${steps[incompleteStep]}) - ยังไม่บันทึก`
        );

        setTimeout(() => {
          getDataMaster();
        }, 100);
      } else {
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
      const response = await axios.get(
        `/api/get/production/record-data/batches/${batchId}`
      );
      const data = response.data?.[0];

      if (data) {
        loadExistingData(data);

        // *** เพิ่มการเซ็ต active step ไปที่ step ที่ยังไม่เสร็จ ***
        const incompleteStep = findFirstIncompleteStep(data);
        setActiveStep(incompleteStep);

        setTimeout(() => {
          getDataMaster();
        }, 100);
      } else {
        setActiveStep(0);
        getDataMaster();
      }
    } catch (error) {
      console.error("Error fetching batch data:", error);
      setActiveStep(0);
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

      switch (stepIndex) {
        case 0:
          if (batchId) {
            // ใช้ batchId ตรงๆ
            response = await axios.put(
              `/api/put/production/update/record/${batchId}`, // ใช้ batchId ตรงๆ
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
            return val === "" ? " " : val;
          });

          response = await axios.post(
            `/api/post/production/${batchId}/chemical-name/add`,
            {
              productionId: productionId,
              chemistryName: chemistryNames,
            }
          );
          break;
        }

        case 2: {
          // ประมวลผล chemicalWeights ให้เป็น number และ default เป็น 0 เฉพาะตอนส่ง
          const processedWeights = chemicalWeights.weights.map((w) => {
            if (w === "" || w === null || w === undefined) {
              return 0.0; // ส่งเป็น 0 ไปยัง database เฉพาะตอนบันทึก
            }
            const numValue = parseFloat(w);
            return isNaN(numValue) ? 0.0 : numValue;
          });

          response = await axios.post(
            `/api/post/production/${batchId}/chemical-weight/add`,
            {
              productionId: productionId,
              chemistryWeight: processedWeights, // ส่งครบ 15 ตัว
            }
          );
          break;
        }

        case 3:
          response = await axios.post(
            `/api/post/production/${batchId}/mixing-step/add`,
            {
              productionId: productionId,
              ...mixingData,
            }
          );
          break;

        case 4:
          response = await axios.post(
            `/api/post/production/${batchId}/cutting-step/add`,
            {
              productionId: productionId,
              ...cuttingData,
            }
          );
          break;

        case 5:
          response = await axios.post(
            `/api/post/production/${batchId}/pre-press-step/add`,
            {
              productionId: productionId,
              ...prePressData,
            }
          );
          break;

        case 6:
          response = await axios.post(
            `/api/post/production/${batchId}/second-press/add`,
            {
              productionId: productionId,
              ...secondaryPressData,
            }
          );
          break;

        case 7:
          response = await axios.post(
            `/api/post/production/${batchId}/foam-check/add`,
            {
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
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
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

              {/* เพิ่ม Ref Chip */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={`Ref: ${productionData.batchNo ? (parseFloat(productionData.batchNo) + 0.3).toFixed(1) : '0.3'}`}
                  color="primary"
                  variant="outlined"
                  size="large"
                  sx={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold',
                    py: 2,
                    px: 3,
                    height: 'auto',
                    '& .MuiChip-label': {
                      px: 2,
                      py: 1
                    }
                  }}
                />
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                {chemicalWeights.weights.map((weight, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <TextField
                      fullWidth
                      label={`Weight ${index + 1}`}
                      type="number"
                      value={weight}
                      placeholder="0.00" // เพิ่ม placeholder
                      onChange={(e) => {
                        if (!isEdit) {
                          const newWeights = [...chemicalWeights.weights];
                          newWeights[index] = e.target.value;
                          setChemicalWeights({
                            weights: newWeights,
                          });
                        }
                      }}
                      className={`foam-text-field ${
                        isEdit ? "foam-disabled-field" : ""
                      }`}
                      disabled={isEdit}
                      InputProps={{
                        inputProps: { 
                          min: 0, 
                          step: "0.01",
                          style: { 
                            color: weight === "" ? "#999" : "inherit" // สีอ่อนถ้าเป็นช่องว่าง
                          }
                        }
                      }}
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
                      onChange={(e) => {
                        if (!isEdit) {
                          setMixingData({
                            ...mixingData,
                            [key]: e.target.value,
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

      case 4:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CutIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Cutting Step
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
                      onChange={(e) => {
                        if (!isEdit) {
                          setCuttingData({
                            ...cuttingData,
                            [key]: e.target.value,
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
                        onChange={(e) => {
                          if (!isEdit) {
                            setCuttingData({
                              ...cuttingData,
                              [key]: e.target.value,
                            });
                          }
                        }}
                        className={`foam-text-field ${
                          isEdit ? "foam-disabled-field" : ""
                        }`}
                        disabled={isEdit}
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
                      onChange={(e) => {
                        if (!isEdit) {
                          setPrePressData({
                            ...prePressData,
                            [key]: e.target.value,
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

      case 6:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CompressIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Secondary Press Step
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
                      onChange={(e) => {
                        if (!isEdit) {
                          setSecondaryPressData({
                            ...secondaryPressData,
                            [key]: e.target.value,
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

      case 7:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <CheckIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Foam Check Step
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
                {/* Run Number */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Run Number"
                    type="number"
                    value={foamCheckData.runNo}
                    onChange={(e) => {
                      if (!isEdit) {
                        setFoamCheckData({
                          ...foamCheckData,
                          runNo: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                    required
                  />
                </Grid>

                {/* Entry Data - ย้ายขึ้นมาแทน Layer 1 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Entry Data"
                    value={foamCheckData.entryData}
                    onChange={(e) => {
                      if (!isEdit) {
                        setFoamCheckData({
                          ...foamCheckData,
                          entryData: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>

                {/* Section Title สำหรับ Layers */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    className="foam-section-title"
                    sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                  >
                    Layer Information
                  </Typography>
                </Grid>

                {/* Layers 1-6 เรียงด้วยกัน */}
                {[
                  "layer1",
                  "layer2",
                  "layer3",
                  "layer4",
                  "layer5",
                  "layer6",
                ].map((key, index) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={`Layer ${index + 1}`}
                      value={foamCheckData[key]}
                      onChange={(e) => {
                        if (!isEdit) {
                          setFoamCheckData({
                            ...foamCheckData,
                            [key]: e.target.value,
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

      default:
        return "Unknown step";
    }
  };

  const loadExistingData = (data) => {
    try {
      const convertDateForInput = (dateString) => {
        if (!dateString) return new Date().toISOString().split("T")[0];

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
          return new Date().toISOString().split("T")[0];
        }

        return new Date().toISOString().split("T")[0];
      };

      // โหลดข้อมูลพื้นฐาน
      setProductionData((prev) => ({
        ...prev,
        batchNo: data.FMBR_batchNo || prev.batchNo,
        recordDate: convertDateForInput(data.FMBR_recDate) || prev.recordDate,
        productStatus: data.FMBR_productStatus || prev.productStatus,
        programNo: data.FMBR_programNo || prev.programNo,
        productName: data.FMPR_productName || prev.productName,
        shiftTime: data.FMBR_shift || prev.shiftTime,
        operatorName: data.FMBR_operator || prev.operatorName,
      }));

      // โหลด chemical names - ป้องกันการเขียนทับ
      const chemicalNames = [];
      let hasChemicalData = false;

      for (let i = 1; i <= 15; i++) {
        const chemicalValue = data[`FMCN_chemicalName_${i}`] || "";
        const cleanValue = chemicalValue === " " ? "" : chemicalValue;

        if (cleanValue.trim() !== "") {
          hasChemicalData = true;
        }

        chemicalNames.push({ [`chemistry_${i}`]: cleanValue });
      }

      if (hasChemicalData) {
        setChemicalNames(chemicalNames);
      }

      // โหลด chemical weights - แสดงช่องว่างถ้า null หรือ 0
      const weights = [];
      let hasWeightData = false;

      for (let i = 1; i <= 15; i++) {
        const weightValue = data[`FMCW_chemicalWeight_${i}`];
        let finalWeight = "";
        
        // เช็คว่ามีค่าจริงหรือไม่
        if (weightValue !== null && weightValue !== undefined && weightValue !== "") {
          const numWeight = parseFloat(weightValue);
          if (!isNaN(numWeight) && numWeight > 0) {
            finalWeight = numWeight.toString();
            hasWeightData = true;
          }
          // ถ้าเป็น 0 ให้เป็นช่องว่าง
        }
        
        weights.push(finalWeight);
      }

      setChemicalWeights({
        weights: weights, // จะเป็น "" หรือ ค่าจริง ไม่มี 0
      });

      // โหลด mixing step
      setMixingData({
        programNo: data.program_no_mix || "",
        hopperWeight: data.hopper_weight || "",
        actualTime: data.actual_press || "",
        mixingFinish: data.mixing_finish_mix || "",
        lipHeat: data.lip_heat || "",
        casingA: data.casing_a_heat || "",
        casingB: data.casing_b_heat || "",
        tempHopper: data.hopper_heat || "",
        longScrew: data.long_screw || "",
        shortScrew: data.short_screw || "",
        waterHeat: data.water_heating || "",
      });

      // โหลด cutting step
      setCuttingData({
        wb1: data.weight_block_1 || "",
        wb2: data.weight_block_2 || "",
        wb3: data.weight_block_3 || "",
        wb4: data.weight_block_4 || "",
        wb5: data.weight_block_5 || "",
        wb6: data.weight_block_6 || "",
        wb7: data.weight_block_7 || "",
        wb8: data.weight_block_8 || "",
        wb9: data.weight_block_9 || "",
        weightRemain: data.weight_remain || "",
        staffSave: data.staff_data_save || "",
        startPress: data.start_press || "",
        mixFinish: data.mixing_finish_cut || "",
      });

      // โหลด pre press step
      setPrePressData({
        prePressHeat: data.pre_press_heat || "",
        waterHeat1: data.water_heating_a || "",
        waterHeat2: data.water_heating_b || "",
        bakeTimePre: data.bake_time_pre_press || "",
        topHeat: data.top_heat || "",
        layerHeat1: data.layer_a_heat || "",
        layerHeat2: data.layer_b_heat || "",
        layerHeat3: data.layer_c_heat || "",
        layerHeat4: data.layer_d_heat || "",
        layerHeat5: data.layer_e_heat || "",
        layerHeat6: data.layer_f_heat || "",
        injectorStaff: data.injector_agent || "",
        bakeTimePrimary: data.bake_time_primary_press || "",
      });

      // โหลด secondary press step
      setSecondaryPressData({
        machineNo: data.machine_no || "",
        streamInPress: data.stream_in_press || "",
        foamWidth: data.foam_width || "",
        foamLength: data.foam_length || "",
        bakeTimeSecondary: data.bake_time_secondary || "",
        sprayAgent: data.spray_agent || "",
        heatCheckA: data.heat_check_a || "",
        heatCheckB: data.heat_check_b || "",
        heatExit: data.heat_exit || "",
      });

      // โหลด foam check step
      setFoamCheckData({
        runNo: data.run_no || "",
        layer1: data.layer_1 || "",
        layer2: data.layer_2 || "",
        layer3: data.layer_3 || "",
        layer4: data.layer_4 || "",
        layer5: data.layer_5 || "",
        layer6: data.layer_6 || "",
        entryData: data.clerk_entry_data || "",
      });

      showAlert(
        `✅ โหลดข้อมูลเดิมของ Batch ${data.FMBR_batchNo} สำเร็จ`,
        "info"
      );
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

  // เพิ่มฟังก์ชันเช็คว่า step ไหนยังไม่บันทึก
  const checkStepCompletion = (stepIndex, data) => {
    switch (stepIndex) {
      case 0: // ข้อมูลพื้นฐาน
        return !!(data.FMBR_operator && data.FMBR_shift && data.FMBR_programNo);

      case 1: // Chemical Names
        for (let i = 1; i <= 15; i++) {
          const chemValue = data[`FMCN_chemicalName_${i}`];
          if (chemValue && chemValue.trim() !== "" && chemValue !== " ") {
            return true;
          }
        }
        return false;

      case 2: {// Chemical Weights - เช็คให้ละเอียดขึ้น
        let hasWeights = false;
        for (let i = 1; i <= 15; i++) {
          const weightValue = data[`FMCW_chemicalWeight_${i}`];
          // เช็คว่ามีค่าจริงและมากกว่า 0
          if (weightValue !== null && weightValue !== undefined && weightValue !== "") {
            const numWeight = parseFloat(weightValue);
            if (!isNaN(numWeight) && numWeight > 0) {
              hasWeights = true;
              break;
            }
          }
        }
        
        return hasWeights; // ลบการเช็ค ref
      }

      case 3: // Mixing
        return !!(
          data.hopper_weight ||
          data.actual_press ||
          data.mixing_finish_mix
        );

      case 4: // Cutting
        return !!(
          data.weight_block_1 ||
          data.weight_remain ||
          data.staff_data_save
        );

      case 5: // Pre Press
        return !!(data.pre_press_heat || data.water_heating_a || data.top_heat);

      case 6: // Secondary Press
        return !!(data.machine_no || data.foam_width || data.foam_length);

      case 7: // Foam Check
        return !!(data.run_no || data.layer_1 || data.clerk_entry_data);

      default:
        return false;
    }
  };

  // เพิ่มฟังก์ชันหา step แรกที่ยังไม่บันทึก
  const findFirstIncompleteStep = (existingData) => {
    if (!existingData) return 0;

    for (let i = 0; i < steps.length; i++) {
      if (!checkStepCompletion(i, existingData)) {
        return i;
      }
    }
    return 0; // ถ้าทุก step เสร็จแล้วก็กลับไป step แรก
  };

  // เพิ่มฟังก์ชันเช็คสถานะของแต่ละ step
  const getStepStatus = (stepIndex) => {
    if (!existingData) return "pending";

    const isCompleted = checkStepCompletion(stepIndex, existingData);
    return isCompleted ? "completed" : "pending";
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
                {isEdit && (
                  <Chip
                    label="สมบูรณ์"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Box>

            <Box className="foam-stepper-container">
              <Stepper
                activeStep={activeStep}
                className="foam-stepper"
                alternativeLabel
              >
                {steps.map((label, index) => {
                  const stepStatus = getStepStatus(index);
                  return (
                    <Step
                      key={label}
                      className={`foam-step ${
                        stepStatus === "completed" ? "completed-step" : ""
                      }`}
                      completed={stepStatus === "completed"}
                    >
                      <StepLabel
                        icon={getStepIcon(index)}
                        className="foam-step-label"
                      >
                        <Box>
                          {label}
                          {stepStatus === "completed" && (
                            <Chip
                              label="✓"
                              size="small"
                              color="success"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      </StepLabel>
                    </Step>
                  );
                })}
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
