import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./plantime.css";

const Plantime = ({ url }) => {
  const [recipeName, setRecipeName] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [planTimes, setPlanTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const navigate = useNavigate();

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${url}/api/get/recipes`);
      setRecipes(response.data.recipes || []);
    } catch (error) {
      console.error("❌ ERROR fetching Recipes:", error);
    }
  };

  const fetchPlanTimes = async () => {
    if (!recipeName) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/get/plantime/${recipeName}`);
      setPlanTimes(response.data.planTimes || []);
      setError(false);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn("⚠️ No Plan Time found for this recipe.");
        setPlanTimes([]); // กำหนดให้ไม่มีข้อมูล
        setError(false); // ไม่ถือว่าเป็นข้อผิดพลาดร้ายแรง
      } else {
        console.error("❌ ERROR fetching PlanTime:", error);
        setPlanTimes([]);
        setError(true); // ข้อผิดพลาดอื่น ๆ
      }
    } finally {
      setLoading(false);
      setSearchDone(true);
    }
  };

  const addPlanTime = async () => {
    if (!recipeName) return;
    try {
      const response = await axios.post(`${url}/api/post/plantime/add/${recipeName}`);
      alert(response.data.message || "✅ Plan Time created successfully");
      fetchPlanTimes(); // โหลดข้อมูลใหม่หลังจากสร้าง
    } catch (error) {
      console.error("❌ ERROR adding Plan Time:", error);
      alert(error.response?.data?.message || "❌ Failed to create Plan Time");
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSearch = () => {
    if (!recipeName) {
      setError(true);
    } else {
      setError(false);
      fetchPlanTimes();
    }
  };

  const handleShowPlanTime = () => {
    navigate("/plantime-table", { state: { recipeName, planTimes } });
  };

  return (
    <div className="container">
      <h1 className="title">Plan Time</h1>

      <div className="form-group">
        <label htmlFor="recipe-select" className="form-label">
          เลือก Recipe
        </label>
        <select
          id="recipe-select"
          className="form-select"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
        >
          <option value="" disabled>
            -- เลือก Recipe --
          </option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.name}>
              {recipe.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="button primary"
        onClick={handleSearch}
        disabled={loading}
      >
        ค้นหา
      </button>

      {searchDone && planTimes.length > 0 && (
        <button className="button success" onClick={handleShowPlanTime}>
          Show Plantime
        </button>
      )}

      {searchDone && planTimes.length === 0 && !error && (
        <div>
          <div className="alert info">ไม่พบข้อมูล Plan Time</div>
          <button className="button warning" onClick={addPlanTime}>
            สร้าง Plan Time
          </button>
        </div>
      )}

      {error && <div className="alert danger">เกิดข้อผิดพลาดในการค้นหา</div>}
    </div>
  );
};

export default Plantime;
