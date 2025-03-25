import React, { useState } from 'react';
import './recipe.css';

const Recipe = ({ url }) => {
  const [recipeName, setRecipeName] = useState('');
  const [startTime, setStartTime] = useState('');

  const handleSave = async () => {
    if (!recipeName || !startTime) {
      alert('❌ Please fill in both Recipe Name and Start Time');
      return;
    }

    // ตรวจสอบรูปแบบเวลา (HH:mm)
    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      alert('❌ Invalid time format. Please use HH:mm (e.g., 14:30)');
      return;
    }

    try {
      // เรียก API เพื่อเพิ่ม Recipe
      const addRecipeResponse = await fetch(`${url}/api/post/recipe/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe_name: recipeName, start_time: startTime }),
      });

      if (!addRecipeResponse.ok) {
        throw new Error('❌ Failed to add recipe');
      }

      alert(`✅ Recipe "${recipeName}" added successfully`);

      // เรียก API เพื่อเพิ่ม PlanTime
      const addPlantimeResponse = await fetch(`${url}/api/post/plantime/add/${recipeName}`, {
        method: 'POST',
      });

      if (!addPlantimeResponse.ok) {
        throw new Error('❌ Failed to add Plan Time');
      }

      alert(`✅ Plan Time for "${recipeName}" added successfully`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="recipe-container">
      <h1>Recipe Logger</h1>
      <div className="form-group">
        <label htmlFor="recipeName">Recipe Name:</label>
        <input
          type="text"
          id="recipeName"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          placeholder="Enter recipe name"
        />
      </div>
      <div className="form-group">
        <label htmlFor="startTime">Start Time (HH:mm):</label>
        <input
          type="text"
          id="startTime"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="Enter start time (e.g., 14:30)"
        />
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default Recipe;