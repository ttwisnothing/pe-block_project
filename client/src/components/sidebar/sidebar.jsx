import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./sidebar.css"; // Import CSS
import "@fortawesome/fontawesome-free/css/all.min.css"; // ใช้ Font Awesome 5

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // ใช้ useState แทน

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          🔷 LOGO
        </Link>
      </div>
      <div className="sidebar-content">
        {/* สร้างเมนูด้วย HTML และ CSS */}
        <div className="sidebar-item">
          <ul className="menu">
            <li>
              <Link to="/" className="menu-item">
                Home
              </Link>
            </li>
            <li>
              <button className="menu-item toggle" onClick={handleToggle}>
                สร้าง Plan Time
                <span className="icon-container">
                  <i
                    className={`fas ${
                      isOpen ? "fa-chevron-down" : "fa-chevron-right"
                    }`}
                  ></i>
                </span>
              </button>
              <ul className={`sub-menu ${isOpen ? "open" : ""}`}>
                {[
                  { id: 1, title: "บันทึก Recipe" },
                  { id: 2, title: "บันทึก Config Time" },
                  // { id: 3, title: "แก้ไขข้อมูล (Edit Plan)" },
                  // { id: 4, title: "บันทึกเวลาจริง (Record Actual Time)" },
                ].map((item) => (
                  <li key={item.id}>
                    <Link to="/" className="menu-item">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link to="/plantime" className="menu-item">
                Plan Time
              </Link>
            </li>
            <li>
              <Link to="/record-data" className="menu-item">
                บันทึกข้อมูล
              </Link>
            </li>
            <li>
              <Link to="/compare" className="menu-item">
                เปรียบเทียบเวลา
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
