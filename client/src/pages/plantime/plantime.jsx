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
      console.error("❌ ERROR fetching PlanTime:", error);
      setPlanTimes([]);
      setError(true);
    } finally {
      setLoading(false);
      setSearchDone(true);
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
    <div className="container mt-5">
      <h1 className="text-center mb-4">Plan Time</h1>

      <div className="mb-3">
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
        className="btn btn-primary w-100 mb-3"
        onClick={handleSearch}
        disabled={loading}
      >
        ค้นหา
      </button>

      {searchDone && planTimes.length > 0 && (
        <button
          className="btn btn-success w-100 mb-3"
          onClick={handleShowPlanTime}
        >
          Show Plantime
        </button>
      )}

      {searchDone && planTimes.length === 0 && !error && (
        <div className="alert alert-info">ไม่พบข้อมูล Plan Time</div>
      )}

      {error && (
        <div className="alert alert-danger">เกิดข้อผิดพลาดในการค้นหา</div>
      )}
    </div>
  );
};

export default Plantime;
