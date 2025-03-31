import db from "../config/db.js";

// สร้าง Chemical_Table เพื่อเก็บข้อมูล
export const createChemicalTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS chemical_master (
                chemical_id INT PRIMARY KEY AUTO_INCREMENT,
                chemical_name VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'chemical_table' : ", error);
    }
}
