import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        product_name: productName.trim(),
        color_name: productColor.trim(),
        status,
        resin,
        foaming,
        color: color.trim() === '' ? null : color,
        bPerRound: parseFloat(kneaderBlock),
        bUse: parseFloat(foamingBlock),
        chemicals: selectedChemicals.filter((chemical) => chemical !== ''),
      };
      
      await axios.post(`/api/post/product/add`, payload);
      toast.success('✅ เพิ่มผลิตภัณฑ์สำเร็จแล้ว!');
      
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
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มผลิตภัณฑ์';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setProductColor('');
    setStatus('');
    setResin('');
    setFoaming('');
    setColor('');
    setKneaderBlock('');
    setFoamingBlock('');
    setSelectedChemicals(['']);
  };

  const isFormValid = () => {
    return productName.trim() && 
           productColor.trim() && 
           status && 
           resin && 
           foaming && 
           kneaderBlock && 
           foamingBlock &&
           selectedChemicals.some(chemical => chemical !== '');
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
      <div className="header-section">
        <div className="header-content">
          <div className="header-icon">
            📦
          </div>
          <div className="header-text">
            <h1 className="product-title">เพิ่มผลิตภัณฑ์ใหม่</h1>
            <p className="product-subtitle">กรอกข้อมูลผลิตภัณฑ์ที่ต้องการเพิ่มลงในระบบ PE Block</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="progress-steps">
          <div className="step active">
            <span className="step-number">1</span>
            <span className="step-label">ข้อมูลหลัก</span>
          </div>
          <div className="step-divider"></div>
          <div className="step active">
            <span className="step-number">2</span>
            <span className="step-label">วัตถุดิบ</span>
          </div>
          <div className="step-divider"></div>
          <div className="step active">
            <span className="step-number">3</span>
            <span className="step-label">การผลิต</span>
          </div>
        </div>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        {/* ข้อมูลหลัก */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">ℹ️</span>
              ข้อมูลหลัก
            </h3>
            <div className="section-badge required">จำเป็น</div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                ชื่อผลิตภัณฑ์ 
                <span className="required-mark">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                placeholder="เช่น RP-300S, EP-200L"
                maxLength="100"
              />
              <div className="input-helper">กรอกชื่อผลิตภัณฑ์ที่ชัดเจน</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                สีผลิตภัณฑ์ 
                <span className="required-mark">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                value={productColor}
                onChange={(e) => setProductColor(e.target.value)}
                required
                placeholder="เช่น White, Black, Gray"
                maxLength="50"
              />
              <div className="input-helper">ระบุสีของผลิตภัณฑ์</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                สถานะ 
                <span className="required-mark">*</span>
              </label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="">-- เลือกสถานะ --</option>
                <option value="Mass">Mass Production</option>
                <option value="R&D">Research & Development</option>
              </select>
              <div className="input-helper">เลือกสถานะการผลิต</div>
            </div>
          </div>
        </div>

        {/* วัตถุดิบ */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🧪</span>
              วัตถุดิบและสารเคมี
            </h3>
            <div className="section-badge">ส่วนผสม</div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Resin 
                <span className="required-mark">*</span>
              </label>
              <select
                className="form-select"
                value={resin}
                onChange={(e) => setResin(e.target.value)}
                required
              >
                <option value="">-- เลือก Resin --</option>
                {resinOptions.map((resinItem, index) => (
                  <option key={index} value={resinItem.name}>
                    {resinItem.name}
                  </option>
                ))}
              </select>
              <div className="input-helper">เลือกชนิด Resin ที่ใช้</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Foaming Agent 
                <span className="required-mark">*</span>
              </label>
              <select
                className="form-select"
                value={foaming}
                onChange={(e) => setFoaming(e.target.value)}
                required
              >
                <option value="">-- เลือก Foaming --</option>
                {foamingOptions.map((foamingItem, index) => (
                  <option key={index} value={foamingItem.name}>
                    {foamingItem.name}
                  </option>
                ))}
              </select>
              <div className="input-helper">เลือกตัวก่อฟอง</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Color Master Batch</label>
              <select
                className="form-select"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="">-- เลือก Color (ถ้ามี) --</option>
                {colorOptions.map((colorItem, index) => (
                  <option key={index} value={colorItem.name}>
                    {colorItem.name}
                  </option>
                ))}
              </select>
              <div className="input-helper">เลือกสีหากต้องการ (ไม่บังคับ)</div>
            </div>
          </div>
        </div>

        {/* ข้อมูลการผลิต */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">⚙️</span>
              ข้อมูลการผลิต
            </h3>
            <div className="section-badge production">Block</div>
          </div>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Kneader Block 
                <span className="required-mark">*</span>
              </label>
              <div className="input-with-unit">
                <input
                  className="form-input"
                  type="number"
                  value={kneaderBlock}
                  onChange={(e) => setKneaderBlock(e.target.value)}
                  required
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <span className="input-unit">Block</span>
              </div>
              <div className="input-helper">จำนวน Block ที่ใช้ใน Kneader</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Foaming Block 
                <span className="required-mark">*</span>
              </label>
              <div className="input-with-unit">
                <input
                  className="form-input"
                  type="number"
                  value={foamingBlock}
                  onChange={(e) => setFoamingBlock(e.target.value)}
                  required
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <span className="input-unit">Block</span>
              </div>
              <div className="input-helper">จำนวน Block ที่ได้จาก Foaming</div>
            </div>
          </div>
        </div>

        {/* Chemicals */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">⚗️</span>
              สารเคมีเพิ่มเติม
            </h3>
            <button
              className="add-chemical-button"
              type="button"
              onClick={addChemicalField}
            >
              <span className="button-icon">➕</span>
              เพิ่มสารเคมี
            </button>
          </div>
          
          <div className="chemicals-container">
            {selectedChemicals.map((selectedChemical, index) => (
              <div key={index} className="chemical-item">
                <div className="chemical-header">
                  <span className="chemical-number">#{index + 1}</span>
                  <span className="chemical-label">สารเคมี {index + 1}</span>
                  {selectedChemicals.length > 1 && (
                    <button
                      type="button"
                      className="remove-chemical-button"
                      onClick={() => removeChemicalField(index)}
                      title="ลบสารเคมีนี้"
                    >
                      <span>🗑️</span>
                    </button>
                  )}
                </div>
                
                <div className="form-group">
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
                </div>
              </div>
            ))}
          </div>
          
          {selectedChemicals.length === 0 && (
            <div className="empty-chemicals">
              <span className="empty-icon">🧪</span>
              <p>ยังไม่มีสารเคมีเพิ่มเติม</p>
              <p className="empty-description">คลิก "เพิ่มสารเคมี" เพื่อเพิ่มสารเคมีที่ต้องการ</p>
            </div>
          )}
        </div>

        {/* Form Summary */}
        <div className="form-summary">
          <div className="summary-header">
            <h4>สรุปข้อมูลผลิตภัณฑ์</h4>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">ชื่อผลิตภัณฑ์:</span>
              <span className="summary-value">{productName || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">สี:</span>
              <span className="summary-value">{productColor || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">สถานะ:</span>
              <span className="summary-value">{status || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Resin:</span>
              <span className="summary-value">{resin || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Foaming:</span>
              <span className="summary-value">{foaming || '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">สารเคมี:</span>
              <span className="summary-value">
                {selectedChemicals.filter(c => c !== '').length} รายการ
              </span>
            </div>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="form-actions">
          <button 
            className="new-reset-button" 
            type="button" 
            onClick={resetForm}
            disabled={isSubmitting}
          >
            <span>🔄</span>
            รีเซ็ต
          </button>
          
          <button 
            className="cancel-button" 
            type="button" 
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            <span>↩️</span>
            ยกเลิก
          </button>
          
          <button 
            className={`save-button ${!isFormValid() ? 'disabled' : ''}`}
            type="submit"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="button-spinner"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <span>💾</span>
                บันทึกผลิตภัณฑ์
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Products;
