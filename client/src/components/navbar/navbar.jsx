import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo-small.jpg";
import "./navbar.css"; // นำเข้า CSS

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar-container">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>

      {/* Menu */}
      <ul className="navbar-menu">
        <li>
          <Link to="/" className="navbar-item">
            Home
          </Link>
        </li>
        <li
          className="navbar-dropdown"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-button">สร้าง Plan Time</button>
          {isDropdownOpen && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/" className="navbar-dropdown-item">
                  บันทึก Recipe
                </Link>
              </li>
              <li>
                <Link to="/" className="navbar-dropdown-item">
                  บันทึก Config Time
                </Link>
              </li>
            </ul>
          )}
        </li>
        <li>
          <Link to="/plantime" className="navbar-item">
            Plan Time
          </Link>
        </li>
        <li>
          <Link to="/record-data" className="navbar-item">
            บันทึกข้อมูล
          </Link>
        </li>
        <li>
          <Link to="/compare" className="navbar-item">
            เปรียบเทียบเวลา
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
