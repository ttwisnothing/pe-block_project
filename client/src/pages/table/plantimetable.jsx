import React, { useEffect, useRef } from "react";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PlanTimeTable = ({ url }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const { productName, planTimes, colorName } = location.state || {};

  useEffect(() => {
    if (!planTimes || planTimes.length === 0) {
      toast.error("❌ ไม่มีข้อมูล Plan Time กรุณากลับไปเลือกใหม่");
      navigate("/plantime");
    }

    const NOTICATION_INTERVAL = 60000; // 1 นาที
    const NOTIFY_BEFORE_MS = 5 * 60 * 1000;
    const NOTIFY_WITHIN_MS = 10 * 60 * 1000;
    const EXACT_MATCH_THRESHOLD_MS = 60 * 1000;

    const alertNotification = () => {
      const currentTime = new Date();

      planTimes.forEach((row) => {
        Object.entries(row).forEach(([key, timeValue]) => {
          if (!timeValue || typeof timeValue !== "string") return;

          const [hours, minutes, seconds] = timeValue.split(":");
          const eventTime = new Date(currentTime);
          eventTime.setHours(+hours, +minutes, +(seconds || 0), 0);

          const diff = eventTime - currentTime;

          if (diff > NOTIFY_BEFORE_MS && diff <= NOTIFY_WITHIN_MS) {
            toast.warn(
              `⏰ ${key} for ${productName} is in 5-10 minutes (${eventTime.toLocaleTimeString()})`
            );
          }

          if (Math.abs(diff) <= EXACT_MATCH_THRESHOLD_MS) {
            toast.success(
              `🚨 ${key} for ${productName} is happening now! (${eventTime.toLocaleTimeString()})`
            );
          }
        });
      });
    };

    const setupAlertInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      const timeoutId = setTimeout(() => {
        intervalRef.current = setInterval(
          alertNotification,
          NOTICATION_INTERVAL
        );
        alertNotification(); // รันทันทีครั้งแรก
      }, delay);

      return () => {
        clearTimeout(timeoutId);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    };

    return setupAlertInterval();
  }, [productName, planTimes]);

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
        toast.success(
          response.data.message || "✅ Temp Plan Time added successfully"
        );

        // นำทางไปยังหน้า edit-temp พร้อมส่ง recipeName
        navigate("/edit-temp", {
          state: { productName, colorName },
        });
      } else {
        throw new Error("❌ Failed to add Temp Plan Time");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "❌ Failed to add Temp Plan Time"
      );
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
        <h2>
          Product: {productName}({colorName}) Plan Time
        </h2>
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
            {planTimes.map((plan, index) => {
              const isFirstRowForRun =
                index === 0 || plan.run_no !== planTimes[index - 1].run_no;

              return (
                <TableRow key={index}>
                  {/* Merge Cell สำหรับ Run No */}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {plan.run_no}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {plan.machine}
                    </TableCell>
                  )}
                  <TableCell>{plan.batch_no}</TableCell>
                  <TableCell>{formatTime(plan.start_time)}</TableCell>
                  <TableCell>{formatTime(plan.mixing)}</TableCell>
                  <TableCell>{formatTime(plan.extruder_exit)}</TableCell>
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.pre_press_exit)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.primary_press_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.stream_in)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.primary_press_exit)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.secondary_press_1_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.temp_check_1)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.secondary_press_2_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.temp_check_2)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.cooling)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        planTimes.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.secondary_press_exit)}
                    </TableCell>
                  )}
                  <TableCell>{plan.block}</TableCell>
                </TableRow>
              );
            })}
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
      {/* เพิ่ม ToastContainer */}
      <ToastContainer />
    </div>
  );
};

export default PlanTimeTable;
