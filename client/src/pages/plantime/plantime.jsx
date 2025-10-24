import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./plantime.css";

const Plantime = () => {
  const [productName, setProductName] = useState("");
  const [programName, setProgramName] = useState(""); 
  const [blockRound, setBlockRound] = useState("");
  const [blockUsed, setBlockUsed] = useState("");
  const [plantimeId, setPlantimeId] = useState("");
  const [fristStart, setFristStart] = useState("");
  const [blockTotal, setBlockTotal] = useState(""); 
  const [products, setProducts] = useState([]);
  const [machineNames, setMachineNames] = useState([""]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!productName || !programName || !fristStart || !blockTotal || !blockRound || !blockUsed || machineNames.length === 0) {
      toast.warn("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const timeParts = fristStart.split(":");
    if (timeParts.length < 2 || timeParts.length > 3) {
      toast.warn("⚠️ กรุณากรอกเวลาในรูปแบบ HH:mm หรือ HH:mm:ss");
      return;
    }

    const formattedTime = `${timeParts[0].padStart(
      2,
      "0"
    )}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`;

    setLoading(true);
    setIsSubmitting(true);

    try {
      const payload = {
        fristStart: formattedTime,
        blockTotal: parseInt(blockTotal, 10),
        blockRound: parseInt(blockRound, 10),
        blockUsed: parseInt(blockUsed, 10),
        programName: programName,
        mcNames: machineNames
          .filter((name) => name.trim() !== "")
          .map((name) =>
            name.trim().startsWith("M") ? name.trim() : `M${name.trim()}`
          ),
      };

      // Step 1: สร้างแผนเวลาก่อน
      const planTimeResponse = await axios.post(
        `/api/post/plantime/add/${productName}`,
        payload
      );

      toast.success(
        planTimeResponse.data.message || "✅ Plan Time calculated successfully"
      );
      setPlanTimes(planTimeResponse.data.planTimeList || []);
      setPlantimeId(planTimeResponse.data.plantime_id || "");
      setCalculated(true);

      // ใช้ plantime_id จาก response ตรงนี้เลย
      const newPlantimeId = planTimeResponse.data.plantime_id || "";

      try {
        const productRecordResponse = await axios.post('/api/post/production/head', {
          plantime_id: newPlantimeId,
          blockTotal: parseInt(blockTotal, 10),
          blockUsed: parseInt(blockUsed, 10)
        });

        toast.success(
          productRecordResponse.data.message ||
            "✅ Product Record added successfully"
        );
        console.log("Product Record created:", productRecordResponse.data);
      } catch (productRecordError) {
        console.error("❌ Error adding product record:", productRecordError);
        toast.warn(
          "⚠️ แผนเวลาสร้างสำเร็จ แต่เกิดข้อผิดพลาดในการสร้าง Product Record"
        );
      }
    } catch (error) {
      console.error("❌ ERROR calculating Plan Time:", error);
      toast.error(
        error.response?.data?.message || "❌ เกิดข้อผิดพลาดในการคำนวณ"
      );
      setPlanTimes([]);
      setCalculated(false);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
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

  const resetForm = () => {
    setProductName("");
    setProgramName("");
    setBlockRound("");
    setBlockUsed("");
    setFristStart("");
    setBlockTotal("");
    setMachineNames([""]);
    setPlanTimes([]);
    setCalculated(false);
    toast.info("🔄 รีเซ็ตฟอร์มเรียบร้อย");
  };

  const isFormValid = () => {
    return (
      productName &&
      programName &&
      fristStart &&
      blockRound &&
      blockUsed &&
      blockTotal &&
      machineNames.some((name) => name.trim() !== "")
    );
  };

  const getCompletionPercentage = () => {
    const requiredFields = [productName, programName, fristStart, blockTotal, blockRound, blockUsed];
    const filledFields = requiredFields.filter(
      (field) => field.trim() !== ""
    ).length;
    const machineField = machineNames.some((name) => name.trim() !== "")
      ? 1
      : 0;
    const totalRequired = 7;
    return Math.round(((filledFields + machineField) / totalRequired) * 100);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="plantime-page-wrapper">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="plantime-main-container">
        {/* Header Section */}
        <header className="plantime-page-header">
          <div className="plantime-header-background">
            <div className="plantime-header-overlay"></div>
            <div className="plantime-header-decoration"></div>
          </div>

          <div className="plantime-header-content">
            <div className="plantime-brand-icon">
              <svg viewBox="0 0 24 24" className="plantime-icon-svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  transform="translate(0,6)"
                />
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  transform="translate(0,12)"
                />
              </svg>
            </div>

            <div className="plantime-header-text">
              <h1 className="plantime-main-title">สร้างแผนเวลาการผลิต</h1>
              <p className="plantime-main-subtitle">
                กำหนดแผนการผลิตและเครื่องจักรที่ใช้งานอย่างมีประสิทธิภาพ
              </p>
            </div>
          </div>

          <div className="plantime-progress-indicator">
            <div className="plantime-progress-bar">
              <div
                className="plantime-progress-fill"
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
            <p className="plantime-progress-text">
              ความสมบูรณ์: {getCompletionPercentage()}%
            </p>
          </div>
        </header>

        {/* Form Container */}
        <main className="plantime-form-container">
          <form className="plantime-main-form">
            {/* Product and Production Settings */}
            <div className="plantime-dual-section">
              <div className="plantime-form-section plantime-product-section">
                <div className="plantime-section-header">
                  <h3 className="plantime-section-title">ข้อมูลผลิตภัณฑ์</h3>
                  <span className="plantime-section-badge plantime-badge-required">
                    จำเป็น
                  </span>
                </div>

                <div className="plantime-form-grid">
                  <div className="plantime-input-group">
                    <label className="plantime-input-label">
                      เลือกผลิตภัณฑ์
                      <span className="plantime-required-asterisk">*</span>
                    </label>
                    <select
                      className="plantime-select-input"
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

                  <div className="plantime-horizontal-group">
                    <div className="plantime-input-group plantime-input-flex">
                      <label className="plantime-input-label">
                        โปรแกรม
                        <span className="plantime-required-asterisk">*</span>
                      </label>
                      <input
                        className="plantime-text-input"
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder="หมายเลขโปรแกรม"
                        required
                      />
                    </div>

                    <div className="plantime-input-group plantime-input-flex">
                      <label className="plantime-input-label">
                        บล็อคต่อรอบ
                        <span className="plantime-required-asterisk">*</span>
                      </label>
                      <input
                        className="plantime-text-input"
                        type="text"
                        value={blockRound}
                        onChange={(e) => setBlockRound(e.target.value)}
                        placeholder="บล็อคต่อรอบ"
                      />
                    </div>

                    <div className="plantime-input-group plantime-input-flex">
                      <label className="plantime-input-label">
                        บล็อคที่ใช้
                        <span className="plantime-required-asterisk">*</span>
                      </label>
                      <input
                        className="plantime-text-input"
                        type="text"
                        value={blockUsed}
                        onChange={(e) => setBlockUsed(e.target.value)}
                        placeholder="บล็อคที่ใช้"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="plantime-form-section plantime-production-section">
                <div className="plantime-section-header">
                  <h3 className="plantime-section-title">ตั้งค่าการผลิต</h3>
                  <span className="plantime-section-badge plantime-badge-production">
                    การผลิต
                  </span>
                </div>

                <div className="plantime-form-grid">
                  <div className="plantime-input-group">
                    <label className="plantime-input-label">
                      เวลาเริ่มต้น
                      <span className="plantime-required-asterisk">*</span>
                    </label>
                    <input
                      className="plantime-text-input"
                      type="text"
                      value={fristStart}
                      onChange={(e) => setFristStart(e.target.value)}
                      placeholder="HH:mm (เช่น 08:30)"
                      required
                    />
                  </div>

                  <div className="plantime-input-group">
                    <label className="plantime-input-label">
                      จำนวน Block
                      <span className="plantime-required-asterisk">*</span>
                    </label>
                    <input
                      className="plantime-number-input"
                      type="number"
                      value={blockTotal}
                      onChange={(e) => setBlockTotal(e.target.value)}
                      placeholder="จำนวน Block ที่ต้องการผลิต"
                      min="1"
                      max="10000"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Machines Section */}
            <div className="plantime-form-section plantime-machines-section">
              <div className="plantime-section-header">
                <h3 className="plantime-section-title">เครื่องจักรที่ใช้งาน</h3>
                <button
                  className="plantime-add-machine-button"
                  type="button"
                  onClick={addMachineField}
                >
                  เพิ่มเครื่องจักร
                </button>
              </div>

              <div className="plantime-machines-container">
                {machineNames.map((name, index) => (
                  <div key={index} className="plantime-machine-card">
                    <div className="plantime-machine-card-header">
                      <div className="plantime-machine-number-badge">
                        {index + 1}
                      </div>
                      <h4 className="plantime-machine-card-title">
                        เครื่องจักรที่ {index + 1}
                      </h4>
                      {machineNames.length > 1 && (
                        <button
                          type="button"
                          className="plantime-remove-machine-button"
                          onClick={() => removeMachineField(index)}
                          title="ลบเครื่องจักรนี้"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="plantime-input-group">
                      <input
                        className="plantime-text-input"
                        type="text"
                        value={name}
                        onChange={(e) =>
                          handleMachineNameChange(index, e.target.value)
                        }
                        placeholder={`ชื่อเครื่องจักร ${index + 1}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Section */}
            <div className="plantime-form-summary">
              <div className="plantime-summary-header">
                <h4 className="plantime-summary-title">สรุปข้อมูลแผนการผลิต</h4>
              </div>

              <div className="plantime-summary-content">
                <div className="plantime-summary-item">
                  <span className="plantime-summary-label">ผลิตภัณฑ์:</span>
                  <span className="plantime-summary-value">
                    {productName || "-"}
                  </span>
                </div>

                <div className="plantime-summary-item">
                  <span className="plantime-summary-label">เวลาเริ่มต้น:</span>
                  <span className="plantime-summary-value">
                    {fristStart || "-"}
                  </span>
                </div>

                <div className="plantime-summary-item">
                  <span className="plantime-summary-label">จำนวน Block:</span>
                  <span className="plantime-summary-value">
                    {blockTotal || "-"} Block
                  </span>
                </div>

                <div className="plantime-summary-item">
                  <span className="plantime-summary-label">เครื่องจักร:</span>
                  <span className="plantime-summary-value">
                    {machineNames.filter((name) => name.trim()).length} เครื่อง
                  </span>
                </div>

                <div className="plantime-summary-item">
                  <span className="plantime-summary-label">สถานะ:</span>
                  <span
                    className={`plantime-summary-status ${
                      isFormValid()
                        ? "plantime-status-valid"
                        : "plantime-status-invalid"
                    }`}
                  >
                    {isFormValid() ? "✅ พร้อมสร้างแผน" : "⚠️ ยังไม่พร้อม"}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="plantime-form-actions">
              <button
                className="plantime-reset-button"
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                รีเซ็ตฟอร์ม
              </button>

              <button
                className="plantime-cancel-button"
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>

              <button
                className={`plantime-submit-button ${
                  !isFormValid() ? "plantime-submit-disabled" : ""
                }`}
                type="button"
                onClick={calculatePlanTime}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="plantime-submit-spinner"></div>
                    กำลังสร้างแผน...
                  </>
                ) : (
                  <>สร้างแผนเวลา</>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Plantime;
