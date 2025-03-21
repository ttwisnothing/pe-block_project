import db from './../config/db.js';

// ดึงค่า PlanTime ทั้งหมดจากฐานข้อมูล
export const getPlanTime = async (req, res) => {
    const { recipe_name } = req.params;

    try {
        // ✅ JOIN Recipe_Table กับ Plan_Time_Table
        const [planTimes] = await db.query(`
            SELECT pt.*
            FROM plan_times_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
        `, [recipe_name]);

        if (planTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
        }

        return res.json({
            recipe_name,
            recipeId: planTimes[0].recipe_id,
            planTimes
        })
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Plan Times" });
    }
};

// คำนวณเวลาของ PlanTime จาก Recipe ที่เลือก และเพิ่มข้อมูลลงในฐานข้อมูล
export const addPlantime = async (req, res) => {
    const { recipe_name } = req.params;

    try {
        // ดึงข้อมูล Recipe จาก Recipe_Table
        const [recipes] = await db.query(
            `SELECT * FROM recipes_table WHERE recipe_name = ?`, [recipe_name]
        )
        if (recipes.length === 0) {
            return res.status(404).json({ message: '❌ Recipe not found' });
        }

        // ดึงข้อมูล ConfigTime จาก Config_Time_Table
        const [config] = await db.query(`SELECT * FROM config_time`);
        if (config.length === 0) {
            return res.status(404).json({ message: '❌ Config Times not found' });
        }

        // ดึงข้อมูล Machine จาก Machine_Table
        const [machines] = await db.query(`SELECT * FROM machine_table`);
        if (machines.length === 0) {
            return res.status(404).json({ message: '❌ Machines not found' });
        }

        // คำนวณเวลาที่ต้องใช้ในแต่ละขั้นตอน
        let startTimes = recipes[0].start_time;
        let round = 6;
        let blockPerRound = 9;
        let blockUse = 6;
        let currentBlock = 0;
        let prevBlock = 0;
        let planTimeList = [];

        for (let i = 0; i < round; i++) {
            const planTime = {};
            const machineIndex = i % machines.length;

            if (prevBlock !== 0 && prevBlock <= blockUse) {
                if (blockUse % prevBlock === 0) {
                    if (prevBlock === 3 && i % 2 !== 0) {
                        planTime.currentBlock = prevBlock
                        currentBlock = prevBlock;
                        planTime.recipe_id = recipes[0].recipe_id;
                        planTime.run_no = i + 1;
                        planTime.machine = machines[machineIndex].machine_name;
                        planTime.batch_no = i;
                        planTime.program_no = null;
                        planTime.start_time = null;
                        planTime.mixing = null;
                        planTime.extruder_exit = null;
                        planTime.pre_press_exit = addMinutes(planTimeList[i - 1].temp_check_1, 2);
                        planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                        planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                        planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                        planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                        planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                        planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                        planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                        planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                        planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                        planTime.block = currentBlock;
                        planTime.nextBlock = currentBlock - planTime.block;
                        prevBlock = currentBlock - planTime.block;

                        planTimeList.push({ ...planTime });

                        if (prevBlock === 0) {
                            planTime.currentBlock = blockPerRound;
                            currentBlock = blockPerRound;
                            planTime.recipe_id = recipes[0].recipe_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex].machine_name;
                            planTime.batch_no = planTime.run_no;
                            planTime.program_no = null
                            planTime.start_time = reduceMinutes(planTimeList[i - 1].primary_press_exit, config[0].adj_next_start);
                            planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                            planTime.extruder_exit = addMinutes(planTime.mixing, config[1].extruder_exit_time);
                            planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
                            planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                            planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                            planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                            planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                            planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                            planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                            planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                            planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                            planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                            planTime.block = currentBlock - blockUse;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }
                    } else {
                        if (prevBlock === 3) {
                            planTime.currentBlock = prevBlock
                            currentBlock = prevBlock;
                            planTime.recipe_id = recipes[0].recipe_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex].machine_name;
                            planTime.batch_no = i - 1;
                            planTime.program_no = null;
                            planTime.start_time = null;
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = addMinutes(planTimeList[i].temp_check_1, 2);
                            planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                            planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                            planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                            planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                            planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                            planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                            planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                            planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                            planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                            planTime.block = currentBlock;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });

                            if (prevBlock === 0) {
                                planTime.currentBlock = blockPerRound;
                                currentBlock = blockPerRound;
                                planTime.recipe_id = recipes[0].recipe_id;
                                planTime.run_no = i + 1;
                                planTime.machine = machines[machineIndex].machine_name;
                                planTime.batch_no = i;
                                planTime.program_no = null
                                planTime.start_time = reduceMinutes(planTimeList[i].primary_press_exit, config[0].adj_next_start);
                                planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                                planTime.extruder_exit = addMinutes(planTime.mixing, config[1].extruder_exit_time);
                                planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
                                planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                                planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                                planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                                planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                                planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                                planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                                planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                                planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                                planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                                planTime.block = currentBlock - blockUse;
                                planTime.nextBlock = currentBlock - planTime.block;
                                prevBlock = currentBlock - planTime.block;

                                planTimeList.push({ ...planTime });
                            }
                        } else {
                            planTime.currentBlock = prevBlock
                            currentBlock = prevBlock
                            planTime.recipe_id = recipes[0].recipe_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex].machine_name;
                            planTime.batch_no = planTime.run_no - 1;
                            planTime.program_no = null
                            planTime.start_time = null;
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = addMinutes(planTimeList[i].secondary_press_1_start, config[0].pre_press_exit_time);
                            planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                            planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                            planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                            planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                            planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                            planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                            planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                            planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                            planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                            planTime.block = currentBlock;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }

                    }
                }
            } else { // i = 0
                if (prevBlock === 0 && currentBlock === 6) {
                    planTime.currentBlock = blockPerRound;
                    currentBlock = blockPerRound;
                    planTime.recipe_id = recipes[0].recipe_id;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[machineIndex].machine_name;
                    planTime.batch_no = planTime.run_no - 1;
                    planTime.program_no = null
                    planTime.start_time = reduceMinutes(planTimeList[i].primary_press_exit, config[0].adj_next_start);
                    planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                    planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                    planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
                    planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                    planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                    planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                    planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                    planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                    planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                    planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                    planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                    planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                    planTime.block = blockUse;
                    planTime.nextBlock = currentBlock - planTime.block;
                    prevBlock = currentBlock - planTime.block;

                    planTimeList.push({ ...planTime });

                } else {
                    planTime.currentBlock = blockPerRound;
                    currentBlock = blockPerRound;
                    planTime.recipe_id = recipes[0].recipe_id;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[0].machine_name;
                    planTime.batch_no = planTime.run_no;
                    planTime.program_no = null
                    planTime.start_time = startTimes;
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                    planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
                    planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                    planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                    planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                    planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                    planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                    planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                    planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                    planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                    planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                    planTime.block = blockUse;
                    planTime.nextBlock = currentBlock - planTime.block;
                    prevBlock = currentBlock - planTime.block;

                    planTimeList.push({ ...planTime });
                }
            }
        }

        // เพิ่มข้อมูลลงในฐานข้อมูล
        for (const plan of planTimeList) {
            const query = `
                INSERT INTO plan_times_table (
                    recipe_id, run_no, machine,
                    batch_no, program_no, start_time,
                    mixing, extruder_exit, pre_press_exit,
                    primary_press_start, stream_in, primary_press_exit,
                    secondary_press_1_start, temp_check_1, secondary_press_2_start,
                    temp_check_2, cooling, secondary_press_exit, block, curr_block, next_block
                ) VALUES (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            `;
            const values = [
                plan.recipe_id, plan.run_no, plan.machine, plan.batch_no, plan.program_no,
                plan.start_time, plan.mixing, plan.extruder_exit, plan.pre_press_exit,
                plan.primary_press_start, plan.stream_in, plan.primary_press_exit,
                plan.secondary_press_1_start, plan.temp_check_1, plan.secondary_press_2_start,
                plan.temp_check_2, plan.cooling, plan.secondary_press_exit, plan.block, plan.currentBlock, plan.nextBlock
            ]

            await db.query(query, values);
        }

        return res.json({
            message: "Plan Time Data successfully added",
            planTimeList
        })

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in calculating Plan Time" });
        console.log(error);
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

