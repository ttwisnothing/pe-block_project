import db from './../config/db.js';

// บันทึก PlanTime ลงในฐานข้อมูล
export const addPlanTime = async (req, res) => {
    const {
        recipe_id,
        run_no,
        machine,
        batch_no,
        program_no,
        start_time,
        mixing,
        extruder_exit,
        pre_press_exit,
        primary_press_start,
        stream_in,
        primary_press_exit,
        secondary_press_1_start,
        temp_check_1,
        secondary_press_2_start,
        temp_check_2,
        cooling,
        secondary_press_exit,
        block
    } = req.body;

    const query = `
        INSERT INTO plan_times_table (
            recipe_id,
            run_no,
            machine,
            batch_no,
            program_no,
            start_time,
            mixing,
            extruder_exit,
            pre_press_exit,
            primary_press_start,
            stream_in,
            primary_press_exit,
            secondary_press_1_start,
            temp_check_1,
            secondary_press_2_start,
            temp_check_2,
            cooling,
            secondary_press_exit,
            block
        ) VALUES (
            ${recipe_id},
            ${run_no},
            '${machine}',
            ${batch_no},
            ${program_no},
            '${start_time}',
            '${mixing}',
            '${extruder_exit}',
            '${pre_press_exit}',
            '${primary_press_start}',
            '${stream_in}',
            '${primary_press_exit}',
            '${secondary_press_1_start}',
            '${temp_check_1}',
            '${secondary_press_2_start}',
            '${temp_check_2}',
            '${cooling}',
            '${secondary_press_exit}',
            ${block} 
        )
    `;

    try {
        await db.query(query);
        res.status(201).send("PlanTime added successfully");
    } catch (error) {
        res.status(500).send("Error in adding PlanTime");
        console.log(error);
    }
};



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

// คำนวณเวลาของ PlanTime จาก Recipe ที่กำหนด
export const calPlantime = async (req, res) => {
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
                        currentBlock = prevBlock
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
                        prevBlock = currentBlock - planTime.block;

                        planTimeList.push({ ...planTime });

                        if (prevBlock === 0) {
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
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }
                    } else {
                        if (prevBlock === 3) {
                            currentBlock = prevBlock
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
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                            
                            if (prevBlock === 0) {
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
                                prevBlock = currentBlock - planTime.block;
    
                                planTimeList.push({ ...planTime });
                            }
                        } else {
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
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }
                        
                    }
                }
            } else { // i = 0
                if (prevBlock === 0 && currentBlock === 6) {
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
                    prevBlock = currentBlock - planTime.block;

                    planTimeList.push({ ...planTime });

                } else {
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
                    prevBlock = currentBlock - planTime.block;

                    planTimeList.push({ ...planTime });
                }
            }            
        }

        // เพิ่มข้อมูลลงในฐานข้อมูล
        for (const plan of planTimeList) {
            const query = `
                INSERT INTO plan_times_table (
                    recipe_id,
                    run_no,
                    machine,
                    
                )
            `
        }

        return res.json({
            recipeName: recipes[0].recipe_name,
            recipeId: recipes[0].recipe_id,
            planTimes: planTimeList
        })

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in calculating Plan Time" });
        console.log(error);
    }
}

// เพิ่มข้อมูลที่ได้จาก CalPlantime ลงในฐานข้อมูล



// // สร้าง PlanTime สำหรับ Recipe ที่กำหนด
// export const genPlantime = async (req, res) => {
//     const { recipe_name } = req.params;

//     try {
//         // ✅ ดึงข้อมูล Recipe จาก Recipe_Table
//         const [recipe] = await db.query(
//             `SELECT * FROM recipes_table WHERE recipe_name = ?`, [recipe_name]
//         )
//         if (recipe.length === 0) {
//             return res.status(404).json({ message: '❌ Recipe not found' });
//         }

//         // ✅ ดึงข้อมูล ConfigTime จาก Config_Time_Table
//         const [config] = await db.query(`SELECT * FROM config_time`);
//         if (config.length === 0) {
//             return res.status(404).json({ message: '❌ Config Times not found' });
//         }

