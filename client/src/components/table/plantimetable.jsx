import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress
} from "@mui/material";

const PlanTimeTable = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลจาก API
    axios.get("/api/plantime/")  // ปรับ URL ตามที่ API ของคุณ
      .then((response) => {
        setData(response.data); // สมมติว่า response.data มีข้อมูลในรูปแบบที่คุณต้องการ
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Recipe: {data.recipeName}</h2>
      <TableContainer component={Paper}>
        <Table>
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
            {data.planTimeList.map((plan, index) => (
              <TableRow key={index}>
                <TableCell>{plan.run_no}</TableCell>
                <TableCell>{plan.machine}</TableCell>
                <TableCell>{plan.batch_no}</TableCell>
                <TableCell>{plan.start_time}</TableCell>
                <TableCell>{plan.mixing}</TableCell>
                <TableCell>{plan.extruder_exit}</TableCell>
                <TableCell>{plan.pre_press_exit}</TableCell>
                <TableCell>{plan.primary_press_start}</TableCell>
                <TableCell>{plan.stream_in}</TableCell>
                <TableCell>{plan.primary_press_exit}</TableCell>
                <TableCell>{plan.secondary_press_1_start}</TableCell>
                <TableCell>{plan.temp_check_1}</TableCell>
                <TableCell>{plan.secondary_press_2_start}</TableCell>
                <TableCell>{plan.temp_check_2}</TableCell>
                <TableCell>{plan.cooling}</TableCell>
                <TableCell>{plan.secondary_press_exit}</TableCell>
                <TableCell>{plan.block}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default PlanTimeTable;
