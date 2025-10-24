import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as echarts from "echarts";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import "./home-dashboard.css";

// Routes Configuration
const navRoutes = {
  HOME: "/dashboard",
  ANALYTICS: "/dashboard/analytics",
  DAILY: "/dashboard/daily",
  WEEKLY: "/dashboard/weekly",
  MONTHLY: "/dashboard/monthly",
  DOWNLOADS: "/dashboard/downloads",
};

const HomeDashboard = () => {
  const { plantimeId } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  // ============ STATE MANAGEMENT ============
  const [currentDate, setCurrentDate] = useState("");
  const [oeeData, setOeeData] = useState({
    OEE: "-",
    Availability: "-",
    Performance: "-",
    Quality: "-",
    StartTime: "-",
    EndTime: "-",
    PlannedProductionTime: "-",
    RunTime: "-",
    Downtime: "-",
  });

  const [availabilityData, setAvailabilityData] = useState({
    PlannedProductionTime: "-",
    RunTime: "-",
    Downtime: "-",
  });

  const [qualityData, setQualityData] = useState({
    GoodCount: "-",
    NonGoodCount: "-",
    ReworkCount: "-",
    TotalBlock: "-",
  });

  const [machineTrendData, setMachineTrendData] = useState([]);

  // ============ HELPER FUNCTIONS ============
  const getActiveNav = () => {
    const path = location.pathname;
    for (const [key, route] of Object.entries(navRoutes)) {
      if (path === route) return key;
    }
    return "HOME";
  };

  const handleNavClick = (navName) => {
    if (navRoutes[navName]) {
      navigate(navRoutes[navName]);
    }
  };

  console.log(plantimeId);
  

  // ============ DATA FETCHING ============
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
          StartTime: res.data.StartTime ?? "-",
          EndTime: res.data.EndTime ?? "-",
          PlannedProductionTime: res.data.PlannedProductionTime ?? "-",
          RunTime: res.data.RunTime ?? "-",
          Downtime: res.data.Downtime ?? "-",
          ProductName: res.data.ProductName ?? "-",
        });
      } catch {
        setOeeData({
          OEE: "-",
          Availability: "-",
          Performance: "-",
          Quality: "-",
          StartTime: "-",
          EndTime: "-",
          PlannedProductionTime: "-",
          RunTime: "-",
          Downtime: "-",
          ProductName: "-",
        });
      }
    };
    fetchOEE();
  }, [plantimeId]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await axios.get("/api/get/oee/availability/", {
          params: { plantimeId },
        });
        setAvailabilityData({
          PlannedProductionTime: res.data.PlannedProductionTime ?? "-",
          RunTime: res.data.RunTime ?? "-",
          Downtime: res.data.Downtime ?? "-",
        });
      } catch {
        setAvailabilityData({
          PlannedProductionTime: "-",
          RunTime: "-",
          Downtime: "-",
        });
      }
    };
    fetchAvailability();
  }, [plantimeId]);

  useEffect(() => {
    const fetchQuality = async () => {
      try {
        const res = await axios.get("/api/get/oee/quality/", {
          params: { plantimeId },
        });
        setQualityData({
          GoodCount: res.data.GoodCount ?? "-",
          NonGoodCount: res.data.NonGoodCount ?? "-",
          ReworkCount: res.data.ReworkCount ?? "-",
          TotalBlock: res.data.TotalBlock ?? "-",
        });
      } catch {
        setQualityData({
          GoodCount: "-",
          NonGoodCount: "-",
          ReworkCount: "-",
          TotalBlock: "-",
        });
      }
    };
    fetchQuality();
  }, [plantimeId]);

  // ดึงข้อมูล machine trend
  useEffect(() => {
    const fetchMachineTrend = async () => {
      try {
        const res = await axios.get("/api/get/oee/machine/block-total", {
          params: { plantimeId },
        });
        setMachineTrendData(res.data || []);
      } catch {
        setMachineTrendData([]);
      }
    };
    if (plantimeId) fetchMachineTrend();
  }, [plantimeId]);

  // ============ DATE/TIME UPDATE ============
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

  // ============ CHART CONFIGURATIONS ============
  const oeeBarChartRef = useRef(null);
  const machineTrendChartRef = useRef(null);

  // Machine Runtime Pie Chart
  useEffect(() => {
    const chartDom = document.getElementById("machine-runtime-chart");
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    const runTime = Number(oeeData.RunTime) || 0;
    const downtime = Number(oeeData.Downtime) || 0;

    const option = {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} minutes ({d}%)",
        backgroundColor: "rgba(0,0,0,0.8)",
        borderColor: "transparent",
        textStyle: { color: "#fff" },
        position: "right",
      },
      legend: {
        left: "center",
        bottom: "10",
        orient: "horizontal",
        itemGap: 20,
        formatter: function (name) {
          const data = option.series[0].data;
          let value = 0;
          for (let i = 0; i < data.length; i++) {
            if (data[i].name === name) {
              value = data[i].value;
              break;
            }
          }
          return "{a|" + name + "}\n{b|" + value + " min}";
        },
        textStyle: {
          fontSize: 10,
          color: "#666",
          rich: {
            a: { fontSize: 10, color: "#666", align: "center" },
            b: {
              fontSize: 12,
              fontWeight: "bold",
              color: "#333",
              align: "center",
            },
          },
        },
      },
      series: [
        {
          name: "Machine Actual Run",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          padAngle: 3,
          clockwise: false,
          itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
          label: { show: false, position: "center" },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
              color: "#333",
            },
            itemStyle: { shadowBlur: 15, shadowColor: "rgba(0, 0, 0, 0.3)" },
          },
          labelLine: { show: false },
          data: [
            {
              value: runTime,
              name: "Actual Run",
              itemStyle: { color: "#4CAF50" },
            },
            {
              value: downtime,
              name: "Downtime",
              itemStyle: { color: "#F44336" },
            },
          ],
        },
      ],
      animationType: "expansion",
      animationDuration: 1000,
    };

    myChart.setOption(option);
    const handleResize = () => myChart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      myChart.dispose();
    };
  }, [availabilityData, oeeData]);

  // OEE Analysis Bar Chart
  useEffect(() => {
    const chartDom = oeeBarChartRef.current;
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    const categories = ["OEE", "A", "P", "Q"];
    const parsePercent = (val) => Number(String(val).replace("%", "")) || 0;
    const values = [
      parsePercent(oeeData.OEE),
      parsePercent(oeeData.Availability),
      parsePercent(oeeData.Performance),
      parsePercent(oeeData.Quality),
    ];

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          return params
            .map((item) => `${item.marker} ${item.name}: ${item.value} %`)
            .join("<br/>");
        },
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: [
        {
          type: "category",
          data: categories,
          axisTick: { alignWithLabel: true },
        },
      ],
      yAxis: [{ type: "value", min: 0, max: 100 }],
      series: [
        {
          name: "OEE Metrics",
          type: "bar",
          barWidth: "60%",
          data: values,
          label: {
            show: true,
            position: "top",
            formatter: "{c} %",
            fontWeight: "bold",
            fontSize: 14,
          },
          itemStyle: {
            color: function (params) {
              const colorList = ["#4CAF50", "#FF9800", "#FFC107", "#2196F3"];
              return colorList[params.dataIndex];
            },
          },
        },
      ],
    };

    myChart.setOption(option);
    const handleResize = () => myChart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      myChart.dispose();
    };
  }, [oeeData]);

  // Machine Operation Trend Chart
  useEffect(() => {
    const chartDom = machineTrendChartRef.current;
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);

    const yAxisData = ["M1", "M2", "M3", "M4"];

    const okData = yAxisData.map((m, idx) => {
      const found = machineTrendData.find(
        (d) => Number(d.machine_no) === idx + 1
      );
      return found ? found.cnt_OK : 0;
    });
    const ngData = yAxisData.map((m, idx) => {
      const found = machineTrendData.find(
        (d) => Number(d.machine_no) === idx + 1
      );
      return found ? found.cnt_NG : 0;
    });
    const reworkData = yAxisData.map((m, idx) => {
      const found = machineTrendData.find(
        (d) => Number(d.machine_no) === idx + 1
      );
      return found ? found.cnt_RW : 0;
    });

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {},
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: yAxisData,
      },
      series: [
        {
          name: "OK",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: function (params) {
              return params.value === 0 ? "" : params.value;
            },
          },
          emphasis: { focus: "series" },
          data: okData,
          itemStyle: { color: "#4CAF50" },
        },
        {
          name: "NG",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: function (params) {
              return params.value === 0 ? "" : params.value;
            },
          },
          emphasis: { focus: "series" },
          data: ngData,
          itemStyle: { color: "#F44336" },
        },
        {
          name: "Rework",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: function (params) {
              return params.value === 0 ? "" : params.value;
            },
          },
          emphasis: { focus: "series" },
          data: reworkData,
          itemStyle: { color: "#FF9800" },
        },
      ],
    };

    myChart.setOption(option);

    const handleResize = () => myChart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      myChart.dispose();
    };
  }, [machineTrendData]);

  // ============ RENDER ============
  const activeNav = getActiveNav();

  return (
    <div className="home-dashboard-container">
      {/* Navigation Header */}
      <header className="home-dashboard-header">
        <nav className="home-dashboard-nav">
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
              className={`home-dashboard-nav-btn ${
                activeNav === item.name ? "active" : ""
              }`}
              onClick={() => handleNavClick(item.name)}
            >
              <i className={`fa ${item.icon}`}></i>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="home-dashboard-status-info">
          <div className="home-dashboard-status-inline">
            <span className="home-dashboard-online-dot">
              <i className="fa fa-circle"></i>
            </span>
            <span className="home-dashboard-online-text">Online</span>
            <span className="home-dashboard-status-separator">|</span>
            <span className="home-dashboard-last-updated-text">
              Last Updated On: {currentDate}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-dashboard-main-content">
        {/* Left Section */}
        <section className="home-dashboard-left-section">
          {/* Time Status Bar */}
          <div className="home-dashboard-time-status-bar">
            <TimeCard
              type="run-time"
              icon="fa-play-circle"
              label="Planned"
              value={availabilityData.PlannedProductionTime}
              colorClass="home-dashboard-green"
            />
            <TimeCard
              type="idle-time"
              icon="fa-circle-up"
              label="Actual Run"
              value={availabilityData.RunTime}
              colorClass="home-dashboard-orange"
            />
            <TimeCard
              type="off-time"
              icon="fa-circle-down"
              label="Downtime"
              value={availabilityData.Downtime}
              colorClass="home-dashboard-red"
            />
          </div>

          {/* OEE Metrics */}
          <div className="home-dashboard-oee-metrics-section">
            <MetricCard
              type="oee"
              icon="fa-percentage"
              label="OEE"
              value={oeeData.OEE}
              unit="%"
            />
            <MetricCard
              type="availability"
              icon="fa-clock"
              label="Availability"
              value={oeeData.Availability}
              unit="%"
            />
            <MetricCard
              type="performance"
              icon="fa-tachometer-alt"
              label="Performance"
              value={oeeData.Performance}
              unit="%"
            />
            <MetricCard
              type="quality"
              icon="fa-star"
              label="Quality"
              value={oeeData.Quality}
              unit="%"
            />
          </div>

          {/* Charts */}
          <div className="home-dashboard-charts-section">
            <ChartContainer
              icon="fa-stopwatch"
              title="Machine Actual Run Time (min)"
            >
              <div className="home-dashboard-echarts-chart">
                <div
                  id="machine-runtime-chart"
                  style={{ width: "100%", height: "300px" }}
                ></div>
              </div>
            </ChartContainer>

            <ChartContainer icon="fa-chart-bar" title="OEE Analysis">
              <div
                ref={oeeBarChartRef}
                style={{ width: "100%", height: "300px" }}
              ></div>
            </ChartContainer>

            <ChartContainer
              icon="fa-chart-line"
              title="Machine Operation Trend"
            >
              <div
                ref={machineTrendChartRef}
                style={{ width: "100%", height: "300px" }}
              ></div>
            </ChartContainer>
          </div>
        </section>

        {/* Right Section */}
        <aside className="home-dashboard-right-section">
          <ShiftInfo start={oeeData.StartTime} end={oeeData.EndTime} />
          <MachineState ProductName={oeeData.ProductName} />
          <ProductionCard
            icon="fa-cubes"
            label="TOTAL BLOCK"
            value={qualityData.TotalBlock}
            colorClass="home-dashboard-blue"
          />
          <ProductionCard
            icon="fa-check-circle"
            label="OK"
            value={qualityData.GoodCount}
            colorClass="home-dashboard-green"
          />
          <ProductionCard
            icon="fa-times-circle"
            label="NG"
            value={qualityData.NonGoodCount}
            colorClass="home-dashboard-red"
          />
          <ProductionCard
            icon="fa-wrench"
            label="REWORK"
            value={qualityData.ReworkCount}
            colorClass="home-dashboard-orange"
          />
        </aside>
      </main>
    </div>
  );
};

