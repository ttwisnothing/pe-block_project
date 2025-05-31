import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./navbar.css";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMouseEnter = (dropdown) => {
    setActiveDropdown(dropdown);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
    setIsDropdownOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setActiveDropdown(null);
  };

  const handleDropdownClick = (dropdown) => {
    if (window.innerWidth <= 768) {
      if (activeDropdown === dropdown) {
        setActiveDropdown(null);
        setIsDropdownOpen(false);
      } else {
        setActiveDropdown(dropdown);
        setIsDropdownOpen(true);
      }
    }
  };

  return (
    <nav className="nav-container">
      {/* Logo Section */}
      <div className="nav-brand">
        <Link to="/" className="nav-brand-link" onClick={closeMenu}>
          <img src={logo} alt="INOAC PE Block Logo" className="nav-logo" />
          <div className="nav-brand-text">
            <span className="nav-company">INOAC</span>
            <span className="nav-department">PE Block Department</span>
          </div>
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className={`nav-mobile-toggle ${isMenuOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        <span className="nav-hamburger-line"></span>
        <span className="nav-hamburger-line"></span>
        <span className="nav-hamburger-line"></span>
      </button>

      {/* Navigation Menu */}
      <ul className={`nav-menu ${isMenuOpen ? "open" : ""}`}>
        {/* New Part Dropdown */}
        <li
          className="nav-dropdown"
          onMouseEnter={() => handleMouseEnter('newpart')}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            className="nav-dropdown-trigger"
            onClick={() => handleDropdownClick('newpart')}
            aria-expanded={isDropdownOpen && activeDropdown === 'newpart'}
          >
            <span className="nav-dropdown-icon">📦</span>
            New Part
            <span className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'newpart' ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'newpart' ? 'visible' : ''}`}>
            <li>
              <Link to="/product" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">🏭</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">New Products</span>
                  <span className="nav-link-desc">เพิ่มผลิตภัณฑ์ใหม่</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/config-time" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">⚙️</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">New Config Time</span>
                  <span className="nav-link-desc">ตั้งค่าเวลาการผลิต</span>
                </div>
              </Link>
            </li>
          </ul>
        </li>
        
        {/* Plan Time Dropdown */}
        <li
          className="nav-dropdown"
          onMouseEnter={() => handleMouseEnter('plantime')}
          onMouseLeave={handleMouseLeave}
        > 
          <button 
            className="nav-dropdown-trigger"
            onClick={() => handleDropdownClick('plantime')}
            aria-expanded={isDropdownOpen && activeDropdown === 'plantime'}
          >
            <span className="nav-dropdown-icon">📅</span>
            Plan Time
            <span className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'plantime' ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'plantime' ? 'visible' : ''}`}>
            <li>
              <Link to="/plantime" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">➕</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">สร้างแผนเวลา</span>
                  <span className="nav-link-desc">วางแผนการผลิตใหม่</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/plantime-list" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">📋</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">Plan Time List</span>
                  <span className="nav-link-desc">รายการแผนการผลิต</span>
                </div>
              </Link>
            </li>
          </ul>
        </li>

        {/* Production Dropdown */}
        <li
          className="nav-dropdown"
          onMouseEnter={() => handleMouseEnter('production')}
          onMouseLeave={handleMouseLeave}
        > 
          <button 
            className="nav-dropdown-trigger"
            onClick={() => handleDropdownClick('production')}
            aria-expanded={isDropdownOpen && activeDropdown === 'production'}
          >
            <span className="nav-dropdown-icon">🏭</span>
            Production
            <span className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'production' ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'production' ? 'visible' : ''}`}>
            <li>
              <Link to="/production-foam" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">🫧</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">Foaming</span>
                  <span className="nav-link-desc">กระบวนการโฟมมิ่ง</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/production-slice" className="nav-dropdown-link" onClick={closeMenu}>
                <span className="nav-link-icon">✂️</span>
                <div className="nav-link-content">
                  <span className="nav-link-title">Slice Baeumer</span>
                  <span className="nav-link-desc">กระบวนการตัดแผ่น</span>
                </div>
              </Link>
            </li>
          </ul>
        </li>
         
        {/* Status Report */}
        <li>
          <Link to="/compare" className="nav-link" onClick={closeMenu}>
            <span className="nav-link-icon">📊</span>
            <div className="nav-link-content">
              <span className="nav-link-title">Status Report</span>
              <span className="nav-link-desc">รายงานสถานะ</span>
            </div>
          </Link>
        </li>
      </ul>

      {/* Backdrop for mobile */}
      {isMenuOpen && <div className="nav-backdrop" onClick={closeMenu}></div>}
    </nav>
  );
};

export default Navbar;
