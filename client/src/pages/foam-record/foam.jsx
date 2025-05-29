import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Science as ScienceIcon,
  Blender as BlenderIcon,
  ContentCut as CutIcon,
  Compress as CompressIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import './foam.css';

const steps = [
  'ข้อมูลพื้นฐาน',
  'Chemical Name',
  'Chemical Weight',
  'Mixing Step',
  'Cutting Step',
  'Pre Press',
  'Secondary Press',
  'Foam Check'
];

const FoamRecord = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  
  // Production Record State
  const [productionData, setProductionData] = useState({
    batchNo: '',
    recordDate: new Date().toISOString().split('T')[0],
    employeeShift: '',
    productStatus: '',
    weighingStaff: '',
    productName: ''
  });

  // Chemical Name State
  const [chemicalNames, setChemicalNames] = useState(
    Array(15).fill('').map((_, i) => ({ [`chemistry_${i + 1}`]: '' }))
  );

  // Chemical Weight State
  const [chemicalWeights, setChemicalWeights] = useState({
    ref: '',
    weights: Array(15).fill('')
  });

  // Mixing Step State
  const [mixingData, setMixingData] = useState({
    programNo: '',
    hopperWeight: '',
    actualTime: '',
    mixingFinish: '',
    lipHeat: '',
    casingA: '',
    casingB: '',
    tempHopper: '',
    longScrew: '',
    shortScrew: '',
    waterHeat: ''
  });

  // Cutting Step State
  const [cuttingData, setCuttingData] = useState({
    wb1: '', wb2: '', wb3: '', wb4: '', wb5: '',
    wb6: '', wb7: '', wb8: '', wb9: '',
    weightRemain: '',
    staffSave: '',
    startPress: '',
    mixFinish: ''
  });

  // Pre Press State
  const [prePressData, setPrePressData] = useState({
    prePressHeat: '',
    waterHeat1: '',
    waterHeat2: '',
    bakeTimePre: '',
    topHeat: '',
    layerHeat1: '', layerHeat2: '', layerHeat3: '',
    layerHeat4: '', layerHeat5: '', layerHeat6: '',
    injectorStaff: '',
    bakeTimePrimary: ''
  });

  // Secondary Press State
  const [secondaryPressData, setSecondaryPressData] = useState({
    machineNo: '',
    streamInPress: '',
    foamWidth: '',
    foamLength: '',
    bakeTimeSecondary: '',
    sprayAgent: '',
    heatCheckA: '',
    heatCheckB: '',
    heatExit: ''
  });

  // Foam Check State
  const [foamCheckData, setFoamCheckData] = useState({
    runNo: '',
    layer1: '', layer2: '', layer3: '',
    layer4: '', layer5: '', layer6: '',
    entryData: ''
  });

  const showAlert = (message, severity = 'success') => {
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
      const batchNo = parseInt(productionData.batchNo);

      switch (stepIndex) {
        case 0: // Production Record
          response = await axios.post('/api/post/production/add', productionData);
          break;
        case 1: // Chemical Names
          const chemistryNames = chemicalNames.map(obj => Object.values(obj)[0]);
          response = await axios.post('/api/post/production/chemical-name/add', {
            batchNo,
            chemistryName: chemistryNames
          });
          break;
        case 2: // Chemical Weights
          response = await axios.post('/api/post/production/chemical-weight/add', {
            batchNo,
            Ref: parseFloat(chemicalWeights.ref),
            chemistryWeight: chemicalWeights.weights.map(w => parseFloat(w) || null)
          });
          break;
        case 3: // Mixing Step
          response = await axios.post('/api/post/production/mixing-step/add', {
            batchNo,
            ...mixingData
          });
          break;
        case 4: // Cutting Step
          response = await axios.post('/api/post/production/cutting-step/add', {
            batchNo,
            ...cuttingData
          });
          break;
        case 5: // Pre Press
          response = await axios.post('/api/post/production/pre-press-step/add', {
            batchNo,
            ...prePressData
          });
          break;
        case 6: // Secondary Press
          response = await axios.post('/api/post/production/second-press/add', {
            batchNo,
            ...secondaryPressData
          });
          break;
        case 7: // Foam Check
          response = await axios.post('/api/post/production/foam-check/add', {
            batchNo,
            ...foamCheckData
          });
          break;
      }
      
      showAlert(`✅ ${steps[stepIndex]} บันทึกสำเร็จ!`);
      if (stepIndex < steps.length - 1) {
        handleNext();
      }
    } catch (error) {
      console.error('Error saving step:', error);
      showAlert(`❌ เกิดข้อผิดพลาดในการบันทึก ${steps[stepIndex]}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <ScienceIcon className="step-icon" />
              ข้อมูลพื้นฐานการผลิต
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Batch Number"
                  type="number"
                  value={productionData.batchNo}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    batchNo: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Record Date"
                  type="date"
                  value={productionData.recordDate}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    recordDate: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee Shift"
                  value={productionData.employeeShift}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    employeeShift: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Status"
                  value={productionData.productStatus}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    productStatus: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weighing Staff"
                  value={productionData.weighingStaff}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    weighingStaff: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={productionData.productName}
                  onChange={(e) => setProductionData({
                    ...productionData,
                    productName: e.target.value
                  })}
                  required
                />
              </Grid>
            </Grid>
          </Paper>
        );

      case 1:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <ScienceIcon className="step-icon" />
              Chemical Names (15 สารเคมี)
            </Typography>
            <Grid container spacing={2}>
              {chemicalNames.map((item, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <TextField
                    fullWidth
                    label={`Chemistry ${index + 1}`}
                    value={Object.values(item)[0]}
                    onChange={(e) => {
                      const newChemicals = [...chemicalNames];
                      newChemicals[index] = { [`chemistry_${index + 1}`]: e.target.value };
                      setChemicalNames(newChemicals);
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case 2:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <ScienceIcon className="step-icon" />
              Chemical Weights
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reference Weight"
                  type="number"
                  value={chemicalWeights.ref}
                  onChange={(e) => setChemicalWeights({
                    ...chemicalWeights,
                    ref: e.target.value
                  })}
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
                      const newWeights = [...chemicalWeights.weights];
                      newWeights[index] = e.target.value;
                      setChemicalWeights({
                        ...chemicalWeights,
                        weights: newWeights
                      });
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case 3:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <BlenderIcon className="step-icon" />
              Mixing Step
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(mixingData).map(([key, value]) => (
                <Grid item xs={12} md={6} lg={4} key={key}>
                  <TextField
                    fullWidth
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type={['programNo', 'hopperWeight', 'lipHeat', 'casingA', 'casingB', 'tempHopper', 'longScrew', 'shortScrew', 'waterHeat'].includes(key) ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setMixingData({
                      ...mixingData,
                      [key]: e.target.value
                    })}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case 4:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <CutIcon className="step-icon" />
              Cutting Step
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" className="section-title">
                  Weight Blocks (1-9)
                </Typography>
              </Grid>
              {['wb1', 'wb2', 'wb3', 'wb4', 'wb5', 'wb6', 'wb7', 'wb8', 'wb9'].map((key) => (
                <Grid item xs={12} md={6} lg={4} key={key}>
                  <TextField
                    fullWidth
                    label={`Weight Block ${key.slice(-1)}`}
                    type="number"
                    value={cuttingData[key]}
                    onChange={(e) => setCuttingData({
                      ...cuttingData,
                      [key]: e.target.value
                    })}
                  />
                </Grid>
              ))}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight Remain"
                  type="number"
                  value={cuttingData.weightRemain}
                  onChange={(e) => setCuttingData({
                    ...cuttingData,
                    weightRemain: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Staff Save"
                  value={cuttingData.staffSave}
                  onChange={(e) => setCuttingData({
                    ...cuttingData,
                    staffSave: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Press"
                  value={cuttingData.startPress}
                  onChange={(e) => setCuttingData({
                    ...cuttingData,
                    startPress: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mix Finish"
                  value={cuttingData.mixFinish}
                  onChange={(e) => setCuttingData({
                    ...cuttingData,
                    mixFinish: e.target.value
                  })}
                />
              </Grid>
            </Grid>
          </Paper>
        );

      case 5:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <CompressIcon className="step-icon" />
              Pre Press Step
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(prePressData).map(([key, value]) => (
                <Grid item xs={12} md={6} lg={4} key={key}>
                  <TextField
                    fullWidth
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type={['prePressHeat', 'waterHeat1', 'waterHeat2', 'topHeat', 'layerHeat1', 'layerHeat2', 'layerHeat3', 'layerHeat4', 'layerHeat5', 'layerHeat6'].includes(key) ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setPrePressData({
                      ...prePressData,
                      [key]: e.target.value
                    })}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case 6:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <CompressIcon className="step-icon" />
              Secondary Press Step
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(secondaryPressData).map(([key, value]) => (
                <Grid item xs={12} md={6} lg={4} key={key}>
                  <TextField
                    fullWidth
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    type={['machineNo', 'foamWidth', 'foamLength', 'heatCheckA', 'heatCheckB', 'heatExit'].includes(key) ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setSecondaryPressData({
                      ...secondaryPressData,
                      [key]: e.target.value
                    })}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case 7:
        return (
          <Paper className="step-content">
            <Typography variant="h6" className="step-title">
              <CheckIcon className="step-icon" />
              Foam Check Step
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Run Number"
                  type="number"
                  value={foamCheckData.runNo}
                  onChange={(e) => setFoamCheckData({
                    ...foamCheckData,
                    runNo: e.target.value
                  })}
                  required
                />
              </Grid>
              {['layer1', 'layer2', 'layer3', 'layer4', 'layer5', 'layer6'].map((key) => (
                <Grid item xs={12} md={6} lg={4} key={key}>
                  <TextField
                    fullWidth
                    label={`Layer ${key.slice(-1)}`}
                    value={foamCheckData[key]}
                    onChange={(e) => setFoamCheckData({
                      ...foamCheckData,
                      [key]: e.target.value
                    })}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Entry Data"
                  multiline
                  rows={3}
                  value={foamCheckData.entryData}
                  onChange={(e) => setFoamCheckData({
                    ...foamCheckData,
                    entryData: e.target.value
                  })}
                />
              </Grid>
            </Grid>
          </Paper>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl" className="foam-container">
      <Paper elevation={3} className="foam-paper">
        <Typography variant="h4" component="h1" className="page-title">
          บันทึกข้อมูลการผลิต Foam
        </Typography>

        <Stepper activeStep={activeStep} className="foam-stepper">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className="step-content-container">
          {renderStepContent(activeStep)}
        </Box>

        <Box className="navigation-buttons">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
            className="back-button"
          >
            ย้อนกลับ
          </Button>
          
          <Button
            variant="contained"
            onClick={() => handleSubmitStep(activeStep)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            className="save-button"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>

          {activeStep < steps.length - 1 && (
            <Button
              onClick={handleNext}
              endIcon={<NextIcon />}
              className="next-button"
            >
              ถัดไป
            </Button>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FoamRecord;
