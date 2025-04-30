import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // เพิ่มการนำเข้า
import "react-toastify/dist/ReactToastify.css"; // เพิ่ม CSS ของ react-toastify
import "./plantime.css";

const Plantime = ({ url }) => {
  const [productName, setProductName] = useState("");
  const [fristStart, setFristStart] = useState("");
  const [runRound, setRunRound] = useState("");
  const [products, setProducts] = useState([]);
  const [colorName, setColorName] = useState("");
  const [machineNames, setMachineNames] = useState([""]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${url}/api/get/products`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("❌ ERROR fetching Products:", error);
      toast.error("❌ Failed to fetch products");
    }
  };

  const calculatePlanTime = async () => {
    if (!productName || !fristStart || !runRound || !colorName || machineNames.length === 0) {
      toast.warn("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const timeParts = fristStart.split(":");
    if (timeParts.length < 2 || timeParts.length > 3) {
      toast.warn("⚠️ กรุณากรอกเวลาในรูปแบบ HH:mm หรือ HH:mm:ss");
      return;
    }
    const formattedTime = `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`;

    setLoading(true);
    try {
      const payload = { 
        fristStart: formattedTime,
        runRound: parseInt(runRound, 10),
        mcNames: machineNames.filter((name) => name !== ""),
        color_name: colorName,
      };
      const response = await axios.post(
        `${url}/api/post/plantime/add/${productName}`,
        payload
      );
      toast.success(response.data.message || "✅ Plan Time calculated successfully");
      setPlanTimes(response.data.planTimeList || []);
      setCalculated(true);
      setError(false);
    } catch (error) {
      console.error("❌ ERROR calculating Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ เกิดข้อผิดพลาดในการคำนวณ");
      setPlanTimes([]);
      setCalculated(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMachineNameChange = (index, value) => {
    const updateNames = [...machineNames];
    updateNames[index] = value;
    setMachineNames(updateNames);
  };

  const addMachineField = () => {
    setMachineNames([...machineNames, ""]);
  };

  const removeMachineField = (index) => {
    const updatedNames = machineNames.filter((_, i) => i !== index);
    setMachineNames(updatedNames);
  };

  const handleShowPlanTime = async () => {
    if (!productName) {
      toast.warn("⚠️ กรุณาเลือก Product ก่อน");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${url}/api/get/plantime/${productName}`
      );
      const fetchedPlanTimes = response.data.planTimes || [];

      if (fetchedPlanTimes.length === 0) {
        toast.info("ℹ️ ไม่มีข้อมูล Plan Time สำหรับ Product นี้");
        return;
      }

      handleOpenPlanTimeTable(); // เปิดแท็บใหม่ที่มีข้อมูล Plan Time
    } catch (error) {
      console.error("❌ ERROR fetching Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ Failed to fetch Plan Time");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlanTimeTable = () => {
    // เก็บข้อมูลไว้ใน localStorage
    localStorage.setItem(
      "planTimeData",
      JSON.stringify({
        productName,
        colorName,
        planTimes,
      })
    );

    // เปิดแท็บใหม่
    window.open("/plantime-table", "_blank");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="container">
      <h1 className="title">Plan Time</h1>

      <div className="form-group">
        <label htmlFor="product-select" className="form-label">
          เลือก Product
        </label>
        <select
          id="product-select"
          className="form-select"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        >
          <option value="" disabled>
            -- เลือก Product --
          </option>
          {products.map((product, index) => (
            <option key={product.id || index} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="frist-start" className="form-label">
          เวลาเริ่มต้น (Frist Start Time)
        </label>
        <input
          id="frist-start"
          type="text"
          className="form-input"
          placeholder="กรอกเวลาเริ่มต้น เช่น 08:00"
          value={fristStart}
          onChange={(e) => setFristStart(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="run-round" className="form-label">
          จำนวนรอบ (Run Round)
        </label>
        <input
          id="run-round"
          type="number"
          className="form-input"
          value={runRound}
          onChange={(e) => setRunRound(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="color-name" className="form-label">
          ชื่อสี (Color Name)
        </label>
        <input
          id="color-name"
          type="text"
          className="form-input"
          placeholder="กรอกชื่อสี"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Machine Names:</label>
        <div className="machine-names-container">
          {machineNames.map((name, index) => (
            <div key={index} className="machine-input-group">
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => handleMachineNameChange(index, e.target.value)}
                placeholder={`Machine ${index + 1}`}
              />
              <button
                type="button"
                className="button remove-button"
                onClick={() => removeMachineField(index)}
                disabled={machineNames.length === 1}
              >
                X
              </button>
            </div>
          ))}
          <button type="button" className="button add-button" onClick={addMachineField}>
            เพิ่มเครื่องจักร
          </button>
        </div>
      </div>

      <button
        className="button primary"
        onClick={calculatePlanTime}
        disabled={loading}
      >
        สร้าง Plan Time
      </button>

      {calculated && (
        <button
          className="button success"
          onClick={handleShowPlanTime}
          disabled={loading}
        >
          แสดง Plan Time
        </button>
      )}

      {/* เพิ่ม ToastContainer */}
      <ToastContainer />
    </div>
  );
};

export default Plantime;
