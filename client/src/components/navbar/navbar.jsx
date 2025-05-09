import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo-small.jpg";
import "./navbar.css";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State สำหรับ Hamburger Menu

  const handleMouseEnter = () => {
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setIsDropdownOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle เปิด/ปิดเมนู
  };

  return (
    <nav className="navbar-container">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>

      {/* Hamburger Button */}
      <button className="navbar-hamburger" onClick={toggleMenu}>
        ☰
      </button>

      {/* Menu */}
      <ul className={`navbar-menu ${isMenuOpen ? "open" : ""}`}>
        <li
          className="navbar-dropdown"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-button">New Part</button>
          {isDropdownOpen && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/product" className="navbar-dropdown-item">
                  New Products
                </Link>
              </li>
              <li>
                <Link to="/config-time" className="navbar-dropdown-item">
                  New Config Time
                </Link>
              </li>
            </ul>
          )}
        </li>
        <li
          className="navbar-dropdown"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-button">Plan Time</button>
          {isDropdownOpen && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/plantime" className="navbar-dropdown-item">
                  สร้างแผนเวลา
                </Link>
              </li>
              <li>
                <Link to="/list-plan-time" className="navbar-dropdown-item">
                  Plan Time List
                </Link>
              </li>
            </ul>
          )}
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
