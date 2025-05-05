import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import axios from "axios"; // ใช้ axios แทน fetch
import "./plantimetable.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../components/table/table.jsx";
import CustomTable from "../../components/table/table"; // นำเข้า CustomTable
import Swal from "sweetalert2"; // นำเข้า SweetAlert2

const playAlertSound = (alertDuration) => {
  const audio = new Audio("/sounds/warning-beeping.mp3") // เสียงเตือน
  audio.play();

  setTimeout(() => {
    audio.pause(); // หยุดเสียงเตือนหลังจาก 5 วินาที
    audio.currentTime = 0; // รีเซ็ตเวลาเสียง
  }, alertDuration); // ระยะเวลาในการเล่นเสียงเตือน
}

const PlanTimeTable = ({ url }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const [productName, setProductName] = useState("");
  const [colorName, setColorName] = useState("");
  const [planTimes, setPlanTimes] = useState([]);
  const [currentRow, setCurrentRow] = useState(null);

  useEffect(() => {
    let savedData = location.state;
    if (!savedData) {
      const fromStorage = localStorage.getItem("planTimeData");
      if (fromStorage) {
        savedData = JSON.parse(fromStorage);
      }
    }

    if (
      !savedData ||
      !savedData.planTimes ||
      savedData.planTimes.length === 0
    ) {
      toast.error("❌ ไม่มีข้อมูล Plan Time กรุณากลับไปเลือกใหม่");
      navigate("/plantime");
      return;
    }

    // จัดเรียงข้อมูลตาม run_no และ batch_no
    const sortedPlanTimes = [...savedData.planTimes].sort((a, b) => {
      if (a.run_no !== b.run_no) {
        return a.run_no - b.run_no; // จัดเรียงตาม run_no
      }
      return a.batch_no - b.batch_no; // ถ้า run_no เท่ากัน ให้จัดเรียงตาม batch_no
    });

    setProductName(savedData.productName);
    setColorName(savedData.colorName);
    setPlanTimes(sortedPlanTimes); // ใช้ข้อมูลที่จัดเรียงแล้ว

    // เรียก setupAlertInterval หลังจากตั้งค่า planTimes
    const NOTICATION_INTERVAL = 60000; // 1 นาที
    const NOTIFY_BEFORE_MS = 5 * 60 * 1000;
    const NOTIFY_WITHIN_MS = 10 * 60 * 1000;
    const EXACT_MATCH_THRESHOLD_MS = 60 * 1000;

    const alertNotification = () => {
      const currentTime = new Date();
      let closestRow = null;
      let closestDiff = Infinity;

      savedData.planTimes.forEach((row) => {
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
              `⏰ ${key} for ${
                savedData.productName
              } is in 5-10 minutes "${eventTime.toLocaleTimeString("en-GB", {
                hour12: false,
              })}"`
            );
          }

          if (Math.abs(diff) <= EXACT_MATCH_THRESHOLD_MS) {
            let timeInterval;
            const alertDuration = 10000; // 5 วินาที
            Swal.fire({
              title: "⏰ ",
              text: `Time for ${key} is now "${eventTime.toLocaleTimeString(
                "en-GB",
                { hour12: false }
              )}"`,
              timer: alertDuration,
              timerProgressBar: true,
              didOpen: () => {
                playAlertSound(alertDuration); // เรียกใช้ฟังก์ชันเสียงเตือน
                Swal.showLoading();
                const timer = Swal.getHtmlContainer().querySelector("b")
                timeInterval = setInterval(() => {
                  if (timer) {
                    timer.textContent = Swal.getTimerLeft();
                  }
                }, 100)
              },
              willClose: () => {
                clearInterval(timeInterval);
              }
            })
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
  }, [navigate]);

  // ฟังก์ชันสำหรับแปลงเวลา
  const formatTime = (time) => {
    if (!time || typeof time !== "string") return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // ฟังก์ชันสำหรับเรียก API addTempPlanTime ด้วย axios
  const handleMachineBreakdown = async () => {
    const addTempPlanTime = async () => {
      // จำลองการรอเวลา 3-5 วินาที
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await axios.post(
        `${url}/api/post/plantime/temp/add/${productName}`
      );

      if (response.status !== 200) {
        throw new Error("❌ Failed to add Temp Plan Time");
      }

      return response.data.message || "✅ Temp Plan Time added successfully";
    };

    try {
      // แสดงสถานะ pending
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

  return (
    <div className="table-container">
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
          Product: {productName}({colorName}) Plan Time
        </h2>
      </div>

      {/* ใช้ CustomTable */}
      <CustomTable
        data={planTimes}
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

export default PlanTimeTable;