//         // ✅ ดึงค่า Header ของ PlanTime จาก Plan_Time_Table
//         const [columns] = await db.query("DESCRIBE plan_times_table");
//         const headers = columns.map(col => col.Field); // ดึงชื่อคอลัมน์จากผลลัพธ์

//         // ✅ สร้าง Object สำหรับเก็บข้อมูล PlanTime
//         let planTimesO = {};

//         // ✅ คำนวณเวลาที่ต้องใช้ในแต่ละขั้นตอน
//         let round = 6
//         let blockPerRound = 9
//         let blockUse = 6
//         let currentBlock = 0;

//         for (let i = 0; i < round; i++) {
//             if (i === 0) {
//                 currentBlock = 9;
//                 headers.plant_id = i + 1
//                 headers.time_start = recipe[0].start_time
//                 headers.mixing = addMinutes(recipe[0].start_time, config[0].mixing_time)
//                 headers.extruder_exit = addMinutes(headers.mixing, config[0].extruder_exit_time)
//                 headers.pre_press_exit = addMinutes(headers.extruder_exit, config[0].pre_press_exit_time)
//                 headers.primary_press_start = addMinutes(headers.pre_press_exit, config[0].primary_press_start)
//                 headers.stream_in = addMinutes(headers.primary_press_start, config[0].stream_in)
//                 headers.primary_press_exit = addMinutes(headers.stream_in, config[0].primary_press_exit)
//                 headers.secondary_press_1_start = addMinutes(headers.primary_press_exit, config[0].secondary_press_1_start)
//                 headers.temp_check_1 = addMinutes(headers.secondary_press_1_start, config[0].temp_check_1)
//                 headers.secondary_press_2_start = addMinutes(headers.temp_check_1, config[0].secondary_press_2_start)
//                 headers.temp_check_2 = addMinutes(headers.secondary_press_2_start, config[0].temp_check_2)
//                 headers.cooling = addMinutes(headers.temp_check_2, config[0].cooling_time)
//                 headers.secondary_press_exit = addMinutes(headers.cooling, config[0].secondary_press_exit)
//                 headers.block = 6
//             } else {
//                 let latestRound = planTimesList[i - 1]
//                 headers.time_start = reduceMinutes(latestRound.primary_press_exit, config[0].adj_next_start)
//                 if (currentBlock === 6) {
//                     headers.time_start = " "
//                     headers.mixing = " "
//                     headers.extruder_exit = " "
//                     headers.pre_press_exit = addMinutes(latestRound.secondary_press_1_start, config[0].pre_press_exit_time)
//                     headers.primary_press_start = addMinutes(headers.pre_press_exit, config[0].primary_press_start)
//                     headers.stream_in = addMinutes(headers.primary_press_start, config[0].stream_in)
//                     headers.primary_press_exit = addMinutes(headers.stream_in, config[0].primary_press_exit)
//                     headers.secondary_press_1_start = addMinutes(headers.primary_press_exit, config[0].secondary_press_1_start)
//                     headers.temp_check_1 = addMinutes(headers.secondary_press_1_start, config[0].temp_check_1)
//                     headers.secondary_press_2_start = addMinutes(headers.temp_check_1, config[0].secondary_press_2_start)
//                     headers.temp_check_2 = addMinutes(headers.secondary_press_2_start, config[0].temp_check_2)
//                     headers.cooling = addMinutes(headers.temp_check_2, config[0].cooling_time)
//                     headers.secondary_press_exit = addMinutes(headers.cooling, config[0].secondary_press_exit)
//                 } else {
//                     currentBlock = currentBlock + blockPerRound;
//                     if (currentBlock % 2 === 0) {
//                         headers.mixing = addMinutes((reduceMinutes(latestRound.primary_press_exit, config[0].adj_next_start)), config[1].mixing_time)
//                         headers.extruder_exit = addMinutes(headers.mixing, (config[0].extruder_exit_time / 2))
//                         headers.pre_press_exit = addMinutes(headers.extruder_exit, config[0].pre_press_exit_time)
//                         headers.primary_press_start = addMinutes(headers.pre_press_exit, config[0].primary_press_start)
//                         headers.stream_in = addMinutes(headers.primary_press_start, config[0].stream_in)
//                         headers.primary_press_exit = addMinutes(headers.stream_in, config[0].primary_press_exit)
//                         headers.secondary_press_1_start = addMinutes(headers.primary_press_exit, config[0].secondary_press_1_start)
//                         headers.temp_check_1 = addMinutes(headers.secondary_press_1_start, config[0].temp_check_1)
//                         headers.secondary_press_2_start = addMinutes(headers.temp_check_1, config[0].secondary_press_2_start)
//                         headers.temp_check_2 = addMinutes(headers.secondary_press_2_start, config[0].temp_check_2)
//                         headers.cooling = addMinutes(headers.temp_check_2, config[0].cooling_time)
//                         headers.secondary_press_exit = addMinutes(headers.cooling, config[0].secondary_press_exit)
//                     } else {
//                         headers.mixing = addMinutes((reduceMinutes(latestRound.primary_press_exit, config[0].adj_next_start)), config[1].mixing_time)
//                         headers.extruder_exit = addMinutes(headers.mixing, config[0].extruder_exit_time)
//                         headers.pre_press_exit = addMinutes(headers.extruder_exit, config[0].pre_press_exit_time)
//                         headers.primary_press_start = addMinutes(headers.pre_press_exit, config[0].primary_press_start)
//                         headers.stream_in = addMinutes(headers.primary_press_start, config[0].stream_in)
//                         headers.primary_press_exit = addMinutes(headers.stream_in, config[0].primary_press_exit)
//                         headers.secondary_press_1_start = addMinutes(headers.primary_press_exit, config[0].secondary_press_1_start)
//                         headers.temp_check_1 = addMinutes(headers.secondary_press_1_start, config[0].temp_check_1)
//                         headers.secondary_press_2_start = addMinutes(headers.temp_check_1, config[0].secondary_press_2_start)
//                         headers.temp_check_2 = addMinutes(headers.secondary_press_2_start, config[0].temp_check_2)
//                         headers.cooling = addMinutes(headers.temp_check_2, config[0].cooling_time)
//                         headers.secondary_press_exit = addMinutes(headers.cooling, config[0].secondary_press_exit)
//                     }
//                 }
//             }
//             planTimesO[i] = headers;
//             currentBlock -= blockUse;
//         }

