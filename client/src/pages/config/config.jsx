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
      toast.error("❌ เกิดข้อผิดพลาดในการเพิ่มการตั้งค่า");
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabel = (key) => {
    const labelMap = {
      config_group: "กลุ่มการตั้งค่า",
      mixing_time: "เวลาการผสม (นาที)",
      extruder_exit_time: "เวลาออกจาก Extruder (นาที)",
      pre_press_exit_time: "เวลาออกจาก Pre Press (นาที)",
      primary_press_start: "เริ่ม Primary Press (นาที)",
      stream_in: "Stream In (นาที)",
      primary_press_exit: "ออกจาก Primary Press (นาที)",
      secondary_press_1_start: "เริ่ม Secondary Press 1 (นาที)",
      temp_check_1: "ตรวจสอบอุณหภูมิ 1 (นาที)",
      secondary_press_2_start: "เริ่ม Secondary Press 2 (นาที)",
      temp_check_2: "ตรวจสอบอุณหภูมิ 2 (นาที)",
      cooling_time: "เวลาทำความเย็น (นาที)",
      secondary_press_exit: "ออกจาก Secondary Press (นาที)",
      adj_next_start: "ปรับและเริ่มรอบถัดไป (นาที)",
      solid_block: "Solid Block (นาที)",
      remove_workpiece: "เอาชิ้นงานออก (นาที)",
    };
    
    return labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getInputType = (key) => {
    if (key === 'config_group') return 'text';
    return 'number';
  };

  const getPlaceholder = (key) => {
    if (key === 'config_group') return 'กรอกชื่อกลุ่มการตั้งค่า';
    return 'กรอกเวลาเป็นนาที';
  };

  // จัดกลุ่มข้อมูล
  const fieldGroups = [
    {
      title: "ข้อมูลทั่วไป",
      icon: "⚙️",
      fields: ["config_group"]
    },
    {
      title: "ขั้นตอนการผสมและขึ้นรูป",
      icon: "🔄",
      fields: ["mixing_time", "extruder_exit_time", "pre_press_exit_time"]
    },
    {
      title: "Primary Press",
      icon: "🏭",
      fields: ["primary_press_start", "stream_in", "primary_press_exit"]
    },
    {
      title: "Secondary Press",
      icon: "🔧",
      fields: ["secondary_press_1_start", "temp_check_1", "secondary_press_2_start", "temp_check_2", "secondary_press_exit"]
    },
    {
      title: "ขั้นตอนสุดท้าย",
      icon: "✅",
      fields: ["cooling_time", "adj_next_start", "solid_block", "remove_workpiece"]
    }
  ];

  return (
    <div className="config-container">
      <ToastContainer position="top-right" />
      
      <div className="header-section">
        <h1 className="config-title">ตั้งค่าเวลาการผลิต</h1>
        <p className="config-subtitle">กำหนดเวลาสำหรับแต่ละขั้นตอนการผลิต PE Block</p>
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        {fieldGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="form-section">
            <h3 className="section-title">
              <div className="icon-container">{group.icon}</div>
              {group.title}
            </h3>
            <div className="form-grid">
              {group.fields.map((key) => (
                <div key={key} className="form-group">
                  <label className="form-label" htmlFor={key}>
                    {formatLabel(key)}
                    {key !== 'config_group' && <span className="required">*</span>}
                  </label>
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
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="form-actions">
          <button 
            className="cancel-button" 
            type="button" 
            onClick={() => window.history.back()}
          >
            ยกเลิก
          </button>
          <button 
            className="form-submit-button" 
            type="submit"
            disabled={isLoading}
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
      </form>
    </div>
  );
};

export default Config;
