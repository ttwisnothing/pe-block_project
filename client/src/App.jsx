import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/navbar"; 
import Home from "./pages/home/home";
import PlanTime from "./pages/plantime/plantime";
import PlanTimeTable from "./components/table/plantimetable";
import Recipe from "./pages/recipe/recipe";
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
            <Route path="/plantime-table" element={<PlanTimeTable url={url} />} />
            <Route path="/recipe" element={<Recipe url={url}/>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;