import db from '../config/db.js';

// สร้าง Machine_Table เพื่อเก็บข้อมูล
export const createMachineTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS machine_table (
                machine_id INT PRIMARY KEY AUTO_INCREMENT,
                machine_name varchar(255) NOT NULL
            )
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'machine_table' : ", error);
    }
}