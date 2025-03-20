import db from '../config/db.js';

// สร้าง Recipe_Table เพื่อเก็บข้อมูล
export const createRecipeTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS recipes_table (
                recipe_id INT PRIMARY KEY AUTO_INCREMENT,
                recipe_name VARCHAR(255) NOT NULL,
                start_time TIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        );
    } catch (error) {
        console.log("❌ Error in creating table 'recipe_table' : ", error);
    }

}