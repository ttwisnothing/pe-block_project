import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
} from '@mui/material';
import axios from 'axios';
import './temptime.css';

const EditTemp = ({ url }) => {
  const location = useLocation();
  const navigate = useNavigate(); // ใช้ useNavigate
  const { recipeName } = location.state || {};
  const [tempPlanTimes, setTempPlanTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newStartTime, setNewStartTime] = useState('');

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!recipeName) {
      console.error('❌ No recipeName provided');
      setError(true);
      setLoading(false);
      return;
    }

    const fetchTempPlanTimes = async () => {
      try {
        const response = await axios.get(`${url}/api/get/tempplantime/${recipeName}`);
        setTempPlanTimes(response.data.tempPlanTimes || []);
        setError(false);
      } catch (err) {
        console.error('❌ ERROR fetching Temp Plan Times:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTempPlanTimes();
  }, [url, recipeName]);

  const handleEditStartTime = (tempId, currentStartTime) => {
    setEditingRow(tempId);
    setNewStartTime(currentStartTime || '');
  };

  const handleSaveStartTime = async () => {
    try {
      await axios.put(`${url}/api/put/tempplantime/update/${recipeName}/${editingRow}`, {
        new_start_time: newStartTime,
      });
      alert('✅ Start Time updated successfully');
      setEditingRow(null);
      setNewStartTime('');
      const response = await axios.get(`${url}/api/get/tempplantime/${recipeName}`);
      setTempPlanTimes(response.data.tempPlanTimes || []);
    } catch (err) {
      console.error('❌ ERROR updating Start Time:', err);
      alert('❌ Failed to update Start Time');
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setNewStartTime('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;

  return (
    <div className="temp-plan-table-container">
      <h1>Temp Plan Table for Recipe: {recipeName}</h1>
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
                <TableCell>{plan.machine}</TableCell>
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
                        style={{ marginRight: '8px' }}
                      >
                        Save
                      </Button>
                      <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    plan.start_time && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleEditStartTime(plan.temp_id, plan.start_time)}
                      >
                        แก้ไขเวลา
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate('/temp-table', { state: { recipeName } })} // ใช้ navigate
        style={{ marginTop: '20px' }}
      >
        Go to TempTable
      </Button>
    </div>
  );
};

export default EditTemp;