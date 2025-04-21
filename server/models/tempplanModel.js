import sql from 'mssql';
import { getPool } from '../config/db'; // สมมติว่าคุณมีฟังก์ชัน getPool สำหรับ mssql pool

export const addTempPlanTime = async (req, res) => {
    const { product_name } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();

        // ลบข้อมูลทั้งหมดใน temp_plan_table
        await request.query(`DELETE FROM temp_plan_table`);

        // รีเซ็ตค่า IDENTITY (เทียบเท่า AUTO_INCREMENT ใน mssql)
        await request.query(`DBCC CHECKIDENT ('temp_plan_table', RESEED, 0)`);

        const planTimesResult = await request.input('product_name', sql.VarChar, product_name).query(`
            SELECT pt.*
            FROM plan_time_table pt
            INNER JOIN product_mst pm ON pt.product_id = pm.product_id
            WHERE pm.product_name = @product_name
        `);
        const planTimes = planTimesResult.recordset;

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // INSERT ข้อมูลลงใน temp_plan_table
        for (const plan of planTimes) {
            const sqlValue = (val) =>
                val === null || val === undefined ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;

            const query = `
                INSERT INTO temp_plan_table (
                    product_id, run_no,
                    machine, batch_no, program_no,
                    start_time, mixing, extruder_exit,
                    pre_press_exit, primary_press_start, stream_in,
                    primary_press_exit, secondary_press_1_start, temp_check_1,
                    secondary_press_2_start, temp_check_2, cooling,
                    secondary_press_exit, block
                ) VALUES (
                    ${sqlValue(plan.product_id)}, ${sqlValue(plan.run_no)}, ${sqlValue(plan.machine)}, ${sqlValue(plan.batch_no)}, ${sqlValue(plan.start_time)},
                    ${sqlValue(plan.mixing)}, ${sqlValue(plan.extruder_exit)}, ${sqlValue(plan.pre_press_exit)}, ${sqlValue(plan.primary_press_start)},
                    ${sqlValue(plan.stream_in)}, ${sqlValue(plan.primary_press_exit)}, ${sqlValue(plan.secondary_press_1_start)},
                    ${sqlValue(plan.temp_check_1)}, ${sqlValue(plan.secondary_press_2_start)}, ${sqlValue(plan.temp_check_2)},
                    ${sqlValue(plan.cooling)}, ${sqlValue(plan.secondary_press_exit)}, ${sqlValue(plan.block)}
                )
            `;

            await request.query(query);
            request.reset(); // รีเซ็ต parameters หลังจากการ execute query แต่ละครั้ง
        }

        return res.status(200).json({
            message: '✅ Plan Times inserted into temp_plan_table successfully',
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}

export const addTempMB = async (req, res) => {
    const { product_name } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();

        // ลบข้อมูลทั้งหมดใน temp_plan_table
        await request.query(`DELETE FROM temp_plan_table`);

        // รีเซ็ตค่า IDENTITY (เทียบเท่า AUTO_INCREMENT ใน mssql)
        await request.query(`DBCC CHECKIDENT ('temp_plan_table', RESEED, 0)`);

        const planTimesResult = await request.input('product_name', sql.VarChar, product_name).query(`
            SELECT tpt.*
            FROM temp_plan_table tpt
            INNER JOIN product_mst pm ON tpt.product_id = pm.product_id
            WHERE pm.product_name = @product_name
        `);
        const planTimes = planTimesResult.recordset;

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // INSERT ข้อมูลลงใน temp_plan_table
        for (const plan of planTimes) {
            const sqlValue = (val) =>
                val === null || val === undefined ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;

            const query = `
                INSERT INTO temp_plan_table (
                    product_id, run_no,
                    machine, batch_no, program_no,
                    start_time, mixing, extruder_exit,
                    pre_press_exit, primary_press_start, stream_in,
                    primary_press_exit, secondary_press_1_start, temp_check_1,
                    secondary_press_2_start, temp_check_2, cooling,
                    secondary_press_exit, block
                ) VALUES (
                    ${sqlValue(plan.product_id)}, ${sqlValue(plan.run_no)}, ${sqlValue(plan.machine)}, ${sqlValue(plan.batch_no)}, ${sqlValue(plan.start_time)},
                    ${sqlValue(plan.mixing)}, ${sqlValue(plan.extruder_exit)}, ${sqlValue(plan.pre_press_exit)}, ${sqlValue(plan.primary_press_start)},
                    ${sqlValue(plan.stream_in)}, ${sqlValue(plan.primary_press_exit)}, ${sqlValue(plan.secondary_press_1_start)},
                    ${sqlValue(plan.temp_check_1)}, ${sqlValue(plan.secondary_press_2_start)}, ${sqlValue(plan.temp_check_2)},
                    ${sqlValue(plan.cooling)}, ${sqlValue(plan.secondary_press_exit)}, ${sqlValue(plan.block)}
                )
            `;

            await request.query(query);
            request.reset(); // รีเซ็ต parameters หลังจากการ execute query แต่ละครั้ง
        }

        return res.status(200).json({
            message: '✅ Plan Times inserted into temp_plan_table successfully',
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}