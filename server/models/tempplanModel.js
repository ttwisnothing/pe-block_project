import sql from 'mssql';
import { getPool } from '../config/db.js'; // สมมติว่าคุณมีฟังก์ชัน getPool สำหรับ mssql pool

export const addTempPlanTime = async (req, res) => {
    const { product_name } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();

        // ลบข้อมูลทั้งหมดใน temp_plan_table
        await request.query(`DELETE FROM PT_temp_time_mst`);

        // รีเซ็ตค่า IDENTITY (เทียบเท่า AUTO_INCREMENT ใน mssql)
        await request.query(`DBCC CHECKIDENT ('PT_temp_time_mst', RESEED, 0)`);

        const planTimesResult = await request.input('product_name', sql.VarChar, product_name).query(`
            SELECT pt.*
            FROM PT_plan_time_mst pt
            INNER JOIN PT_product_mst pm ON pt.product_id = pm.product_id
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
                INSERT INTO PT_temp_time_mst (
                    product_id, run_no, machine, batch_no, start_time,
                    mixing, solid_block, extruder_exit, pre_press_exit, primary_press_start,
                    stream_in, primary_press_exit, secondary_press_1_start,
                    temp_check_1, secondary_press_2_start, temp_check_2,
                    cooling, secondary_press_exit, remove_work, foam_block
                ) VALUES (
                    ${sqlValue(plan.product_id)}, ${sqlValue(plan.run_no)}, ${sqlValue(plan.machine)}, ${sqlValue(plan.batch_no)}, ${sqlValue(plan.start_time)},
                    ${sqlValue(plan.mixing)}, ${sqlValue(plan.solid_block)}, ${sqlValue(plan.extruder_exit)}, ${sqlValue(plan.pre_press_exit)}, ${sqlValue(plan.primary_press_start)},
                    ${sqlValue(plan.stream_in)}, ${sqlValue(plan.primary_press_exit)}, ${sqlValue(plan.secondary_press_1_start)},
                    ${sqlValue(plan.temp_check_1)}, ${sqlValue(plan.secondary_press_2_start)}, ${sqlValue(plan.temp_check_2)},
                    ${sqlValue(plan.cooling)}, ${sqlValue(plan.secondary_press_exit)}, ${sqlValue(plan.remove_work)}, ${sqlValue(plan.block)}
                )
            `;

            try {
                await pool.request().query(query);
            } catch (err) {
                console.error(`❌ Insert error for item`, err);
            }
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

        const planTimesResult = await request.input('product_name', sql.VarChar, product_name).query(`
            SELECT tpt.*
            FROM PT_temp_time_mst tpt
            INNER JOIN PT_product_mst pm ON tpt.product_id = pm.product_id
            WHERE pm.product_name = @product_name
        `);
        const planTimes = planTimesResult.recordset;

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // ลบข้อมูลทั้งหมดใน temp_plan_table
        await request.query(`DELETE FROM PT_temp_time_mst`);

        // รีเซ็ตค่า IDENTITY (เทียบเท่า AUTO_INCREMENT ใน mssql)
        await request.query(`DBCC CHECKIDENT ('PT_temp_time_mst', RESEED, 0)`);

        // INSERT ข้อมูลลงใน temp_plan_table
        for (const plan of planTimes) {
            const sqlValue = (val) =>
                val === null || val === undefined ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;

            const query = `
                INSERT INTO PT_temp_time_mst (
                    product_id, run_no, machine, batch_no, start_time,
                    mixing, solid_block, extruder_exit, pre_press_exit, primary_press_start,
                    stream_in, primary_press_exit, secondary_press_1_start,
                    temp_check_1, secondary_press_2_start, temp_check_2,
                    cooling, secondary_press_exit, remove_work, foam_block
                ) VALUES (
                    ${sqlValue(plan.product_id)}, ${sqlValue(plan.run_no)}, ${sqlValue(plan.machine)}, ${sqlValue(plan.batch_no)}, ${sqlValue(plan.start_time)},
                    ${sqlValue(plan.mixing)}, ${sqlValue(plan.solid_block)}, ${sqlValue(plan.extruder_exit)}, ${sqlValue(plan.pre_press_exit)}, ${sqlValue(plan.primary_press_start)},
                    ${sqlValue(plan.stream_in)}, ${sqlValue(plan.primary_press_exit)}, ${sqlValue(plan.secondary_press_1_start)},
                    ${sqlValue(plan.temp_check_1)}, ${sqlValue(plan.secondary_press_2_start)}, ${sqlValue(plan.temp_check_2)},
                    ${sqlValue(plan.cooling)}, ${sqlValue(plan.secondary_press_exit)}, ${sqlValue(plan.remove_work)}, ${sqlValue(plan.foam_block)}
                )
            `;

            try {
                await pool.request().query(query);
            } catch (err) {
                console.error(`❌ Insert error for item`, err);
            }
        }

        return res.status(200).json({
            message: '✅ Plan Times inserted into temp_plan_table successfully',
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}

// อัพเดท start_time ของ TempPlanTime ที่เลือกโดย temp_id
export const updateNewStartTime = async (req, res) => {
    const { product_name, temp_id } = req.params;
    const { new_start_time } = req.body;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('product_name', sql.VarChar, product_name);
        request.input('temp_id', sql.Int, parseInt(temp_id));

        const tempPlanTimesResult = await request.query(`
            SELECT pt.*
            FROM PT_temp_plan_table pt
            INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = @product_name
        `);
        const tempPlanTimes = tempPlanTimesResult.recordset;

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found for this product' });
        }

        // ดึงข้อมูล Product จาก product_master
        const productsResult = await request.query(`
            SELECT *
            FROM PT_product_mst
            WHERE product_name = @product_name
        `);
        const products = productsResult.recordset;

        if (products.length === 0) {
            return res.status(404).json({ message: '❌ Product not found' });
        }

        // ดึงข้อมูล ConfigTime จาก Config_Time_Table
        request.input('product_name_like', sql.VarChar, `%${product_name}%`);
        const configResult = await request.query(`
                    SELECT *
                    FROM PT_config_time
                    WHERE @product_name_like LIKE CONCAT('%', config_group, '%')
                `);
        const config = configResult.recordset;

        if (config.length === 0) {
            return res.status(404).json({ message: '❌ Config Times not found' });
        }
        // เก็บค่า config_group ไว้ในตัวแปร config_group
        const cGroup = config[0].config_group;
        // ค้นหา index ของ temp_id ที่เลือก
        const runIndex = tempPlanTimes.findIndex((temp) => temp.temp_id === parseInt(temp_id));
        if (runIndex === -1) {
            return res.status(404).json({ message: '❌ Temp Plan Time with the specified temp_id not found' });
        }

        let newStartTime = new_start_time
        let blockPerRound = products[0].bPerRound;
        let blockUse = products[0].bUse;
        let currentBlock = 0;
        let prevBlock = 0;
        let runBlock = 0;
        let updateTempList = [];

        // 8 % 3 

        // อัพเดทเวลา temp_plan_times ใหม่ทั้งหมดยกเว้น temp_id ก่อนหน้า
        for (let i = runIndex; i < (tempPlanTimes.length / 4) * 3; i++) {
            const currTemp = {}

            if (i !== runIndex) {
                if (prevBlock === 3) {
                    currTemp.start_time = reduceMinutes(updateTempList[updateTempList.length - 1].primary_press_exit, config[0].adj_next_start)
                    currTemp.mixing = addMinutes(currTemp.start_time, config[1].mixing_time);
                    currTemp.extruder_exit = addMinutes(currTemp.mixing, config[1].extruder_exit_time);
                    currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    runBlock = blockPerRound - blockUse
                    currentBlock = runBlock + blockPerRound
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })

                    if (true) {
                        currTemp.start_time = null;
                        currTemp.mixing = null;
                        currTemp.extruder_exit = null;

                        currentBlock = prevBlock
                        runBlock = currentBlock - blockUse
                        prevBlock = currentBlock - runBlock

                        updateTempList.push({ ...currTemp })
                    }
                } else if (prevBlock === 6) {
                    currTemp.start_time = null;
                    currTemp.mixing = null;
                    currTemp.extruder_exit = null;
                    currTemp.pre_press_exit = addMinutes(updateTempList[updateTempList.length - 1].secondary_press_1_start, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    currentBlock = prevBlock
                    runBlock = currentBlock
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })
                } else {
                    currTemp.start_time = reduceMinutes(updateTempList[updateTempList.length - 1].primary_press_exit, config[0].adj_next_start);
                    currTemp.mixing = addMinutes(currTemp.start_time, config[1].mixing_time);
                    currTemp.extruder_exit = addMinutes(currTemp.mixing, config[0].extruder_exit_time);
                    currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    currentBlock = blockPerRound
                    runBlock = blockUse
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })
                }
            } else {
                if (i === 0) {
                    currTemp.start_time = newStartTime;
                    currTemp.mixing = addMinutes(newStartTime, config[0].mixing_time);
                    currTemp.extruder_exit = addMinutes(currTemp.mixing, config[0].extruder_exit_time);
                    currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    runBlock = blockUse
                    currentBlock = blockPerRound
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })
                } else if (i % 2 !== 0) {
                    currTemp.start_time = newStartTime;
                    currTemp.mixing = addMinutes(newStartTime, config[1].mixing_time);
                    currTemp.extruder_exit = addMinutes(currTemp.mixing, config[1].extruder_exit_time);
                    currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    runBlock = blockPerRound - blockUse
                    currentBlock = runBlock + blockPerRound
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })

                    if (true) {
                        currTemp.start_time = null;
                        currTemp.mixing = null;
                        currTemp.extruder_exit = null;

                        currentBlock = prevBlock
                        runBlock = currentBlock - blockUse
                        prevBlock = currentBlock - runBlock

                        updateTempList.push({ ...currTemp })
                    }
                } else {
                    currTemp.start_time = newStartTime;
                    currTemp.mixing = addMinutes(newStartTime, config[1].mixing_time);
                    currTemp.extruder_exit = addMinutes(currTemp.mixing, config[0].extruder_exit_time);
                    currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time);
                    currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start);
                    currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in);
                    currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit);
                    currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start);
                    currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1);
                    currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start);
                    currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2);
                    currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time);
                    currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit);
                    currentBlock = blockPerRound
                    runBlock = blockUse
                    prevBlock = currentBlock - runBlock

                    updateTempList.push({ ...currTemp })
                }
            }
        }

        // อัพเดท temp_plan_time_table ด้วย updateTempList
        for (let i = 0; i < updateTempList.length; i++) {
            const pool = await getPool();
            const request = pool.request();

            const sqlValue = (val) =>
                val === null || val === undefined ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;

            await request.input('start_time', sql.NVarChar, updateTempList[i].start_time)
                .input('mixing', sql.NVarChar, updateTempList[i].mixing)
                .input('extruder_exit', sql.NVarChar, updateTempList[i].extruder_exit)
                .input('pre_press_exit', sql.NVarChar, updateTempList[i].pre_press_exit)
                .input('primary_press_start', sql.NVarChar, updateTempList[i].primary_press_start)
                .input('stream_in', sql.NVarChar, updateTempList[i].stream_in)
                .input('primary_press_exit', sql.NVarChar, updateTempList[i].primary_press_exit)
                .input('secondary_press_1_start', sql.NVarChar, updateTempList[i].secondary_press_1_start)
                .input('temp_check_1', sql.NVarChar, updateTempList[i].temp_check_1)
                .input('secondary_press_2_start', sql.NVarChar, updateTempList[i].secondary_press_2_start)
                .input('temp_check_2', sql.NVarChar, updateTempList[i].temp_check_2)
                .input('cooling', sql.NVarChar, updateTempList[i].cooling)
                .input('secondary_press_exit', sql.NVarChar, updateTempList[i].secondary_press_exit)
                .input('temp_id', sql.Int, tempPlanTimes[runIndex + i].temp_id) // ใช้ runIndex + i เพื่อให้ได้ temp_id ที่ถูกต้อง
                .query(`
                    UPDATE PT_temp_plan_table
                    SET start_time = @start_time,
                        mixing = @mixing,
                        extruder_exit = @extruder_exit,
                        pre_press_exit = @pre_press_exit,
                        primary_press_start = @primary_press_start,
                        stream_in = @stream_in,
                        primary_press_exit = @primary_press_exit,
                        secondary_press_1_start = @secondary_press_1_start,
                        temp_check_1 = @temp_check_1,
                        secondary_press_2_start = @secondary_press_2_start,
                        temp_check_2 = @temp_check_2,
                        cooling = @cooling,
                        secondary_press_exit = @secondary_press_exit
                    WHERE temp_id = @temp_id
                `);
        }

        return res.json({
            message: '✅ New Start Time updated successfully and Temp Plan Times recalculated',
            updateTempList
        });

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in editing Temp Plan Time" });
    }
}

