import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import axios from "axios";
import "./temptime.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditTemp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productName, colorName } = location.state || {};
  const [tempPlanTimes, setTempPlanTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newStartTime, setNewStartTime] = useState("");
  const [editingMachineRow, setEditingMachineRow] = useState(false);
  const [newMachineValues, setNewMachineValues] = useState({});

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
          `/api/get/tempplantime/${productName}`
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
  }, [productName]);

  const handleEditStartTime = (tempId, currentStartTime) => {
    setEditingRow(tempId);
    setNewStartTime(currentStartTime || "");
  };

  const handleSaveStartTime = async () => {
    try {
      const formattedTime = newStartTime.includes(":")
        ? `${newStartTime}:00`
        : newStartTime;

      await axios.put(
        `/api/put/tempplantime/update/${productName}/${editingRow}`,
        {
          new_start_time: formattedTime,
        }
      );
      toast.success("✅ Start Time updated successfully");
      setEditingRow(null);
      setNewStartTime("");
      const response = await axios.get(
        `/api/get/tempplantime/${productName}`
      );
      setTempPlanTimes(response.data.tempPlanTimes || []);
    } catch (err) {
      console.error("❌ ERROR updating Start Time:", err);
      toast.error("❌ Failed to update Start Time");
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
      initialValues[plan.temp_id] = plan.machine;
    });
    setNewMachineValues(initialValues);
  };

  const handleSaveMachine = async () => {
    try {
      const machines = Object.entries(newMachineValues).map(([tempId, newMachineName]) => ({
        temp_id: parseInt(tempId, 10),
        new_machine_name: newMachineName,
      }));

      await axios.put(`/api/put/tempplantime/upmachine/${productName}`, {
        machines,
      });

      toast.success("✅ Machines updated successfully");
      setEditingMachineRow(false);
      const response = await axios.get(`/api/get/tempplantime/${productName}`);
      setTempPlanTimes(response.data.tempPlanTimes || []);
    } catch (err) {
      console.error("❌ ERROR updating Machines:", err);
      toast.error("❌ Failed to update Machines");
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

  if (loading) {
    return (
      <div className="temptime-loading-container">
        <div className="temptime-loading-spinner"></div>
        <Typography variant="h6">กำลังโหลดข้อมูล...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="temptime-error-container">
        <Typography variant="h6" color="error">
          ❌ เกิดข้อผิดพลาดในการโหลดข้อมูล
        </Typography>
      </div>
    );
  }

  return (
    <div className="temptime-main-container">
      {/* Header Section */}
      <div className="temptime-header-section">
        <div className="temptime-title-wrapper">
          <ScheduleIcon className="temptime-title-icon" />
          <Typography variant="h4" className="temptime-main-title">
            แก้ไขเวลาแผนชั่วคราว
          </Typography>
        </div>
        
        <div className="temptime-product-info">
          <Chip 
            label={`สินค้า: ${productName}`} 
            className="temptime-product-chip"
            icon={<BuildIcon />}
          />
          {colorName && (
            <Chip 
              label={`สี: ${colorName}`} 
              className="temptime-color-chip"
              variant="outlined"
            />
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="temptime-stats-section">
        <div className="temptime-stat-card">
          <Typography variant="h6" className="temptime-stat-number">
            {tempPlanTimes.length}
          </Typography>
          <Typography variant="body2" className="temptime-stat-label">
            จำนวนแผน
          </Typography>
        </div>
        <div className="temptime-stat-card">
          <Typography variant="h6" className="temptime-stat-number">
            {editingMachineRow ? "แก้ไข" : "ปกติ"}
          </Typography>
          <Typography variant="body2" className="temptime-stat-label">
            สถานะ
          </Typography>
        </div>
      </div>

      {/* Table Section */}
      <div className="temptime-table-section">
        <TableContainer component={Paper} className="temptime-table-container">
          <Table className="temptime-table">
            <TableHead>
              <TableRow className="temptime-table-header">
                <TableCell className="temptime-table-cell-header">Run No</TableCell>
                <TableCell className="temptime-table-cell-header">Machine</TableCell>
                <TableCell className="temptime-table-cell-header">Batch No</TableCell>
                <TableCell className="temptime-table-cell-header">Start Time</TableCell>
                <TableCell className="temptime-table-cell-header">Mixing</TableCell>
                <TableCell className="temptime-table-cell-header">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tempPlanTimes.map((plan, index) => (
                <TableRow 
                  key={plan.temp_id} 
                  className={`temptime-table-row ${index % 2 === 0 ? 'temptime-row-even' : 'temptime-row-odd'}`}
                >
                  <TableCell className="temptime-table-cell">
                    <Chip 
                      label={plan.run_no} 
                      size="small" 
                      className="temptime-run-chip"
                    />
                  </TableCell>
                  <TableCell className="temptime-table-cell">
                    {editingMachineRow ? (
                      <TextField
                        value={newMachineValues[plan.temp_id] || ""}
                        onChange={(e) =>
                          handleMachineChange(plan.temp_id, e.target.value)
                        }
                        placeholder="ชื่อเครื่องจักร"
                        size="small"
                        className="temptime-input-field"
                        fullWidth
                      />
                    ) : (
                      <div className="temptime-machine-name">{plan.machine}</div>
                    )}
                  </TableCell>
                  <TableCell className="temptime-table-cell">
                    <Chip 
                      label={plan.batch_no} 
                      size="small" 
                      variant="outlined"
                      className="temptime-batch-chip"
                    />
                  </TableCell>
                  <TableCell className="temptime-table-cell">
                    {editingRow === plan.temp_id ? (
                      <TextField
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        placeholder="HH:MM"
                        size="small"
                        className="temptime-input-field"
                      />
                    ) : (
                      <div className="temptime-time-display">
                        {formatTime(plan.start_time)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="temptime-table-cell">
                    <div className="temptime-time-display">
                      {formatTime(plan.mixing)}
                    </div>
                  </TableCell>
                  <TableCell className="temptime-table-cell">
                    <div className="temptime-action-buttons">
                      {editingRow === plan.temp_id ? (
                        <>
                          <IconButton
                            color="success"
                            onClick={handleSaveStartTime}
                            className="temptime-save-btn"
                            size="small"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={handleCancelEdit}
                            className="temptime-cancel-btn"
                            size="small"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        plan.start_time && (
                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleEditStartTime(plan.temp_id, plan.start_time)
                            }
                            className="temptime-edit-btn"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="temptime-table-footer">
                <TableCell colSpan={6} className="temptime-footer-cell">
                  <div className="temptime-footer-actions">
                    {editingMachineRow ? (
                      <div className="temptime-machine-edit-actions">
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleSaveMachine}
                          startIcon={<SaveIcon />}
                          className="temptime-save-all-btn"
                        >
                          บันทึกทั้งหมด
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleCancelEditMachine}
                          startIcon={<CancelIcon />}
                          className="temptime-cancel-all-btn"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleEditMachine}
                        startIcon={<BuildIcon />}
                        className="temptime-edit-machine-btn"
                      >
                        แก้ไขเครื่องจักร
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </div>

      {/* Bottom Actions */}
      <div className="temptime-bottom-actions">
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/temp-table", { state: { productName, colorName } })}
          startIcon={<VisibilityIcon />}
          className="temptime-show-table-btn"
          size="large"
        >
          แสดงตารางเวลา
        </Button>
      </div>

      <ToastContainer limit={2} />
    </div>
  );
};

export default EditTemp;