// ============ SUB COMPONENTS ============
const TimeCard = ({ type, icon, label, value, colorClass }) => (
  <div className={`home-dashboard-time-card home-dashboard-${type}`}>
    <div className="home-dashboard-time-header">
      <span className="home-dashboard-time-icon">
        <i className={`fa ${icon}`}></i>
      </span>
      <span className="home-dashboard-time-label">{label}</span>
      <div className={`home-dashboard-time-value ${colorClass}`}>{value}</div>
    </div>
  </div>
);

const MetricCard = ({ type, icon, label, value, unit }) => (
  <div className={`home-dashboard-metric-card home-dashboard-${type}`}>
    <div className="home-dashboard-metric-header">
      <i className={`fa ${icon}`}></i> {label}
    </div>
    <div className="home-dashboard-metric-value">
      {value} {unit}
    </div>
  </div>
);

const ChartContainer = ({ icon, title, children }) => (
  <div className="home-dashboard-chart-container">
    <div className="home-dashboard-chart-header">
      <span className="home-dashboard-chart-icon">
        <i className={`fa ${icon}`}></i>
      </span>
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const ShiftInfo = ({ start, end }) => (
  <div className="home-dashboard-shift-info">
    <div className="home-dashboard-shift-label">Shift: 1</div>
    <div className="home-dashboard-shift-time-row">
      <span>Start: {start}</span>
      <span className="home-dashboard-shift-time-separator">|</span>
      <span>End: {end}</span>
    </div>
  </div>
);

const MachineState = ({ ProductName }) => (
  <div className="home-dashboard-machine-state">
    <div className="home-dashboard-state-header">PRODUCT NAME:</div>
    <div className="home-dashboard-state-status run">
      {ProductName}
    </div>
  </div>
);

const ProductionCard = ({ icon, label, value, colorClass }) => (
  <div className="home-dashboard-production-card">
    <div className="home-dashboard-production-header">
      <span className="home-dashboard-prod-icon">
        <i className={`fa ${icon}`}></i>
      </span>
      <span className="home-dashboard-prod-label">{label}</span>
    </div>
    <div className={`home-dashboard-prod-value ${colorClass}`}>
      {value} Block
    </div>
  </div>
);

export default HomeDashboard;
