import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/navbar";
import Home from "./pages/home/home";
import PlanTime from "./pages/plantime/plantime";
import PlanTimeTable from "./pages/table/plantimetable";
import EditTemp from "./pages/edittemp/temptime"
import TempTable from "./pages/temptable/temptable";
import "./App.css";
import Products from "./pages/product/product";
import Config from './pages/config/config';

const url = "http://localhost:6090";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* เส้นทางที่มี Navbar */}
          <Route path="/" element={ <> <Navbar /> <Home url={url} /> </>}/>
          <Route path="/plantime" element={ <> <Navbar /> <PlanTime url={url} /> </> } />
          <Route path="/product" element={ <> <Navbar /> <Products url={url} /> </> } />
          <Route path="/config-time" element={ <> <Navbar /> <Config url={url} /> </> } />

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
