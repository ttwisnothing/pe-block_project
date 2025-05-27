import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, IconButton } from "@mui/material";
import axios from "axios";
import "./plantimetable.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../components/table/table.jsx";
import CustomTable from "../../components/table/table"; 
import DigitalClock from "../../components/clock/digitalClock.jsx";
import Swal from "sweetalert2";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import PrintIcon from '@mui/icons-material/Print';

let alertAudio = null;

const playAlertSound = (alertDuration) => {
  alertAudio = new Audio("/sounds/warning-beeping.mp3");
  alertAudio.play();

  setTimeout(() => {
    if (alertAudio) {
      alertAudio.pause();
      alertAudio.currentTime = 0;
    }
  }, alertDuration);
}

const PlanTimeTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const [productName, setProductName] = useState("");
  const [colorName, setColorName] = useState("");
  const [planTimes, setPlanTimes] = useState([]);
  const [currentRow, setCurrentRow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // เพิ่ม effect เพื่ออัปเดตเวลาปัจจุบันทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let savedData = location.state;
    if (!savedData) {
      const fromStorage = localStorage.getItem("planTimeData");
      if (fromStorage) {
        savedData = JSON.parse(fromStorage);
      }
    }

    if (!savedData || !savedData.planTimes || savedData.planTimes.length === 0) {
      toast.error("❌ ไม่มีข้อมูล Plan Time กรุณากลับไปเลือกใหม่");
      navigate("/plantime");
      return;
    }

    // จัดเรียงข้อมูลตาม run_no และ batch_no
    const sortedPlanTimes = [...savedData.planTimes].sort((a, b) => {
      if (a.run_no !== b.run_no) {
        return a.run_no - b.run_no;
      }
      return a.batch_no - b.batch_no;
    });

    setProductName(savedData.productName);
    setColorName(savedData.colorName);
    setPlanTimes(sortedPlanTimes);

    // ตั้งค่าตัวแปรแจ้งเตือน
    const NOTICATION_INTERVAL = 60000; // 1 นาที
    const NOTIFY_BEFORE_MS = 5 * 60 * 1000; // แจ้งเตือนล่วงหน้า 5 นาที
    const NOTIFY_WITHIN_MS = 10 * 60 * 1000; // ภายใน 10 นาที
    const EXACT_MATCH_THRESHOLD_MS = 60 * 1000; // ขอบเขตเวลาตรงกัน 1 นาที

    const alertNotification = () => {
      const currentTime = new Date();
      let closestRow = null;
      let closestDiff = Infinity;

      savedData.planTimes.forEach((row) => {
        Object.entries(row).forEach(([key, timeValue]) => {
          // ข้ามฟิลด์ที่ไม่ใช่เวลา
          if (!timeValue || typeof timeValue !== "string" || 
              !timeValue.includes(":") || 
              ['run_no', 'batch_no', 'id', 'product_id'].includes(key)) return;

          // แปลงเวลาเป็นวัตถุ Date
          const [hours, minutes, seconds] = timeValue.split(":");
          const eventTime = new Date(currentTime);
          eventTime.setHours(+hours, +minutes, +(seconds || 0), 0);

          const diff = eventTime - currentTime;

          // ปรับปรุงหาแถวที่ใกล้เวลาปัจจุบันที่สุด
          if (Math.abs(diff) < closestDiff) {
            closestDiff = Math.abs(diff);
            closestRow = {...row, closestField: key};
          }

          // แจ้งเตือนล่วงหน้า 5-10 นาที
          if (diff >= 0 && diff >= NOTIFY_BEFORE_MS && diff <= NOTIFY_WITHIN_MS) {
            // คำนวณเวลาที่เหลือเป็นนาที
            const minutesLeft = Math.floor(diff / 60000);
            
            toast.warn(
              `⏰ เตือน! ขั้นตอน ${key.replace('_', ' ')} สำหรับ ${savedData.productName} จะเกิดขึ้นในอีก ${minutesLeft} นาที (${eventTime.toLocaleTimeString("th-TH", { hour12: false })})`
            );
          }

          // แจ้งเตือนเมื่อถึงเวลาพอดี
          if (Math.abs(diff) <= EXACT_MATCH_THRESHOLD_MS) {
            let timeInterval;
            const alertDuration = 10000; // 10 วินาที
            
            Swal.fire({
              title: "🚨 ถึงเวลาดำเนินการ!",
              html: `<div class="alert-content">
                     <p><strong>ขั้นตอน:</strong> ${key.replace('_', ' ')}</p>
                     <p><strong>เวลา:</strong> ${eventTime.toLocaleTimeString("th-TH", { hour12: false })}</p>
                     <p><strong>สินค้า:</strong> ${savedData.productName} (${savedData.colorName || '-'})</p>
                     </div>`,
              timer: alertDuration,
              timerProgressBar: true,
              showConfirmButton: true,
              confirmButtonText: 'รับทราบ',
              didOpen: () => {
                playAlertSound(alertDuration);
                Swal.showLoading();
                timeInterval = setInterval(() => {
                  const timer = Swal.getHtmlContainer().querySelector("b.timer-left");
                  if (timer) {
                    timer.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
                  }
                }, 100);
              },
              willClose: () => {
                clearInterval(timeInterval);
              },
              didDestroy: () => {
                if (alertAudio) {
                  alertAudio.pause();
                  alertAudio.currentTime = 0;
                }
              }
            });
          }
        });
      });

      setCurrentRow(closestRow);
    };

    const setupAlertInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // ซิงค์กับนาทีถัดไป
      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      const timeoutId = setTimeout(() => {
        alertNotification(); // รันครั้งแรกทันที
        intervalRef.current = setInterval(alertNotification, NOTICATION_INTERVAL);
      }, delay);

      return () => {
        clearTimeout(timeoutId);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    };

    return setupAlertInterval();
  }, [navigate, location.state]);

  // ฟังก์ชันสำหรับแปลงเวลา
  const formatTime = (time) => {
    if (!time || typeof time !== "string" || !time.includes(":")) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // ฟังก์ชันสำหรับตรวจสอบเครื่องจักร
  const handleMachineBreakdown = async () => {
    setIsLoading(true);
    
    try {
      // แสดงสถานะ loading
      const pendingToastId = toast.loading("⏳ กำลังเพิ่มข้อมูลแผนชั่วคราว...");

      // เรียก API
      const response = await axios.post(`/api/post/plantime/temp/add/${productName}`);
      
      if (response.status !== 200) {
        throw new Error("❌ ไม่สามารถเพิ่มข้อมูลแผนชั่วคราวได้");
      }

      // อัพเดท toast เป็น success
      toast.update(pendingToastId, {
        render: response.data.message || "✅ เพิ่มข้อมูลแผนชั่วคราวสำเร็จ",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // นำทางไปยังหน้า edit-temp
      setTimeout(() => {
        navigate("/edit-temp", {
          state: { productName, colorName },
        });
      }, 3000);
    } catch (error) {
      toast.error(error.message || "❌ ไม่สามารถเพิ่มข้อมูลแผนชั่วคราวได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับพิมพ์แผนเวลา
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="table-container">
      <div className="table-header-section">
        <DigitalClock showDate={true} showSeconds={true} is24Hour={true} />
        
        <div className="top-buttons">
          <Button
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={() => window.close()}
            className="close-button"
          >
            ปิดตารางเวลา
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            className="print-button"
          >
            พิมพ์แผนเวลา
          </Button>
        </div>
      </div>

      <div className="product-info-section">
        <div className="table-header">
          <h2>
            <span className="product-label">สินค้า:</span> 
            <span className="product-name">{productName}</span>
            {colorName && (
              <span className="product-color">({colorName})</span>
            )}
          </h2>
        </div>

        {/* แสดงแถวปัจจุบันที่ใกล้เวลาปัจจุบันที่สุด */}
        {currentRow && (
          <div className="current-step">
            <div className="current-step-label">ขั้นตอนปัจจุบัน:</div>
            <div className="current-step-value">
              {currentRow.closestField && currentRow.closestField.replace('_', ' ')}
            </div>
          </div>
        )}
      </div>

      {/* ใช้ CustomTable */}
      <div className="table-responsive">
        <CustomTable
          data={planTimes}
          formatTime={formatTime}
          currentRow={currentRow}
        />
      </div>

      <div className="footer-actions">
        <Button
          variant="contained"
          color="primary"
          startIcon={<BuildIcon />}
          onClick={handleMachineBreakdown}
          disabled={isLoading}
          className="machine-button"
        >
          {isLoading ? "กำลังดำเนินการ..." : "ตรวจสอบเครื่องจักร"}
        </Button>
      </div>
      
      <ToastContainer position="top-right" limit={3} />
    </div>
  );
};

export default PlanTimeTable;
