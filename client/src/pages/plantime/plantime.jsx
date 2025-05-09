import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

const Plantime = () => {
  const [productName, setProductName] = useState("");
  const [fristStart, setFristStart] = useState("");
  const [runRound, setRunRound] = useState("");
  const [products, setProducts] = useState([]);
  const [colorName, setColorName] = useState("");
  const [machineNames, setMachineNames] = useState([""]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/get/products`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("❌ ERROR fetching Products:", error);
      toast.error("❌ Failed to fetch products");
    }
  };

  const calculatePlanTime = async () => {
    if (!productName || !fristStart || !runRound || !colorName || machineNames.length === 0) {
      toast.warn("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const timeParts = fristStart.split(":");
    if (timeParts.length < 2 || timeParts.length > 3) {
      toast.warn("⚠️ กรุณากรอกเวลาในรูปแบบ HH:mm หรือ HH:mm:ss");
      return;
    }
    const formattedTime = `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`;

    setLoading(true);
    try {
      const payload = {
        fristStart: formattedTime,
        runRound: parseInt(runRound, 10),
        mcNames: machineNames.filter((name) => name !== ""),
        color_name: colorName,
      };
      const response = await axios.post(
        `/api/post/plantime/add/${productName}`,
        payload
      );
      toast.success(response.data.message || "✅ Plan Time calculated successfully");
      setPlanTimes(response.data.planTimeList || []);
      setCalculated(true);
    } catch (error) {
      console.error("❌ ERROR calculating Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ เกิดข้อผิดพลาดในการคำนวณ");
      setPlanTimes([]);
      setCalculated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMachineNameChange = (index, value) => {
    const updateNames = [...machineNames];
    updateNames[index] = value;
    setMachineNames(updateNames);
  };

  const addMachineField = () => {
    setMachineNames([...machineNames, ""]);
  };

  const removeMachineField = (index) => {
    const updatedNames = machineNames.filter((_, i) => i !== index);
    setMachineNames(updatedNames);
  };

  const handleShowPlanTime = async () => {
    if (!productName) {
      toast.warn("⚠️ กรุณาเลือก Product ก่อน");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/get/plantime/${productName}`);
      const fetchedPlanTimes = response.data.planTimes || [];

      if (fetchedPlanTimes.length === 0) {
        toast.info("ℹ️ ไม่มีข้อมูล Plan Time สำหรับ Product นี้");
        return;
      }

      handleOpenPlanTimeTable(); // เปิดแท็บใหม่ที่มีข้อมูล Plan Time
    } catch (error) {
      console.error("❌ ERROR fetching Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ Failed to fetch Plan Time");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlanTimeTable = () => {
    // เก็บข้อมูลไว้ใน localStorage
    localStorage.setItem(
      "planTimeData",
      JSON.stringify({
        productName,
        colorName,
        planTimes,
      })
    );

    // เปิดแท็บใหม่
    window.open("/plantime-table", "_blank");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Plan Time
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel id="product-select-label">เลือก Product</InputLabel>
        <Select
          labelId="product-select-label"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        >
          <MenuItem value="" disabled>
            -- เลือก Product --
          </MenuItem>
          {products.map((product, index) => (
            <MenuItem key={product.id || index} value={product.name}>
              {product.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        margin="normal"
        label="เวลาเริ่มต้น (Frist Start Time)"
        placeholder="กรอกเวลาเริ่มต้น เช่น 08:00"
        value={fristStart}
        onChange={(e) => setFristStart(e.target.value)}
      />

      <TextField
        fullWidth
        margin="normal"
        label="จำนวนรอบ (Run Round)"
        type="number"
        value={runRound}
        onChange={(e) => setRunRound(e.target.value)}
      />

      <TextField
        fullWidth
        margin="normal"
        label="ชื่อสี (Color Name)"
        placeholder="กรอกชื่อสี"
        value={colorName}
        onChange={(e) => setColorName(e.target.value)}
      />

      <Box sx={{ marginY: 2 }}>
        <Typography variant="h6">Machine Names:</Typography>
        {machineNames.map((name, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
            <TextField
              fullWidth
              label={`Machine ${index + 1}`}
              value={name}
              onChange={(e) => handleMachineNameChange(index, e.target.value)}
            />
            <IconButton
              onClick={() => removeMachineField(index)}
              disabled={machineNames.length === 1}
            >
              <Remove />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={addMachineField}
        >
          เพิ่มเครื่องจักร
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={calculatePlanTime}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "สร้าง Plan Time"}
        </Button>

        {calculated && (
          <Button
            variant="contained"
            color="success"
            onClick={handleShowPlanTime}
            disabled={loading}
          >
            แสดง Plan Time
          </Button>
        )}
      </Box>

      <ToastContainer />
    </Box>
  );
};

export default Plantime;