const addMinutes = (time, minutes) => {
    let date = new Date(`2021-01-01T${time}`);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 8);
}

const reduceMinutes = (time, minutes) => {
    let date = new Date(`2021-01-01T${time}`);
    date.setMinutes(date.getMinutes() - minutes);
    return date.toTimeString().slice(0, 8);
}

export const updateMac = async (req, res) => {
    const { product_name } = req.params; // รับ product_name จาก params
    const { machines } = req.body; // รับ machines (อาร์เรย์ของ temp_id และ new_machine_name) จาก body

    if (!machines || !Array.isArray(machines) || machines.length === 0) {
        return res.status(400).json({ message: "❌ Invalid input: machines array is required" });
    }

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('product_name', sql.VarChar, product_name);

        // ตรวจสอบว่า temp_id ทั้งหมดมีอยู่ในฐานข้อมูล
        const tempIds = machines.map((machine) => machine.temp_id);

        // สร้าง string สำหรับ IN clause
        const tempIdsString = tempIds.map(id => `'${id}'`).join(', ');

        const existingTempPlanTimesResult = await request.query(`
            SELECT pt.temp_id
            FROM PT_temp_plan_table pt
            INNER JOIN PT_product_mst pm ON pt.product_id = pm.product_id
            WHERE pm.product_name = @product_name AND pt.temp_id IN (${tempIdsString})
        `);
        const existingTempPlanTimes = existingTempPlanTimesResult.recordset;

        if (existingTempPlanTimes.length !== machines.length) {
            return res.status(404).json({ message: "❌ Some Temp Plan Times not found for the given temp_ids" });
        }

        // อัปเดต machine สำหรับ temp_id ทั้งหมด
        const updatePromises = machines.map(async (machine) => {
            const updateRequest = pool.request();
            updateRequest.input('new_machine_name', sql.VarChar, machine.new_machine_name);
            updateRequest.input('temp_id', sql.Int, machine.temp_id);

            await updateRequest.query(`
                UPDATE PT_temp_plan_table
                SET machine = @new_machine_name
                WHERE temp_id = @temp_id
            `);
        });

        await Promise.all(updatePromises); // รันคำสั่ง SQL ทั้งหมดพร้อมกัน

        return res.status(200).json({
            message: "✅ Machines updated successfully",
            updatedMachines: machines,
        });
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ message: "❌ Error in updating Machines" });
    }
};