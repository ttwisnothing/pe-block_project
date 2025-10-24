import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./config.css";
 
const Config = () => {
  const [formData, setFormData] = useState({
    config_group: "",
    mixing_time: "",
    extruder_exit_time: "",
    pre_press_exit_time: "",
    primary_press_start: "",
    stream_in: "",
    primary_press_exit: "",
    secondary_press_1_start: "",
    temp_check_1: "",
    secondary_press_2_start: "",
    temp_check_2: "",
    cooling_time: "",
    secondary_press_exit: "",
    adj_next_start: "",
    solid_block: "",
    remove_workpiece: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await axios.post(`/api/post/config/add`, formData);
      toast.success("✅ เพิ่มการตั้งค่าสำเร็จ!");
      
      // รีเซ็ตฟอร์ม
      setFormData({
        config_group: "",
        mixing_time: "",
        extruder_exit_time: "",
        pre_press_exit_time: "",
        primary_press_start: "",
        stream_in: "",
        primary_press_exit: "",
        secondary_press_1_start: "",
        temp_check_1: "",
        secondary_press_2_start: "",
        temp_check_2: "",
        cooling_time: "",
        secondary_press_exit: "",
        adj_next_start: "",
        solid_block: "",
        remove_workpiece: "",
      });
    } catch (error) {
      console.error("Error in adding config:", error);
      const errorMessage = error.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มการตั้งค่า";
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      config_group: "",
      mixing_time: "",
      extruder_exit_time: "",
      pre_press_exit_time: "",
      primary_press_start: "",
      stream_in: "",
      primary_press_exit: "",
      secondary_press_1_start: "",
      temp_check_1: "",
      secondary_press_2_start: "",
      temp_check_2: "",
      cooling_time: "",
      secondary_press_exit: "",
      adj_next_start: "",
      solid_block: "",
      remove_workpiece: "",
    });
    toast.info("🔄 รีเซ็ตฟอร์มเรียบร้อย");
  };

  const isFormValid = () => {
    return formData.config_group.trim() !== '' && 
           Object.entries(formData).some(([key, value]) => 
             key !== 'config_group' && value.trim() !== ''
           );
  };

  const formatLabel = (key) => {
    const labelMap = {
      config_group: "กลุ่มการตั้งค่า",
      mixing_time: "เวลาการผสม",
      extruder_exit_time: "เวลาออกจาก Extruder",
      pre_press_exit_time: "เวลาออกจาก Pre Press",
      primary_press_start: "เริ่ม Primary Press",
      stream_in: "Stream In",
      primary_press_exit: "ออกจาก Primary Press",
      secondary_press_1_start: "เริ่ม Secondary Press 1",
      temp_check_1: "ตรวจสอบอุณหภูมิ 1",
      secondary_press_2_start: "เริ่ม Secondary Press 2",
      temp_check_2: "ตรวจสอบอุณหภูมิ 2",
      cooling_time: "เวลาทำความเย็น",
      secondary_press_exit: "ออกจาก Secondary Press",
      adj_next_start: "ปรับและเริ่มรอบถัดไป",
      solid_block: "Solid Block",
      remove_workpiece: "เอาชิ้นงานออก",
    };
    
    return labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getInputType = (key) => {
    if (key === 'config_group') return 'text';
    return 'number';
  };

  const getPlaceholder = (key) => {
    if (key === 'config_group') return 'เช่น RP-300S, B-150, B-4';
    return 'กรุณาระบุบเป็นจำนวน (นาที)';
  };

  // จัดกลุ่มข้อมูล
  const fieldGroups = [
    {
      title: "ข้อมูลทั่วไป",
      icon: "⚙️",
      description: "กำหนดชื่อกลุ่มการตั้งค่า",
      fields: ["config_group"]
    },
    {
      title: "ขั้นตอนการผสมและขึ้นรูป",
      icon: "🔄",
      description: "กระบวนการเตรียมวัตถุดิบและขึ้นรูปเบื้องต้น",
      fields: ["mixing_time", "extruder_exit_time", "pre_press_exit_time"]
    },
    {
      title: "Primary Press",
      icon: "🏭",
      description: "กระบวนการอัดรอบแรกและการไหลเข้า",
      fields: ["primary_press_start", "stream_in", "primary_press_exit"]
    },
    {
      title: "Secondary Press",
      icon: "🔧",
      description: "กระบวนการอัดรอบสองและตรวจสอบอุณหภูมิ",
      fields: ["secondary_press_1_start", "temp_check_1", "secondary_press_2_start", "temp_check_2", "secondary_press_exit"]
    },
    {
      title: "ขั้นตอนสุดท้าย",
      icon: "✅",
      description: "การทำความเย็นและเสร็จสิ้นกระบวนการ",
      fields: ["cooling_time", "adj_next_start", "solid_block", "remove_workpiece"]
    }
  ];

  const getCompletionPercentage = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => value.trim() !== '').length;
    return Math.round((filledFields / totalFields) * 100);
  };
 
  return (
    <div className="config-page-wrapper">
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
      
      <div className="config-main-container">
        {/* Header Section */}
        <header className="config-page-header">
          <div className="config-header-background">
            <div className="config-header-overlay"></div>
            <div className="config-header-decoration"></div>
          </div>
          
          <div className="config-header-content">
            <div className="config-brand-icon">
              <svg viewBox="0 0 24 24" className="config-icon-svg">
                <path d="M12 1L21 5V11C21 16.55 17.16 21.74 12 23C6.84 21.74 3 16.55 3 11V5L12 1M12 7C10.9 7 10 7.9 10 9S10.9 11 12 11 14 10.1 14 9 13.1 7 12 7M18 9C16.9 9 16 9.9 16 11S16.9 13 18 13 20 12.1 20 11 19.1 9 18 9M6 9C4.9 9 4 9.9 4 11S4.9 13 6 13 8 12.1 8 11 7.1 9 6 9Z"/>
              </svg>
            </div>
            
            <div className="config-header-text">
              <h1 className="config-main-title">ตั้งค่าเวลาการผลิต</h1>
              <p className="config-main-subtitle">
                กำหนดเวลาสำหรับแต่ละขั้นตอนการผลิต PE Block อย่างละเอียด
              </p>
            </div>
          </div>
          
          <div className="config-progress-indicator">
            <div className="config-progress-bar">
              <div 
                className="config-progress-fill" 
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
            <p className="config-progress-text">
              ความสมบูรณ์: {getCompletionPercentage()}% ({Object.values(formData).filter(v => v.trim()).length}/{Object.keys(formData).length} ฟิลด์)
            </p>
          </div>
        </header>

        {/* Form Container */}
        <main className="config-form-container">
          <form className="config-main-form" onSubmit={handleSubmit}>
            
            {/* Form Sections Grid */}
            <div className="config-sections-grid">
              {fieldGroups.map((group, groupIndex) => (
                <div 
                  key={groupIndex} 
                  className={`config-form-section ${group.fields.length > 3 ? 'config-large-section' : ''}`}
                >
                  <div className="config-section-header">
                    <div className="config-section-title-container">
                      <div 
                        className="config-icon-container" 
                        style={{ backgroundColor: group.color }}
                      >
                        <span className="config-section-emoji">{group.icon}</span>
                      </div>
                      <div className="config-section-info">
                        <h3 className="config-section-title">{group.title}</h3>
                        <p className="config-section-description">{group.description}</p>
                      </div>
                    </div>
                    <div className="config-section-badge">
                      <span className="config-badge-number">{group.fields.length}</span>
                      <span className="config-badge-text">ฟิลด์</span>
                    </div>
                  </div>
                  
                  <div className="config-form-grid">
                    {group.fields.map((key) => {
                      const hasValue = formData[key].trim() !== '';
                      return (
                        <div key={key} className="config-form-group">
                          <label className="config-form-label" htmlFor={key}>
                            <span className="config-label-text">{formatLabel(key)}</span>
                            {key !== 'config_group' && (
                              <span className="config-required-asterisk">*</span>
                            )}
                          </label>
                          
                          <div className="config-input-container">
                            <input
                              className={`config-form-input ${hasValue ? 'config-input-filled' : ''}`}
                              type={getInputType(key)}
                              id={key}
                              name={key}
                              value={formData[key]}
                              onChange={handleChange}
                              placeholder={getPlaceholder(key)}
                              required
                              min={key !== 'config_group' ? "0" : undefined}
                              step={key !== 'config_group' ? "0.01" : undefined}
                              maxLength={key === 'config_group' ? "50" : undefined}
                            />
                            {key !== 'config_group' && (
                              <span className="config-input-unit">นาที</span>
                            )}
                            {hasValue && (
                              <div className="config-input-check">✓</div>
                            )}
                          </div>
                          
                          <div className="config-input-helper">
                            {key === 'config_group' 
                              ? 'ระบุชื่อตามชื่อ Product ที่ต้องการ' 
                              : ' '
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary และ Actions */}
            <div className="config-form-summary-actions">
              {/* Form Summary */}
              <div className="config-form-summary">
                <div className="config-summary-header">
                  <div className="config-summary-icon">📊</div>
                  <h4 className="config-summary-title">สรุปการตั้งค่า</h4>
                </div>
                
                <div className="config-summary-content">
                  <div className="config-summary-item">
                    <span className="config-summary-label">กลุ่มการตั้งค่า:</span>
                    <span className="config-summary-value">
                      {formData.config_group || '-'}
                    </span>
                  </div>
                  
                  <div className="config-summary-item">
                    <span className="config-summary-label">จำนวนฟิลด์ที่กรอก:</span>
                    <span className="config-summary-value">
                      <span className="config-count-highlight">
                        {Object.values(formData).filter(value => value.trim() !== '').length}
                      </span>
                      <span className="config-count-total"> / {Object.keys(formData).length}</span>
                    </span>
                  </div>
                  
                  <div className="config-summary-item">
                    <span className="config-summary-label">สถานะ:</span>
                    <span className={`config-summary-status ${isFormValid() ? 'config-status-valid' : 'config-status-invalid'}`}>
                      {isFormValid() ? '✅ พร้อมบันทึก' : '⚠️ ยังไม่พร้อม'}
                    </span>
                  </div>
                  
                  <div className="config-summary-progress">
                    <div className="config-mini-progress-bar">
                      <div 
                        className="config-mini-progress-fill"
                        style={{ width: `${getCompletionPercentage()}%` }}
                      ></div>
                    </div>
                    <span className="config-mini-progress-text">{getCompletionPercentage()}%</span>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="config-form-actions">
                <button 
                  className="config-reset-button" 
                  type="button" 
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  {/* <span className="config-button-icon">🧹</span> */}
                  <span className="config-button-text">รีเซ็ต</span>
                </button>
                
                <button 
                  className="config-cancel-button" 
                  type="button" 
                  onClick={() => window.history.back()}
                  disabled={isLoading}
                >
                  {/* <span className="config-button-icon">↩️</span> */}
                  <span className="config-button-text">ยกเลิก</span>
                </button>
                
                <button 
                  className={`config-submit-button ${!isFormValid() ? 'config-submit-disabled' : ''}`}
                  type="submit"
                  disabled={!isFormValid() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="config-loading-spinner"></span>
                      <span className="config-button-text">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      {/* <span className="config-button-icon">💾</span> */}
                      <span className="config-button-text">บันทึกการตั้งค่า</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Config;
