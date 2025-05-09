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

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* เส้นทางที่มี Navbar */}
          <Route path="/" element={ <> <Navbar /> <Home /> </>}/>
          <Route path="/plantime" element={ <> <Navbar /> <PlanTime /> </> } />
          <Route path="/product" element={ <> <Navbar /> <Products /> </> } />
          <Route path="/config-time" element={ <> <Navbar /> <Config /> </> } />

          {/* เส้นทางที่ไม่มี Navbar */}
          <Route path="/plantime-table" element={<PlanTimeTable />} />
          <Route path="/edit-temp" element={<EditTemp />} />
          <Route path="/temp-table" element={<TempTable />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
