import React, { useState, useEffect } from "react";
import {
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from "@mui/material";
import axios from "axios";
import "./plantime.css"; // ✅ นำเข้าไฟล์ CSS

const Plantime = ({ url }) => {
  const [recipeName, setRecipeName] = useState("");
  const [planTimes, setPlanTimes] = useState([]);
  const [plantimeName, setPlantimeName] = useState(""); // ✅ เพิ่มตัวแปรนี้
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // โหลดรายการ Plan Time จาก API
  const fetchPlanTimes = async () => {
    if (!recipeName) return; // ✅ ตรวจสอบว่ามีชื่อ Recipe ก่อนโหลด
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/plantime/${recipeName}`);
      setPlanTimes(response.data.planTimes || []);
    } catch (error) {
      console.error("❌ ERROR fetching PlanTime:", error);
      setPlanTimes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanTimes();
  }, [recipeName]); // ✅ โหลดข้อมูลเมื่อ recipeName เปลี่ยน

  const handleSearch = async () => {
    if (!plantimeName) {
      setError(true);
    } else {
      setError(false);
      try {
        const response = await axios.get(`${url}/api/recipe/${plantimeName}`);
        console.log("📌 ผลลัพธ์ที่ได้:", response.data);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    }
  };

  return (
    <div className="container">
      <h1>Plan Time</h1>

      {error && <Alert severity="error">กรุณาเลือก Plan Time</Alert>}

      <FormControl fullWidth className="form-control">
        <InputLabel id="recipe-label">เลือก Recipe</InputLabel>
        <Select
          labelId="recipe-label"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
        >
          <MenuItem value="Recipe1">Recipe1</MenuItem>
          <MenuItem value="Recipe2">Recipe2</MenuItem>
          <MenuItem value="Recipe3">Recipe3</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth className="form-control" disabled={loading}>
        <InputLabel id="plantime-label">เลือก Plan Time</InputLabel>
        <Select
          labelId="plantime-label"
          value={plantimeName}
          onChange={(e) => setPlantimeName(e.target.value)}
        >
          {planTimes.map((plantime, index) => (
            <MenuItem key={index} value={plantime}>
              {plantime}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSearch}
        className="button"
        disabled={loading}
      >
        ค้นหา
      </Button>
    </div>
  );
};

export default Plantime;
