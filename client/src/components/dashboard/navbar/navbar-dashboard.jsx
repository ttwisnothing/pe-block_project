import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./navbar-dashboard.css";

const navRoutes = {
  HOME: "/dashboard",
  ANALYTICS: "/dashboard/analytics",
  DAILY: "/dashboard/daily",
  WEEKLY: "/dashboard/weekly",
  MONTHLY: "/dashboard/monthly",
  DOWNLOADS: "/dashboard/downloads",
};

const NavbarDashboard = () => {
  const [currentDate, setCurrentDate] = useState("");
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

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNavClick = (navName) => {
    if (navRoutes[navName]) {
      navigate(navRoutes[navName]);
    }
  };

  return (
    <div className="header-section">
      {/* Top Header - Green */}
      <div className="top-header">
        <div className="header-left">
          <div className="logo">
            <i className="fa fa-chart-line"></i>
          </div>
          <div className="header-title">
            <div className="main-title">PE-Block Dashboard</div>
            <div className="subtitle">Production Monitoring System</div>
          </div>
          <div className="production-monitoring">
            Production Monitoring
            {activeNav === "ANALYTICS" && " : Analytics Reports"}
            {activeNav === "DAILY" && " : Daily Reports"}
            {activeNav === "WEEKLY" && " : Weekly Reports"}
            {activeNav === "MONTHLY" && " : Monthly Reports"}
            {activeNav === "DOWNLOADS" && " : Custom Downloads Reports"}
          </div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="back-home-btn" onClick={handleBackToHome}>
              <i className="fa fa-home"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarDashboard;
