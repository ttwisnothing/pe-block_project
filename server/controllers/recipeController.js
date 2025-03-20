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
}

// ดึงข้อมูล Recipes จากฐานข้อมูล
export const getRecipes = async (req, res) => {
    const { recipe_name } = req.params; // รับค่า recipe_name จาก params

    const query = `SELECT * FROM recipes_table WHERE recipe_name = '${recipe_name}'`;

    try {
        const result = await db.query(query);
        
        // ส่งข้อมูลจากฐานข้อมูลในรูปแบบ JSON
        if (result.rows.length > 0) {
            return res.status(200).json(result.rows); // ส่งข้อมูล recipe ที่ตรงกับ query
        } else {
            return res.status(404).send("❌ Recipe not found");
        }
    } catch (error) {
        res.status(500).send("❌ Error in fetching recipes");
        console.log(error);
    }
}