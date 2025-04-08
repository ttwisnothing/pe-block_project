import db from "../config/db.js";

// สร้าง PlanTime_Table เพื่อเก็บข้อมูล
export const createPlanTimeTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS plan_time_table (
                plant_id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                run_no INT NOT NULL,
                machine VARCHAR(255),
                batch_no INT,
                program_no INT,
                start_time TIME,
                mixing TIME,
                extruder_exit TIME,
                pre_press_exit TIME,
                primary_press_start TIME,
                stream_in TIME,
                primary_press_exit TIME,
                secondary_press_1_start TIME,
                temp_check_1 TIME,
                secondary_press_2_start TIME,
                temp_check_2 TIME,
                cooling TIME,
                secondary_press_exit TIME,
                block INT,
                FOREIGN KEY (product_id) REFERENCES product_master(product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'plan_time_table' : ", error);
    }
}

export const createRemoveSolidPlanTimeTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS resolid_plan_table (
                plant_id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                run_no INT NOT NULL,
                machine VARCHAR(255),
                batch_no INT,
                program_no INT,
                start_time TIME,
                mixing TIME,
                solid_block TIME,
                extruder_exit TIME,
                pre_press_exit TIME,
                primary_press_start TIME,
                stream_in TIME,
                primary_press_exit TIME,
                secondary_press_1_start TIME,
                temp_check_1 TIME,
                secondary_press_2_start TIME,
                temp_check_2 TIME,
                cooling TIME,
                secondary_press_exit TIME,
                remove_work TIME,
                block INT,
                FOREIGN KEY (product_id) REFERENCES product_master(product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'plan_time_table' : ", error);
    }
}

// สร้าง summary_table เพื่อเก็บข้อมูล
export const createSummaryTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS summary_time (
                summary_id INT PRIMARY KEY AUTO_INCREMENT,
                create_time DATE DEFAULT CURRENT_DATE,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                sum_time TIME NOT NULL
            )
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'summary_table' : ", error);
    }
}