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
          <div className="nav-logo-wrapper">
            <img src={logo} alt="INOAC PE Block Logo" className="nav-logo" />
          </div>
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
            <div className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
              </svg>
            </div>
            <span className="nav-item-text">New Part</span>
            <div className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'newpart' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'newpart' ? 'visible' : ''}`}>
            <li>
              <Link to="/product" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="nav-link-content">
                  <span className="nav-link-title">New Products</span>
                  <span className="nav-link-desc">เพิ่มผลิตภัณฑ์ใหม่</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/config-time" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                  </svg>
                </div>
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
            <div className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            <span className="nav-item-text">Plan Time</span>
            <div className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'plantime' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'plantime' ? 'visible' : ''}`}>
            <li>
              <Link to="/plantime" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <div className="nav-link-content">
                  <span className="nav-link-title">สร้างแผนเวลา</span>
                  <span className="nav-link-desc">วางแผนการผลิตใหม่</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/plantime-list" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                </div>
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
            <div className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="nav-item-text">Production</span>
            <div className={`nav-dropdown-arrow ${isDropdownOpen && activeDropdown === 'production' ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          </button>
          <ul className={`nav-dropdown-menu ${isDropdownOpen && activeDropdown === 'production' ? 'visible' : ''}`}>
            <li>
              <Link to="/production-foam" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="nav-link-content">
                  <span className="nav-link-title">Foaming</span>
                  <span className="nav-link-desc">กระบวนการโฟมมิ่ง</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/production-slice" className="nav-dropdown-link" onClick={closeMenu}>
                <div className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18v-6l15-8 3 3-8 15h-6l-4-4zm7.5-5.5L8 15h2.5l6.5-6.5-2-2L10.5 12.5z"/>
                  </svg>
                </div>
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
            <div className="nav-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 21h-2l1-4h1l-4-7h3l1-4h1l-4-6h2l-1 4h-1l4 7h-3l-1 4h-1l4 6zM3 5h2v14H3v-14zm4 2h2v12H7V7zm4 4h2v8h-2v-8z"/>
              </svg>
            </div>
            <div className="nav-link-content">
              <span className="nav-link-title">Status Report</span>
              <span className="nav-link-desc">รายงานสถานะการผลิต</span>
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
