import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import axios from "axios"; // ใช้ axios แทน fetch
import "./plantimetable.css";

const PlanTimeTable = ({ url }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productName, planTimes, colorName } = location.state || {};

  // ฟังก์ชันสำหรับแปลงเวลา
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // ฟังก์ชันสำหรับเรียก API addTempPlanTime ด้วย axios
  const handleMachineBreakdown = async () => {
    try {
      const response = await axios.post(
        `${url}/api/post/plantime/temp/add/${productName}`
      );

      if (response.status === 200) {
        alert(response.data.message || "✅ Temp Plan Time added successfully");

        // นำทางไปยังหน้า edit-temp พร้อมส่ง recipeName
        navigate("/edit-temp", {
          state: { productName, colorName },
        });
      } else {
        throw new Error("❌ Failed to add Temp Plan Time");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "❌ Failed to add Temp Plan Time");
    }
  };

  return (
    <div className="table-container">
      {/* ปุ่มย้อนกลับ */}
      <div className="top-buttons">
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/plantime")}
        >
          Back
        </Button>
      </div>

      <div className="table-header">
        <h2>Product: {productName}({colorName}) Plan Time</h2>
      </div>

      <TableContainer component={Paper} className="custom-table-container">
        <Table className="custom-table">
          <TableHead>
            <TableRow>
              <TableCell>Run No</TableCell>
              <TableCell>Machine</TableCell>
              <TableCell>Batch No</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Mixing</TableCell>
              <TableCell>Extruder Exit</TableCell>
              <TableCell>Pre-Press Exit</TableCell>
              <TableCell>Primary Press Start</TableCell>
              <TableCell>Stream In</TableCell>
              <TableCell>Primary Press Exit</TableCell>
              <TableCell>Secondary Press 1 Start</TableCell>
              <TableCell>Temp Check 1</TableCell>
              <TableCell>Secondary Press 2 Start</TableCell>
              <TableCell>Temp Check 2</TableCell>
              <TableCell>Cooling</TableCell>
              <TableCell>Secondary Press Exit</TableCell>
              <TableCell>Block</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {planTimes.map((plan, index) => (
              <TableRow key={index}>
                <TableCell>{plan.run_no}</TableCell>
                <TableCell>{plan.machine}</TableCell>
                <TableCell>{plan.batch_no}</TableCell>
                <TableCell>{formatTime(plan.start_time)}</TableCell>
                <TableCell>{formatTime(plan.mixing)}</TableCell>
                <TableCell>{formatTime(plan.extruder_exit)}</TableCell>
                <TableCell>{formatTime(plan.pre_press_exit)}</TableCell>
                <TableCell>{formatTime(plan.primary_press_start)}</TableCell>
                <TableCell>{formatTime(plan.stream_in)}</TableCell>
                <TableCell>{formatTime(plan.primary_press_exit)}</TableCell>
                <TableCell>{formatTime(plan.secondary_press_1_start)}</TableCell>
                <TableCell>{formatTime(plan.temp_check_1)}</TableCell>
                <TableCell>{formatTime(plan.secondary_press_2_start)}</TableCell>
                <TableCell>{formatTime(plan.temp_check_2)}</TableCell>
                <TableCell>{formatTime(plan.cooling)}</TableCell>
                <TableCell>{formatTime(plan.secondary_press_exit)}</TableCell>
                <TableCell>{plan.block}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="footer-button">
        <Button
          variant="contained"
          color="primary"
          onClick={handleMachineBreakdown}
        >
          Machine Inspection
        </Button>
      </div>
    </div>
  );
};

export default PlanTimeTable;
