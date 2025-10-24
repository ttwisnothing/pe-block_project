import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./daily.css";

const navRoutes = {
  HOME: "/dashboard",
  ANALYTICS: "/dashboard/analytics",
  DAILY: "/dashboard/daily",
  WEEKLY: "/dashboard/weekly",
  MONTHLY: "/dashboard/monthly",
  DOWNLOADS: "/dashboard/downloads",
};

const Daily = () => {
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

  const handleNavClick = (navName) => {
    if (navRoutes[navName]) {
      navigate(navRoutes[navName]);
    }
  };

  return (
    <div>
      <div className="daily-container">
        <div className="daily-header">
          <div className="daily-nav">
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
                className={`daily-nav-btn ${
                  activeNav === item.name ? "active" : ""
                }`}
                onClick={() => handleNavClick(item.name)}
              >
                <i className={`fa ${item.icon}`}></i>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          <div className="daily-status-info">
            <div className="daily-status-item">
              <span>Selected Range : 11/06/2024 08:00 to 18/06/2024 07:59</span>
            </div>
          </div>
        </div>

        <div className="daily-content">
          <h2>Analytics Page</h2>
        </div>
      </div>
    </div>
  );
};

export default Daily;
