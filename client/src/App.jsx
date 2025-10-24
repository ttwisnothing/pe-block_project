import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import NewPlantime from "./pages/new-plantime/new-plantime";
import Dashboard from "./pages/dashboard/dashboard";
import Analytics from "./components/dashboard/analytics/analytics";
import HomeDashboard from "./components/dashboard/home/home-dashboard";
import Daily from './components/dashboard/daily/daily';
import Weekly from './components/dashboard/weekly/weekly';

function AppContent() {
  const location = useLocation();
  const isNewPlantime = location.pathname === "/new-plantime";
  const isDashboard = location.pathname === "/dashboard";
  const isAnalytics = location.pathname === "/dashboard/analytics";
  const isDaily = location.pathname === "/dashboard/daily";
  const isWeekly = location.pathname === "/dashboard/weekly";
  const isMonthly = location.pathname === "/dashboard/monthly";
  const isDownloads = location.pathname === "/dashboard/downloads";

  return (
    <div className={`App${isNewPlantime || isDashboard || isAnalytics || isDaily || isWeekly || isMonthly || isDownloads ? " no-padding-top" : ""}`}>
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
        <Route path="/new-plantime" element={<NewPlantime />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<HomeDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="daily" element={<Daily />} />
          <Route path="weekly" element={<Weekly />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
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
