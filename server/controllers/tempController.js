import db from '../config/db.js';

export const addTempPlanTime = async (req, res) => {
    const { product_name } = req.params;

    try {
        // ลบข้อมูลทั้งหมดใน temp_plan_time_table
        await db.query(`DELETE FROM temp_plan_table`);

        // รีเซ็ตค่า AUTO_INCREMENT
        await db.query(`ALTER TABLE temp_plan_table AUTO_INCREMENT = 1`)

        const [planTimes] = await db.query(`
            SELECT pt.*
            FROM plan_time_table pt
            INNER JOIN product_master pm ON pt.product_id = pm.product_id
            WHERE pm.product_name = ?
        `, [product_name]);

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // INSERT ข้อมูลลงใน TempPlanTime
        for (const plantime of planTimes) {
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
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            `;
            const values = [
                plantime.product_id, plantime.run_no,
                plantime.machine, plantime.batch_no, plantime.program_no,
                plantime.start_time, plantime.mixing, plantime.extruder_exit,
                plantime.pre_press_exit, plantime.primary_press_start, plantime.stream_in,
                plantime.primary_press_exit, plantime.secondary_press_1_start, plantime.temp_check_1,
                plantime.secondary_press_2_start, plantime.temp_check_2, plantime.cooling,
                plantime.secondary_press_exit, plantime.block
            ]

            await db.query(query, values);
        }

        return res.status(200).json({
            message: '✅ Plan Times inserted into temp_plan_times_table successfully',
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}

export const addTempMB = async (req, res) => {
    const { product_name } = req.params;

    try {
        const [tempTimes] = await db.query(`
            SELECT tpt.*
            FROM temp_plan_table tpt
            INNER JOIN product_master rt ON tpt.product_id = rt.product_id
            WHERE rt.product_name = ?
        `, [ product_name]);

        if (tempTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // ลบข้อมูลทั้งหมดใน temp_plan_time_table
        await db.query(`DELETE FROM temp_plan_table`);

        // รีเซ็ตค่า AUTO_INCREMENT
        await db.query(`ALTER TABLE temp_plan_table AUTO_INCREMENT = 1`)

        // INSERT ข้อมูลลงใน TempPlanTime
        for (const plantime of tempTimes) {
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
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            `;
            const values = [
                plantime.product_id, plantime.run_no,
                plantime.machine, plantime.batch_no, plantime.program_no,
                plantime.start_time, plantime.mixing, plantime.extruder_exit,
                plantime.pre_press_exit, plantime.primary_press_start, plantime.stream_in,
                plantime.primary_press_exit, plantime.secondary_press_1_start, plantime.temp_check_1,
                plantime.secondary_press_2_start, plantime.temp_check_2, plantime.cooling,
                plantime.secondary_press_exit, plantime.block
            ]

            await db.query(query, values);
        }

        return res.status(200).json({
            message: '✅ New Tepm Plan Times add to Temp Plan Time Table success',
            tempTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}

// ดึงข้อมูล TempPlanTime ทั้งหมด
export const getTempPlanTime = async (req, res) => {
    const { product_name } = req.params;

    try {
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_table pt
            INNER JOIN product_master rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = ?
        `, [product_name]);

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this recipe' });
        }

        return res.status(200).json({
            product_name,
            productId: tempPlanTimes[0].product_id,
            tempPlanTimes
        })
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
}

// ดึงข้อมูล TempPlanTime ทั้งหมด และเรียงตาม run_no, batch_no
export const getTempPlanTimeASC = async (req, res) => {
    const { product_name } = req.params;

    try {
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_table pt
            INNER JOIN product_master rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = ?
            ORDER BY pt.run_no, pt.batch_no;
        `, [product_name]);

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this recipe' });
        }

        return res.status(200).json({
            product_name,
            productId: tempPlanTimes[0].product_id,
            tempPlanTimes
        })
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
}

// อัพเดท start_time ของ TempPlanTime ที่เลือกโดย temp_id
export const updateNewStartTime = async (req, res) => {
    const { product_name, temp_id } = req.params;
    const { new_start_time } = req.body;

    try {
        // ดึงข้อมูลจาก TempPlanTime ที่เลือก
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_table pt
            INNER JOIN product_master rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = ?
        `, [product_name]);
        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found' });
        }

        // ดึงข้อมูลจาก Config_Time
        const [config] = await db.query(`
            SELECT *
            FROM config_time
        `);
        if (config.length === 0) {
            return res.status(404).json({ message: '❌ Config Time not found' });
        }

        // อัพเดทเวลา start_time ใหม่ของ temp_id ที่เลือก
        await db.query(`
            UPDATE temp_plan_table
            SET start_time = ?
            WHERE temp_id = ?
        `, [new_start_time, temp_id]); // new_start_time: 14:26:00, temp_id: 2

        // ค้นหา index ของ temp_id ที่เลือก
        const runIndex = tempPlanTimes.findIndex((temp) => temp.temp_id === parseInt(temp_id));
        if (runIndex === -1) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found' });
        }

        let updateTempList = []
        tempPlanTimes[runIndex].start_time = new_start_time;

        // อัพเดทเวลา temp_plan_times ใหม่ทั้งหมดยกเว้น temp_id ก่อนหน้า
        for (let i = runIndex; i < tempPlanTimes.length; i++) {
            const currTemp = {}

            if (i === runIndex) {
                if (i === 0) {
                    currTemp.start_time = tempPlanTimes[runIndex].start_time;
                    currTemp.mixing = addMinutes(currTemp.start_time, config[0].mixing_time);
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

                    updateTempList.push({ ...currTemp });
                } else if (i === 1 || i === 5) {
                    currTemp.start_time = tempPlanTimes[runIndex].start_time;
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

                    updateTempList.push({ ...currTemp });
                } else {
                    currTemp.start_time = tempPlanTimes[runIndex].start_time;
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

                    updateTempList.push({ ...currTemp });
                }
            } else {
                if (i === 2 || i === 6) {
                    currTemp.start_time = null
                    currTemp.mixing = null
                    currTemp.extruder_exit = null
                    currTemp.pre_press_exit = updateTempList[updateTempList.length - 1].pre_press_exit
                    currTemp.primary_press_start = updateTempList[updateTempList.length - 1].primary_press_start
                    currTemp.stream_in = updateTempList[updateTempList.length - 1].stream_in
                    currTemp.primary_press_exit = updateTempList[updateTempList.length - 1].primary_press_exit
                    currTemp.secondary_press_1_start = updateTempList[updateTempList.length - 1].secondary_press_1_start
                    currTemp.temp_check_1 = updateTempList[updateTempList.length - 1].temp_check_1
                    currTemp.secondary_press_2_start = updateTempList[updateTempList.length - 1].secondary_press_2_start
                    currTemp.temp_check_2 = updateTempList[updateTempList.length - 1].temp_check_2
                    currTemp.cooling = updateTempList[updateTempList.length - 1].cooling
                    currTemp.secondary_press_exit = updateTempList[updateTempList.length - 1].secondary_press_exit

                    updateTempList.push({ ...currTemp });
                } else {
                    if (i === 3 || i === 7) {
                        currTemp.start_time = null
                        currTemp.mixing = null
                        currTemp.extruder_exit = null
                        currTemp.pre_press_exit = addMinutes(updateTempList[updateTempList.length - 1].secondary_press_1_start, config[0].pre_press_exit_time)
                        currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start)
                        currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in)
                        currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit)
                        currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start)
                        currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1)
                        currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start)
                        currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2)
                        currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time)
                        currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit)

                        updateTempList.push({ ...currTemp });
                    } else {
                        if (i === 4) {
                            currTemp.start_time = reduceMinutes(updateTempList[updateTempList.length - 1].primary_press_exit, config[0].adj_next_start)
                            currTemp.mixing = addMinutes(currTemp.start_time, config[1].mixing_time)
                            currTemp.extruder_exit = addMinutes(currTemp.mixing, config[0].extruder_exit_time)
                            currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time)
                            currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start)
                            currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in)
                            currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit)
                            currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start)
                            currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1)
                            currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start)
                            currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2)
                            currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time)
                            currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit)

                            updateTempList.push({ ...currTemp });
                        } else {
                            currTemp.start_time = reduceMinutes(updateTempList[updateTempList.length - 1].primary_press_exit, config[0].adj_next_start)
                            currTemp.mixing = addMinutes(currTemp.start_time, config[1].mixing_time)
                            currTemp.extruder_exit = addMinutes(currTemp.mixing, config[1].extruder_exit_time)
                            currTemp.pre_press_exit = addMinutes(currTemp.extruder_exit, config[0].pre_press_exit_time)
                            currTemp.primary_press_start = addMinutes(currTemp.pre_press_exit, config[0].primary_press_start)
                            currTemp.stream_in = addMinutes(currTemp.primary_press_start, config[0].stream_in)
                            currTemp.primary_press_exit = addMinutes(currTemp.stream_in, config[0].primary_press_exit)
                            currTemp.secondary_press_1_start = addMinutes(currTemp.primary_press_exit, config[0].secondary_press_1_start)
                            currTemp.temp_check_1 = addMinutes(currTemp.secondary_press_1_start, config[0].temp_check_1)
                            currTemp.secondary_press_2_start = addMinutes(currTemp.temp_check_1, config[0].secondary_press_2_start)
                            currTemp.temp_check_2 = addMinutes(currTemp.secondary_press_2_start, config[0].temp_check_2)
                            currTemp.cooling = addMinutes(currTemp.temp_check_2, config[0].cooling_time)
                            currTemp.secondary_press_exit = addMinutes(currTemp.cooling, config[0].secondary_press_exit)

                            updateTempList.push({ ...currTemp });
                        }
                    }
                }
            }
        }

        // อัพเดท temp_plan_time_table ด้วย updateTempList
        for (let i = 0; i < updateTempList.length; i++) {
            await db.query(`
                UPDATE temp_plan_table
                SET start_time = ?, mixing = ?, extruder_exit = ?, pre_press_exit = ?,
                    primary_press_start = ?, stream_in = ?, primary_press_exit = ?,
                    secondary_press_1_start = ?, temp_check_1 = ?, secondary_press_2_start = ?,
                    temp_check_2 = ?, cooling = ?, secondary_press_exit = ?
                WHERE temp_id = ?
            `, [
                updateTempList[i].start_time, updateTempList[i].mixing, updateTempList[i].extruder_exit,
                updateTempList[i].pre_press_exit, updateTempList[i].primary_press_start,
                updateTempList[i].stream_in, updateTempList[i].primary_press_exit,
                updateTempList[i].secondary_press_1_start, updateTempList[i].temp_check_1,
                updateTempList[i].secondary_press_2_start, updateTempList[i].temp_check_2,
                updateTempList[i].cooling, updateTempList[i].secondary_press_exit,
                tempPlanTimes[runIndex + i].temp_id // ใช้ runIndex + i เพื่อให้ได้ temp_id ที่ถูกต้อง
            ]);
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
        // ตรวจสอบว่า temp_id ทั้งหมดมีอยู่ในฐานข้อมูล
        const tempIds = machines.map((machine) => machine.temp_id);
        const [existingTempPlanTimes] = await db.query(`
            SELECT pt.temp_id
            FROM temp_plan_table pt
            INNER JOIN product_master pm ON pt.product_id = pm.product_id
            WHERE pm.product_name = ? AND pt.temp_id IN (?)
        `, [product_name, tempIds]);

        if (existingTempPlanTimes.length !== machines.length) {
            return res.status(404).json({ message: "❌ Some Temp Plan Times not found for the given temp_ids" });
        }

        // อัปเดต machine สำหรับ temp_id ทั้งหมด
        const updatePromises = machines.map((machine) => {
            return db.query(`
                UPDATE temp_plan_table
                SET machine = ?
                WHERE temp_id = ?
            `, [machine.new_machine_name, machine.temp_id]);
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