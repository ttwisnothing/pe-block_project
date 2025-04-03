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
      const response = await axios.post(`${url}post/api/config/add`, formData);
      alert("Config added successfully!");
    } catch (error) {
      console.error("Error adding config:", error);
      alert("Failed to add config.");
    }
  };

  return (
    <div className="config-container">
      <form className="config-form" onSubmit={handleSubmit}>
        <h1>Config</h1>
        {/* Config Group แถวบนสุด */}
        <div>
          <label>Config Group:</label>
          <input
            type="number"
            name="config_group"
            className="input-config"
            value={formData.config_group}
            onChange={handleChange}
            required
          />
        </div>

        {/* ส่วนที่เหลือเรียงเป็นแถวละ 5 ช่อง */}
        <div className="config-form-group">
          {Object.keys(formData)
            .filter((key) => key !== "config_group")
            .map((key) => (
              <div key={key}>
                <label>{key.replace(/_/g, " ")}:</label>
                <input
                  type="number"
                  name={key}
                  className="input-config"
                  value={formData[key]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
        </div>
        <button className="btn-config" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Config;
