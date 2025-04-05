import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './product.css';

const Products = ({ url }) => {
  const [productName, setProductName] = useState('');
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
        const response = await axios.get(`${url}/api/get/chemicals`);
        setResinOptions(response.data.resin);
        setFoamingOptions(response.data.foaming);
        setColorOptions(response.data.color);
        setChemicals(response.data.chemicals);
      } catch (error) {
        console.error('❌ Error fetching chemicals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChemicals();
  }, []);

  const addChemicalField = () => {
    setSelectedChemicals([...selectedChemicals, '']);
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
        status,
        resin,
        foaming,
        color,
        bPerRound: kneaderBlock,
        bUse: foamingBlock,
        chemicals: selectedChemicals.filter((chemical) => chemical !== ''),
      };
      await axios.post(`${url}/api/post/product/add`, payload);
      toast.success('✅ Product added successfully');
      setProductName('');
      setStatus('');
      setResin('');
      setFoaming('');
      setColor('');
      setKneaderBlock('');
      setFoamingBlock('');
      setSelectedChemicals(['']);
    } catch (error) {
      console.error('❌ Error adding product:', error);
      toast.error('❌ Failed to add product');
    }
  };

  return (
    <div className="product-container">
      <ToastContainer />
      <form className="product-form" onSubmit={handleSubmit}>
        <h1 className="product-title">Add Product</h1>
        {/* แถวแรก */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name:</label>
            <input
              className="form-input"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status:</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="">-- Select Status --</option>
              <option value="Mass">Mass</option>
              <option value="R&D">R&D</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resin:</label>
            <select
              className="form-select"
              value={resin}
              onChange={(e) => setResin(e.target.value)}
              required
            >
              <option value="">-- Select Resin --</option>
              {resinOptions.map((resin, index) => (
                <option key={index} value={resin.name}>
                  {resin.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Foaming:</label>
            <select
              className="form-select"
              value={foaming}
              onChange={(e) => setFoaming(e.target.value)}
              required
            >
              <option value="">-- Select Foaming --</option>
              {foamingOptions.map((foaming, index) => (
                <option key={index} value={foaming.name}>
                  {foaming.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Color:</label>
            <select
              className="form-select"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="">-- Select Color --</option>
              {colorOptions.map((color, index) => (
                <option key={index} value={color.name}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* แถวที่สอง */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kneader Block:</label>
            <input
              className="form-input"
              type="number"
              value={kneaderBlock}
              onChange={(e) => setKneaderBlock(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Foaming Block:</label>
            <input
              className="form-input"
              type="number"
              value={foamingBlock}
              onChange={(e) => setFoamingBlock(e.target.value)}
              required
            />
          </div>
        </div>


        {/* แถวที่สาม */}
        <div className="chemicals-grid">
          {selectedChemicals.map((selectedChemical, index) => (
            <div key={index} className="form-group">
              <label className="form-label">Chemical {index + 1}:</label>
              {isLoading ? (
                <p className="loading-text">Loading chemicals...</p>
              ) : (
                <select
                  className="form-select"
                  value={selectedChemical}
                  onChange={(e) => handleChemicalChange(index, e.target.value)}
                  required
                >
                  <option value="">-- Select a Chemical --</option>
                  {chemicals.map((chemical, idx) => (
                    <option key={idx} value={chemical.name}>
                      {chemical.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button
            className="add-chemical-button"
            type="button"
            onClick={addChemicalField}
          >
            Add Another Chemical
          </button>
        </div>

        {/* ปุ่ม Save */}
        <div className="form-actions">
          <button className="save-button" type="submit">
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default Products;
