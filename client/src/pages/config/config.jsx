import React, { useState } from "react";
import axios from "axios";
import "./config.css";

const Config = ({ url }) => {
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${url}/api/post/config/add`, formData);
      alert("Config added successfully!");
    } catch (error) {
      console.error("Error in adding config:", error);
      alert("Failed to add config.");
    }
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, " ") // แทนที่ "_" ด้วยช่องว่าง
      .replace(/\b\w/g, (char) => char.toUpperCase()); // ทำให้ตัวอักษรตัวแรกของแต่ละคำเป็นตัวใหญ่
  };

  return (
    <div className="config-container">
      <h1 className="config-title">Config</h1>
      <form className="config-form" onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key} className="form-group">
            <label className="form-label" htmlFor={key}>
              {formatLabel(key)}
            </label>
            <input
              className="form-input"
              type="text"
              id={key}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button className="form-submit-button" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Config;
