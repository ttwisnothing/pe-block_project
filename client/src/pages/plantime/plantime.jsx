import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./plantime.css";

const Plantime = ({ url }) => {
  const [productName, setProductName] = useState("");
  const [fristStart, setFristStart] = useState("");
  const [runRound, setRunRound] = useState("");
  const [bUse, setBUse] = useState("");
  const [products, setProducts] = useState([]);
  const [machineNames, setMachineNames] = useState([""]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [calculated, setCalculated] = useState(false); // ใช้ตัวแปรนี้ควบคุมการแสดงปุ่ม
  const navigate = useNavigate();

  // ดึงข้อมูล Product จาก API
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${url}/api/get/products`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("❌ ERROR fetching Products:", error);
    }
  };

  // คำนวณ Plan Time
  const calculatePlanTime = async () => {
    if (!productName || !fristStart || !runRound || !bUse) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fristStart,
        runRound: parseInt(runRound, 10),
        bUse: parseInt(bUse, 10),
        machine_name: machineNames.filter((name) => name !== ""), // ส่งเฉพาะช่องที่ไม่ว่าง
      };
      const response = await axios.post(
        `${url}/api/post/plantime/add/${productName}`,
        payload
      );
      alert(response.data.message || "✅ Plan Time calculated successfully");
      setPlanTimes(response.data.planTimeList || []);
      setCalculated(true);
      setError(false);
    } catch (error) {
      console.error("❌ ERROR calculating Plan Time:", error);
      alert(
        error.response?.data?.message || "❌ Failed to calculate Plan Time"
      );
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

  // แสดง Plan Time
  const handleShowPlanTime = async () => {
    if (!productName) {
      alert("กรุณาเลือก Product ก่อน");
      return;
    }

    setLoading(true);
    try {
      // เรียก API เพื่อดึงข้อมูล Plan Time
      const response = await axios.get(
        `${url}/api/get/plantime/${productName}`
      );
      const fetchedPlanTimes = response.data.planTimes || [];

      if (fetchedPlanTimes.length === 0) {
        alert("ไม่มีข้อมูล Plan Time สำหรับ Product นี้");
        return;
      }

      // นำทางไปยังหน้า PlanTimeTable พร้อมส่งข้อมูล
      navigate("/plantime-table", {
        state: { productName, planTimes: fetchedPlanTimes },
      });
    } catch (error) {
      console.error("❌ ERROR fetching Plan Time:", error);
      alert(error.response?.data?.message || "❌ Failed to fetch Plan Time");
    } finally {
      setLoading(false);
    }
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
        <label htmlFor="b-use" className="form-label">
          จำนวน Block (Block)
        </label>
        <input
          id="b-use"
          type="number"
          className="form-input"
          value={bUse}
          onChange={(e) => setBUse(e.target.value)}
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
                required
              />
              <button
                type="button"
                className="button remove-button"
                onClick={() => removeMachineField(index)}
                disabled={machineNames.length === 1} // ป้องกันการลบช่องสุดท้าย
              >
                X
              </button>
            </div>
          ))}
          <button type="button" className="button add-button" onClick={addMachineField}>
            +
          </button>
        </div>
      </div>

      <button
        className="button primary"
        onClick={calculatePlanTime}
        disabled={loading}
      >
        คำนวณเวลา
      </button>

      {/* แสดงปุ่ม "แสดง Plan Time" เฉพาะเมื่อการคำนวณสำเร็จ */}
      {calculated && (
        <button
          className="button success"
          onClick={handleShowPlanTime}
          disabled={loading}
        >
          แสดง Plan Time
        </button>
      )}

      {error && <div className="alert danger">เกิดข้อผิดพลาดในการคำนวณ</div>}
    </div>
  );
};

export default Plantime;
