import React from 'react';
import './home.css'; // Import CSS file

const Home = () => {
  return (
    <div className="home-container">
      {/* Header Section */}
      <header className="home-header text-center">
        <h1>Welcome to the Home Page</h1>
      </header>

      {/* Main Content Section */}
      <main className="home-main text-center">
        <p>
          This is the home page of your application. You can customize this section to display
          any content you want.
        </p>
        <button
          className="btn btn-primary home-button"
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </button>
      </main>

      {/* Footer Section */}
      <footer className="home-footer text-center">
        <p>&copy; 2025 Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