//         return res.json({
//             recipeName: recipe[0].recipe_name,
//             recipeId: recipe[0].recipe_id,
//             planTimes: planTimesO
//         })
//     } catch (error) {
//         console.error('❌ ERROR:', error);
//         res.status(500).json({ message: "❌ Error in generating Plan Time" });
//         console.log(error);
//     }
// };

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

// // เพิ่ม PlanTime ลงไปที่ TempPlanTime ในฐานข้อมูล
// export const addTempPlanTime = async (req, res) => {
//     const {
//         recipe_id,
//         start_time,
//         mixing,
//         extruder_exit,
//         pre_press_exit,
//         primary_press_start,
//         stream_in,
//         primary_press_exit,
//         secondary_press_1_start,
//         temp_check_1,
//         secondary_press_2_start,
//         temp_check_2,
//         cooling,
//         secondary_press_exit,
//         block
//     } = req.body;

//     const query =
//         `
//             INSERT INTO temp_plan_times_table (
//                 recipe_id,
//                 start_time,
//                 mixing,
//                 extruder_exit,
//                 pre_press_exit,
//                 primary_press_start,
//                 stream_in,
//                 primary_press_exit,
//                 secondary_press_1_start,
//                 temp_check_1,
//                 secondary_press_2_start,
//                 temp_check_2,
//                 cooling,
//                 secondary_press_exit,
//                 block
//             ) VALUES (
//                 ${recipe_id},
//                 '${start_time}',
//                 '${mixing}',
//                 '${extruder_exit}',
//                 '${pre_press_exit}',
//                 '${primary_press_start}',
//                 '${stream_in}',
//                 '${primary_press_exit}',
//                 '${secondary_press_1_start}',
//                 '${temp_check_1}',
//                 '${secondary_press_2_start}',
//                 '${temp_check_2}',
//                 '${cooling}',
//                 '${secondary_press_exit}',
//                 '${block}' 
//             )
//         `
//     try {
//         await db.query(query);
//         res.status(201).send("Temp Plan Time added successfully");
//     } catch (error) {
//         res.status(500).send("Error in adding Temp Plan Time");
//         console.log(error);
//     }
// }

