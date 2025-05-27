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
  };

  return (
    <nav className="navbar-container">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/" onClick={closeMenu}>
          <div className="logo-wrapper">
            <img src={logo} alt="PE Block Logo" />
          </div>
          <span className="navbar-brand">PE Block</span>
        </Link>
      </div>

      {/* Hamburger Button */}
      <button className="navbar-hamburger" onClick={toggleMenu}>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
      </button>

      {/* Menu */}
      <ul className={`navbar-menu ${isMenuOpen ? "open" : ""}`}>
        <li
          className="navbar-dropdown"
          onMouseEnter={() => handleMouseEnter('newpart')}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-button">
            <span>📦</span>
            New Part
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && activeDropdown === 'newpart' && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/product" className="navbar-dropdown-item" onClick={closeMenu}>
                  <span>🏷️</span>
                  New Products
                </Link>
              </li>
              <li>
                <Link to="/config-time" className="navbar-dropdown-item" onClick={closeMenu}>
                  <span>⚙️</span>
                  New Config Time
                </Link>
              </li>
            </ul>
          )}
        </li>
        
        <li
          className="navbar-dropdown"
          onMouseEnter={() => handleMouseEnter('plantime')}
          onMouseLeave={handleMouseLeave}
        > 
          <button className="navbar-dropdown-button">
            <span>📅</span>
            Plan Time
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && activeDropdown === 'plantime' && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/plantime" className="navbar-dropdown-item" onClick={closeMenu}>
                  <span>➕</span>
                  สร้างแผนเวลา
                </Link>
              </li>
              <li>
                <Link to="/plantime-list" className="navbar-dropdown-item" onClick={closeMenu}>
                  <span>📋</span>
                  Plan Time List
                </Link>
              </li>
            </ul>
          )}
        </li>
        
        <li>
          <Link to="/production" className="navbar-item" onClick={closeMenu}>
            <span>🏭</span>
            Production
          </Link>
        </li>
        
        <li>
          <Link to="/compare" className="navbar-item" onClick={closeMenu}>
            <span>📊</span>
            เปรียบเทียบเวลา
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
