import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./plantime.css";

const Plantime = () => {
  const [productName, setProductName] = useState("");
  const [fristStart, setFristStart] = useState("");
  const [runRound, setRunRound] = useState("");
  const [products, setProducts] = useState([]);
  const [colorName, setColorName] = useState("");
  const [machineNames, setMachineNames] = useState([""]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/get/products`);
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
        `/api/post/plantime/add/${productName}`,
        payload
      );
      toast.success(response.data.message || "✅ Plan Time calculated successfully");
      setPlanTimes(response.data.planTimeList || []);
      setCalculated(true);
    } catch (error) {
      console.error("❌ ERROR calculating Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ เกิดข้อผิดพลาดในการคำนวณ");
      setPlanTimes([]);
      setCalculated(false);
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
    if (machineNames.length > 1) {
      const updatedNames = machineNames.filter((_, i) => i !== index);
      setMachineNames(updatedNames);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="plantime-container">
      <ToastContainer position="top-right" />
      
      <div className="header-section">
        <h1 className="plantime-title">สร้างแผนเวลาการผลิต</h1>
        <p className="plantime-subtitle">กำหนดแผนการผลิตและเครื่องจักรที่ใช้งาน</p>
      </div>

      <form className="plantime-form">
        {/* ข้อมูลผลิตภัณฑ์และตั้งค่าการผลิต (แนวนอน) */}
        <div className="form-combined-section">
          <div className="form-section product-info">
            <h3 className="section-title">
              <div className="icon-container">📦</div>
              ข้อมูลผลิตภัณฑ์
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">เลือกผลิตภัณฑ์ *</label>
                <select
                  className="form-select"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                >
                  <option value="">-- เลือกผลิตภัณฑ์ --</option>
                  {products.map((product, index) => (
                    <option key={product.id || index} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ชื่อสี *</label>
                <input
                  className="form-input"
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="กรอกชื่อสี"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section production-settings">
            <h3 className="section-title">
              <div className="icon-container">⏰</div>
              ตั้งค่าการผลิต
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">เวลาเริ่มต้น *</label>
                <input
                  className="form-input"
                  type="text"
                  value={fristStart}
                  onChange={(e) => setFristStart(e.target.value)}
                  placeholder="กรอกเวลาเริ่ม HH:mm"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">จำนวนรอบ *</label>
                <input
                  className="form-input"
                  type="number"
                  value={runRound}
                  onChange={(e) => setRunRound(e.target.value)}
                  placeholder="กรอกจำนวนรอบ"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* เครื่องจักร */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <div className="icon-container">🏭</div>
              เครื่องจักรที่ใช้งาน
            </h3>
            <button
              className="add-machine-button"
              type="button"
              onClick={addMachineField}
            >
              <span>+</span>
              เพิ่มเครื่องจักร
            </button>
          </div>
          
          <div className="machines-grid-horizontal">
            {machineNames.map((name, index) => (
              <div key={index} className="machine-item">
                <div className="form-group">
                  <label className="form-label">เครื่องจักร {index + 1}</label>
                  <div className="machine-input-wrapper">
                    <input
                      className="form-input"
                      type="text"
                      value={name}
                      onChange={(e) => handleMachineNameChange(index, e.target.value)}
                      placeholder={`ชื่อเครื่องจักร ${index + 1}`}
                      required
                    />
                    {machineNames.length > 1 && (
                      <button
                        type="button"
                        className="remove-machine-button"
                        onClick={() => removeMachineField(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="form-actions">
          <button 
            className="cancel-button" 
            type="button" 
            onClick={() => window.history.back()}
          >
            ยกเลิก
          </button>
          
          <button
            className="calculate-button"
            type="button"
            onClick={calculatePlanTime}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                กำลังคำนวณ...
              </>
            ) : (
              <>
                <span>🔄</span>
                สร้างแผนเวลา
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Plantime;
