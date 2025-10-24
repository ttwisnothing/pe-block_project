import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import axios from "axios";
import "./plantimetable.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../components/table/table.jsx";
import CustomTable from "../../components/table/table";
import CustomTableB150 from "../../components/table/tableb";
import CustomTableA110F from "../../components/table/tablea"; // เพิ่มบรรทัดนี้
import DigitalClock from "../../components/clock/digitalClock";
import Swal from "sweetalert2";
import CloseIcon from "@mui/icons-material/Close";
import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";

let alertAudio = null;

const fieldSoundMap5Min = {
  start_time: "/sounds/1. stand by autostart.wav",
  primary_press_start: "/sounds/2. stand by primary press.wav",
  stream_in: "/sounds/4. stand by stream in.wav",
  secondary_press_1_start: "/sounds/3. stand by secondary press.wav",
};

const fieldSoundMapExact = {
  start_time: "/sounds/1. auto start.wav",
  primary_press_start: "/sounds/2. primary press.wav",
  stream_in: "/sounds/4. stream in.wav",
  secondary_press_1_start: "/sounds/3. out seccondary.wav",
};

// ปรับฟังก์ชันให้รับ mapping
const playAlertSound = (alertDuration, fieldName, soundMap) => {
  const soundSrc = soundMap[fieldName] || "/sounds/warning-beeping.mp3";
  alertAudio = new Audio(soundSrc);
  alertAudio.play();

  setTimeout(() => {
    if (alertAudio) {
      alertAudio.pause();
      alertAudio.currentTime = 0;
    }
  }, alertDuration);
};

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
  const [tableType, setTableType] = useState("default");
  const [refreshing, setRefreshing] = useState(false);
  const [plantimeId, setPlantimeId] = useState(""); // เพิ่ม state

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

    if (
      !savedData ||
      !savedData.planTimes ||
      savedData.planTimes.length === 0
    ) {
      toast.error("❌ ไม่มีข้อมูล Plan Time กรุณากลับไปเลือกใหม่");
      navigate("/plantime");
      return;
    }

    // เซ็ต plantimeId
    if (savedData.plantimeId) {
      setPlantimeId(savedData.plantimeId);
    }

    // เรียกใช้ determineTableType ด้วย productName จาก savedData
    determineTableType(savedData.productName);

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

      // เพิ่มรายชื่อฟิลด์ที่ต้องการแจ้งเตือน
      const notifyFields = [
        "start_time",
        "extruder_exit",
        "primary_press_start",
        "stream_in",
        "primary_press_exit",
        "secondary_press_1_start",
        "secondary_press_exit",
      ];

      savedData.planTimes.forEach((row) => {
        Object.entries(row).forEach(([key, timeValue]) => {
          // ข้ามฟิลด์ที่ไม่ใช่เวลา หรือไม่อยู่ในรายชื่อที่ต้องการแจ้งเตือน
          if (
            !timeValue ||
            typeof timeValue !== "string" ||
            !timeValue.includes(":") ||
            !notifyFields.includes(key) || // เพิ่มบรรทัดนี้
            ["run_no", "batch_no", "id", "product_id"].includes(key)
          )
            return;

          // แปลงเวลาเป็นวัตถุ Date
          const [hours, minutes, seconds] = timeValue.split(":");
          const eventTime = new Date(currentTime);
          eventTime.setHours(+hours, +minutes, +(seconds || 0), 0);

          const diff = eventTime - currentTime;

          // ปรับปรุงหาแถวที่ใกล้เวลาปัจจุบันที่สุด
          if (Math.abs(diff) < closestDiff) {
            closestDiff = Math.abs(diff);
            closestRow = { ...row, closestField: key };
          }

          // แจ้งเตือนล่วงหน้า 5-10 นาที
          if (
            diff >= 0 &&
            diff >= NOTIFY_BEFORE_MS &&
            diff <= NOTIFY_WITHIN_MS
          ) {
            const minutesLeft = Math.floor(diff / 60000);

            toast.warn(
              `⏰ เตือน! ขั้นตอน ${key.replace("_", " ")} สำหรับ ${
                savedData.productName
              } จะเกิดขึ้นในอีก ${minutesLeft} นาที (${eventTime.toLocaleTimeString(
                "th-TH",
                { hour12: false }
              )})`
            );

            // เพิ่มเสียงแจ้งเตือนเฉพาะตอนเหลือ 5 นาที
            if (minutesLeft === 5) {
              playAlertSound(5000, key, fieldSoundMap5Min); // ใช้ mapping สำหรับ 5 นาที
            }
          }

          // แจ้งเตือนเมื่อถึงเวลาพอดี
          if (diff >= 0 && diff <= EXACT_MATCH_THRESHOLD_MS) {
            let timeInterval;
            const alertDuration = 5000;

            Swal.fire({
              title: "🚨 ถึงเวลาดำเนินการ!",
              html: `<div class="plantimetable-alert-content">
                     <p><strong>ขั้นตอน:</strong> ${key.replace("_", " ")}</p>
                     <p><strong>เวลา:</strong> ${eventTime.toLocaleTimeString(
                       "th-TH",
                       { hour12: false }
                     )}</p>
                     <p><strong>สินค้า:</strong> ${savedData.productName} (${
                savedData.colorName || "-"
              })</p>
                     </div>`,
              timer: alertDuration,
              timerProgressBar: true,
              showConfirmButton: true,
              confirmButtonText: "รับทราบ",
              didOpen: () => {
                playAlertSound(alertDuration, key, fieldSoundMapExact); // ใช้ mapping สำหรับตรงเวลา
                Swal.showLoading();
                timeInterval = setInterval(() => {
                  const timer =
                    Swal.getHtmlContainer().querySelector("b.timer-left");
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
              },
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
        intervalRef.current = setInterval(
          alertNotification,
          NOTICATION_INTERVAL
        );
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

  // ฟังก์ชันสำหรับกำหนดประเภทตาราง
  const determineTableType = (productName) => {
    if (productName && productName.includes("B-150")) {
      setTableType("b150");
    } else if (productName && productName.includes("RP-300S")) {
      setTableType("default");
    } else if (productName && productName.includes("A-110F")) {
      setTableType("a110f");
    }
  };

  const renderTable = () => {
    switch (tableType) {
      case "b150":
        return (
          <CustomTableB150
            data={planTimes}
            formatTime={formatTime}
            currentRow={currentRow}
          />
        );
      case "a110f": // เพิ่ม case นี้
        return (
          <CustomTableA110F
            data={planTimes}
            formatTime={formatTime}
            currentRow={currentRow}
          />
        );
      case "default":
      default:
        return (
          <CustomTable
            data={planTimes}
            formatTime={formatTime}
            currentRow={currentRow}
          />
        );
    }
  };

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

      // ดึง plantimeId จาก localStorage หรือ state
      let plantimeId = "";
      const planTimeData = localStorage.getItem("planTimeData");
      if (planTimeData) {
        const parsed = JSON.parse(planTimeData);
        plantimeId = parsed.plantimeId;
      }

      // เรียก API
      const response = await axios.post(
        `/api/post/plantime/temp/add/${plantimeId}`
      );

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
          state: { plantimeId, productName, colorName },
        });
      }, 3000);
    } catch (error) {
      toast.error(error.message || "❌ ไม่สามารถเพิ่มข้อมูลแผนชั่วคราวได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (!plantimeId) {
        toast.error("❌ ไม่พบ plantimeId สำหรับรีเฟรชข้อมูล");
        setRefreshing(false);
        return;
      }
      const response = await axios.get(`/api/get/plantime/${plantimeId}`);

      if (response.data && response.data.planTimes) {
        const sortedPlanTimes = [...response.data.planTimes].sort((a, b) => {
          if (a.run_no !== b.run_no) {
            return a.run_no - b.run_no;
          }
          return a.batch_no - b.batch_no;
        });
        setPlanTimes(sortedPlanTimes);
        toast.success("✅ ข้อมูลถูกอัพเดทแล้ว");
      }
    } catch (error) {
      toast.error("❌ ไม่สามารถอัพเดทข้อมูลได้", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="plantimetable-container">
      <div className="plantimetable-header-section">
        <div className="plantimetable-clock-wrapper">
          <DigitalClock showDate={true} showSeconds={true} is24Hour={true} />
        </div>

        <div className="plantimetable-top-buttons">
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            className="plantimetable-refresh-button"
          >
            {refreshing ? "กำลังอัพเดท..." : "รีเฟรช"}
          </Button>
          <Button
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={() => window.close()}
            className="plantimetable-close-button"
          >
            ปิดตารางเวลา
          </Button>
        </div>
      </div>

      <div className="plantimetable-product-info-section">
        <div className="plantimetable-table-header">
          <h2>
            <span className="plantimetable-product-label">สินค้า:</span>
            <span className="plantimetable-product-name">{productName}</span>
            {colorName && (
              <span className="plantimetable-product-color">({colorName})</span>
            )}
          </h2>
        </div>

        {/* แสดงแถวปัจจุบันที่ใกล้เวลาปัจจุบันที่สุด */}
        {currentRow && (
          <div className="plantimetable-current-step">
            <div className="plantimetable-current-step-icon"></div>
            <div className="plantimetable-current-step-content">
              <div className="plantimetable-current-step-label">
                ขั้นตอนปัจจุบัน:
              </div>
              <div className="plantimetable-current-step-value">
                {currentRow.closestField &&
                  currentRow.closestField.replace("_", " ")}
              </div>
            </div>
            <div className="plantimetable-current-step-time">
              {currentTime.toLocaleTimeString("th-TH", { hour12: false })}
            </div>
          </div>
        )}
      </div>

      {/* ใช้ CustomTable */}
      <div className="plantimetable-table-responsive">{renderTable()}</div>

      <div className="plantimetable-footer-actions">
        <Button
          variant="contained"
          color="primary"
          startIcon={<BuildIcon />}
          onClick={handleMachineBreakdown}
          disabled={isLoading}
          className="plantimetable-machine-button"
        >
          {isLoading ? "⏳ กำลังดำเนินการ..." : "ตรวจสอบเครื่องจักร"}
        </Button>

        <div className="plantimetable-status-info">
          <div className="plantimetable-status-item">
            <span className="plantimetable-status-label">จำนวนแผน:</span>
            <span className="plantimetable-status-value">
              {planTimes.length} รายการ
            </span>
          </div>
          <div className="plantimetable-status-item">
            <span className="plantimetable-status-label">วันที่:</span>
            <span className="plantimetable-status-value">
              {currentTime.toLocaleDateString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" limit={3} />
    </div>
  );
};

export default PlanTimeTable;
