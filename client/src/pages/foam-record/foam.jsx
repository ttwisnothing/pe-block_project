import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import qs from "qs";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import th from "date-fns/locale/th";

// steps array
const steps = [
  "ข้อมูลพื้นฐาน",
  "Chemical Name & Weight",
  "Mixing Step",
  "Cutting Step",
  "Pre Press",
  "Primary Press",
  "Secondary Press",
  "Foam Check",
];

const FoamRecord = () => {
  const { productName } = useParams();
  const location = useLocation();

  // decode state from query string
  const getStateFromQuery = () => {
    const search = location.search;
    if (!search) return null;
    const params = qs.parse(search, { ignoreQueryPrefix: true });
    if (params.state) {
      try {
        return JSON.parse(decodeURIComponent(params.state));
      } catch {
        return null;
      }
    }
    return null;
  };

  // รับ state จาก location หรือ query string
  const state = location.state || getStateFromQuery() || {};
  const productionId = state.productionId;
  const existingData = state.existingData;
  const isEdit = state.isEdit || false;
  const runId = state.runId;
  const runNo = state.runNo;
  const autoNavigateToIncomplete = !!state?.autoNavigateToIncomplete;

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Production Record State
  const [productionData, setProductionData] = useState({
    runNo: "",
    recordDate: new Date().toISOString().split("T")[0],
    productStatus: "",
    programNo: "",
    productName: productName || "",
    shiftTime: "",
    operatorName: "",
  });

  // Chemical Name State
  const [chemicalNames, setChemicalNames] = useState(
    Array(15)
      .fill("")
      .map((_, i) => ({ [`chemistry_${i + 1}`]: "" }))
  );

  // Chemical Weight State
  const [chemicalWeights, setChemicalWeights] = useState({
    weights: Array(15).fill(""),
  });

  // Mixing Step State - ลบ programNo
  const [mixingData, setMixingData] = useState({
    programHopper: "",
    hopperWeight: "",
    programKneader: "",
    actualStart: "",
    mixFinish: "",
    programExtruder: "",
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

  // Secondary Press State
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

  // Foam Check State
  const [foamCheckData, setFoamCheckData] = useState({
    runNo: "",
    foamBlock1: "",
    foamBlock2: "",
    foamBlock3: "",
    foamBlock4: "",
    foamBlock5: "",
    foamBlock6: "",
    employeeRecord: "",
    exitSecondaryPress: "",
  });

  const [allChemicals, setAllChemicals] = useState([]);
  const [chemicalsLoading, setChemicalsLoading] = useState(false);

  const hasInitialStepSet = useRef(false);

  // ฟังก์ชันแปลงวันที่เป็น YYYY-MM-DD (รองรับ MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd)
  const toISODate = useCallback((dateValue) => {
    if (!dateValue) return "";
    // ถ้าเป็น yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    // ถ้าเป็น dd/MM/yyyy หรือ MM/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      const [a, b, year] = dateValue.split("/");
      // ถ้า a > 12 แปลว่าเป็น dd/MM/yyyy
      if (parseInt(a, 10) > 12) {
        return `${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
      }
      // ถ้า b > 12 แปลว่าเป็น MM/dd/yyyy
      if (parseInt(b, 10) > 12) {
        return `${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
      }
      // ถ้าไม่แน่ใจ ให้เดาว่าเป็น MM/dd/yyyy
      return `${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
    }
    // ถ้าเป็นรูปแบบอื่น
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return "";
  }, []);

  const showAlert = useCallback((message, severity = "success") => {
    setAlert({ open: true, message, severity });
  }, []);

  const loadChemicals = useCallback(async () => {
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
  }, [showAlert]);

  const getDataMaster = useCallback(async () => {
    try {
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

      if (Array.isArray(data.chemicals)) {
        setChemicalNames((prevChemicals) => {
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
  }, [productName, showAlert]);

  useEffect(() => {
    loadChemicals();
    getDataMaster();
  }, [loadChemicals, getDataMaster]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmitStep = async (stepIndex) => {
    setLoading(true);
    try {
      switch (stepIndex) {
        case 0:
          if (runId) {
            await axios.put(`/api/put/production/update/record/${runId}`, {
              runNo: productionData.runNo,
              recordDate: productionData.recordDate,
              productStatus: productionData.productStatus,
              programNo: productionData.programNo,
              productName: productionData.productName,
              shiftTime: productionData.shiftTime,
              operatorName: productionData.operatorName,
            });
          } else {
            showAlert("ไม่พบ runId สำหรับอัพเดทข้อมูล", "error");
            return;
          }
          break;

        case 1: {
          // Chemical Name
          const chemistryNames = chemicalNames.map((obj) => {
            const val = Object.values(obj)[0];
            return val === "" ? " " : val;
          });

          await axios.post(`/api/post/production/${runId}/chemical-name/add`, {
            productionId: productionId,
            chemistryName: chemistryNames,
          });

          // Chemical Weight
          const processedWeights = chemicalWeights.weights.map((w) => {
            if (w === "" || w === null || w === undefined) {
              return 0.0;
            }
            const numValue = parseFloat(w);
            return isNaN(numValue) ? 0.0 : numValue;
          });

          await axios.post(
            `/api/post/production/${runId}/chemical-weight/add`,
            {
              productionId: productionId,
              chemistryWeight: processedWeights,
            }
          );
          break;
        }

        case 2:
          await axios.post(`/api/post/production/${runId}/mixing-step/add`, {
            productionId: productionId,
            ...mixingData,
          });
          break;

        case 3:
          await axios.post(`/api/post/production/${runId}/cutting-step/add`, {
            productionId: productionId,
            ...cuttingData,
          });
          break;

        case 4:
          await axios.post(`/api/post/production/${runId}/pre-press-step/add`, {
            productionId: productionId,
            ...prePressData,
          });
          break;

        case 5:
          await axios.post(`/api/post/production/${runId}/primary-press/add`, {
            productionId: productionId,
            ...primaryPressData,
          });
          break;

        case 6:
          await axios.post(`/api/post/production/${runId}/second-press/add`, {
            productionId: productionId,
            ...secondaryPressData,
          });
          break;

        case 7:
          await axios.post(`/api/post/production/${runId}/foam-check/add`, {
            productionId: productionId,
            ...foamCheckData,
          });
          break;
      }

      showAlert(`✅ ${steps[stepIndex]} บันทึกสำเร็จ!`);
      if (stepIndex < steps.length - 1) {
        handleNext();
      } else {
        // ถ้าเป็น step สุดท้าย (Foam Check) ให้ปิดแท็บ
        setTimeout(() => {
          window.close();
        }, 800); // รอ 0.8 วิ ให้เห็น snackbar
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
      <BlenderIcon />,
      <CutIcon />,
      <CompressIcon />,
      <CompressIcon />,
      <CompressIcon />,
      <VerifiedIcon />,
    ];
    return icons[step];
  };

  // แก้ไข renderStepContent
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

              <Grid container spacing={2} className="foam-form-grid">
                {/* Run Number */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        Run Number
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label=""
                        type="number"
                        value={productionData.runNo}
                        onChange={(e) =>
                          setProductionData({
                            ...productionData,
                            runNo: e.target.value,
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
                </Grid>
                {/* Product Name */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        ชื่อผลิตภัณฑ์
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label=""
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
                  </Grid>
                </Grid>
                {/* สถานะ */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>สถานะ</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label=""
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
                  </Grid>
                </Grid>
                {/* โปรแกรม */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        โปรแกรม
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label=""
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
                  </Grid>
                </Grid>
                {/* วันที่บันทึก - แก้เป็น DatePicker */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        วันที่บันทึก
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                        adapterLocale={th}
                      >
                        <DatePicker
                          value={
                            productionData.recordDate
                              ? new Date(productionData.recordDate)
                              : null
                          }
                          onChange={(date) => {
                            if (!isEdit && date) {
                              // แปลงเป็น yyyy-MM-dd
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              const day = String(date.getDate()).padStart(2, "0");
                              const formattedDate = `${year}-${month}-${day}`;

                              setProductionData({
                                ...productionData,
                                recordDate: formattedDate,
                              });
                            }
                          }}
                          format="dd/MM/yyyy"
                          disabled={isEdit}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              className: `foam-text-field ${
                                isEdit ? "foam-disabled-field" : ""
                              }`,
                              required: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </Grid>
                {/* ชื่อผู้ปฏิบัติงาน */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        ชื่อผู้ปฏิบัติงาน
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label=""
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
                  </Grid>
                </Grid>
                {/* กะ */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 4 }}>
                      <Typography sx={{ fontWeight: 500 }}>กะ</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <FormControl
                        fullWidth
                        className={`foam-text-field ${
                          isEdit ? "foam-disabled-field" : ""
                        }`}
                      >
                        <Select
                          value={productionData.shiftTime}
                          onChange={(e) =>
                            setProductionData({
                              ...productionData,
                              shiftTime: e.target.value,
                            })
                          }
                          disabled={isEdit}
                          required
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>เลือกกะ</em>
                          </MenuItem>
                          <MenuItem value="เช้า">เช้า</MenuItem>
                          <MenuItem value="ดึก">ดึก</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 1:
        // รวม Chemical Name และ Weight ในหน้าเดียว
        return (
          <Fade in timeout={500}>
            <Paper className="foam-step-content">
              <Box className="foam-step-header">
                <ScienceIcon className="foam-step-icon" />
                <Typography variant="h6" className="foam-step-title">
                  Chemical Names & Weights
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

              <Box sx={{ p: 2 }}>
                {chemicalNames.map((item, index) => (
                  <Grid
                    container
                    spacing={2}
                    sx={{ alignItems: "center", mb: 1 }}
                    key={index
                    }
                  >
                    {/* Label สารเคมีตัวที่ n */}
                    <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                      <Typography sx={{ fontWeight: 500 }}>
                        {`สารเคมีตัวที่ ${index + 1}`}
                      </Typography>
                    </Grid>
                    {/* Select Chemical Name */}
                    <Grid size={{ xs: 12, md: 5, lg: 5 }}>
                      <FormControl
                        fullWidth
                        className={`foam-text-field ${
                          isEdit ? "foam-disabled-field" : ""
                        }`}
                      >
                        <Select
                          value={
                            Object.values(item)[0] === " "
                              ? ""
                              : Object.values(item)[0]
                          }
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
                          displayEmpty
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
                    {/* ช่องกรอกน้ำหนัก */}
                    <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        value={chemicalWeights.weights[index]}
                        placeholder="0.00"
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
                              color:
                                chemicalWeights.weights[index] === ""
                                  ? "#999"
                                  : "inherit",
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                ))}
                {chemicalsLoading && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      กำลังโหลดรายการสารเคมี...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Fade>
        );

      case 2:
        // Mixing Step - อัพเดทการแบ่ง keys
        const mixingKeys = Object.keys(mixingData);
        const mixingLeftKeys = mixingKeys.slice(0, 7);
        const mixingRightKeys = mixingKeys.slice(7);

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
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {mixingLeftKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {mixingLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type="text"
                          value={mixingData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {/* ฝั่งขวา */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {mixingRightKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {mixingLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type="text"
                          value={mixingData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 3:
        // Cutting Step - แก้ไขให้เหมือน Secondary Press
        const cuttingKeys = Object.keys(cuttingData);
        const cuttingLeftKeys = cuttingKeys.slice(0, 5); // wb1-wb5
        const cuttingRightKeys = cuttingKeys.slice(5); // wb5-wb9, weightRemain, staffSave, startPress, mixFinish

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
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {cuttingLeftKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {cuttingLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
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
                          sx={{ maxWidth: 250 }}
                          placeholder="0.00"
                          InputProps={{
                            inputProps: {
                              min: 0,
                              step: "0.01",
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {/* ฝั่งขวา */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {cuttingRightKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {cuttingLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            ["staffSave", "startPress", "mixFinish"].includes(key)
                              ? "text"
                              : "number"
                          }
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
                          sx={{ maxWidth: 250 }}
                          placeholder={
                            ["staffSave", "startPress", "mixFinish"].includes(key)
                              ? ""
                              : "0.00"
                          }
                          InputProps={
                            !["staffSave", "startPress", "mixFinish"].includes(key)
                              ? {
                                  inputProps: {
                                    min: 0,
                                    step: "0.01",
                                  },
                                }
                              : undefined
                          }
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 4:
        // Pre Press Step - แก้ไขให้เหมือน Secondary Press
        const prePressKeys = Object.keys(prePressData);
        const prePressLeftKeys = prePressKeys.slice(0, 2); // tempPrePress, waterHeat1
        const prePressRightKeys = prePressKeys.slice(2); // waterHeat2, bakeTimePrePress

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
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {prePressLeftKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {prePressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            ["tempPrePress", "waterHeat1"].includes(key)
                              ? "number"
                              : "text"
                          }
                          value={prePressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {/* ฝั่งขวา */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {prePressRightKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {prePressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            ["waterHeat2"].includes(key)
                              ? "number"
                              : "text"
                          }
                          value={prePressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 5:
        // Primary Press Step - แก้ไขให้เหมือน Secondary Press
        const primaryKeys = Object.keys(primaryPressData);
        const primaryLeftKeys = primaryKeys.slice(0, 5); // programNo-tempBlock3
        const primaryRightKeys = primaryKeys.slice(5); // tempBlock4-bakeTimePrimary

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
                <Chip
                  label={`Production ID: ${productionId}`}
                  variant="outlined"
                  className="foam-production-chip"
                />
              </Box>
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {primaryLeftKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {primaryPressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            [
                              "programNo",
                              "topTemp",
                              "tempBlock1",
                              "tempBlock2",
                              "tempBlock3",
                            ].includes(key)
                              ? "number"
                              : "text"
                          }
                          value={primaryPressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {/* ฝั่งขวา */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {primaryRightKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {primaryPressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            [
                              "tempBlock4",
                              "tempBlock5",
                              "tempBlock6",
                            ].includes(key)
                              ? "number"
                              : "text"
                          }
                          value={primaryPressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 6:
        // Secondary Press Step
        const secondaryKeys = Object.keys(secondaryPressData);
        const leftKeys = secondaryKeys.slice(0, 5); // machineNo-foamLength
        const rightKeys = secondaryKeys.slice(5);

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
              <Grid container spacing={2}>
                {/* ฝั่งซ้าย */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {leftKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {secondaryPressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            [
                              "machineNo",
                              "programNo",
                              "foamWidth",
                              "foamLength",
                            ].includes(key)
                              ? "number"
                              : "text"
                          }
                          value={secondaryPressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {/* ฝั่งขวา */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {rightKeys.map((key) => (
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "center", mb: 1 }}
                      key={key}
                    >
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {secondaryPressLabels[key] || key}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <TextField
                          fullWidth
                          type={
                            ["tempCheck1", "tempCheck2", "tempOut"].includes(
                              key
                            )
                              ? "number"
                              : "text"
                          }
                          value={secondaryPressData[key]}
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
                          sx={{ maxWidth: 250 }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        );

      case 7:
        // Foam Check
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

              {/* ปรับตรงนี้ให้ 3 ช่องในแถวเดียว พร้อม label ข้างหน้า */}
              <Grid container spacing={3} className="foam-form-grid" sx={{ mb: 2 }}>
                {/* Run Number */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Grid container sx={{ alignItems: "center" }} spacing={1}>
                    <Grid size={{ xs: 5 }}>
                      <Typography sx={{ fontWeight: 500 }}>Run Number</Typography>
                    </Grid>
                    <Grid size={{ xs: 7 }}>
                      <TextField
                        fullWidth
                        label=""
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
                        className={`foam-text-field ${isEdit ? "foam-disabled-field" : ""}`}
                        disabled={isEdit}
                        required
                      />
                    </Grid>
                  </Grid>
                </Grid>
                {/* Employee Record */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Grid container sx={{ alignItems: "center" }} spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ fontWeight: 500 }}>พนักงานตรวจสอบโฟม</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label=""
                        value={foamCheckData.employeeRecord}
                        onChange={(e) => {
                          if (!isEdit) {
                            setFoamCheckData({
                              ...foamCheckData,
                              employeeRecord: e.target.value,
                            });
                          }
                        }}
                        className={`foam-text-field ${isEdit ? "foam-disabled-field" : ""}`}
                        disabled={isEdit}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                {/* Exit Secondary Press */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Grid container sx={{ alignItems: "center" }} spacing={1}>
                    <Grid size={{ xs: 7 }}>
                      <Typography sx={{ fontWeight: 500 }}>เวลาออกจากเซคเค็นดารีเพรส</Typography>
                    </Grid>
                    <Grid size={{ xs: 5 }}>
                      <TextField
                        fullWidth
                        label=""
                        value={foamCheckData.exitSecondaryPress}
                        onChange={(e) => {
                          if (!isEdit) {
                            setFoamCheckData({
                              ...foamCheckData,
                              exitSecondaryPress: e.target.value,
                            });
                          }
                        }}
                        className={`foam-text-field ${isEdit ? "foam-disabled-field" : ""}`}
                        disabled={isEdit}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* Section Title สำหรับ Foam Blocks */}
              <Grid container>
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="subtitle1"
                    className="foam-section-title"
                    sx={{ mt: 2, mb: 1, fontWeight: 600 }}
                  >
                    Foam Block Quality Check (OK/NG/Rework)
                  </Typography>
                </Grid>
              </Grid>

              {/* Foam Blocks 1-6 */}
              { [
                "foamBlock1",
                "foamBlock2",
                "foamBlock3",
                "foamBlock4",
                "foamBlock5",
                "foamBlock6",
              ].map((key, index) => (
                <Grid
                  container
                  spacing={2}
                  sx={{ alignItems: "center", mb: 1 }}
                  key={key}
                >
                  <Grid size={{ xs: 12, md: 4, lg: 1.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        textAlign: { xs: "left", md: "right" },
                      }}
                    >
                      {`โฟมก้อนที่ ${index + 1}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8, lg: 6 }}>
                    <FormControl
                      fullWidth
                      className={`foam-text-field ${isEdit ? "foam-disabled-field" : ""}`}
                    >
                      <Select
                        value={foamCheckData[key]}
                        onChange={(e) => {
                          if (!isEdit) {
                            setFoamCheckData({
                              ...foamCheckData,
                              [key]: e.target.value,
                            });
                          }
                        }}
                        disabled={isEdit}
                        displayEmpty
                        sx={{
                          "& .MuiSelect-select": {
                            color:
                              foamCheckData[key] === "OK"
                                ? "green"
                                : foamCheckData[key] === "NG"
                                ? "red"
                                : foamCheckData[key] === "RW"
                                ? "#ff9800"
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
                        <MenuItem
                          value="RW"
                          sx={{ color: "#ff9800", fontWeight: "bold" }}
                        >
                          ⟳ Rework
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ))}
            </Paper>
          </Fade>
        );

      default:
        return "Unknown step";
    }
  };

  const loadExistingData = useCallback(
    (data) => {
      try {
        setProductionData((prev) => ({
          ...prev,
          runNo: data.FMBR_runNo || "",
          recordDate: toISODate(data.FMBR_recDate) || "",
          productStatus: data.FMBR_productStatus || "",
          programNo: data.FMBR_programNo || "",
          productName: data.FMPR_productName || "",
          shiftTime: data.FMBR_shift || "",
          operatorName: data.FMBR_operator || "",
        }));

        // Chemical Names
        const chemicalNames = Array.from({ length: 15 }, (_, i) => ({
          [`chemistry_${i + 1}`]: data[`FMCN_chemicalName_${i + 1}`] || " ",
        }));
        setChemicalNames(chemicalNames);

        // Chemical Weights
        const weights = Array.from({ length: 15 }, (_, i) =>
          parseFloat(data[`FMCW_chemicalWeight_${i + 1}`] || "0.00").toFixed(2)
        );
        setChemicalWeights({ weights });

        // Mixing Step
        setMixingData({
          programHopper: data.FMMX_programHopper || "",
          hopperWeight: data.FMMX_hopperWeight || "",
          programKneader: data.FMMX_programKneader || "",
          actualStart: data.FMMX_actualStart || "",
          mixFinish: data.FMMX_mixFinish || "",
          programExtruder: data.FMMX_programExtruder || "",
          lip: data.FMMX_lip || "",
          casingA: data.FMMX_casingA || "",
          casingB: data.FMMX_casingB || "",
          tempHopper: data.FMMX_tempHopper || "",
          longScrew: data.FMMX_longScrew || "",
          shortScrew: data.FMMX_shortScrew || "",
          waterHeat: data.FMMX_waterHeat || "",
        });

        // Cutting Step
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

        // Pre Press
        setPrePressData({
          tempPrePress: data.FMPP_tempPrePress || "",
          waterHeat1: data.FMPP_waterHeat_1 || "",
          waterHeat2: data.FMPP_waterHeat_2 || "",
          bakeTimePrePress: data.FMPP_bakeTimePrePress || "",
        });

        // Primary Press
        setPrimaryPressData({
          programNo: data.FMPMP_programNo || "",
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

        // Secondary Press
        setSecondaryPressData({
          machineNo: data.FMSP_machineNo || "",
          programNo: data.FMSP_programNo || "",
          streamInPress: data.FMSP_steamInPress || "",
          foamWidth: data.FMSP_widthFoam || "",
          foamLength: data.FMSP_lengthFoam || "",
          bakeSecondaryTime: data.FMSP_bakeSecondaryTime || "",
          injectEmp: data.FMSP_injectEmp || "",
          tempCheck1: data.FMSP_tempCheck_1 || "",
          tempCheck2: data.FMSP_tempCheck_2 || "",
          tempOut: data.FMSP_tempOut || "",
        });

        // Foam Check
        setFoamCheckData({
          runNo: data.FMFC_runNo || "",
          foamBlock1: data.FMFC_foamBlock_1 || "",
          foamBlock2: data.FMFC_foamBlock_2 || "",
          foamBlock3: data.FMFC_foamBlock_3 || "",
          foamBlock4: data.FMFC_foamBlock_4 || "",
          foamBlock5: data.FMFC_foamBlock_5 || "",
          foamBlock6: data.FMFC_foamBlock_6 || "",
          employeeRecord: data.FMFC_employeeRecord || "",
          exitSecondaryPress: data.FMFC_exitSecondaryPress || "",
        });
      } catch (error) {
        console.error("Error loading existing data:", error);
      }
    },
    [toISODate]
  );

  // เพิ่มฟังก์ชันเช็คว่า step ไหนยังไม่บันทึก
  const checkStepCompletion = useCallback((stepIndex, data) => {
    switch (stepIndex) {
      case 0: // ข้อมูลพื้นฐาน
        return !!(
          data.FMBR_operator &&
          data.FMBR_shift &&
          data.FMBR_programNo &&
          data.FMBR_runNo &&
          data.FMBR_recDate &&
          data.FMBR_productStatus &&
          data.FMPR_productName
        );
      case 1: // Chemical Name & Weight
        let hasChemName = false,
          hasChemWeight = false;
        for (let i = 1; i <= 15; i++) {
          if (
            data[`FMCN_chemicalName_${i}`] &&
            data[`FMCN_chemicalName_${i}`].trim() !== ""
          ) {
            hasChemName = true;
          }
          const w = data[`FMCW_chemicalWeight_${i}`];
          if (
            w !== null &&
            w !== undefined &&
            w !== "" &&
            !isNaN(parseFloat(w))
          ) {
            hasChemWeight = true;
          }
        }
        return hasChemName && hasChemWeight;
      case 2: // Mixing Step
        return !!(
          data.FMMX_programHopper ||
          data.FMMX_hopperWeight ||
          data.FMMX_actualStart ||
          data.FMMX_mixFinish ||
          data.FMMX_lip ||
          data.FMMX_casingA ||
          data.FMMX_casingB ||
          data.FMMX_tempHopper ||
          data.FMMX_longScrew ||
          data.FMMX_shortScrew ||
          data.FMMX_waterHeat ||
          data.FMMX_programKneader ||
          data.FMMX_programExtruder
        );
      case 3: // Cutting Step
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
      case 4: // Pre Press
        return !!(
          data.FMPP_tempPrePress ||
          data.FMPP_waterHeat_1 ||
          data.FMPP_waterHeat_2 ||
          data.FMPP_bakeTimePrePress
        );
      case 5: // Primary Press
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
      case 6: // Secondary Press
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
      case 7: // Foam Check
        return !!(
          data.FMFC_runNo ||
          data.FMFC_foamBlock_1 ||
          data.FMFC_foamBlock_2 ||
          data.FMFC_foamBlock_3 ||
          data.FMFC_foamBlock_4 ||
          data.FMFC_foamBlock_5 ||
          data.FMFC_foamBlock_6 ||
          data.FMFC_employeeRecord ||
          data.FMFC_exitSecondaryPress
        );
      default:
        return false;
    }
  }, []);

  const findFirstIncompleteStep = useCallback(
    (existingData) => {
      if (!existingData) return 0;

      for (let i = 0; i < steps.length; i++) {
        const isCompleted = checkStepCompletion(i, existingData);

        if (!isCompleted) {
          return i;
        }
      }

      return 0;
    },
    [checkStepCompletion]
  );

  const getStepStatus = (stepIndex) => {
    if (!existingData) return "pending";

    const isCompleted = checkStepCompletion(stepIndex, existingData);
    return isCompleted ? "completed" : "pending";
  };

  useEffect(() => {
    if (existingData && !hasInitialStepSet.current) {
      loadExistingData(existingData);
      const targetStep = autoNavigateToIncomplete
        ? findFirstIncompleteStep(existingData)
        : 0;
      setActiveStep(targetStep);
      hasInitialStepSet.current = true;
    }
  }, [
    existingData,
    loadExistingData,
    findFirstIncompleteStep,
    autoNavigateToIncomplete,
  ]);

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  const mixingLabels = {
    programHopper: "โปรแกรม Hopper",
    hopperWeight: "Auto Hopper Weight",
    programKneader: "โปรแกรม Kneader",
    actualStart: "เวลากดปุ่ม Auto Start",
    mixFinish: "เวลาผสมเสร็จ",
    programExtruder: "โปรแกรม Extruder",
    lip: "อุณหภูมิ Lip",
    casingA: "อุณหภูมิ Casing A",
    casingB: "อุณหภูมิ Casing B",
    tempHopper: "อุณหภูมิ Hopper",
    longScrew: "อุณหภูมิ Long Screw",
    shortScrew: "อุณหภูมิ Short Screw",
    waterHeat: "Water Heat",
  };

  const prePressLabels = {
    tempPrePress: "อุณหภูมิ Pre Press",
    waterHeat1: "Water Heat 1",
    waterHeat2: "Water Heat 2",
    bakeTimePrePress: "เวลาในการอบชิ้นงาน",
  };

  const primaryPressLabels = {
    programNo: "โปรแกรม No.",
    topTemp: "อุณหภูมิ Top",
    tempBlock1: "อุณหภูมิชั้นที่ 1",
    tempBlock2: "อุณหภูมิชั้นที่ 2",
    tempBlock3: "อุณหภูมิชั้นที่ 3",
    tempBlock4: "อุณหภูมิชั้นที่ 4",
    tempBlock5: "อุณหภูมิชั้นที่ 5",
    tempBlock6: "อุณหภูมิชั้นที่ 6",
    empSpray: "ผู้ฉีดสเปร์ย",
    bakeTimePrimary: "เวลาที่เริ่มอบ",
  };

  const secondaryPressLabels = {
    machineNo: "เครื่องจักรที่",
    programNo: "โปรแกรม No.",
    streamInPress: "เวลากดปุ่ม Stream In",
    foamWidth: "ความกว้างโฟม (mm.)",
    foamLength: "ความยาวโฟม (mm.)",
    bakeSecondaryTime: "เวลาที่เริ่มอบ",
    injectEmp: "ผู้ฉีดสเปรย์",
    tempCheck1: "เช็คอุณหภูมิครั้งที่ 1",
    tempCheck2: "เช็คอุณหภูมิครั้งที่ 2",
    tempOut: "อุณหภูมิชิ้นงานออก",
  };

  const cuttingLabels = {
    wb1: "น้ำหนักบล็อคที่ 1",
    wb2: "น้ำหนักบล็อคที่ 2", 
    wb3: "น้ำหนักบล็อคที่ 3",
    wb4: "น้ำหนักบล็อคที่ 4",
    wb5: "น้ำหนักบล็อคที่ 5",
    wb6: "น้ำหนักบล็อคที่ 6",
    wb7: "น้ำหนักบล็อคที่ 7",
    wb8: "น้ำหนักบล็อคที่ 8",
    wb9: "น้ำหนักบล็อคที่ 9",
    weightRemain: "น้ำหนักคงเหลือ",
    staffSave: "พนักงานที่บันทึก",
    startPress: "เวลาเริ่มเข้าเพรส",
    mixFinish: "เวลาผสมเสร็จ",
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
                {runNo && ` | Run: ${runNo}`}
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
                      } clickable-step`}
                      completed={stepStatus === "completed"}
                    >
                      <StepLabel
                        icon={getStepIcon(index)}
                        className="foam-step-label"
                        onClick={() => handleStepClick(index)}
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
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
