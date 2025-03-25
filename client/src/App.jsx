import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/navbar"; // นำเข้า Navbar
import Home from "./pages/home/home"; // นำเข้าหน้า Home
import PlanTime from "./pages/plantime/plantime"; // นำเข้าหน้า PlanTime
import PlanTimeTable from "./components/table/plantimetable"; // นำเข้าหน้า PlanTimeTable
import "./App.css";

const url = "http://localhost:6090";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Routes>
            {/* เส้นทางที่มี Navbar */}
            <Route path="/" element={<Home url={url} />} />
            <Route path="/plantime" element={<PlanTime url={url} />} />

            {/* เส้นทางที่ไม่มี Navbar */}
            <Route path="/plantime-table" element={<PlanTimeTable />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;