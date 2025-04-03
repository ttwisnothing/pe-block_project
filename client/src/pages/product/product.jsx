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
        chemicals: selectedChemicals.filter((chemical) => chemical !== ''),
      };
      await axios.post(`${url}/api/post/product/add`, payload);
      toast.success('✅ Product added successfully');
      setProductName('');
      setStatus('');
      setResin('');
      setFoaming('');
      setColor('');
      setSelectedChemicals(['']);
    } catch (error) {
      console.error('❌ Error adding product:', error);
      toast.error('❌ Failed to add product');
    }
  };

  return (
    <div>
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        <h1>Add Product</h1>
        {/* แถวแรก */}
        <div>
          <label>Product Name:</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="">-- Select Status --</option>
            <option value="Mass">Mass</option>
            <option value="R&D">R&D</option>
          </select>
        </div>
        <div>
          <label>Resin:</label>
          <select
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
        <div>
          <label>Foaming:</label>
          <select
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
        <div>
          <label>Color:</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            required
          >
            <option value="">-- Select Color --</option>
            {colorOptions.map((color, index) => (
              <option key={index} value={color.name}>
                {color.name}
              </option>
            ))}
          </select>
        </div>

        {/* แถวที่สอง */}
        <div className="chemicals-grid">
          {selectedChemicals.map((selectedChemical, index) => (
            <div key={index}>
              <label>Chemical {index + 1}:</label>
              {isLoading ? (
                <p>Loading chemicals...</p>
              ) : (
                <select
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
        <div className="full-width">
          <button type="button" onClick={addChemicalField}>
            Add Another Chemical
          </button>
        </div>

        {/* ปุ่ม Save */}
        <div className="full-width">
          <button type="submit">Save Product</button>
        </div>
      </form>
    </div>
  );
};

export default Products;
