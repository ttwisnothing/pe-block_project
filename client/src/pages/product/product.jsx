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
      
      const response = await axios.post(`/api/post/product/add`, payload);
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
      
      if (error.response?.status === 409) {
        // กรณีข้อมูลซ้ำ
        const errorMessage = error.response?.data?.message || 'มีผลิตภัณฑ์นี้อยู่แล้วในระบบ';
        toast.error(`🚫 ${errorMessage}`);
        toast.warn(`⚠️ ผลิตภัณฑ์ "${productName}" สี "${productColor}" มีอยู่แล้ว กรุณาตรวจสอบข้อมูล`);
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        // กรณี client error อื่นๆ
        const errorMessage = error.response?.data?.message || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบใหม่';
        toast.error(`❌ ${errorMessage}`);
      } else if (error.response?.status >= 500) {
        // กรณี server error
        toast.error('❌ เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        // กรณีปัญหาเครือข่าย
        toast.error('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
      } else {
        // กรณีอื่นๆ
        const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มผลิตภัณฑ์';
        toast.error(`❌ ${errorMessage}`);
      }
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
      <div className="product-page-wrapper">
        <div className="product-loading-screen">
          <div className="product-loading-animation">
            <div className="product-spinner"></div>
            <h3 className="product-loading-text">กำลังโหลดข้อมูล...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page-wrapper">
      <div className="product-main-container">
        
        {/* Header Section */}
        <header className="product-page-header">
          <div className="product-header-background">
            <div className="product-header-overlay"></div>
            <div className="product-header-decoration"></div>
          </div>
          
          <div className="product-header-content">
            <div className="product-brand-icon">
              <svg viewBox="0 0 24 24" className="product-icon-svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 12L12 17L22 12" />
                <path d="M2 17L12 22L22 17" />
              </svg>
            </div>
            
            <div className="product-header-text">
              <h1 className="product-main-title">เพิ่มผลิตภัณฑ์ PE Block</h1>
              <p className="product-main-subtitle">
                กรอกข้อมูลสำหรับสร้างผลิตภัณฑ์ใหม่ในระบบ
              </p>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <main className="product-form-container">
          <form onSubmit={handleSubmit} className="product-main-form">
            
            {/* Basic Information Section */}
            <section className="product-form-section">
              <div className="product-section-header">
                <h2 className="product-section-title">
                  <span className="product-section-icon">📋</span>
                  ข้อมูลพื้นฐาน
                </h2>
                <span className="product-section-badge product-badge-required">
                  จำเป็น
                </span>
              </div>
              
              <div className="product-form-grid">
                <div className="product-input-group">
                  <label className="product-input-label">
                    ชื่อผลิตภัณฑ์ 
                    <span className="product-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    className="product-text-input"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="ชื่อผลิตภัณฑ์"
                    required
                  />
                </div>

                <div className="product-input-group">
                  <label className="product-input-label">
                    สีของผลิตภัณฑ์
                    <span className="product-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    className="product-text-input"
                    value={productColor}
                    onChange={(e) => setProductColor(e.target.value)}
                    placeholder="WH, BL, GY"
                    required
                  />
                </div>

                <div className="product-input-group">
                  <label className="product-input-label">
                    สถานะการใช้งาน
                    <span className="product-required-asterisk">*</span>
                  </label>
                  <select
                    className="product-select-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="">-- เลือกสถานะ --</option>
                    <option value="Mass">Mass Production (การผลิตจำนวนมาก)</option>
                    <option value="R&D">R&D (วิจัยและพัฒนา)</option>
                    <option value="Cleaning">Cleaning (ล้างระบบ)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Chemical Formula Section */}
            <section className="product-form-section">
              <div className="product-section-header">
                <h2 className="product-section-title">
                  <span className="product-section-icon">🧪</span>
                  สูตรเคมีหลัก
                </h2>
                <span className="product-section-badge product-badge-important">
                  สำคัญ
                </span>
              </div>
              
              <div className="product-form-grid">
                <div className="product-input-group">
                  <label className="product-input-label">
                    เรซิน (Resin)
                    <span className="product-required-asterisk">*</span>
                  </label>
                  <select
                    className="product-select-input"
                    value={resin}
                    onChange={(e) => setResin(e.target.value)}
                    required
                  >
                    <option value="">-- เลือกเรซิน --</option>
                    {resinOptions.length > 0 ? (
                      resinOptions.map((option, index) => (
                        <option key={`resin-${index}`} value={option.name}>
                          {option.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>ไม่พบข้อมูลเรซิน</option>
                    )}
                  </select>
                </div>

                <div className="product-input-group">
                  <label className="product-input-label">
                    โฟมมิ่ง (Foaming Agent)
                    <span className="product-required-asterisk">*</span>
                  </label>
                  <select
                    className="product-select-input"
                    value={foaming}
                    onChange={(e) => setFoaming(e.target.value)}
                    required
                  >
                    <option value="">-- เลือกโฟมมิ่ง --</option>
                    {foamingOptions.length > 0 ? (
                      foamingOptions.map((option, index) => (
                        <option key={`foaming-${index}`} value={option.name}>
                          {option.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>ไม่พบข้อมูลโฟมมิ่ง</option>
                    )}
                  </select>
                </div>

                <div className="product-input-group">
                  <label className="product-input-label">
                    สีเคมี (Color Additive)
                    <span className="product-optional-text">(ถ้ามี)</span>
                  </label>
                  <select
                    className="product-select-input"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  >
                    <option value="">-- ไม่ใช้สี --</option>
                    {colorOptions.length > 0 ? (
                      colorOptions.map((option, index) => (
                        <option key={`color-${index}`} value={option.name}>
                          {option.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>ไม่พบข้อมูลสี</option>
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* Production Parameters Section */}
            <section className="product-form-section">
              <div className="product-section-header">
                <h2 className="product-section-title">
                  <span className="product-section-icon">⚙️</span>
                  พารามิเตอร์การผลิต
                </h2>
                <span className="product-section-badge product-badge-production">
                  การผลิต
                </span>
              </div>
              
              <div className="product-production-grid">
                <div className="product-measurement-card">
                  <div className="product-card-header">
                    <h3 className="product-card-title">บล็อกต่อรอบ</h3>
                  </div>
                  
                  <div className="product-input-group">
                    <label className="product-input-label">
                      <span className="product-required-asterisk">*</span>
                    </label>
                    <div className="product-number-input-wrapper">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="product-number-input"
                        value={kneaderBlock}
                        onChange={(e) => setKneaderBlock(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <span className="product-input-unit">บล็อค</span>
                    </div>
                    <p className="product-input-description">
                      จำนวนบล็อกที่ผลิตได้ในแต่ละรอบการผลิต
                    </p>
                  </div>
                </div>

                <div className="product-measurement-card">
                  <div className="product-card-header">
                    <h3 className="product-card-title">บล็อกที่ใช้</h3>
                  </div>
                  
                  <div className="product-input-group">
                    <label className="product-input-label">
                      <span className="product-required-asterisk">*</span>
                    </label>
                    <div className="product-number-input-wrapper">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="product-number-input"
                        value={foamingBlock}
                        onChange={(e) => setFoamingBlock(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <span className="product-input-unit">บล็อค</span>
                    </div>
                    <p className="product-input-description">
                      จำนวนบล็อคที่ใช้ Foaming
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Chemicals Section */}
            <section className="product-form-section">
              <div className="product-section-header">
                <h2 className="product-section-title">
                  <span className="product-section-icon">🧬</span>
                  เคมีเสริม
                </h2>
                <button
                  type="button"
                  className="product-add-chemical-button"
                  onClick={addChemicalField}
                >
                  <span className="product-button-icon">➕</span>
                  เพิ่มเคมี
                </button>
              </div>

              <div className="product-chemicals-container">
                {selectedChemicals.map((chemical, index) => (
                  <div key={`chemical-${index}`} className="product-chemical-card">
                    <div className="product-chemical-card-header">
                      <div className="product-chemical-number-badge">
                        {index + 1}
                      </div>
                      <h4 className="product-chemical-card-title">
                        เคมีลำดับที่ {index + 1}
                      </h4>
                      {selectedChemicals.length > 1 && (
                        <button
                          type="button"
                          className="product-remove-chemical-button"
                          onClick={() => removeChemicalField(index)}
                          title="ลบเคมีนี้"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <div className="product-input-group">
                      <select
                        className="product-select-input"
                        value={chemical}
                        onChange={(e) => handleChemicalChange(index, e.target.value)}
                      >
                        <option value="">-- เลือกเคมีเสริม --</option>
                        {chemicals.length > 0 ? (
                          chemicals.map((chem, chemIndex) => (
                            <option key={`chem-${chemIndex}`} value={chem.name}>
                              {chem.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>ไม่พบข้อมูลเคมีเสริม</option>
                        )}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Form Actions */}
            <div className="product-form-actions">
              <button
                type="button"
                className="product-reset-button"
                onClick={resetForm}
              >
                <span className="product-button-icon">🔄</span>
                รีเซ็ตฟอร์ม
              </button>
              
              <button
                type="submit"
                className={`product-submit-button ${isSubmitting ? 'product-submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="product-submit-spinner"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <span className="product-button-icon">💾</span>
                    บันทึกผลิตภัณฑ์
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Products;
