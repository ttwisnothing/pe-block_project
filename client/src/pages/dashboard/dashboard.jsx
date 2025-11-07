import React, { useEffect, useState } from "react";
import axios from "axios";
import "./dashboard.css";
import NavbarDashboard from "../../components/dashboard/navbar/navbar-dashboard";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  const [plantimeId, setPlantimeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlantimeId = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/api/get/oee/get/plantime");
        if (res.data && res.data.length > 0) {
          setPlantimeId(res.data[0].plantime_id);
        } else {
          setPlantimeId(null);
          setError("ไม่พบข้อมูล plantime_id ล่าสุด");
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล plantime_id");
        setPlantimeId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPlantimeId();
  }, []);

  return (
    <div className="dashboard-container">
      <NavbarDashboard />
      {loading ? (
        <div className="dashboard-loading">กำลังโหลดข้อมูล...</div>
      ) : error ? (
        <div className="dashboard-error">{error}</div>
      ) : (
        <Outlet context={{ plantimeId, setPlantimeId }} />
      )}
    </div>
  );
};

export default Dashboard;