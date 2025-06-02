import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import axios from "axios";
import "./temptable.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../components/table/table.jsx";
import CustomTable from "../../components/table/table";
import CustomTableB150 from "../../components/table/tableb";
import DigitalClock from "../../components/clock/digitalClock";
import Swal from "sweetalert2";
import CloseIcon from "@mui/icons-material/Close";
import BuildIcon from "@mui/icons-material/Build";
import RefreshIcon from "@mui/icons-material/Refresh";

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
};

const TempTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const { productName, colorName } = location.state || {};
  const [tempPlanTimes, setTempPlanTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tableType, setTableType] = useState("default");

  // อัปเดตเวลาปัจจุบันทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันสำหรับกำหนดประเภทตาราง
  const determineTableType = (productName) => {
    if (productName && productName.includes("B-150")) {
      setTableType("b150");
    } else if (productName && productName.includes("RP-300S")) {
      setTableType("default");
    } else {
      setTableType("default");
    }
  };

  // ฟังก์ชันสำหรับเลือกตารางที่เหมาะสม
  const renderTable = () => {
    switch (tableType) {
      case "b150":
        return (
          <CustomTableB150
            data={tempPlanTimes}
            formatTime={formatTime}
            currentRow={currentRow}
          />
        );
      case "default":
      default:
        return (
          <CustomTable
            data={tempPlanTimes}
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

  useEffect(() => {
    if (!productName) {
      console.error("❌ No recipeName provided");
      setError(true);
      setLoading(false);
      return;
    }

    // เรียกใช้ determineTableType
    determineTableType(productName);

    const fetchTempPlanTimes = async () => {
      try {
        const response = await axios.get(
          `/api/get/tempplantime/${productName}`
        );
        
        // จัดเรียงข้อมูลตาม run_no และ batch_no เหมือน temptable
        const sortedTempPlanTimes = [...(response.data.tempPlanTimes || [])].sort((a, b) => {
          if (a.run_no !== b.run_no) {
            return a.run_no - b.run_no;
          }
          return a.batch_no - b.batch_no;
        });

        setTempPlanTimes(sortedTempPlanTimes);
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

  // ฟังก์ชันสำหรับเรียก API addTempPlanTime ด้วย axios
  const handleMachineBreakdown = async () => {
    setIsLoading(true);

    try {
      const pendingToastId = toast.loading("⏳ กำลังเพิ่มข้อมูลแผนชั่วคราว...");

      const response = await axios.post(
        `/api/post/plantime/temp-mb/add/${productName}`
      );

      if (response.status !== 200) {
        throw new Error("❌ ไม่สามารถเพิ่มข้อมูลแผนชั่วคราวได้");
      }

      toast.update(pendingToastId, {
        render: response.data.message || "✅ เพิ่มข้อมูลแผนชั่วคราวสำเร็จ",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

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

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`/api/get/tempplantime/${productName}`);
      
      if (response.data && response.data.tempPlanTimes) {
        // จัดเรียงข้อมูลใหม่
        const sortedTempPlanTimes = [...response.data.tempPlanTimes].sort((a, b) => {
          if (a.run_no !== b.run_no) {
            return a.run_no - b.run_no;
          }
          return a.batch_no - b.batch_no;
        });
        
        setTempPlanTimes(sortedTempPlanTimes);
        toast.success("✅ ข้อมูลถูกอัพเดทแล้ว");
      }
    } catch (error) {
      toast.error("❌ ไม่สามารถอัพเดทข้อมูลได้");
    } finally {
      setRefreshing(false);
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
        // ใช้วิธีการเดียวกับ temptable - วนลูปทุก field
        Object.entries(row).forEach(([key, timeValue]) => {
          // ข้ามฟิลด์ที่ไม่ใช่เวลา
          if (
            !timeValue ||
            typeof timeValue !== "string" ||
            !timeValue.includes(":") ||
            ["run_no", "batch_no", "temp_id", "product_id", "machine"].includes(key)
          )
            return;

          const [hours, minutes, seconds] = timeValue.split(":");
          const eventTime = new Date(currentTime);
          eventTime.setHours(+hours, +minutes, +(seconds || 0), 0);

          const diff = eventTime - currentTime;

          if (Math.abs(diff) < closestDiff) {
            closestDiff = Math.abs(diff);
            closestRow = { ...row, closestField: key };
          }

          if (diff >= 0 && diff >= NOTIFY_BEFORE_MS && diff <= NOTIFY_WITHIN_MS) {
            const minutesLeft = Math.floor(diff / 60000);
            toast.warn(
              `⏰ เตือน! ขั้นตอน ${key.replace("_", " ")} สำหรับ ${productName} จะเกิดขึ้นในอีก ${minutesLeft} นาที (${eventTime.toLocaleTimeString(
                "th-TH",
                { hour12: false }
              )})`
            );
          }

          if (Math.abs(diff) <= EXACT_MATCH_THRESHOLD_MS) {
            let timeInterval;
            const alertDuration = 10000;

            Swal.fire({
              title: "🚨 ถึงเวลาดำเนินการ!",
              html: `<div class="temptable-alert-content">
                     <p><strong>ขั้นตอน:</strong> ${key.replace("_", " ")}</p>
                     <p><strong>เวลา:</strong> ${eventTime.toLocaleTimeString(
                       "th-TH",
                       { hour12: false }
                     )}</p>
                     <p><strong>สินค้า:</strong> ${productName} (${colorName || "-"})</p>
                     </div>`,
              timer: alertDuration,
              timerProgressBar: true,
              showConfirmButton: true,
              confirmButtonText: "รับทราบ",
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

      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      const timeoutId = setTimeout(() => {
        alertNotification();
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
  }, [tempPlanTimes, productName, colorName]);

  if (loading) {
    return (
      <div className="temptable-loading-container">
        <div className="temptable-loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="temptable-error-container">
        <p>❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="temptable-container">
      <div className="temptable-header-section">
        <div className="temptable-clock-wrapper">
          <DigitalClock showDate={true} showSeconds={true} is24Hour={true} />
        </div>

        <div className="temptable-top-buttons">
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            className="temptable-refresh-button"
          >
            {refreshing ? "กำลังอัพเดท..." : "รีเฟรช"}
          </Button>
          <Button
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={() => window.close()}
            className="temptable-close-button"
          >
            ปิดตารางเวลา
          </Button>
        </div>
      </div>
 
      <div className="temptable-product-info-section">
        <div className="temptable-table-header">
          <h2>
            <span className="temptable-product-label">สินค้า:</span>
            <span className="temptable-product-name">{productName}</span>
            {colorName && <span className="temptable-product-color">({colorName})</span>}
          </h2>
        </div>

        {/* แสดงแถวปัจจุบันที่ใกล้เวลาปัจจุบันที่สุด */}
        {currentRow && (
          <div className="temptable-current-step">
            <div className="temptable-current-step-icon"></div>
            <div className="temptable-current-step-content">
              <div className="temptable-current-step-label">ขั้นตอนปัจจุบัน:</div>
              <div className="temptable-current-step-value">
                {currentRow.closestField &&
                  currentRow.closestField.replace("_", " ")}
              </div>
            </div>
            <div className="temptable-current-step-time">
              {currentTime.toLocaleTimeString("th-TH", { hour12: false })}
            </div>
          </div>
        )}
      </div>

      {/* ใช้ CustomTable */}
      <div className="temptable-table-responsive">{renderTable()}</div>

      <div className="temptable-footer-actions">
        <Button
          variant="contained"
          color="primary"
          startIcon={<BuildIcon />}
          onClick={handleMachineBreakdown}
          disabled={isLoading}
          className="temptable-machine-button"
        >
          {isLoading ? "⏳ กำลังดำเนินการ..." : "ตรวจสอบเครื่องจักร"}
        </Button>
        
        <div className="temptable-status-info">
          <div className="temptable-status-item">
            <span className="temptable-status-label">จำนวนแผน:</span>
            <span className="temptable-status-value">{tempPlanTimes.length} รายการ</span>
          </div>
          <div className="temptable-status-item">
            <span className="temptable-status-label">วันที่:</span>
            <span className="temptable-status-value">{currentTime.toLocaleDateString("th-TH")}</span>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" limit={3} />
    </div>
  );
};

export default TempTable;
