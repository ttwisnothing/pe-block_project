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
    if (key === 'config_group') return 'เช่น Production-Group-A';
    return 'เวลาเป็นนาที (เช่น 5.5)';
  };

  // จัดกลุ่มข้อมูล
  const fieldGroups = [
    {
      title: "ข้อมูลทั่วไป",
      icon: "⚙️",
      color: "#004D8A",
      description: "กำหนดชื่อกลุ่มการตั้งค่า",
      fields: ["config_group"]
    },
    {
      title: "ขั้นตอนการผสมและขึ้นรูป",
      icon: "🔄",
      color: "#FFCD00",
      description: "กระบวนการเตรียมวัตถุดิบและขึ้นรูปเบื้องต้น",
      fields: ["mixing_time", "extruder_exit_time", "pre_press_exit_time"]
    },
    {
      title: "Primary Press",
      icon: "🏭",
      color: "#004D8A",
      description: "กระบวนการอัดรอบแรกและการไหลเข้า",
      fields: ["primary_press_start", "stream_in", "primary_press_exit"]
    },
    {
      title: "Secondary Press",
      icon: "🔧",
      color: "#FFCD00",
      description: "กระบวนการอัดรอบสองและตรวจสอบอุณหภูมิ",
      fields: ["secondary_press_1_start", "temp_check_1", "secondary_press_2_start", "temp_check_2", "secondary_press_exit"]
    },
    {
      title: "ขั้นตอนสุดท้าย",
      icon: "✅",
      color: "#10b981",
      description: "การทำความเย็นและเสร็จสิ้นกระบวนการ",
      fields: ["cooling_time", "adj_next_start", "solid_block", "remove_workpiece"]
    }
  ];
 
  return (
    <div className="config-container">
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
      
      <div className="header-section">
        <div className="header-content">
          <div className="header-icon">⚙️</div>
          <div className="header-text">
            <h1 className="config-title">ตั้งค่าเวลาการผลิต</h1>
            <p className="config-subtitle">กำหนดเวลาสำหรับแต่ละขั้นตอนการผลิต PE Block อย่างละเอียด</p>
          </div>
        </div>
        
        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '20%' }}></div>
          </div>
          <p className="progress-text">การตั้งค่าใหม่ - ขั้นตอนที่ 1/5</p>
        </div>
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        {/* คอลัมน์ซ้าย - Sections 1-3 */}
        <div className="form-left-column">
          {fieldGroups.slice(0, 3).map((group, groupIndex) => (
            <div key={groupIndex} className={`form-section ${group.fields.length > 3 ? 'large-section' : ''}`}>
              <div className="section-header">
                <div className="section-title-container">
                  <div 
                    className="icon-container" 
                    style={{ backgroundColor: group.color }}
                  >
                    {group.icon}
                  </div>
                  <div className="section-info">
                    <h3 className="section-title">{group.title}</h3>
                    <p className="section-description">{group.description}</p>
                  </div>
                </div>
                <div className="section-badge">
                  {group.fields.length} ฟิลด์
                </div>
              </div>
              
              <div className="form-grid">
                {group.fields.map((key) => (
                  <div key={key} className="form-group">
                    <label className="form-label" htmlFor={key}>
                      {formatLabel(key)}
                      {key !== 'config_group' && <span className="required">*</span>}
                      {key !== 'config_group' && <span className="unit-label">(นาที)</span>}
                    </label>
                    <div className="input-container">
                      <input
                        className="form-input"
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
                        <span className="input-unit">นาที</span>
                      )}
                    </div>
                    <div className="input-helper">
                      {key === 'config_group' 
                        ? 'ระบุชื่อกลุ่มการตั้งค่าที่เป็นเอกลักษณ์' 
                        : 'ระบุเวลาที่ใช้ในขั้นตอนนี้'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* คอลัมน์ขวา - Sections 4-5 */}
        <div className="form-right-column">
          {fieldGroups.slice(3, 5).map((group, groupIndex) => (
            <div key={groupIndex + 3} className={`form-section ${group.fields.length > 3 ? 'large-section' : ''}`}>
              <div className="section-header">
                <div className="section-title-container">
                  <div 
                    className="icon-container" 
                    style={{ backgroundColor: group.color }}
                  >
                    {group.icon}
                  </div>
                  <div className="section-info">
                    <h3 className="section-title">{group.title}</h3>
                    <p className="section-description">{group.description}</p>
                  </div>
                </div>
                <div className="section-badge">
                  {group.fields.length} ฟิลด์
                </div>
              </div>
              
              <div className="form-grid">
                {group.fields.map((key) => (
                  <div key={key} className="form-group">
                    <label className="form-label" htmlFor={key}>
                      {formatLabel(key)}
                      {key !== 'config_group' && <span className="required">*</span>}
                      {key !== 'config_group' && <span className="unit-label">(นาที)</span>}
                    </label>
                    <div className="input-container">
                      <input
                        className="form-input"
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
                        <span className="input-unit">นาที</span>
                      )}
                    </div>
                    <div className="input-helper">
                      {key === 'config_group' 
                        ? 'ระบุชื่อกลุ่มการตั้งค่าที่เป็นเอกลักษณ์' 
                        : 'ระบุเวลาที่ใช้ในขั้นตอนนี้'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary และ Actions */}
        <div className="form-summary-actions">
          {/* Form Summary */}
          <div className="form-summary">
            <div className="summary-header">
              <h4>สรุปการตั้งค่า</h4>
            </div>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">กลุ่มการตั้งค่า:</span>
                <span className="summary-value">{formData.config_group || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">จำนวนฟิลด์ที่กรอก:</span>
                <span className="summary-value">
                  {Object.values(formData).filter(value => value.trim() !== '').length} / {Object.keys(formData).length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">สถานะ:</span>
                <span className={`summary-status ${isFormValid() ? 'valid' : 'invalid'}`}>
                  {isFormValid() ? '✅ พร้อมบันทึก' : '⚠️ ยังไม่พร้อม'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="reset-button" 
              type="button" 
              onClick={resetForm}
              disabled={isLoading}
            >
              <span>🧹</span>
              รีเซ็ต
            </button>
            
            <button 
              className="cancel-button" 
              type="button" 
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              <span>↩️</span>
              ยกเลิก
            </button>
            
            <button 
              className={`form-submit-button ${!isFormValid() ? 'disabled' : ''}`}
              type="submit"
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <span>💾</span>
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Config;
