import db from "../config/db.js";

// สร้าง Process_Time_Table เพื่อเก็บข้อมูล
export const createConfigTimeTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS config_time (
                config_id INT PRIMARY KEY AUTO_INCREMENT,
                mixing_time INT NOT NULL,
                extruder_exit_time INT NOT NULL,
                pre_press_exit_time INT NOT NULL,
                primary_press_start INT NOT NULL,
                stream_in INT NOT NULL,
                primary_press_exit INT NOT NULL,
                secondary_press_1_start INT NOT NULL,
                temp_check_1 INT NOT NULL,
                secondary_press_2_start INT NOT NULL,
                temp_check_2 INT NOT NULL,
                cooling_time INT NOT NULL,
                secondary_press_exit INT NOT NULL,
                adj_next_start INT NOT NULL
            )
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'config_table' : ", error);
    }
}