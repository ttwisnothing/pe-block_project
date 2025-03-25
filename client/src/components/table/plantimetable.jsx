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
import "./plantimetable.css"; // Import CSS

const PlanTimeTable = () => {
  const location = useLocation(); // รับข้อมูลจาก navigate
  const navigate = useNavigate();
  const { recipeName, planTimes } = location.state || {}; // ดึงข้อมูล recipeName และ planTimes

  // หากไม่มีข้อมูล ให้ redirect กลับไปหน้า PlanTime
  if (!recipeName || !planTimes) {
    navigate("/plantime");
    return null;
  }

  // ฟังก์ชันสำหรับแปลงเวลาให้เหลือแค่ชั่วโมงและนาที
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <div className="table-container">
      {/* Recipe Title */}
      <div className="table-header">
        <h2>Recipe: {recipeName}</h2>
      </div>

      {/* Table */}
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

      {/* Machine Breakdown Button */}
      <div className="footer-button">
        <Button
          variant="contained"
          color="primary"
          onClick={() => alert("Machine Breakdown clicked!")}
        >
          Machine Breakdown
        </Button>
      </div>
    </div>
  );
};

export default PlanTimeTable;