// // อัพเดท PlanTime ไปบันทึกที่ TempPlanTime ในฐานข้อมูล
// export const updatePlanTime = async (req, res) => {
//     const { start_time } = req.body;

//     try {
//         // ✅ ดึงข้อมูล ConfigTime จาก Config_Time_Table
//         const [config] = await db.query(
//             `SELECT * FROM config_time`
//         )
//         if (config.length === 0) {
//             return res.status(404).json({ message: '❌ Config Times not found' });
//         }

//         // ดึงข้อมูล TempPlanTime จาก TempPlanTime_Table
//         const [tempPlanTime] = await db.query(
//             `SELECT * FROM temp_plan_times_table`
//         )
//         if (tempPlanTime.length === 0) {
//             return res.status(404).json({ message: '❌ Temp Plan Times not found' });
//         }

//         // คำนวณเวลาใหม่และเพิ่มลง TempPlanTime_Table
//         let newStart = start_time
//         let round = 6
//         let blockPerRound = 9
//         let blockUse = 6
//         let currentBlock = 0;

//         for (let i = 0; i < round; i++) {
//             const updatePlantimes = {}

//             if (i === 0) {
//                 currentBlock = 9;
//                 updatePlantimes.start_time = newStart;
//                 updatePlantimes.mixing = addMinutes(newStart, config[0].mixing_time);
//                 updatePlantimes.extruder_exit = addMinutes(updatePlantimes.mixing, config[0].extruder_exit_time);
//                 updatePlantimes.pre_press_exit = addMinutes(updatePlantimes.extruder_exit, config[0].pre_press_exit_time);
//                 updatePlantimes.primary_press_start = addMinutes(updatePlantimes.pre_press_exit, config[0].primary_press_start);
//                 updatePlantimes.stream_in = addMinutes(updatePlantimes.primary_press_start, config[0].stream_in);
//                 updatePlantimes.primary_press_exit = addMinutes(updatePlantimes.stream_in, config[0].primary_press_exit);
//                 updatePlantimes.secondary_press_1_start = addMinutes(updatePlantimes.primary_press_exit, config[0].secondary_press_1_start);
//                 updatePlantimes.temp_check_1 = addMinutes(updatePlantimes.secondary_press_1_start, config[0].temp_check_1);
//                 updatePlantimes.secondary_press_2_start = addMinutes(updatePlantimes.temp_check_1, config[0].secondary_press_2_start);
//                 updatePlantimes.temp_check_2 = addMinutes(updatePlantimes.secondary_press_2_start, config[0].temp_check_2);
//                 updatePlantimes.cooling = addMinutes(updatePlantimes.temp_check_2, config[0].cooling_time);
//                 updatePlantimes.secondary_press_exit = addMinutes(updatePlantimes.cooling, config[0].secondary_press_exit);
//                 updatePlantimes.block = blockUse;
//             } else {
//                 let latestRound = tempPlanTime[i - 1];
//                 updatePlantimes.start_time = reduceMinutes(latestRound.primary_press_exit, config[0].adj_next_start);

