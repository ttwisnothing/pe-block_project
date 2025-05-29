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
          <img src={logo} alt="PE Block Logo" className="full-logo" />
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
            New Part
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && activeDropdown === 'newpart' && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/product" className="navbar-dropdown-item" onClick={closeMenu}>
                  New Products
                </Link>
              </li>
              <li>
                <Link to="/config-time" className="navbar-dropdown-item" onClick={closeMenu}>
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
            Plan Time
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && activeDropdown === 'plantime' && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/plantime" className="navbar-dropdown-item" onClick={closeMenu}>
                  สร้างแผนเวลา
                </Link>
              </li>
              <li>
                <Link to="/plantime-list" className="navbar-dropdown-item" onClick={closeMenu}>
                  Plan Time List
                </Link>
              </li>
            </ul>
          )}
        </li>

        <li
          className="navbar-dropdown"
          onMouseEnter={() => handleMouseEnter('production')}
          onMouseLeave={handleMouseLeave}
        > 
          <button className="navbar-dropdown-button">
            Production
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && activeDropdown === 'production' && (
            <ul className="navbar-dropdown-menu">
              <li>
                <Link to="/production-foam" className="navbar-dropdown-item" onClick={closeMenu}>
                  Foaming
                </Link>
              </li>
              <li>
                <Link to="/production-slice" className="navbar-dropdown-item" onClick={closeMenu}>
                  Slice Baeumer
                </Link>
              </li>
            </ul>
          )}
        </li>
        
        <li>
          <Link to="/compare" className="navbar-item" onClick={closeMenu}>
            Status Report
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