// เพิ่มข้อมูลจาก PlanTime ที่เลือกลงใน TempPlanTime
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

// ดึงข้อมูล TempPlanTime จาก Recipe ที่เลือก
export const getTempPlanTime = async (req, res) => {
    const { recipe_name } = req.params;

    try {
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_time_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
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

// แก้ไขเวลาใน TempPlanTime โดยเลือกจาก Start Time ของแต่ละขั้นตอนและวนลูปเพื่อคำนวณเวลาใหม่จนครบทุกขั้นตอน
export const editTempPlanTime = async (req, res) => {
    const { recipe_name, temp_id } = req.params;
    const { start_time } = req.body;

    try {
        // ดึงข้อมูลจาก TempPlanTime ที่เลือก
        const [tempPlanTimes] = await db.query(`
            SELECT pt.*
            FROM temp_plan_time_table pt
            INNER JOIN recipes_table rt ON pt.recipe_id = rt.recipe_id
            WHERE rt.recipe_name = ?
        `, [recipe_name]);

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ Temp Plan Time not found' });
        }

        // ดึงข้อมูล ConfigTime จาก Config_Time_Table
        const [config] = await db.query(`SELECT * FROM config_time`);
        if (config.lngth === 0) {
            return res.status(400).json({ message: '❌ Config Time not found' });
        }

        // ดึงค่า Machine จาก Machine_Table
        const [machines] = await db.query(`SELECT * FROM machine_table`);
        if (machines.length === 0) {
            return res.status(404).json({ message: '❌ Machines not found' });
        }

        let startTimes = start_time;
        let round = 6;
        let blockPerRound = 9;
        let blockUse = 6;
        let currentBlock = tempPlanTimes[temp_id - 1].curr_block;
        let prevBlock = tempPlanTimes[temp_id - 1].next_block;

        let updateTempTiemsList = [];

        for (let i = temp_id - 1; i < round; i++) {
            const planTime = {};
            const machineIndex = i % machines.length;

            
        }

        return res.json({
            recipe_name,
            tempId: temp_id,
            startTime: start_time,
            tempPlanTimes: tempPlanTimes[temp_id - 1]
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in editing Temp Plan Time" });
    }
}