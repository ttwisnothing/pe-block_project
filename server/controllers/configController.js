import db from "../config/db.js";

// บันทึก Config time ลงในฐานข้อมูล
export const addConfig = async (req, res) => {
    const {
        config_group,
        mixing_time,
        extruder_exit_time,
        pre_press_exit_time,
        primary_press_start,
        stream_in,
        primary_press_exit,
        secondary_press_1_start,
        temp_check_1,
        secondary_press_2_start,
        temp_check_2,
        cooling_time,
        secondary_press_exit,
        adj_next_start,
        solid_block,
        remove_workpiece,
    } = req.body;
    const query = `
        INSERT INTO config_time (
            config_group,
            mixing_time,
            extruder_exit_time,
            pre_press_exit_time,
            primary_press_start,
            stream_in,
            primary_press_exit,
            secondary_press_1_start,
            temp_check_1,
            secondary_press_2_start,
            temp_check_2,
            cooling_time,
            secondary_press_exit,
            adj_next_start,
            solid_block,
            remove_workpiece
        ) VALUES (
            '${config_group}',
            ${mixing_time},
            ${extruder_exit_time},
            ${pre_press_exit_time},
            ${primary_press_start},
            ${stream_in},
            ${primary_press_exit},
            ${secondary_press_1_start},
            ${temp_check_1},
            ${secondary_press_2_start},
            ${temp_check_2},
            ${cooling_time},
            ${secondary_press_exit},
            ${adj_next_start},
            ${solid_block},
            ${remove_workpiece}
        )
    `;
    try {
        await db.query(query);
        res.status(201).send("Config added successfully");
    } catch (error) {
        res.status(500).send("Error in adding config");
        console.log("❌ Error in adding config : ", error);
    }
}