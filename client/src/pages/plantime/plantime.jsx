import React, { useState, useEffect } from "react";
import {
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // ใช้ Navigate สำหรับเปลี่ยนหน้า
import axios from "axios";
import "./plantime.css";

const Plantime = ({ url }) => {
  const [recipeName, setRecipeName] = useState("");
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchDone, setSearchDone] = useState(false); // ตรวจสอบว่าเคยค้นหาหรือไม่
  const navigate = useNavigate();

  // โหลดรายการ Plan Time จาก API
  const fetchPlanTimes = async () => {
    if (!recipeName) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/plantime/${recipeName}`);
      setPlanTimes(response.data.planTimes || []);
      setError(false);
    } catch (error) {
      console.error("❌ ERROR fetching PlanTime:", error);
      setPlanTimes([]);
      setError(true);
    } finally {
      setLoading(false);
      setSearchDone(true); // เมื่อเสร็จการค้นหาก็จะตั้งค่าเป็น `true`
    }
  };

  useEffect(() => {
    if (searchDone) {
      fetchPlanTimes(); // โหลดข้อมูลเมื่อ `searchDone` เป็น true
    }
  }, [searchDone]);

  const handleSearch = () => {
    if (!recipeName) {
      setError(true);
    } else {
      setError(false);
      setSearchDone(true); // กดค้นหาจะตั้ง `searchDone` เป็น true
    }
  };

  // ฟังก์ชันเปลี่ยนหน้าไปยัง `PlantimeTable.jsx`
  const handleShowPlanTime = () => {
    navigate("/plantime-table", { state: { recipeName, planTimes } });
  };

  return (
    <div className="container">
      <h1>Plan Time</h1>

      <FormControl fullWidth className="form-control">
        <InputLabel id="recipe-label">เลือก Recipe</InputLabel>
        <Select
          labelId="recipe-label"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
        >
          <MenuItem value="RP300S">RP300S</MenuItem>
          <MenuItem value="RP300S-DB">RP300S-DB</MenuItem>
          <MenuItem value="RP300S-50">RP300S-50</MenuItem>
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

      {/* ปุ่ม Show Plantime จะแสดงเมื่อมีข้อมูลหลังจากค้นหา */}
      {searchDone && planTimes.length > 0 && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleShowPlanTime}
          className="button show-button"
        >
          Show Plantime
        </Button>
      )}

      {/* ถ้าไม่พบข้อมูล */}
      {searchDone && planTimes.length === 0 && !error && (
        <Alert severity="info">ไม่พบข้อมูล Plan Time</Alert>
      )}

      {/* ถ้าเกิด error */}
      {error && <Alert severity="error">เกิดข้อผิดพลาดในการค้นหา</Alert>}
    </div>
  );
};

export default Plantime;
