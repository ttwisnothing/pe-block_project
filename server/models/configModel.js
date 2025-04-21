import { getPool } from "../config/db.js"; // Assuming app.js exports getPool
import sql from 'mssql';

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
            @config_group,
            @mixing_time,
            @extruder_exit_time,
            @pre_press_exit_time,
            @primary_press_start,
            @stream_in,
            @primary_press_exit,
            @secondary_press_1_start,
            @temp_check_1,
            @secondary_press_2_start,
            @temp_check_2,
            @cooling_time,
            @secondary_press_exit,
            @adj_next_start,
            @solid_block,
            @remove_workpiece
        )
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนดค่า Parameters
        request.input('config_group', sql.VarChar, config_group);
        request.input('mixing_time', sql.Int, mixing_time);
        request.input('extruder_exit_time', sql.Int, extruder_exit_time);
        request.input('pre_press_exit_time', sql.Int, pre_press_exit_time);
        request.input('primary_press_start', sql.Int, primary_press_start);
        request.input('stream_in', sql.Int, stream_in);
        request.input('primary_press_exit', sql.Int, primary_press_exit);
        request.input('secondary_press_1_start', sql.Int, secondary_press_1_start);
        request.input('temp_check_1', sql.Int, temp_check_1);
        request.input('secondary_press_2_start', sql.Int, secondary_press_2_start);
        request.input('temp_check_2', sql.Int, temp_check_2);
        request.input('cooling_time', sql.Int, cooling_time);
        request.input('secondary_press_exit', sql.Int, secondary_press_exit);
        request.input('adj_next_start', sql.Int, adj_next_start);
        request.input('solid_block', sql.Int, solid_block);
        request.input('remove_workpiece', sql.Int, remove_workpiece);

        await request.query(query);
        res.status(201).send("Config added successfully");
    } catch (error) {
        res.status(500).send("Error in adding config");
        console.log("❌ Error in adding config : ", error);
    }
};