//                 if (currentBlock === 6) {
//                     updatePlantimes.start_time = " ";
//                     updatePlantimes.mixing = " ";
//                     updatePlantimes.extruder_exit = " ";
//                     updatePlantimes.pre_press_exit = addMinutes(latestRound.secondary_press_1_start, config[0].pre_press_exit_time);
//                 } else {
//                     currentBlock += blockPerRound;
//                     if (currentBlock % 2 === 0) {
//                         updatePlantimes.mixing = addMinutes(updatePlantimes.start_time, config[1].mixing_time);
//                         updatePlantimes.extruder_exit = addMinutes(updatePlantimes.mixing, config[0].extruder_exit_time / 2);
//                     } else {
//                         updatePlantimes.mixing = addMinutes(updatePlantimes.start_time, config[1].mixing_time);
//                         updatePlantimes.extruder_exit = addMinutes(updatePlantimes.mixing, config[0].extruder_exit_time);
//                     }
//                     updatePlantimes.pre_press_exit = addMinutes(updatePlantimes.extruder_exit, config[0].pre_press_exit_time);
//                 }
//                 updatePlantimes.primary_press_start = addMinutes(updatePlantimes.pre_press_exit, config[0].primary_press_start);
//                 updatePlantimes.stream_in = addMinutes(updatePlantimes.primary_press_start, config[0].stream_in);
//                 updatePlantimes.primary_press_exit = addMinutes(updatePlantimes.stream_in, config[0].primary_press_exit);
//                 updatePlantimes.secondary_press_1_start = addMinutes(updatePlantimes.primary_press_exit, config[0].secondary_press_1_start);
//                 updatePlantimes.temp_check_1 = addMinutes(updatePlantimes.secondary_press_1_start, config[0].temp_check_1);
//                 updatePlantimes.secondary_press_2_start = addMinutes(updatePlantimes.temp_check_1, config[0].secondary_press_2_start);
//                 updatePlantimes.temp_check_2 = addMinutes(updatePlantimes.secondary_press_2_start, config[0].temp_check_2);
//                 updatePlantimes.cooling = addMinutes(updatePlantimes.temp_check_2, config[0].cooling_time);
//                 updatePlantimes.secondary_press_exit = addMinutes(updatePlantimes.cooling, config[0].secondary_press_exit);
//                 updatePlantimes.block = blockUse;
//             }

//             currentBlock -= blockUse;

//             // Log the value of updatePlantimes for each round
//             console.log(`Round ${i + 1} updatePlantimes:`, updatePlantimes);

//             promises.push(db.query(`
//                 UPDATE temp_plan_times_table SET
//                     start_time = '${updatePlantimes.start_time}',
//                     mixing = '${updatePlantimes.mixing}',
//                     extruder_exit = '${updatePlantimes.extruder_exit}',
//                     pre_press_exit = '${updatePlantimes.pre_press_exit}',
//                     primary_press_start = '${updatePlantimes.primary_press_start}',
//                     stream_in = '${updatePlantimes.stream_in}',
//                     primary_press_exit = '${updatePlantimes.primary_press_exit}',
//                     secondary_press_1_start = '${updatePlantimes.secondary_press_1_start}',
//                     temp_check_1 = '${updatePlantimes.temp_check_1}',
//                     secondary_press_2_start = '${updatePlantimes.secondary_press_2_start}',
//                     temp_check_2 = '${updatePlantimes.temp_check_2}',
//                     cooling = '${updatePlantimes.cooling}',
//                     secondary_press_exit = '${updatePlantimes.secondary_press_exit}',
//                     block = '${updatePlantimes.block}'
//                 WHERE temp_id = ${i + 1}
//             `));      
//         }

//         // ใช้ Promise.all เพื่อให้การอัพเดตทั้งหมดเกิดขึ้นพร้อมกัน
//         await Promise.all(promises);
//         return res.json({ message: '✅ Temp Plan Time updated successfully' });

//     } catch (error) {
//         console.error('❌ ERROR:', error)
//         res.status(500).json({ message: "❌ Error in update Plan Time" });
//         console.log(error);
//     }
// }

// // ดึงค่า TempPlanTime ทั้งหมดจากฐานข้อมูล
// export const getTempPlanTime = async (req, res) => {
//     const { recipe_name } = req.params;

//     try {
//         // ✅ JOIN Recipe_Table กับ Plan_Time_Table
//         const [tempPlanTimes] = await db.query(`
//             SELECT temp_pt.*
//             FROM temp_plan_times_table temp_pt
//             INNER JOIN recipes_table rt ON temp_pt.recipe_id = rt.recipe_id
//             WHERE rt.recipe_name = ?
//         `, [recipe_name]);

//         if (tempPlanTimes.length === 0) {
//             return res.status(404).json({ message: '❌ No Plan Times found for this recipe' });
//         }

//         return res.json({
//             recipe_name,
//             recipeId: tempPlanTimes[0].recipe_id,
//             tempPlanTimes
//         });
//     } catch (error) {
//         console.error('❌ ERROR:', error);
//         res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
//     }
// };