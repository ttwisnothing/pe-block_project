import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/navbar";
import Home from "./pages/home/home";
import PlanTime from "./pages/plantime/plantime";
import PlanTimeTable from "./pages/table/plantimetable";
import EditTemp from "./pages/edittemp/temptime"
import TempTable from "./pages/temptable/temptable";
import Recipe from "./pages/recipe/recipe";
import "./App.css";

const url = "http://localhost:6090";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* เส้นทางที่มี Navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home url={url} />
              </>
            }
          />
          <Route
            path="/plantime"
            element={
              <>
                <Navbar />
                <PlanTime url={url} />
              </>
            }
          />
          <Route
            path="/recipe"
            element={
              <>
                <Navbar />
                <Recipe url={url} />
              </>
            }
          />

          {/* เส้นทางที่ไม่มี Navbar */}
          <Route path="/plantime-table" element={<PlanTimeTable url={url} />} />
          <Route path="/edit-temp" element={<EditTemp url={url} />} />
          <Route path="/temp-table" element={<TempTable url={url} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
