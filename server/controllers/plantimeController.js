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
            ORDER BY pt.run_no ASC, pt.batch_no ASC
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
                        planTime.currentBlock = prevBlock + currentBlock
                        currentBlock = prevBlock + currentBlock;
                        planTime.recipe_id = recipes[0].recipe_id;
                        planTime.run_no = i + 1;
                        planTime.machine = machines[machineIndex].machine_name;
                        planTime.batch_no = i + 1;
                        planTime.program_no = null;
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
                        planTime.block = currentBlock - blockPerRound;
                        planTime.nextBlock = currentBlock - planTime.block;
                        prevBlock = currentBlock - planTime.block;

                        planTimeList.push({ ...planTime });

                        if (prevBlock === 9) {
                            planTime.currentBlock = prevBlock;
                            currentBlock = prevBlock;
                            planTime.recipe_id = recipes[0].recipe_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex].machine_name;
                            planTime.batch_no = i;
                            planTime.program_no = null
                            planTime.start_time = null
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = planTimeList[i].pre_press_exit;
                            planTime.primary_press_start = planTimeList[i].primary_press_start;
                            planTime.stream_in = planTimeList[i].stream_in;
                            planTime.primary_press_exit = planTimeList[i].primary_press_exit;
                            planTime.secondary_press_1_start = planTimeList[i].secondary_press_1_start;
                            planTime.temp_check_1 = planTimeList[i].temp_check_1;
                            planTime.secondary_press_2_start = planTimeList[i].secondary_press_2_start;
                            planTime.temp_check_2 = planTimeList[i].temp_check_2;
                            planTime.cooling = planTimeList[i].cooling;
                            planTime.secondary_press_exit = planTimeList[i].secondary_press_exit;
                            planTime.block = currentBlock - blockUse;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }
                    } else {
                        if (prevBlock === 3) {
                            planTime.currentBlock = prevBlock + blockPerRound
                            currentBlock = prevBlock + blockPerRound;
                            planTime.recipe_id = recipes[0].recipe_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex].machine_name;
                            planTime.batch_no = i;
                            planTime.program_no = null;
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
                            planTime.block = currentBlock - blockPerRound;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });

                            if (prevBlock === 9) {
                                planTime.currentBlock = prevBlock;
                                currentBlock = prevBlock;
                                planTime.recipe_id = recipes[0].recipe_id;
                                planTime.run_no = i + 1;
                                planTime.machine = machines[machineIndex].machine_name;
                                planTime.batch_no = i - 1;
                                planTime.program_no = null
                                planTime.start_time = null
                                planTime.mixing = null;
                                planTime.extruder_exit = null;
                                planTime.pre_press_exit = planTimeList[i + 1].pre_press_exit;
                                planTime.primary_press_start = planTimeList[i + 1].primary_press_start;
                                planTime.stream_in = planTimeList[i + 1].stream_in;
                                planTime.primary_press_exit = planTimeList[i + 1].primary_press_exit;
                                planTime.secondary_press_1_start = planTimeList[i + 1].secondary_press_1_start;
                                planTime.temp_check_1 = planTimeList[i + 1].temp_check_1;
                                planTime.secondary_press_2_start = planTimeList[i + 1].secondary_press_2_start;
                                planTime.temp_check_2 = planTimeList[i + 1].temp_check_2;
                                planTime.cooling = planTimeList[i + 1].cooling;
                                planTime.secondary_press_exit = planTimeList[i + 1].secondary_press_exit;
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

export const newAddPlantime = async (req, res) => {
    const { product_name } = req.params;
    const { startTime, rOund, bUse } = req.body;

    try {
        // ดึงข้อมูล Product จาก product_master
        const [products] = await db.query(
            `SELECT * FROM product_master WHERE product_name = ?`, [product_name]
        )
        if (products.length === 0) {
            return res.status(404).json({ message: '❌ Product not found' });
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
        let startTimes = startTime;
        let round = rOund;
        let blockPerRound = 9;
        let blockUse = bUse;
        let currentBlock = 0;
        let prevBlock = 0;
        let planTimeList = [];

        if (bUse === 4) {
            for (let i = 0; i < round; i++) {
                const machineIndex = i % machines.length;
                const planTime = {};

                if (prevBlock !== 0 && prevBlock <= blockUse) {
                    planTime.currentBlock = prevBlock + currentBlock
                    currentBlock = prevBlock + currentBlock;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[machineIndex].machine_name + 1;
                    planTime.batch_no = i + 1;
                    planTime.program_no = null;
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
                    planTime.block = currentBlock - blockPerRound;
                    planTime.nextBlock = currentBlock - planTime.block;
                    prevBlock = currentBlock - planTime.block;

                    planTimeList.push({ ...planTime });

                    if (prevBlock === 9) {
                        planTime.currentBlock = prevBlock;
                        currentBlock = prevBlock;
                        planTime.run_no = i + 1;
                        planTime.machine = machines[machineIndex].machine_name + 1;
                        planTime.batch_no = i;
                        planTime.program_no = null
                        planTime.start_time = null
                        planTime.mixing = null;
                        planTime.extruder_exit = null;
                        planTime.pre_press_exit = planTimeList[i].pre_press_exit;
                        planTime.primary_press_start = planTimeList[i].primary_press_start;
                        planTime.stream_in = planTimeList[i].stream_in;
                        planTime.primary_press_exit = planTimeList[i].primary_press_exit;
                        planTime.secondary_press_1_start = planTimeList[i].secondary_press_1_start;
                        planTime.temp_check_1 = planTimeList[i].temp_check_1;
                        planTime.secondary_press_2_start = planTimeList[i].secondary_press_2_start;
                        planTime.temp_check_2 = planTimeList[i].temp_check_2;
                        planTime.cooling = planTimeList[i].cooling;
                        planTime.secondary_press_exit = planTimeList[i].secondary_press_exit;
                        planTime.block = currentBlock - blockUse;
                        planTime.nextBlock = currentBlock - planTime.block;
                        prevBlock = currentBlock - planTime.block;

                        planTimeList.push({ ...planTime });
                    }
                } else {
                    planTime.currentBlock = blockPerRound;
                    currentBlock = blockPerRound;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[i].machine_name;
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
        } else if (bUse === 6) { // แก้ machine
            for (let i = 0; i < round; i++) {
                const machineIndex = i % machines.length;
                const planTime = {};

                if (prevBlock !== 0 && prevBlock <= blockUse) {
                    if (blockUse % prevBlock === 0) {
                        if (prevBlock === 3 && i % 2 !== 0) {
                            planTime.currentBlock = prevBlock + currentBlock
                            currentBlock = prevBlock + currentBlock;
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = i + 1;
                            planTime.machine = machines[machineIndex + 1].machine_name;
                            planTime.batch_no = i + 1;
                            planTime.program_no = null;
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
                            planTime.block = currentBlock - blockPerRound;
                            planTime.nextBlock = currentBlock - planTime.block;
                            prevBlock = currentBlock - planTime.block;
    
                            planTimeList.push({ ...planTime });
    
                            if (prevBlock === 9) {
                                planTime.currentBlock = prevBlock;
                                currentBlock = prevBlock;
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = i + 1;
                                planTime.machine = machines[machineIndex + 1].machine_name;
                                planTime.batch_no = i;
                                planTime.program_no = null
                                planTime.start_time = null
                                planTime.mixing = null;
                                planTime.extruder_exit = null;
                                planTime.pre_press_exit = planTimeList[i].pre_press_exit;
                                planTime.primary_press_start = planTimeList[i].primary_press_start;
                                planTime.stream_in = planTimeList[i].stream_in;
                                planTime.primary_press_exit = planTimeList[i].primary_press_exit;
                                planTime.secondary_press_1_start = planTimeList[i].secondary_press_1_start;
                                planTime.temp_check_1 = planTimeList[i].temp_check_1;
                                planTime.secondary_press_2_start = planTimeList[i].secondary_press_2_start;
                                planTime.temp_check_2 = planTimeList[i].temp_check_2;
                                planTime.cooling = planTimeList[i].cooling;
                                planTime.secondary_press_exit = planTimeList[i].secondary_press_exit;
                                planTime.block = currentBlock - blockUse;
                                planTime.nextBlock = currentBlock - planTime.block;
                                prevBlock = currentBlock - planTime.block;
    
                                planTimeList.push({ ...planTime });
                            }
                        } else {
                            if (prevBlock === 3) {
                                planTime.currentBlock = prevBlock + blockPerRound
                                currentBlock = prevBlock + blockPerRound;
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = i + 1;
                                planTime.machine = machines[machineIndex].machine_name;
                                planTime.batch_no = i;
                                planTime.program_no = null;
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
                                planTime.block = currentBlock - blockPerRound;
                                planTime.nextBlock = currentBlock - planTime.block;
                                prevBlock = currentBlock - planTime.block;
    
                                planTimeList.push({ ...planTime });
    
                                if (prevBlock === 9) {
                                    planTime.currentBlock = prevBlock;
                                    currentBlock = prevBlock;
                                    planTime.product_id = products[0].product_id;
                                    planTime.run_no = i + 1;
                                    planTime.machine = machines[machineIndex].machine_name;
                                    planTime.batch_no = i - 1;
                                    planTime.program_no = null
                                    planTime.start_time = null
                                    planTime.mixing = null;
                                    planTime.extruder_exit = null;
                                    planTime.pre_press_exit = planTimeList[i + 1].pre_press_exit;
                                    planTime.primary_press_start = planTimeList[i + 1].primary_press_start;
                                    planTime.stream_in = planTimeList[i + 1].stream_in;
                                    planTime.primary_press_exit = planTimeList[i + 1].primary_press_exit;
                                    planTime.secondary_press_1_start = planTimeList[i + 1].secondary_press_1_start;
                                    planTime.temp_check_1 = planTimeList[i + 1].temp_check_1;
                                    planTime.secondary_press_2_start = planTimeList[i + 1].secondary_press_2_start;
                                    planTime.temp_check_2 = planTimeList[i + 1].temp_check_2;
                                    planTime.cooling = planTimeList[i + 1].cooling;
                                    planTime.secondary_press_exit = planTimeList[i + 1].secondary_press_exit;
                                    planTime.block = currentBlock - blockUse;
                                    planTime.nextBlock = currentBlock - planTime.block;
                                    prevBlock = currentBlock - planTime.block;
    
                                    planTimeList.push({ ...planTime });
                                }
                            } else {
                                planTime.currentBlock = prevBlock
                                currentBlock = prevBlock
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = i + 1;
                                planTime.machine = machines[machineIndex - 1].machine_name;
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
                        planTime.product_id = products[0].product_id;
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
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = i + 1;
                        planTime.machine = machines[i].machine_name;
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
        } else if (bUse === 3) {
            for (let i = 0; i < round; i++) {
                const machineIndex = i % machines.length;
                const planTime = {};
    
                if (prevBlock !== 0 && prevBlock <= blockUse) {
                    planTime.currentBlock = prevBlock + currentBlock
                    currentBlock = prevBlock + currentBlock;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[machineIndex].machine_name + 1;
                    planTime.batch_no = i + 1;
                    planTime.program_no = null;
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
                    planTime.block = currentBlock - blockPerRound;
                    planTime.nextBlock = currentBlock - planTime.block;
                    prevBlock = currentBlock - planTime.block;
    
                    planTimeList.push({ ...planTime });
    
                    if (prevBlock === 9) {
                        planTime.currentBlock = prevBlock;
                        currentBlock = prevBlock;
                        planTime.run_no = i + 1;
                        planTime.machine = machines[machineIndex].machine_name + 1;
                        planTime.batch_no = i;
                        planTime.program_no = null
                        planTime.start_time = null
                        planTime.mixing = null;
                        planTime.extruder_exit = null;
                        planTime.pre_press_exit = planTimeList[i].pre_press_exit;
                        planTime.primary_press_start = planTimeList[i].primary_press_start;
                        planTime.stream_in = planTimeList[i].stream_in;
                        planTime.primary_press_exit = planTimeList[i].primary_press_exit;
                        planTime.secondary_press_1_start = planTimeList[i].secondary_press_1_start;
                        planTime.temp_check_1 = planTimeList[i].temp_check_1;
                        planTime.secondary_press_2_start = planTimeList[i].secondary_press_2_start;
                        planTime.temp_check_2 = planTimeList[i].temp_check_2;
                        planTime.cooling = planTimeList[i].cooling;
                        planTime.secondary_press_exit = planTimeList[i].secondary_press_exit;
                        planTime.block = currentBlock - blockUse;
                        planTime.nextBlock = currentBlock - planTime.block;
                        prevBlock = currentBlock - planTime.block;
    
                        planTimeList.push({ ...planTime });
                    }
                } else {
                    planTime.currentBlock = blockPerRound;
                    currentBlock = blockPerRound;
                    planTime.run_no = i + 1;
                    planTime.machine = machines[i].machine_name;
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

        return res.json({
            ProductName: product_name,
            planTimeList
        })

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in calculating Plan Time" });
    }
}
