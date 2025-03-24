import db from '../config/db.js';

export const addTempPlanTime = async (req, res) => {
    const { recipe_name } = req.params;

    try {
        const [planTimes] = await db.query(`
            SELECT pt.*
            FROM plan_times_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
        `, [recipe_name]);

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        // INSERT ข้อมูลลงใน TempPlanTime
        for (const plantime of planTimes) {
            const query = `
                INSERT INTO temp_plan_time_table (
                    recipe_id, run_no,
                    machine, batch_no, program_no,
                    start_time, mixing, extruder_exit,
                    pre_press_exit, primary_press_start, stream_in,
                    primary_press_exit, secondary_press_1_start, temp_check_1,
                    secondary_press_2_start, temp_check_2, cooling,
                    secondary_press_exit, block, curr_block, next_block
                ) VALUES (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            `;
            const values = [
                plantime.recipe_id, plantime.run_no,
                plantime.machine, plantime.batch_no, plantime.program_no,
                plantime.start_time, plantime.mixing, plantime.extruder_exit,
                plantime.pre_press_exit, plantime.primary_press_start, plantime.stream_in,
                plantime.primary_press_exit, plantime.secondary_press_1_start, plantime.temp_check_1,
                plantime.secondary_press_2_start, plantime.temp_check_2, plantime.cooling,
                plantime.secondary_press_exit, plantime.block, plantime.curr_block, plantime.next_block
            ]

            await db.query(query, values);
        }

        return res.json({
            message: '✅ Plan Times inserted into temp_plan_times_table successfully',
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in inserting Temp Plan Time" });
    }
}

// ดึงข้อมูล TempPlanTime ทั้งหมด
export const getTempPlanTime = async (req, res) => {
    const { recipe_name } = req.params;

    try {
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_time_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
            ORDER BY pt.batch_no ASC
        `, [recipe_name]);

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this recipe' });
        }

        return res.json({
            recipe_name,
            recipeId: tempPlanTimes[0].recipe_id,
            tempPlanTimes
        })
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
}

// อัพเดท start_time ของ TempPlanTime ที่เลือกโดย temp_id
export const updateNewStartTime = async (req, res) => {
    const { recipe_name, temp_id } = req.params;
    const { new_start_time } = req.body;

    try {
        // ดึงข้อมูลจาก TempPlanTime ที่เลือก
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_time_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
            ORDER BY pt.batch_no ASC, pt.temp_id ASC
        `, [recipe_name]);

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found' });
        }

        // ดึงข้อมูล ConfigTime จาก Config_Time_Table
        const [config] = await db.query(`SELECT * FROM config_time`);
        if (config.length === 0) {
            return res.status(400).json({ message: '❌ Config Time not found' });
        }

        // อัพเดทเวลา start_time ใหม่ของ temp_id ที่เลือก
        await db.query(`
            UPDATE temp_plan_time_table
            SET start_time = ?
            WHERE temp_id = ?
        `, [new_start_time, temp_id]); // new_start_time: 12:46:00, temp_id: 2

        // ค้นหา index ของ temp_id ที่เลือก
        const runIndex = tempPlanTimes.findIndex((temp) => temp.temp_id === parseInt(temp_id));
        if (runIndex === -1) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found' });
        }

        let updateTempList = []

        // อัพเดทเวลา temp_plan_times ใหม่ทั้งหมดยกเว้น temp_id ก่อนหน้า
        for (let i = runIndex; i <= tempPlanTimes.length; i++) {
            const currTemp = {}

            if (i === runIndex) {
                currTemp.start_time = new_start_time
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

                
            } else {
            }

        }

        return res.json({
            recipe_name,
            tempId: temp_id,
            startTime: tempPlanTimes[runIndex].start_time,
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