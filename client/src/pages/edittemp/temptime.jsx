import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // เพิ่ม useNavigate
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Button,
  TextField,
} from "@mui/material";
import axios from "axios";
import "./temptime.css";

const EditTemp = ({ url }) => {
  const location = useLocation();
  const navigate = useNavigate(); // ใช้ useNavigate
  const { productName, colorName } = location.state || {};
  const [tempPlanTimes, setTempPlanTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newStartTime, setNewStartTime] = useState("");
  const [editingMachineRow, setEditingMachineRow] = useState(false); // สำหรับโหมดแก้ไข Machine
  const [newMachineValues, setNewMachineValues] = useState({}); // เก็บค่าที่แก้ไข

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!productName) {
      console.error("❌ No recipeName provided");
      setError(true);
      setLoading(false);
      return;
    }

    const fetchTempPlanTimes = async () => {
      try {
        const response = await axios.get(
          `${url}/api/get/tempplantime/${productName}`
        );
        setTempPlanTimes(response.data.tempPlanTimes || []);
        setError(false);
      } catch (err) {
        console.error("❌ ERROR fetching Temp Plan Times:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTempPlanTimes();
  }, [url, productName]);

  const handleEditStartTime = (tempId, currentStartTime) => {
    setEditingRow(tempId);
    setNewStartTime(currentStartTime || "");
  };

  const handleSaveStartTime = async () => {
    try {
      // ตรวจสอบว่าค่าที่กรอกมีวินาทีหรือไม่ ถ้าไม่มีให้เพิ่ม ":00"
      const formattedTime = newStartTime.includes(":")
        ? `${newStartTime}:00`
        : newStartTime;

      await axios.put(
        `${url}/api/put/tempplantime/update/${productName}/${editingRow}`,
        {
          new_start_time: formattedTime, // ใช้เวลาที่ปรับรูปแบบแล้ว
        }
      );
      alert("✅ Start Time updated successfully");
      setEditingRow(null);
      setNewStartTime("");
      const response = await axios.get(
        `${url}/api/get/tempplantime/${productName}`
      );
      setTempPlanTimes(response.data.tempPlanTimes || []);
    } catch (err) {
      console.error("❌ ERROR updating Start Time:", err);
      alert("❌ Failed to update Start Time");
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setNewStartTime("");
  };

  const handleEditMachine = () => {
    setEditingMachineRow(true);
    const initialValues = {};
    tempPlanTimes.forEach((plan) => {
      initialValues[plan.temp_id] = plan.machine; // ตั้งค่าเริ่มต้นสำหรับ Machine
    });
    setNewMachineValues(initialValues);
  };

  const handleSaveMachine = async () => {
    try {
      // สร้าง payload สำหรับส่งไปยัง API
      const machines = Object.entries(newMachineValues).map(([tempId, newMachineName]) => ({
        temp_id: parseInt(tempId, 10),
        new_machine_name: newMachineName,
      }));

      // ส่งคำขอ PUT ไปยัง API
      await axios.put(`${url}/api/put/tempplantime/upmachine/${productName}`, {
        machines,
      });

      alert("✅ Machines updated successfully");
      setEditingMachineRow(false);
      const response = await axios.get(`${url}/api/get/tempplantime/${productName}`);
      setTempPlanTimes(response.data.tempPlanTimes || []);
    } catch (err) {
      console.error("❌ ERROR updating Machines:", err);
      alert("❌ Failed to update Machines");
    }
  };

  const handleCancelEditMachine = () => {
    setEditingMachineRow(false);
    setNewMachineValues({});
  };

  const handleMachineChange = (tempId, value) => {
    setNewMachineValues((prev) => ({
      ...prev,
      [tempId]: value,
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;

  return (
    <div className="temp-plan-table-container">
      <h1>
        Edit Temp Time fot Product: {productName}({colorName})
      </h1>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Run No</TableCell>
              <TableCell>Machine</TableCell>
              <TableCell>Batch No</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Mixing</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tempPlanTimes.map((plan) => (
              <TableRow key={plan.temp_id}>
                <TableCell>{plan.run_no}</TableCell>
                <TableCell>
                  {editingMachineRow ? (
                    <TextField
                      value={newMachineValues[plan.temp_id] || ""}
                      onChange={(e) =>
                        handleMachineChange(plan.temp_id, e.target.value)
                      }
                      placeholder="Machine Name"
                      size="small"
                    />
                  ) : (
                    plan.machine
                  )}
                </TableCell>
                <TableCell>{plan.batch_no}</TableCell>
                <TableCell>
                  {editingRow === plan.temp_id ? (
                    <TextField
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      placeholder="HH:MM"
                      size="small"
                    />
                  ) : (
                    formatTime(plan.start_time)
                  )}
                </TableCell>
                <TableCell>{formatTime(plan.mixing)}</TableCell>
                <TableCell>
                  {editingRow === plan.temp_id ? (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSaveStartTime}
                        style={{ marginRight: "8px" }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    plan.start_time && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          handleEditStartTime(plan.temp_id, plan.start_time)
                        }
                      >
                        แก้ไขเวลา
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} align="right">
                {editingMachineRow ? (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSaveMachine}
                      style={{ marginRight: "8px" }}
                    >
                      Save All
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancelEditMachine}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEditMachine}
                  >
                    แก้ไข Machine
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate("/temp-table", { state: { productName, colorName } })} // ใช้ navigate
        style={{ marginTop: "20px" }}
      >
        Show time table
      </Button>
    </div>
  );
};

export default EditTemp;
