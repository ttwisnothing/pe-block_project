import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import axios from "axios";
import "./temptable.css";
import CustomTable from "../../components/table/table"; // นำเข้า CustomTable
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2"; // นำเข้า SweetAlert2
import DigitalClock from "../../components/clock/digitalClock.jsx"; // นำเข้า DigitalClock

let alertAudio = null; // เพิ่มตัวแปรนี้ไว้ด้านบนสุดของไฟล์ (นอก component)

const playAlertSound = (alertDuration) => {
  alertAudio = new Audio("/sounds/warning-beeping.mp3"); // เสียงเตือน
  alertAudio.play();

  setTimeout(() => {
    if (alertAudio) {
      alertAudio.pause(); // หยุดเสียงเตือนหลังจากครบเวลา
      alertAudio.currentTime = 0; // รีเซ็ตเวลาเสียง
    }
  }, alertDuration); // ระยะเวลาในการเล่นเสียงเตือน
};

const TempTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productName, colorName } = location.state || {};
  const [tempPlanTimes, setTempPlanTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const intervalRef = useRef(null);

  // ฟังก์ชันสำหรับแปลงเวลา
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
          `/api/get/temp-time-asc/${productName}`
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
  }, [ productName]);

  // ฟังก์ชันสำหรับเรียก API addTempPlanTime ด้วย axios
  const handleMachineBreakdown = async () => {
    const addTempPlanTime = async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // จำลองการหน่วงเวลา 1 วินาที

      const response = await axios.post(
        `/api/post/plantime/temp-mb/add/${productName}`
      );

      if (response.status !== 200) {
        throw new Error("❌ Failed to add Temp Plan Time");
      }

      return response.data.message || "✅ Temp Plan Time added successfully";
    };

    try {
      const pendingToastId = toast.loading("⏳ Adding Temp Plan Time...");

      // รอให้ addTempPlanTime สำเร็จ
      const successMessage = await addTempPlanTime();

      // อัปเดต toast เป็น success หลังจากรอ 3-5 วินาที
      setTimeout(() => {
        toast.update(pendingToastId, {
          render: successMessage,
          type: "success",
          isLoading: false,
          autoClose: 3000, // ปิดอัตโนมัติหลัง 3 วินาที
        });

        // นำทางไปยังหน้า edit-temp หลังจากแสดง success
        setTimeout(() => {
          navigate("/edit-temp", {
            state: { productName, colorName },
          });
        }, 3000); // รออีก 3 วินาทีก่อน navigate
      }, 3000); // รอ 3 วินาทีก่อนเปลี่ยนเป็น success
    } catch (error) {
      // แสดงข้อความข้อผิดพลาดใน toast
      toast.error(error.message || "❌ Failed to add Temp Plan Time");
    }
  };

  useEffect(() => {
    const NOTICATION_INTERVAL = 60000; // 1 นาที
    const NOTIFY_BEFORE_MS = 5 * 60 * 1000;
    const NOTIFY_WITHIN_MS = 10 * 60 * 1000;
    const EXACT_MATCH_THRESHOLD_MS = 60 * 1000;

    const alertNotification = () => {
      const currentTime = new Date();
      let closestRow = null;
      let closestDiff = Infinity;

      tempPlanTimes.forEach((row) => {
        Object.entries(row).forEach(([key, timeValue]) => {
          if (!timeValue || typeof timeValue !== "string") return;

          const [hours, minutes, seconds] = timeValue.split(":");
          const eventTime = new Date(currentTime);
          eventTime.setHours(+hours, +minutes, +(seconds || 0), 0);

          const diff = eventTime - currentTime;

          if (Math.abs(diff) < closestDiff) {
            closestDiff = Math.abs(diff);
            closestRow = row;
          }

          if (diff >= NOTIFY_BEFORE_MS && diff <= NOTIFY_WITHIN_MS) {
            toast.warn(
              `⏰ ${key} for ${productName} is in 5-10 minutes "${eventTime.toLocaleTimeString(
                "en-GB",
                {
                  hour12: false,
                }
              )}"`
            );
          }

          if (Math.abs(diff) <= EXACT_MATCH_THRESHOLD_MS) {
            let timeInterval;
            const alertDuration = 10000; // 10 วินาที
            Swal.fire({
              title: "🚨 Time Alert",
              text: `Time for ${key} is now "${eventTime.toLocaleTimeString(
                "en-GB",
                { hour12: false }
              )}"`,
              timer: alertDuration,
              timerProgressBar: true,
              didOpen: () => {
                playAlertSound(alertDuration); // เรียกใช้ฟังก์ชันเสียงเตือน
                Swal.showLoading();
                const timer = Swal.getHtmlContainer().querySelector("b");
                timeInterval = setInterval(() => {
                  if (timer) {
                    timer.textContent = Swal.getTimerLeft();
                  }
                }, 100);
              },
              willClose: () => {
                clearInterval(timeInterval);
              },
              didDestroy: () => {
                // หยุดเสียงเมื่อปิด Swal (กดปิดหรือหมดเวลา)
                if (alertAudio) {
                  alertAudio.pause();
                  alertAudio.currentTime = 0;
                }
              }
            });
          }
        });
      });

      setCurrentRow(closestRow); // อัปเดต currentRow
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
  }, [tempPlanTimes, productName]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;

  return (
    <div className="table-container">
      <DigitalClock />
      <div className="top-buttons">
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.close()}
        >
          Close Table
        </Button>
      </div>

      <div className="table-header">
        <h2>
          Product: {productName}({colorName}) PlanTime
        </h2>
      </div>

      {/* ใช้ CustomTable */}
      <CustomTable
        data={tempPlanTimes}
        formatTime={formatTime}
        currentRow={currentRow}
      />

      <div className="footer-button">
        <Button
          variant="contained"
          color="primary"
          onClick={handleMachineBreakdown}
        >
          ตรวจสอบเครื่องจักร
        </Button>
      </div>
      <ToastContainer limit={2} />
    </div>
  );
};

export default TempTable;
