import "./App.css";
import Sidebar from "./components/sidebar/sidebar";
import PlanTimeTable from "./components/table/plantimetable";
import Home from "./pages/home/home";
import Plantime from "./pages/plantime/plantime";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const url = "http://localhost:6090";

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plantime" element={<Plantime url={url} />} />
            <Route path="/plantime-table" element={<PlanTimeTable url={url} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
