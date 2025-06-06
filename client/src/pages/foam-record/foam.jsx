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
  Scale as ScaleIcon,
  Verified as VerifiedIcon,
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
  "Primary Press", // เพิ่ม step ใหม่
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
    actualStart: "",
    mixFinish: "",
    lip: "",
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
    tempPrePress: "",
    waterHeat1: "",
    waterHeat2: "",
    bakeTimePrePress: "",
  });

  // Primary Press State
  const [primaryPressData, setPrimaryPressData] = useState({
    programNo: "",
    topTemp: "",
    tempBlock1: "",
    tempBlock2: "",
    tempBlock3: "",
    tempBlock4: "",
    tempBlock5: "",
    tempBlock6: "",
    empSpray: "",
    bakeTimePrimary: "",
  });

  // Secondary Press State - แก้ไขให้ตรงกับ model
  const [secondaryPressData, setSecondaryPressData] = useState({
    machineNo: "",
    programNo: "",
    streamInPress: "",
    foamWidth: "",
    foamLength: "",
    bakeSecondaryTime: "",
    injectEmp: "",
    tempCheck1: "",
    tempCheck2: "",
    tempOut: "",
  });

  // Foam Check State - แก้ไขให้ตรงกับ model
  const [foamCheckData, setFoamCheckData] = useState({
    runNo: "",
    foamBlock1: "", // เปลี่ยนเป็น "OK" หรือ "NG"
    foamBlock2: "",
    foamBlock3: "",
    foamBlock4: "",
    foamBlock5: "",
    foamBlock6: "",
    employeeRecord: "",
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
            response = await axios.put(
              `/api/put/production/update/record/${batchId}`,
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
          const processedWeights = chemicalWeights.weights.map((w) => {
            if (w === "" || w === null || w === undefined) {
              return 0.0;
            }
            const numValue = parseFloat(w);
            return isNaN(numValue) ? 0.0 : numValue;
          });

          response = await axios.post(
            `/api/post/production/${batchId}/chemical-weight/add`,
            {
              productionId: productionId,
              chemistryWeight: processedWeights,
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
            `/api/post/production/${batchId}/primary-press/add`,
            {
              productionId: productionId,
              ...primaryPressData,
            }
          );
          break;

        case 7:
          response = await axios.post(
            `/api/post/production/${batchId}/second-press/add`,
            {
              productionId: productionId,
              ...secondaryPressData,
            }
          );
          break;

        case 8:
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
      <ScaleIcon />,
      <BlenderIcon />,
      <CutIcon />,
      <CompressIcon />,
      <CompressIcon />,
      <CompressIcon />,
      <VerifiedIcon />,
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
                        value={Object.values(item)[0] === " " ? "" : Object.values(item)[0]}
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
                <ScaleIcon className="foam-step-icon" />
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
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Chip
                  label={`Ref: ${
                    productionData.batchNo
                      ? (parseFloat(productionData.batchNo) + 0.3).toFixed(1)
                      : "0.3"
                  }`}
                  color="primary"
                  variant="outlined"
                  size="large"
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    py: 2,
                    px: 3,
                    height: "auto",
                    "& .MuiChip-label": {
                      px: 2,
                      py: 1,
                    },
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
                            color: weight === "" ? "#999" : "inherit", // สีอ่อนถ้าเป็นช่องว่าง
                          },
                        },
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
                      InputProps={{
                        inputProps: {
                          min: 0,
                          step: "0.01", // รองรับทศนิยม 2 ตำแหน่ง
                          placeholder: "0.00",
                        },
                      }}
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
                {["weightRemain"].map((key) => (
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
                      InputProps={{
                        inputProps: {
                          min: 0,
                          step: "0.01", // รองรับทศนิยม 2 ตำแหน่ง
                          placeholder: "0.00",
                        },
                      }}
                    />
                  </Grid>
                ))}
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
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Temperature Pre Press"
                    type="number"
                    value={prePressData.tempPrePress}
                    onChange={(e) => {
                      if (!isEdit) {
                        setPrePressData({
                          ...prePressData,
                          tempPrePress: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Water Heat 1"
                    type="number"
                    value={prePressData.waterHeat1}
                    onChange={(e) => {
                      if (!isEdit) {
                        setPrePressData({
                          ...prePressData,
                          waterHeat1: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Water Heat 2"
                    type="number"
                    value={prePressData.waterHeat2}
                    onChange={(e) => {
                      if (!isEdit) {
                        setPrePressData({
                          ...prePressData,
                          waterHeat2: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bake Time Pre Press"
                    value={prePressData.bakeTimePrePress}
                    onChange={(e) => {
                      if (!isEdit) {
                        setPrePressData({
                          ...prePressData,
                          bakeTimePrePress: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>
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
                  Primary Press Step
                  {isEdit && (
                    <Chip
                      label="โหมดดูข้อมูล"
                      color="info"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
              </Box>

              <Grid container spacing={3} className="foam-form-grid">
                {Object.entries(primaryPressData).map(([key, value]) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <TextField
                      fullWidth
                      label={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      type={
                        [
                          "programNo",
                          "topTemp",
                          "tempBlock1",
                          "tempBlock2",
                          "tempBlock3",
                          "tempBlock4",
                          "tempBlock5",
                          "tempBlock6",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={value}
                      onChange={(e) => {
                        if (!isEdit) {
                          setPrimaryPressData({
                            ...primaryPressData,
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
                          "programNo",
                          "foamWidth",
                          "foamLength",
                          "tempCheck1",
                          "tempCheck2",
                          "tempOut",
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

      case 8:
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <VerifiedIcon className="foam-step-icon" />
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

                {/* Employee Record */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee Record"
                    value={foamCheckData.employeeRecord}
                    onChange={(e) => {
                      if (!isEdit) {
                        setFoamCheckData({
                          ...foamCheckData,
                          employeeRecord: e.target.value,
                        });
                      }
                    }}
                    className={`foam-text-field ${
                      isEdit ? "foam-disabled-field" : ""
                    }`}
                    disabled={isEdit}
                  />
                </Grid>

                {/* Section Title สำหรับ Foam Blocks */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    className="foam-section-title"
                    sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                  >
                    Foam Block Quality Check (OK/NG)
                  </Typography>
                </Grid>

                {/* Foam Blocks 1-6 - เปลี่ยนเป็น Dropdown */}
                {[
                  "foamBlock1",
                  "foamBlock2",
                  "foamBlock3",
                  "foamBlock4",
                  "foamBlock5",
                  "foamBlock6",
                ].map((key, index) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <FormControl
                      fullWidth
                      className={`foam-text-field ${
                        isEdit ? "foam-disabled-field" : ""
                      }`}
                    >
                      <InputLabel id={`foam-block-${index + 1}-label`}>
                        Foam Block {index + 1}
                      </InputLabel>
                      <Select
                        labelId={`foam-block-${index + 1}-label`}
                        value={foamCheckData[key]}
                        label={`Foam Block ${index + 1}`}
                        onChange={(e) => {
                          if (!isEdit) {
                            setFoamCheckData({
                              ...foamCheckData,
                              [key]: e.target.value,
                            });
                          }
                        }}
                        disabled={isEdit}
                        sx={{
                          "& .MuiSelect-select": {
                            color:
                              foamCheckData[key] === "OK"
                                ? "green"
                                : foamCheckData[key] === "NG"
                                ? "red"
                                : "inherit",
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>-- เลือกสถานะ --</em>
                        </MenuItem>
                        <MenuItem
                          value="OK"
                          sx={{ color: "green", fontWeight: "bold" }}
                        >
                          ✓ OK
                        </MenuItem>
                        <MenuItem
                          value="NG"
                          sx={{ color: "red", fontWeight: "bold" }}
                        >
                          ✗ NG
                        </MenuItem>
                      </Select>
                    </FormControl>
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

      // โหลด chemical names - *** เปลี่ยนให้แสดง " " แทน "-- ไม่ได้เลือก --" ***
      const chemicalNames = [];
      let hasChemicalData = false;

      for (let i = 1; i <= 15; i++) {
        const chemicalValue = data[`FMCN_chemicalName_${i}`] || "";
        let displayValue = chemicalValue;
        if (chemicalValue === " " || chemicalValue.trim() === "") {
          displayValue = " ";
        }

        if (chemicalValue.trim() !== "" && chemicalValue !== " ") {
          hasChemicalData = true;
        }

        chemicalNames.push({ [`chemistry_${i}`]: displayValue });
      }

      if (hasChemicalData || data.FMCN_chemicalName_1) {
        setChemicalNames(chemicalNames);
      }

      // โหลด chemical weights - แสดง "0.00" แทนช่องว่าง
      const weights = [];

      for (let i = 1; i <= 15; i++) {
        const weightValue = data[`FMCW_chemicalWeight_${i}`];
        let finalWeight = "0.00";

        // เช็คว่ามีค่าจริงหรือไม่
        if (weightValue !== null && weightValue !== undefined && weightValue !== "") {
          const numWeight = parseFloat(weightValue);
          if (!isNaN(numWeight)) {
            finalWeight = numWeight.toFixed(2);
          }
        }

        weights.push(finalWeight);
      }

      setChemicalWeights({
        weights: weights,
      });

      // โหลด mixing step
      setMixingData({
        programNo: data.FMMX_programNo || data.FMBR_programNo || "",
        hopperWeight: data.FMMX_hopperWeight || "",
        actualStart: data.FMMX_actualStart || "", // เปลี่ยนจาก actualTime
        mixFinish: data.FMMX_mixFinish || "",
        lip: data.FMMX_lip || "",
        casingA: data.FMMX_casingA || "",
        casingB: data.FMMX_casingB || "",
        tempHopper: data.FMMX_tempHopper || "",
        longScrew: data.FMMX_longScrew || "",
        shortScrew: data.FMMX_shortScrew || "",
        waterHeat: data.FMMX_waterHeat || "",
      });

      // โหลด cutting step
      setCuttingData({
        wb1: data.FMCU_weightBlock_1 || "",
        wb2: data.FMCU_weightBlock_2 || "",
        wb3: data.FMCU_weightBlock_3 || "",
        wb4: data.FMCU_weightBlock_4 || "",
        wb5: data.FMCU_weightBlock_5 || "",
        wb6: data.FMCU_weightBlock_6 || "",
        wb7: data.FMCU_weightBlock_7 || "",
        wb8: data.FMCU_weightBlock_8 || "",
        wb9: data.FMCU_weightBlock_9 || "",
        weightRemain: data.FMCU_weightBlockRemain || "",
      });

      // โหลด pre press step (เหลือ 4 fields)
      setPrePressData({
        tempPrePress: data.FMPP_tempPrePress || "",
        waterHeat1: data.FMPP_waterHeat_1 || "",
        waterHeat2: data.FMPP_waterHeat_2 || "",
        bakeTimePrePress: data.FMPP_bakeTimePrePress || "",
      });

      // โหลด primary press step (ใหม่)
      setPrimaryPressData({
        programNo: data.FMPMP_programNo || data.FMBR_programNo || "",
        topTemp: data.FMPMP_topTemp || "",
        tempBlock1: data.FMPMP_tempBlock_1 || "",
        tempBlock2: data.FMPMP_tempBlock_2 || "",
        tempBlock3: data.FMPMP_tempBlock_3 || "",
        tempBlock4: data.FMPMP_tempBlock_4 || "",
        tempBlock5: data.FMPMP_tempBlock_5 || "",
        tempBlock6: data.FMPMP_tempBlock_6 || "",
        empSpray: data.FMPMP_empSpray || "",
        bakeTimePrimary: data.FMPMP_bakeTimePrimary || "",
      });

      // โหลด secondary press step
      setSecondaryPressData({
        machineNo: data.FMSP_machineNo || "",
        programNo: data.FMSP_programNo || data.FMBR_programNo || "",
        streamInPress: data.FMSP_steamInPress || "",
        foamWidth: data.FMSP_widthFoam || "",
        foamLength: data.FMSP_lengthFoam || "",
        bakeSecondaryTime: data.FMSP_bakeSecondaryTime || "",
        injectEmp: data.FMSP_injectEmp || "",
        tempCheck1: data.FMSP_tempCheck_1 || "",
        tempCheck2: data.FMSP_tempCheck_2 || "",
        tempOut: data.FMSP_tempOut || "",
      });

      // โหลด foam check step - รองรับทั้ง OK/NG และตัวเลข
      setFoamCheckData({
        runNo: data.FMFC_runNo || "",
        foamBlock1: data.FMFC_foamBlock_1 || "",
        foamBlock2: data.FMFC_foamBlock_2 || "",
        foamBlock3: data.FMFC_foamBlock_3 || "",
        foamBlock4: data.FMFC_foamBlock_4 || "",
        foamBlock5: data.FMFC_foamBlock_5 || "",
        foamBlock6: data.FMFC_foamBlock_6 || "",
        employeeRecord: data.FMFC_employeeRecord || "",
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
      case 0:
        return !!(
          data.FMBR_operator && 
          data.FMBR_shift && 
          data.FMBR_programNo &&
          data.FMBR_batchNo &&
          data.FMBR_recDate &&
          data.FMBR_productStatus &&
          data.FMPR_productName
        );

      case 1:
        for (let i = 1; i <= 15; i++) {
          const chemValue = data[`FMCN_chemicalName_${i}`];
          if (chemValue && (chemValue.trim() !== "" || chemValue === " ")) {
            return true;
          }
        }
        return false;

      case 2: {
        let hasWeights = false;
        for (let i = 1; i <= 15; i++) {
          const weightValue = data[`FMCW_chemicalWeight_${i}`];
          if (
            weightValue !== null &&
            weightValue !== undefined &&
            weightValue !== ""
          ) {
            const numWeight = parseFloat(weightValue);
            if (!isNaN(numWeight) && numWeight >= 0) { // *** เปลี่ยนจาก > 0 เป็น >= 0 ***
              hasWeights = true;
              break;
            }
          }
        }
        return hasWeights;
      }

      case 3:
        return !!(
          data.FMMX_programNo ||
          data.FMMX_hopperWeight ||
          data.FMMX_actualStart ||
          data.FMMX_mixFinish ||
          data.FMMX_lip ||
          data.FMMX_casingA ||
          data.FMMX_casingB ||
          data.FMMX_tempHopper ||
          data.FMMX_longScrew ||
          data.FMMX_shortScrew ||
          data.FMMX_waterHeat
        );

      case 4:
        return !!(
          data.FMCU_weightBlock_1 || 
          data.FMCU_weightBlock_2 ||
          data.FMCU_weightBlock_3 ||
          data.FMCU_weightBlock_4 ||
          data.FMCU_weightBlock_5 ||
          data.FMCU_weightBlock_6 ||
          data.FMCU_weightBlock_7 ||
          data.FMCU_weightBlock_8 ||
          data.FMCU_weightBlock_9 ||
          data.FMCU_weightBlockRemain
        );

      case 5:
        return !!(
          data.FMPP_tempPrePress ||
          data.FMPP_waterHeat_1 ||
          data.FMPP_waterHeat_2 ||
          data.FMPP_bakeTimePrePress
        );

      case 6:
        return !!(
          data.FMPMP_programNo ||
          data.FMPMP_topTemp ||
          data.FMPMP_tempBlock_1 ||
          data.FMPMP_tempBlock_2 ||
          data.FMPMP_tempBlock_3 ||
          data.FMPMP_tempBlock_4 ||
          data.FMPMP_tempBlock_5 ||
          data.FMPMP_tempBlock_6 ||
          data.FMPMP_empSpray ||
          data.FMPMP_bakeTimePrimary
        );

      case 7:
        return !!(
          data.FMSP_machineNo ||
          data.FMSP_programNo ||
          data.FMSP_steamInPress ||
          data.FMSP_widthFoam ||
          data.FMSP_lengthFoam ||
          data.FMSP_bakeSecondaryTime ||
          data.FMSP_injectEmp ||
          data.FMSP_tempCheck_1 ||
          data.FMSP_tempCheck_2 ||
          data.FMSP_tempOut
        );

      case 8:
        return !!(
          data.FMFC_runNo ||
          data.FMFC_foamBlock_1 ||
          data.FMFC_foamBlock_2 ||
          data.FMFC_foamBlock_3 ||
          data.FMFC_foamBlock_4 ||
          data.FMFC_foamBlock_5 ||
          data.FMFC_foamBlock_6 ||
          data.FMFC_employeeRecord
        );

      default:
        return false;
    }
  };

  // เพิ่มฟังก์ชันหา step แรกที่ยังไม่บันทึก
  const findFirstIncompleteStep = (existingData) => {
    if (!existingData) return 0;
    
    for (let i = 0; i < steps.length; i++) {
      const isCompleted = checkStepCompletion(i, existingData);
      
      if (!isCompleted) {
        return i;
      }
    }
    
    return 0;
  };

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
