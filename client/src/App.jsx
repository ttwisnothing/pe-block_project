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
import Production from './pages/productiondata/production';
import ListPlan from './pages/plantimelist/listplan';
import FoamRecord from './pages/foam-record/foam';
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
          <Route path="/production-foam" element={ <> <Navbar /> <Production /> </> } />
          <Route path="/production-foam/create/:productName" element={ <> <Navbar /> <FoamRecord /> </> } />
          <Route path="/plantime-list" element={ <> <Navbar /> <ListPlan /> </> } />

          {/* เส้นทางที่ไม่มี Navbar */}
          <Route path="/plantime-table" element={<PlanTimeTable />} />
          <Route path="/edit-temp" element={<EditTemp />} />
          <Route path="/temp-table" element={<TempTable />} />
        </Routes>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={2}
      />
    </Router>
  );
}

export default App;
