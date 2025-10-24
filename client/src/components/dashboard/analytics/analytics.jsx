import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import axios from "axios";
import "./analytics.css";
import * as echarts from "echarts";

const navRoutes = {
  HOME: "/dashboard",
  ANALYTICS: "/dashboard/analytics",
  DAILY: "/dashboard/daily",
  WEEKLY: "/dashboard/weekly",
  MONTHLY: "/dashboard/monthly",
  DOWNLOADS: "/dashboard/downloads",
};

const Analytics = () => {
  const { plantimeId } = useOutletContext();
  const [currentDate, setCurrentDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [oeeData, setOeeData] = useState({
    OEE: "-",
    Availability: "-",
    Performance: "-",
    Quality: "-",
  });
  const [machineOEE, setMachineOEE] = useState([]);
  const [expandedChart, setExpandedChart] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ตรวจสอบ active จาก path ปัจจุบัน
  const getActiveNav = () => {
    const path = location.pathname;
    for (const [key, route] of Object.entries(navRoutes)) {
      if (path === route) return key;
    }
    return "HOME";
  };
  const activeNav = getActiveNav();
  const chartRefs = React.useRef([]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options = {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      setCurrentDate(now.toLocaleString("th-TH", options).replace(",", ""));
    };
    updateDate();
    const timer = setInterval(updateDate, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchOEE = async () => {
      try {
        const res = await axios.get("/api/get/oee/", {
          params: { plantimeId },
        });
        setOeeData({
          OEE: res.data.OEE ?? "-",
          Availability: res.data.Availability ?? "-",
          Performance: res.data.Performance ?? "-",
          Quality: res.data.Quality ?? "-",
        });
      } catch {
        setOeeData({
          OEE: "-",
          Availability: "-",
          Performance: "-",
          Quality: "-",
        });
      }
    };
    if (plantimeId) fetchOEE();
  }, [plantimeId]);

  // สมมติคุณมี 4 เครื่อง
  const machineList = [
    { machineNo: 1, name: "Machine 1: Secondary Press 1" },
    { machineNo: 2, name: "Machine 2: Secondary Press 2" },
    { machineNo: 3, name: "Machine 3: Secondary Press 3" },
    { machineNo: 4, name: "Machine 4: Secondary Press 4" },
  ];

  useEffect(() => {
    const fetchMachineOEE = async () => {
      if (!plantimeId) return;
      const promises = machineList.map(async (m) => {
        try {
          const res = await axios.get("/api/get/oee/machine/oee/", {
            params: { plantimeId, machineNo: m.machineNo },
          });
          return {
            machineNo: m.machineNo,
            OEE: res.data.OEE,
            Availability: res.data.Availability,
            Performance: res.data.Performance,
            Quality: res.data.Quality,
            TotalBlock: res.data.TotalBlock,
            okCount: res.data.okCount,
            ngCount: res.data.ngCount,
            rwCount: res.data.rwCount,
            planProductionTime: res.data.planProductionTime,
            runTime: res.data.runTime,
            downTime: res.data.downTime,
          };
        } catch {
          return {
            machineNo: m.machineNo,
            OEE: "-",
            Availability: "-",
            Performance: "-",
            Quality: "-",
            TotalBlock: null,
            okCount: null,
            ngCount: null,
            rwCount: null,
            planProductionTime: null,
            runTime: null,
            downTime: null,
          };
        }
      });
      const results = await Promise.all(promises);
      setMachineOEE(results);
    };
    fetchMachineOEE();
  }, [plantimeId]);

  const handleNavClick = (navName) => {
    if (navRoutes[navName]) {
      navigate(navRoutes[navName]);
    }
  };

  const handleApply = () => {
    if (selectedDate && selectedShift) {
      console.log(`Applied: Date ${selectedDate}, Shift ${selectedShift}`);
      // ใส่ logic สำหรับการ apply ข้อมูลที่เลือก
    } else {
      alert("Please select both date and shift");
    }
  };

  // useEffect สำหรับการสร้างกราฟ
  useEffect(() => {
    machineList.forEach((machine, idx) => {
      const oee =
        machineOEE.find((m) => m.machineNo === machine.machineNo) || {};
      const chartDom = chartRefs.current[idx];
      if (!chartDom) return;

      // ตรวจสอบว่ามีข้อมูลหรือไม่
      const hasData =
        oee.OEE !== undefined && oee.OEE !== "-" && oee.OEE !== null;

      // ลบ chart เดิมก่อนสร้างใหม่
      if (chartDom._echarts_instance_) {
        echarts.dispose(chartDom);
      }

      // ถ้าไม่มีข้อมูลก็ไม่สร้างกราฟ
      if (!hasData) {
        return;
      }

      const myChart = echarts.init(chartDom);

      const parsePercent = (val) => Number(String(val).replace("%", "")) || 0;
      const values = [
        parsePercent(oee.OEE),
        parsePercent(oee.Availability),
        parsePercent(oee.Performance),
        parsePercent(oee.Quality),
      ];
      const categories = ["OEE", "A", "P", "Q"];

      const option = {
        grid: {
          left: "15%",
          right: "10%",
          bottom: "15%",
          top: "10%",
        },
        xAxis: {
          type: "category",
          data: categories,
          axisTick: { alignWithLabel: true },
          axisLabel: { fontSize: 11, fontWeight: "bold" },
        },
        yAxis: { type: "value", min: 0, max: 100, axisLabel: { fontSize: 10 } },
        series: [
          {
            name: "OEE Metrics",
            type: "bar",
            barWidth: "60%",
            data: values,
            label: {
              show: true,
              position: "top",
              formatter: "{c}%",
              fontWeight: "bold",
              fontSize: 11,
            },
            itemStyle: {
              color: function (params) {
                const colorList = ["#4CAF50", "#3b82f6", "#f59e0b", "#06b6d4"];
                return colorList[params.dataIndex];
              },
            },
          },
        ],
        animation: false,
      };

      myChart.setOption(option);

      // Responsive
      const handleResize = () => myChart.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (myChart) {
          myChart.dispose();
        }
      };
    });
  }, [machineOEE]);

  const oeeRating =
    Number(oeeData.OEE) >= 90
      ? "Excellent"
      : Number(oeeData.OEE) >= 80
      ? "Good"
      : "Needs Improvement";

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-nav">
          {[
            { name: "HOME", icon: "fa-home" },
            { name: "ANALYTICS", icon: "fa-chart-bar" },
            { name: "DAILY", icon: "fa-calendar-day" },
            { name: "WEEKLY", icon: "fa-calendar-week" },
            { name: "MONTHLY", icon: "fa-calendar-alt" },
            { name: "DOWNLOADS", icon: "fa-cloud-arrow-down" },
          ].map((item) => (
            <button
              key={item.name}
              className={`analytics-nav-btn ${
                activeNav === item.name ? "active" : ""
              }`}
              onClick={() => handleNavClick(item.name)}
            >
              <i className={`fa ${item.icon}`}></i>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="analytics-status-info">
          <div className="analytics-status-item">
            <span>Shift 1 : 17/06/2024 08:00 to 17/06/2024 19:59</span>
          </div>
        </div>
      </div>

      <div className="analytics-main-content">
        <div className="analytics-top-section">
          <div className="analytics-top-left-section">
            <div className="analytics-title">
              <i className="fa-solid fa-chart-area"></i>Shiftwise Analytics
            </div>
          </div>
          <div className="analytics-top-right-section">
            <div className="analytics-date-input">
              <input
                type="date"
                name="shift-date"
                id="shift-date"
                className="analytics-date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Choose a date*"
              />
              <select
                name="shift-select"
                id="shift-select"
                className="analytics-shift-select"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
              >
                <option value="" disabled>
                  Choose a Shift*
                </option>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
              </select>
              <button
                className="analytics-set-datetime-btn"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Overall Plant OEE Section */}
        <div className="analytics-oee-section">
          <div className="analytics-oee-cards">
            <div className="analytics-oee-card main-card">
              <div className="analytics-oee-percentage">{oeeData.OEE}%</div>
              <div className="analytics-oee-label">
                <div className="analytics-oee-status">Overall OEE</div>
                <div className="analytics-oee-rating">{oeeRating}</div>
              </div>
            </div>
            <div className="analytics-oee-card availability-card">
              <div className="analytics-oee-header">Availability</div>
              <div className="analytics-oee-percentage">
                {oeeData.Availability}%
              </div>
              {/* <div className="analytics-oee-comparison positive">+2.1% vs last week</div> */}
            </div>
            <div className="analytics-oee-card performance-card">
              <div className="analytics-oee-header">Performance</div>
              <div className="analytics-oee-percentage">
                {oeeData.Performance}%
              </div>
              {/* <div className="analytics-oee-comparison negative">-1.5% vs last week</div> */}
            </div>
            <div className="analytics-oee-card quality-card">
              <div className="analytics-oee-header">Quality</div>
              <div className="analytics-oee-percentage">{oeeData.Quality}%</div>
              {/* <div className="analytics-oee-comparison positive">+0.2% vs last week</div> */}
            </div>
          </div>
        </div>

        {/* Machine Performance Section */}
        <div className="analytics-machines-section">
          <div className="analytics-machines-grid">
            {machineList.map((machine, idx) => {
              const oee =
                machineOEE.find((m) => m.machineNo === machine.machineNo) || {};

              // ตรวจสอบว่ามีข้อมูลหรือไม่
              const hasData =
                oee.OEE !== undefined && oee.OEE !== "-" && oee.OEE !== null;
              const machineStatus = hasData
                ? "เดินเครื่อง"
                : "ไม่ได้เดินเครื่อง";
              const statusClass = hasData
                ? "machine-running"
                : "machine-stopped";

              return (
                <div
                  className={`analytics-machine-card ${statusClass}`}
                  key={machine.machineNo}
                >
                  <div className="analytics-machine-header">
                    <h4 className="analytics-machine-title">
                      {machine.name}
                      <span
                        className={`analytics-machine-status ${statusClass}`}
                      >
                        {machineStatus}
                      </span>
                    </h4>
                  </div>
                  <div className="analytics-machine-metrics">
                    <div className="analytics-machine-metric oee-metric">
                      <div className="analytics-metric-label">OEE</div>
                      <div
                        className={`analytics-metric-value ${
                          hasData
                            ? Number(oee.OEE) >= 90
                              ? "oee-excellent"
                              : Number(oee.OEE) >= 80
                              ? "oee-good"
                              : "oee-warning"
                            : "oee-no-data"
                        }`}
                      >
                        {hasData ? `${oee.OEE}%` : "N/A"}
                      </div>
                      {!hasData && (
                        <div className="analytics-no-data-message">
                          ไม่มีข้อมูล
                        </div>
                      )}
                    </div>
                    <div className="analytics-machine-metric availability-metric">
                      <div className="analytics-metric-label">Availability</div>
                      <div className="analytics-metric-value">
                        {hasData ? `${oee.Availability}%` : "N/A"}
                      </div>
                    </div>
                    <div className="analytics-machine-metric performance-metric">
                      <div className="analytics-metric-label">Performance</div>
                      <div className="analytics-metric-value">
                        {hasData ? `${oee.Performance}%` : "N/A"}
                      </div>
                    </div>
                    <div className="analytics-machine-metric quality-metric">
                      <div className="analytics-metric-label">Quality</div>
                      <div className="analytics-metric-value">
                        {hasData ? `${oee.Quality}%` : "N/A"}
                      </div>
                    </div>
                    <div
                      className="analytics-machine-metric chart-section"
                      onClick={() =>
                        hasData && setExpandedChart(machine.machineNo)
                      }
                      style={{
                        cursor: hasData ? "pointer" : "not-allowed",
                        opacity: hasData ? 1 : 0.6,
                      }}
                      title={
                        hasData
                          ? "คลิกเพื่อขยายกราฟ"
                          : "ไม่มีข้อมูลสำหรับแสดงกราฟ"
                      }
                    >
                      <div className="analytics-chart-item">
                        <div className="analytics-chart-label">
                          {hasData ? "OEE Analysis" : "ไม่มีข้อมูล"}
                        </div>
                        {hasData ? (
                          <div
                            ref={(el) => (chartRefs.current[idx] = el)}
                            style={{
                              width: "100%",
                              height: "100%",
                              minWidth: "180px",
                              minHeight: "120px",
                            }}
                          ></div>
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              minWidth: "180px",
                              minHeight: "120px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#9ca3af",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            📊 ไม่มีข้อมูล
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Overlay Chart Section */}
      {expandedChart && (
        <div
          className="analytics-chart-overlay"
          onClick={() => setExpandedChart(null)}
        >
          <div
            className="analytics-chart-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="analytics-chart-overlay-close"
              onClick={() => setExpandedChart(null)}
            >
              ×
            </button>
            <h2>
              {machineList.find((m) => m.machineNo === expandedChart)?.name}
            </h2>

            {/* แสดงข้อมูล OEE ของเครื่องที่เลือก */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              {(() => {
                const oee =
                  machineOEE.find((m) => m.machineNo === expandedChart) || {};
                const hasData =
                  oee.OEE !== undefined && oee.OEE !== "-" && oee.OEE !== null;

                return (
                  <>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
                        padding: "24px",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "2px solid #10b981",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        OEE
                      </div>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "800",
                          color: "#10b981",
                        }}
                      >
                        {hasData ? `${oee.OEE}%` : "N/A"}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
                        padding: "24px",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "2px solid #3b82f6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        Availability
                      </div>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "800",
                          color: "#3b82f6",
                        }}
                      >
                        {hasData ? `${oee.Availability}%` : "N/A"}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #fff7ed, #fffbeb)",
                        padding: "24px",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "2px solid #f59e0b",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        Performance
                      </div>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "800",
                          color: "#f59e0b",
                        }}
                      >
                        {hasData ? `${oee.Performance}%` : "N/A"}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #f0fdfa, #ecfeff)",
                        padding: "24px",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "2px solid #06b6d4",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        Quality
                      </div>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "800",
                          color: "#06b6d4",
                        }}
                      >
                        {hasData ? `${oee.Quality}%` : "N/A"}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ข้อมูลรายละเอียดจาก MachineOEEQuery */}
            {(() => {
              const oee =
                machineOEE.find((m) => m.machineNo === expandedChart) || {};
              const hasData =
                oee.OEE !== undefined && oee.OEE !== "-" && oee.OEE !== null;

              if (!hasData) {
                return (
                  <div
                    style={{
                      marginTop: "32px",
                      padding: "40px",
                      textAlign: "center",
                      background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                      borderRadius: "16px",
                      border: "2px dashed #dee2e6",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        color: "#6c757d",
                        marginBottom: "16px",
                      }}
                    >
                      📊
                    </div>
                    <h3 style={{ color: "#6c757d", marginBottom: "8px" }}>
                      ไม่มีข้อมูลสำหรับเครื่องนี้
                    </h3>
                    <p style={{ color: "#868e96", margin: 0 }}>
                      เครื่องยังไม่ได้เริ่มการผลิตหรือไม่มีข้อมูลในระบบ
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {/* ข้อมูลการผลิตรายละเอียด */}
                  <div
                    style={{
                      marginTop: "32px",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {/* Production Stats */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #fff5f5, #fef2f2)",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "2px solid #f87171",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 20px 0",
                          color: "#dc2626",
                          fontSize: "18px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        🎯 สถิติการผลิต
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#7f1d1d", fontWeight: "600" }}>
                            Total Blocks:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#dc2626",
                              fontSize: "18px",
                            }}
                          >
                            {oee.TotalBlock || "N/A"} บล็อค
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#7f1d1d", fontWeight: "600" }}>
                            OK Count:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#16a34a",
                              fontSize: "18px",
                            }}
                          >
                            {oee.okCount || "0"} บล็อค
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#7f1d1d", fontWeight: "600" }}>
                            NG Count:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#dc2626",
                              fontSize: "18px",
                            }}
                          >
                            {oee.ngCount || "0"} บล็อค
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#7f1d1d", fontWeight: "600" }}>
                            Rework Count:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#f59e0b",
                              fontSize: "18px",
                            }}
                          >
                            {oee.rwCount || "0"} บล็อค
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Time Analysis */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "2px solid #38bdf8",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 20px 0",
                          color: "#0284c7",
                          fontSize: "18px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        ⏱️ วิเคราะห์เวลา
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#075985", fontWeight: "600" }}>
                            Plan Production Time:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#0284c7",
                              fontSize: "16px",
                            }}
                          >
                            {oee.planProductionTime
                              ? `${(oee.planProductionTime / 60).toFixed(
                                  1
                                )} hrs`
                              : "N/A"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#075985", fontWeight: "600" }}>
                            Actual Run Time:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#0284c7",
                              fontSize: "16px",
                            }}
                          >
                            {oee.runTime
                              ? `${(oee.runTime / 60).toFixed(1)} hrs`
                              : "N/A"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#075985", fontWeight: "600" }}>
                            Downtime:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color: "#dc2626",
                              fontSize: "16px",
                            }}
                          >
                            {oee.downTime
                              ? `${(oee.downTime / 60).toFixed(1)} hrs`
                              : "0.0 hrs"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "#075985", fontWeight: "600" }}>
                            Efficiency:
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              color:
                                oee.planProductionTime &&
                                oee.runTime &&
                                oee.runTime <= oee.planProductionTime
                                  ? "#16a34a"
                                  : "#dc2626",
                              fontSize: "16px",
                            }}
                          >
                            {oee.planProductionTime && oee.runTime
                              ? `${(
                                  (oee.runTime / oee.planProductionTime) *
                                  100
                                ).toFixed(1)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลเพิ่มเติม */}
                  <div
                    style={{
                      marginTop: "32px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 20px 0",
                          color: "#495057",
                          fontSize: "18px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        🏭 ข้อมูลการผลิต
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          color: "#6c757d",
                          lineHeight: "1.8",
                        }}
                      >
                        <li>
                          <strong>สถานะเครื่องจักร:</strong>{" "}
                          {hasData ? "กำลังทำงาน" : "ไม่ได้เดินเครื่อง"}
                        </li>
                        <li>
                          <strong>ประสิทธิภาพ OEE:</strong>{" "}
                          {oee.OEE ? `${oee.OEE}%` : "N/A"}
                        </li>
                        <li>
                          <strong>คุณภาพผลผลิต:</strong>{" "}
                          {oee.Quality ? `${oee.Quality}%` : "N/A"}
                        </li>
                        <li>
                          <strong>การใช้งานเครื่อง:</strong>{" "}
                          {oee.Availability ? `${oee.Availability}%` : "N/A"}
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "24px",
                        borderRadius: "16px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 20px 0",
                          color: "#495057",
                          fontSize: "18px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        📊 สรุปผลการผลิต
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          color: "#6c757d",
                          lineHeight: "1.8",
                        }}
                      >
                        <li>
                          <strong>ผลผลิตรวม:</strong>{" "}
                          {(oee.okCount || 0) +
                            (oee.ngCount || 0) +
                            (oee.rwCount || 0)}{" "}
                          ชิ้น
                        </li>
                        <li>
                          <strong>อัตราผ่าน:</strong>{" "}
                          {(() => {
                            const total =
                              (oee.okCount || 0) +
                              (oee.ngCount || 0) +
                              (oee.rwCount || 0);
                            return total > 0
                              ? `${(((oee.okCount || 0) / total) * 100).toFixed(
                                  1
                                )}%`
                              : "N/A";
                          })()}
                        </li>
                        <li>
                          <strong>อัตราของเสีย:</strong>{" "}
                          {(() => {
                            const total =
                              (oee.okCount || 0) +
                              (oee.ngCount || 0) +
                              (oee.rwCount || 0);
                            return total > 0
                              ? `${(((oee.ngCount || 0) / total) * 100).toFixed(
                                  1
                                )}%`
                              : "N/A";
                          })()}
                        </li>
                        <li>
                          <strong>อัตรา Rework:</strong>{" "}
                          {(() => {
                            const total =
                              (oee.okCount || 0) +
                              (oee.ngCount || 0) +
                              (oee.rwCount || 0);
                            return total > 0
                              ? `${(((oee.rwCount || 0) / total) * 100).toFixed(
                                  1
                                )}%`
                              : "N/A";
                          })()}
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
