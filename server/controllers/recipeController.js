import db from "../config/db.js";

// บันทึก Recipe ลงในฐานข้อมูล
export const addRecipe = async (req, res) => {
    const { recipe_name, start_time } = req.body;
    const query = `INSERT INTO recipes_table (recipe_name, start_time) VALUES ('${recipe_name}','${start_time}')`;
    try {
        await db.query(query);
        res.status(201).send("✅ Recipe added successfully");
    } catch (error) {
        res.status(500).send("❌ Error in adding recipe");
        console.log(error);
    }
};

// ดึงข้อมูล Recipes ทั้งหมดจากฐานข้อมูล
export const getRecipes = async (req, res) => {
    const query = `SELECT recipe_id AS id, recipe_name AS name FROM recipes_table`; // ใช้ alias "name" ให้ตรงกับฝั่ง plantime.jsx

    try {
        const [recipes] = await db.query(query);
        res.status(200).json({ recipes }); // ส่งข้อมูล recipes กลับในรูปแบบ JSON
    } catch (error) {
        res.status(500).send("❌ Error in fetching recipes");
        console.log(error);
    }
};