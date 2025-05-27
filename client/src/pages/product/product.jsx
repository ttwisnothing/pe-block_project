import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './product.css';

const Products = () => {
  const [productName, setProductName] = useState('');
  const [productColor, setProductColor] = useState('');
  const [status, setStatus] = useState('');
  const [resin, setResin] = useState('');
  const [foaming, setFoaming] = useState('');
  const [color, setColor] = useState('');
  const [resinOptions, setResinOptions] = useState([]);
  const [foamingOptions, setFoamingOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [selectedChemicals, setSelectedChemicals] = useState(['']);
  const [isLoading, setIsLoading] = useState(true);
  const [chemicals, setChemicals] = useState([]);
  const [kneaderBlock, setKneaderBlock] = useState('');
  const [foamingBlock, setFoamingBlock] = useState('');

  useEffect(() => {
    const fetchChemicals = async () => {
      try {
        const response = await axios.get(`/api/get/chemicals`);
        setResinOptions(response.data.resin);
        setFoamingOptions(response.data.foaming);
        setColorOptions(response.data.color);
        setChemicals(response.data.chemicals);
      } catch (error) {
        console.error('❌ Error fetching chemicals:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChemicals();
  }, []);

  const addChemicalField = () => {
    setSelectedChemicals([...selectedChemicals, '']);
  };

  const removeChemicalField = (index) => {
    if (selectedChemicals.length > 1) {
      const updatedChemicals = selectedChemicals.filter((_, idx) => idx !== index);
      setSelectedChemicals(updatedChemicals);
    }
  };

  const handleChemicalChange = (index, value) => {
    const updatedChemicals = [...selectedChemicals];
    updatedChemicals[index] = value;
    setSelectedChemicals(updatedChemicals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_name: productName,
        color_name: productColor,
        status,
        resin,
        foaming,
        color: color.trim() === '' ? null : color,
        bPerRound: kneaderBlock,
        bUse: foamingBlock,
        chemicals: selectedChemicals.filter((chemical) => chemical !== ''),
      };
      await axios.post(`/api/post/product/add`, payload);
      toast.success('✅ เพิ่มผลิตภัณฑ์สำเร็จ');
      
      // รีเซ็ตฟอร์ม
      setProductName('');
      setProductColor('');
      setStatus('');
      setResin('');
      setFoaming('');
      setColor('');
      setKneaderBlock('');
      setFoamingBlock('');
      setSelectedChemicals(['']);
    } catch (error) {
      console.error('❌ Error adding product:', error);
      toast.error('❌ เกิดข้อผิดพลาดในการเพิ่มผลิตภัณฑ์');
    }
  };

  if (isLoading) {
    return (
      <div className="product-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-container">
      <ToastContainer position="top-right" />
      
      <div className="header-section">
        <h1 className="product-title">เพิ่มผลิตภัณฑ์ใหม่</h1>
        <p className="product-subtitle">กรอกข้อมูลผลิตภัณฑ์ที่ต้องการเพิ่มลงในระบบ</p>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        {/* ข้อมูลหลัก */}
        <div className="form-section">
          <h3 className="section-title">ข้อมูลหลัก</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">ชื่อผลิตภัณฑ์ *</label>
              <input
                className="form-input"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                placeholder="กรอกชื่อผลิตภัณฑ์"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">สีผลิตภัณฑ์ *</label>
              <input
                className="form-input"
                type="text"
                value={productColor}
                onChange={(e) => setProductColor(e.target.value)}
                required
                placeholder="กรอกสีผลิตภัณฑ์"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">สถานะ *</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="">-- เลือกสถานะ --</option>
                <option value="Mass">Mass</option>
                <option value="R&D">R&D</option>
              </select>
            </div>
          </div>
        </div>

        {/* วัตถุดิบ */}
        <div className="form-section">
          <h3 className="section-title">วัตถุดิบ</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Resin *</label>
              <select
                className="form-select"
                value={resin}
                onChange={(e) => setResin(e.target.value)}
                required
              >
                <option value="">-- เลือก Resin --</option>
                {resinOptions.map((resin, index) => (
                  <option key={index} value={resin.name}>
                    {resin.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Foaming *</label>
              <select
                className="form-select"
                value={foaming}
                onChange={(e) => setFoaming(e.target.value)}
                required
              >
                <option value="">-- เลือก Foaming --</option>
                {foamingOptions.map((foaming, index) => (
                  <option key={index} value={foaming.name}>
                    {foaming.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Color</label>
              <select
                className="form-select"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="">-- เลือก Color --</option>
                {colorOptions.map((color, index) => (
                  <option key={index} value={color.name}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ข้อมูลการผลิต */}
        <div className="form-section">
          <h3 className="section-title">ข้อมูลการผลิต</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Kneader Block *</label>
              <input
                className="form-input"
                type="number"
                value={kneaderBlock}
                onChange={(e) => setKneaderBlock(e.target.value)}
                required
                placeholder="จำนวน block"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Foaming Block *</label>
              <input
                className="form-input"
                type="number"
                value={foamingBlock}
                onChange={(e) => setFoamingBlock(e.target.value)}
                required
                placeholder="จำนวน block"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Chemicals */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">สารเคมี</h3>
            <button
              className="add-chemical-button"
              type="button"
              onClick={addChemicalField}
            >
              <span>+</span>
              เพิ่มสารเคมี
            </button>
          </div>
          
          <div className="chemicals-grid">
            {selectedChemicals.map((selectedChemical, index) => (
              <div key={index} className="chemical-item">
                <div className="form-group">
                  <label className="form-label">สารเคมี {index + 1}</label>
                  <div className="chemical-input-wrapper">
                    <select
                      className="form-select"
                      value={selectedChemical}
                      onChange={(e) => handleChemicalChange(index, e.target.value)}
                      required
                    >
                      <option value="">-- เลือกสารเคมี --</option>
                      {chemicals.map((chemical, idx) => (
                        <option key={idx} value={chemical.name}>
                          {chemical.name}
                        </option>
                      ))}
                    </select>
                    {selectedChemicals.length > 1 && (
                      <button
                        type="button"
                        className="remove-chemical-button"
                        onClick={() => removeChemicalField(index)}
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

        {/* ปุ่มบันทึก */}
        <div className="form-actions">
          <button className="cancel-button" type="button" onClick={() => window.history.back()}>
            ยกเลิก
          </button>
          <button className="save-button" type="submit">
            <span>💾</span>
            บันทึกผลิตภัณฑ์
          </button>
        </div>
      </form>
    </div>
  );
};

export default Products;
