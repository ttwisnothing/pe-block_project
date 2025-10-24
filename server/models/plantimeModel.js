import { getPool } from "../config/db.js";
import sql from "mssql";

export const addPlantime = async (req, res) => {
    let { product_name } = req.params;
    const { fristStart, blockTotal, mcNames, programName, blockRound, blockUsed, startDate } = req.body;

    // แยกชื่อสินค้าและสีออกจาก product_name
    let color_name = '';
    const match = product_name.match(/^(.+)\((.+)\)$/);
    if (match) {
        product_name = match[1];
        color_name = match[2];
    }

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('product_name', sql.VarChar, product_name);
        request.input('color_name', sql.VarChar, color_name);

        // ดึงข้อมูล Product จาก product_master
        const productsResult = await request.query(`
            SELECT *
            FROM PT_product_mst
            WHERE product_name = @product_name AND color_name = @color_name
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

        // กำหนดค่า mac จาก machine_name
        let mac = Array.isArray(mcNames) ? mcNames : [];// รองรับทั้ง array และ string

        if (mac.length === 0) {
            return res.status(400).json({ message: '❌ Machine names are required' });
        }

        // คำนวณเวลาที่ต้องใช้ในแต่ละขั้นตอน
        let startTimes = fristStart;
        let blockPerRound = blockRound;
        let blockUse = blockUsed;
        let runRound = Math.ceil(blockTotal / blockUse);
        let currentBlock = 0;
        let prevBlock = 0;
        let planTimeList = [];

        if (cGroup === 'B-150') { // แก้แล้ว
            for (let i = 0; i < runRound; i++) {
                const machineIndex = i % mac.length;
                const planTime = {};

                if (planTimeList.length !== 0) {
                    if (planTimeList.length === 2) {
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        planTime.program_no = null;
                        planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].extruder_exit_time);
                        planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                        planTimeList.push({ ...planTime });

                        if (true) {
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                            planTime.program_no = null;
                            planTime.start_time = addMinutes(planTimeList[planTimeList.length - 1].mixing, config[1].stream_in);
                            planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                            planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                            planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                            planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                            planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                            planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                            planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                            planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                            planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                            planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                            planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                            planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                            planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                            planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                            planTime.block = blockPerRound;

                            planTimeList.push({ ...planTime });

                            // อัปเดต pre_press_exit ของแถวแรก
                            if (true) {
                                planTimeList[planTimeList.length - 2].pre_press_exit = planTime.pre_press_exit;
                                planTimeList[planTimeList.length - 2].primary_press_start = planTime.primary_press_start;
                                planTimeList[planTimeList.length - 2].stream_in = planTime.stream_in;
                                planTimeList[planTimeList.length - 2].primary_press_exit = planTime.primary_press_exit;
                                planTimeList[planTimeList.length - 2].secondary_press_1_start = planTime.secondary_press_1_start;
                                planTimeList[planTimeList.length - 2].temp_check_1 = planTime.temp_check_1;
                                planTimeList[planTimeList.length - 2].secondary_press_2_start = planTime.secondary_press_2_start;
                                planTimeList[planTimeList.length - 2].temp_check_2 = planTime.temp_check_2;
                                planTimeList[planTimeList.length - 2].cooling = planTime.cooling;
                                planTimeList[planTimeList.length - 2].secondary_press_exit = planTime.secondary_press_exit;
                                planTimeList[planTimeList.length - 2].remove_work = planTime.remove_work;
                                planTimeList[planTimeList.length - 2].block = planTime.block;
                            }
                        }
                    } else {
                        // if (i >= 5) {
                        //     planTime.product_id = products[0].product_id;
                        //     planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        //     planTime.machine = mac[machineIndex];
                        //     planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        //     planTime.program_no = null;
                        //     planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
                        //     planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        //     planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        //     planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                        //     planTimeList.push({ ...planTime });

                        //     if (true) {
                        //         planTime.product_id = products[0].product_id;
                        //         planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                        //         planTime.machine = mac[machineIndex];
                        //         planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        //         planTime.program_no = null;
                        //         planTime.start_time = planTimeList[planTimeList.length - 1].mixing;
                        //         planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        //         planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        //         planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                        //         planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                        //         planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                        //         planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                        //         planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                        //         planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                        //         planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                        //         planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                        //         planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                        //         planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                        //         planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                        //         planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                        //         planTime.block = blockPerRound;

                        //         planTimeList.push({ ...planTime });

                        //         // อัปเดต pre_press_exit ของแถวแรก
                        //         if (planTimeList.length > 1) {
                        //             planTimeList[planTimeList.length - 2].pre_press_exit = planTime.pre_press_exit;
                        //             planTimeList[planTimeList.length - 2].primary_press_start = planTime.primary_press_start;
                        //             planTimeList[planTimeList.length - 2].stream_in = planTime.stream_in;
                        //             planTimeList[planTimeList.length - 2].primary_press_exit = planTime.primary_press_exit;
                        //             planTimeList[planTimeList.length - 2].secondary_press_1_start = planTime.secondary_press_1_start;
                        //             planTimeList[planTimeList.length - 2].temp_check_1 = planTime.temp_check_1;
                        //             planTimeList[planTimeList.length - 2].secondary_press_2_start = planTime.secondary_press_2_start;
                        //             planTimeList[planTimeList.length - 2].temp_check_2 = planTime.temp_check_2;
                        //             planTimeList[planTimeList.length - 2].cooling = planTime.cooling;
                        //             planTimeList[planTimeList.length - 2].secondary_press_exit = planTime.secondary_press_exit;
                        //             planTimeList[planTimeList.length - 2].remove_work = planTime.remove_work;
                        //             planTimeList[planTimeList.length - 2].block = planTime.block;
                        //         }
                        //     }
                        // } else {
                        //     planTime.product_id = products[0].product_id;
                        //     planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        //     planTime.machine = mac[machineIndex];
                        //     planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        //     planTime.program_no = null;
                        //     planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].extruder_exit_time);
                        //     planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        //     planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        //     planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                        //     planTimeList.push({ ...planTime });

                        //     if (true) {
                        //         planTime.product_id = products[0].product_id;
                        //         planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                        //         planTime.machine = mac[machineIndex];
                        //         planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        //         planTime.program_no = null;
                        //         planTime.start_time = planTimeList[planTimeList.length - 1].mixing;
                        //         planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        //         planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        //         planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                        //         planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                        //         planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                        //         planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                        //         planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                        //         planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                        //         planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                        //         planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                        //         planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                        //         planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                        //         planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                        //         planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                        //         planTime.block = blockPerRound;

                        //         planTimeList.push({ ...planTime });

                        //         // อัปเดต pre_press_exit ของแถวแรก
                        //         if (planTimeList.length > 1) {
                        //             planTimeList[planTimeList.length - 2].pre_press_exit = planTime.pre_press_exit;
                        //             planTimeList[planTimeList.length - 2].primary_press_start = planTime.primary_press_start;
                        //             planTimeList[planTimeList.length - 2].stream_in = planTime.stream_in;
                        //             planTimeList[planTimeList.length - 2].primary_press_exit = planTime.primary_press_exit;
                        //             planTimeList[planTimeList.length - 2].secondary_press_1_start = planTime.secondary_press_1_start;
                        //             planTimeList[planTimeList.length - 2].temp_check_1 = planTime.temp_check_1;
                        //             planTimeList[planTimeList.length - 2].secondary_press_2_start = planTime.secondary_press_2_start;
                        //             planTimeList[planTimeList.length - 2].temp_check_2 = planTime.temp_check_2;
                        //             planTimeList[planTimeList.length - 2].cooling = planTime.cooling;
                        //             planTimeList[planTimeList.length - 2].secondary_press_exit = planTime.secondary_press_exit;
                        //             planTimeList[planTimeList.length - 2].remove_work = planTime.remove_work;
                        //             planTimeList[planTimeList.length - 2].block = planTime.block;
                        //         }
                        //     }
                        // }
                        if ((i - 5) % 5 === 0) {
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                            planTime.program_no = null;
                            planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
                            planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                            planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                            planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                            planTimeList.push({ ...planTime });

                            if (true) {
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                                planTime.machine = mac[machineIndex];
                                planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                                planTime.program_no = null;
                                planTime.start_time = planTimeList[planTimeList.length - 1].mixing;
                                planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                                planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                                planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                                planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                                planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                                planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                                planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                                planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                                planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                                planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                                planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                                planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                                planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                                planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                                planTime.block = blockPerRound;

                                planTimeList.push({ ...planTime });

                                // อัปเดต pre_press_exit ของแถวแรก
                                if (planTimeList.length > 1) {
                                    planTimeList[planTimeList.length - 2].pre_press_exit = planTime.pre_press_exit;
                                    planTimeList[planTimeList.length - 2].primary_press_start = planTime.primary_press_start;
                                    planTimeList[planTimeList.length - 2].stream_in = planTime.stream_in;
                                    planTimeList[planTimeList.length - 2].primary_press_exit = planTime.primary_press_exit;
                                    planTimeList[planTimeList.length - 2].secondary_press_1_start = planTime.secondary_press_1_start;
                                    planTimeList[planTimeList.length - 2].temp_check_1 = planTime.temp_check_1;
                                    planTimeList[planTimeList.length - 2].secondary_press_2_start = planTime.secondary_press_2_start;
                                    planTimeList[planTimeList.length - 2].temp_check_2 = planTime.temp_check_2;
                                    planTimeList[planTimeList.length - 2].cooling = planTime.cooling;
                                    planTimeList[planTimeList.length - 2].secondary_press_exit = planTime.secondary_press_exit;
                                    planTimeList[planTimeList.length - 2].remove_work = planTime.remove_work;
                                    planTimeList[planTimeList.length - 2].block = planTime.block;
                                }
                            }
                        } else {
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                            planTime.program_no = null;
                            planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].extruder_exit_time);
                            planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                            planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                            planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                            planTimeList.push({ ...planTime });

                            if (true) {
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                                planTime.machine = mac[machineIndex];
                                planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                                planTime.program_no = null;
                                planTime.start_time = planTimeList[planTimeList.length - 1].mixing;
                                planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                                planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                                planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                                planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                                planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                                planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                                planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                                planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                                planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                                planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                                planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                                planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                                planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                                planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                                planTime.block = blockPerRound;

                                planTimeList.push({ ...planTime });

                                // อัปเดต pre_press_exit ของแถวแรก
                                if (planTimeList.length > 1) {
                                    planTimeList[planTimeList.length - 2].pre_press_exit = planTime.pre_press_exit;
                                    planTimeList[planTimeList.length - 2].primary_press_start = planTime.primary_press_start;
                                    planTimeList[planTimeList.length - 2].stream_in = planTime.stream_in;
                                    planTimeList[planTimeList.length - 2].primary_press_exit = planTime.primary_press_exit;
                                    planTimeList[planTimeList.length - 2].secondary_press_1_start = planTime.secondary_press_1_start;
                                    planTimeList[planTimeList.length - 2].temp_check_1 = planTime.temp_check_1;
                                    planTimeList[planTimeList.length - 2].secondary_press_2_start = planTime.secondary_press_2_start;
                                    planTimeList[planTimeList.length - 2].temp_check_2 = planTime.temp_check_2;
                                    planTimeList[planTimeList.length - 2].cooling = planTime.cooling;
                                    planTimeList[planTimeList.length - 2].secondary_press_exit = planTime.secondary_press_exit;
                                    planTimeList[planTimeList.length - 2].remove_work = planTime.remove_work;
                                    planTimeList[planTimeList.length - 2].block = planTime.block;
                                }
                            }
                        }
                    }
                } else {
                    planTime.product_id = products[0].product_id;
                    planTime.run_no = planTimeList.length + 1;
                    planTime.machine = mac[machineIndex];
                    planTime.batch_no = planTimeList.length + 1;
                    planTime.program_no = null;
                    planTime.start_time = startTimes;
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                    planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);

                    planTimeList.push({ ...planTime });

                    if (true) {
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        planTime.program_no = null;
                        planTime.start_time = addMinutes(planTimeList[planTimeList.length - 1].mixing, config[1].solid_block);
                        planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                        planTime.solid_block = addMinutes(planTime.mixing, config[0].solid_block);
                        planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                        planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[1].pre_press_exit_time);
                        planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
                        planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
                        planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
                        planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
                        planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
                        planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
                        planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
                        planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
                        planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
                        planTime.remove_work = addMinutes(planTime.secondary_press_exit, config[0].remove_workpiece);
                        planTime.block = blockPerRound;

                        planTimeList.push({ ...planTime });

                        // อัปเดต pre_press_exit ของแถวแรก
                        if (planTimeList.length > 1) {
                            planTimeList[i].pre_press_exit = planTime.pre_press_exit;
                            planTimeList[i].primary_press_start = planTime.primary_press_start;
                            planTimeList[i].stream_in = planTime.stream_in;
                            planTimeList[i].primary_press_exit = planTime.primary_press_exit;
                            planTimeList[i].secondary_press_1_start = planTime.secondary_press_1_start;
                            planTimeList[i].temp_check_1 = planTime.temp_check_1;
                            planTimeList[i].secondary_press_2_start = planTime.secondary_press_2_start;
                            planTimeList[i].temp_check_2 = planTime.temp_check_2;
                            planTimeList[i].cooling = planTime.cooling;
                            planTimeList[i].secondary_press_exit = planTime.secondary_press_exit;
                            planTimeList[i].remove_work = planTime.remove_work;
                            planTimeList[i].block = planTime.block;
                        }
                    }
                }
            }
        } else if (cGroup === 'RP-300S') { // แก้แล้ว
            for (let i = 0; i < runRound; i++) {
                const machineIndex = i % mac.length;
                const planTime = {};

                if (prevBlock !== 0 && prevBlock <= blockUse) {
                    if (prevBlock === 3) {
                        currentBlock = prevBlock + currentBlock;
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        planTime.program_no = null;
                        planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
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
                        prevBlock = currentBlock - planTime.block;

                        planTimeList.push({ ...planTime });

                        if (prevBlock === 9) {
                            currentBlock = prevBlock;
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                            planTime.machine = planTimeList[planTimeList.length - 1].machine;
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no - 1;
                            planTime.program_no = null
                            planTime.start_time = null
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = planTimeList[planTimeList.length - 1].pre_press_exit;
                            planTime.primary_press_start = planTimeList[planTimeList.length - 1].primary_press_start;
                            planTime.stream_in = planTimeList[planTimeList.length - 1].stream_in;
                            planTime.primary_press_exit = planTimeList[planTimeList.length - 1].primary_press_exit;
                            planTime.secondary_press_1_start = planTimeList[planTimeList.length - 1].secondary_press_1_start;
                            planTime.temp_check_1 = planTimeList[planTimeList.length - 1].temp_check_1;
                            planTime.secondary_press_2_start = planTimeList[planTimeList.length - 1].secondary_press_2_start;
                            planTime.temp_check_2 = planTimeList[planTimeList.length - 1].temp_check_2;
                            planTime.cooling = planTimeList[planTimeList.length - 1].cooling;
                            planTime.secondary_press_exit = planTimeList[planTimeList.length - 1].secondary_press_exit;
                            planTime.block = currentBlock - blockUse;
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });
                        }
                    }
                    else {
                        currentBlock = prevBlock
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 2].batch_no;
                        planTime.program_no = null
                        planTime.start_time = null;
                        planTime.mixing = null;
                        planTime.extruder_exit = null;
                        planTime.pre_press_exit = addMinutes(planTimeList[planTimeList.length - 1].secondary_press_1_start, config[0].pre_press_exit_time);
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
                } else { // i = 0
                    if (i === 0) {
                        currentBlock = blockPerRound;
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList.length + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList.length + 1;
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
                    } else {
                        currentBlock = blockPerRound;
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        planTime.program_no = null
                        planTime.start_time = addMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].adj_next_start);
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
                    }
                }
            }
        } else if (cGroup === 'B-4') { // แก้แล้ว
            for (let i = 0; i < runRound; i++) {
                const machineIndex = i % mac.length;
                const planTime = {};

                if (prevBlock !== 0 && prevBlock <= blockUse) {
                    if (i <= 9) {
                        if (prevBlock === 3) {
                            currentBlock = prevBlock + currentBlock;
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                            planTime.program_no = null;
                            planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].adj_next_start);
                            planTime.mixing = addMinutes(planTime.start_time, config[1].mixing_time);
                            planTime.extruder_exit = addMinutes(planTime.mixing, (config[1].extruder_exit_time / 2));
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
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });

                            if (prevBlock === 9) {
                                currentBlock = prevBlock;
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                                planTime.machine = planTimeList[planTimeList.length - 1].machine;
                                planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no - 1;
                                planTime.program_no = null
                                planTime.start_time = null
                                planTime.mixing = null;
                                planTime.extruder_exit = null;
                                planTime.pre_press_exit = planTimeList[planTimeList.length - 1].pre_press_exit;
                                planTime.primary_press_start = planTimeList[planTimeList.length - 1].primary_press_start;
                                planTime.stream_in = planTimeList[planTimeList.length - 1].stream_in;
                                planTime.primary_press_exit = planTimeList[planTimeList.length - 1].primary_press_exit;
                                planTime.secondary_press_1_start = planTimeList[planTimeList.length - 1].secondary_press_1_start;
                                planTime.temp_check_1 = planTimeList[planTimeList.length - 1].temp_check_1;
                                planTime.secondary_press_2_start = planTimeList[planTimeList.length - 1].secondary_press_2_start;
                                planTime.temp_check_2 = planTimeList[planTimeList.length - 1].temp_check_2;
                                planTime.cooling = planTimeList[planTimeList.length - 1].cooling;
                                planTime.secondary_press_exit = planTimeList[planTimeList.length - 1].secondary_press_exit;
                                planTime.block = currentBlock - blockUse;
                                prevBlock = currentBlock - planTime.block;

                                planTimeList.push({ ...planTime });
                            }
                        }
                        else {
                            currentBlock = prevBlock
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 2].batch_no;
                            planTime.program_no = null
                            planTime.start_time = null;
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = addMinutes(planTimeList[planTimeList.length - 1].secondary_press_1_start, config[0].pre_press_exit_time);
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
                    } else {
                        if (prevBlock === 3) {
                            currentBlock = prevBlock + currentBlock;
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                            planTime.program_no = null;
                            planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
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
                            prevBlock = currentBlock - planTime.block;

                            planTimeList.push({ ...planTime });

                            if (prevBlock === 9) {
                                currentBlock = prevBlock;
                                planTime.product_id = products[0].product_id;
                                planTime.run_no = planTimeList[planTimeList.length - 1].run_no;
                                planTime.machine = planTimeList[planTimeList.length - 1].machine;
                                planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no - 1;
                                planTime.program_no = null
                                planTime.start_time = null
                                planTime.mixing = null;
                                planTime.extruder_exit = null;
                                planTime.pre_press_exit = planTimeList[planTimeList.length - 1].pre_press_exit;
                                planTime.primary_press_start = planTimeList[planTimeList.length - 1].primary_press_start;
                                planTime.stream_in = planTimeList[planTimeList.length - 1].stream_in;
                                planTime.primary_press_exit = planTimeList[planTimeList.length - 1].primary_press_exit;
                                planTime.secondary_press_1_start = planTimeList[planTimeList.length - 1].secondary_press_1_start;
                                planTime.temp_check_1 = planTimeList[planTimeList.length - 1].temp_check_1;
                                planTime.secondary_press_2_start = planTimeList[planTimeList.length - 1].secondary_press_2_start;
                                planTime.temp_check_2 = planTimeList[planTimeList.length - 1].temp_check_2;
                                planTime.cooling = planTimeList[planTimeList.length - 1].cooling;
                                planTime.secondary_press_exit = planTimeList[planTimeList.length - 1].secondary_press_exit;
                                planTime.block = currentBlock - blockUse;
                                prevBlock = currentBlock - planTime.block;

                                planTimeList.push({ ...planTime });
                            }
                        }
                        else {
                            currentBlock = prevBlock
                            planTime.product_id = products[0].product_id;
                            planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                            planTime.machine = mac[machineIndex];
                            planTime.batch_no = planTimeList[planTimeList.length - 2].batch_no;
                            planTime.program_no = null
                            planTime.start_time = null;
                            planTime.mixing = null;
                            planTime.extruder_exit = null;
                            planTime.pre_press_exit = addMinutes(planTimeList[planTimeList.length - 1].secondary_press_1_start, config[0].pre_press_exit_time);
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
                else { // i = 0
                    if (i === 0) {
                        currentBlock = blockPerRound;
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList.length + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList.length + 1;
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
                    else {
                        currentBlock = blockPerRound;
                        planTime.product_id = products[0].product_id;
                        planTime.run_no = planTimeList[planTimeList.length - 1].run_no + 1;
                        planTime.machine = mac[machineIndex];
                        planTime.batch_no = planTimeList[planTimeList.length - 1].batch_no + 1;
                        planTime.program_no = null
                        planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[1].adj_next_start);
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
                    }
                }
            }
        } else if (cGroup === 'B-300FRE') {
            // if (blockUse === 6) {
            // for (let i = 0; i < runRound; i++) {
            //     const machineIndex = i % mac.length;
            //     const planTime = {};

            //     if (i >= 1) {
            //         if (i === 1) {
            //             currentBlock = blockPerRound;
            //             planTime.product_id = products[0].product_id;
            //             planTime.run_no = planTimeList.length + 1;
            //             planTime.machine = mac[machineIndex];
            //             planTime.batch_no = planTimeList.length + 1;
            //             planTime.program_no = null
            //             planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
            //             planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
            //             planTime.extruder_exit = addMinutes(planTime.mixing, config[1].extruder_exit_time);
            //             planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
            //             planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
            //             planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
            //             planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
            //             planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
            //             planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
            //             planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
            //             planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
            //             planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
            //             planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
            //             planTime.block = blockUse;
            //             prevBlock = currentBlock - planTime.block;

            //             planTimeList.push({ ...planTime });
            //         }
            //         else {
            //             currentBlock = blockPerRound;
            //             planTime.product_id = products[0].product_id;
            //             planTime.run_no = planTimeList.length + 1;
            //             planTime.machine = mac[machineIndex];
            //             planTime.batch_no = planTimeList.length + 1;
            //             planTime.program_no = null
            //             planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
            //             planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
            //             planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
            //             planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
            //             planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
            //             planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
            //             planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
            //             planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
            //             planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
            //             planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
            //             planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
            //             planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
            //             planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
            //             planTime.block = blockUse;
            //             prevBlock = currentBlock - planTime.block;

            //             planTimeList.push({ ...planTime });
            //         }
            //     }
            //     else {
            //         currentBlock = blockPerRound;
            //         planTime.product_id = products[0].product_id;
            //         planTime.run_no = planTimeList.length + 1;
            //         planTime.machine = mac[machineIndex];
            //         planTime.batch_no = planTimeList.length + 1;
            //         planTime.program_no = null
            //         planTime.start_time = startTimes;
            //         planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
            //         planTime.extruder_exit = addMinutes(planTime.mixing, config[0].extruder_exit_time);
            //         planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].pre_press_exit_time);
            //         planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_start);
            //         planTime.stream_in = addMinutes(planTime.primary_press_start, config[0].stream_in);
            //         planTime.primary_press_exit = addMinutes(planTime.stream_in, config[0].primary_press_exit);
            //         planTime.secondary_press_1_start = addMinutes(planTime.primary_press_exit, config[0].secondary_press_1_start);
            //         planTime.temp_check_1 = addMinutes(planTime.secondary_press_1_start, config[0].temp_check_1);
            //         planTime.secondary_press_2_start = addMinutes(planTime.temp_check_1, config[0].secondary_press_2_start);
            //         planTime.temp_check_2 = addMinutes(planTime.secondary_press_2_start, config[0].temp_check_2);
            //         planTime.cooling = addMinutes(planTime.temp_check_2, config[0].cooling_time);
            //         planTime.secondary_press_exit = addMinutes(planTime.cooling, config[0].secondary_press_exit);
            //         planTime.block = blockUse;
            //         prevBlock = currentBlock - planTime.block;

            //         planTimeList.push({ ...planTime });
            //     }
            // }
            // } else if (blockUse === 9) {
            for (let i = 0; i < runRound; i++) {
                const machineIndex = i % mac.length;
                const planTime = {};

                if (i > 1) {
                    planTime.product_id = products[0].product_id;
                    planTime.run_no = planTimeList.length + 1;
                    planTime.machine = mac[machineIndex];
                    planTime.batch_no = planTimeList.length + 1;
                    planTime.program_no = null
                    planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.solid_block = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                    planTime.extruder_exit = addMinutes(planTime.solid_block, config[0].pre_press_exit_time);
                    planTime.mold_primary_press = addMinutes(planTime.mixing, config[1].primary_press_start);
                    planTime.pre_press_exit = addMinutes(planTime.mold_primary_press, config[1].stream_in);
                    planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_exit);
                    planTime.primary_press_exit = addMinutes(planTime.primary_press_start, config[0].secondary_press_1_start);
                    planTime.trolley_in = addMinutes(planTime.primary_press_exit, config[0].temp_check_1);
                    planTime.trolley_out = addMinutes(planTime.trolley_in, config[0].secondary_press_2_start);
                    planTime.remove_work = addMinutes(planTime.trolley_out, config[1].temp_check_2);
                    planTime.block = blockUse;

                    planTimeList.push({ ...planTime });
                }
                else {
                    planTime.product_id = products[0].product_id;
                    planTime.run_no = planTimeList.length + 1;
                    planTime.machine = mac[machineIndex];
                    planTime.batch_no = planTimeList.length + 1;
                    planTime.program_no = null
                    planTime.start_time = startTimes;
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.solid_block = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                }
            }
            // }
        } else if (cGroup === 'A-110F') { // ปัญหาข้อมูลน้อยเกินไป
            for (let i = 0; i < runRound; i++) {
                const machineIndex = i % mac.length;
                const planTime = {};

                if (i >= 1) {
                    planTime.product_id = products[0].product_id;
                    planTime.run_no = planTimeList.length + 1;
                    planTime.machine = mac[machineIndex];
                    planTime.batch_no = planTimeList.length + 1;
                    planTime.program_no = null
                    planTime.start_time = reduceMinutes(planTimeList[planTimeList.length - 1].primary_press_exit, config[0].adj_next_start);
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.solid_block = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                    planTime.extruder_exit = addMinutes(planTime.solid_block, config[0].pre_press_exit_time);
                    planTime.mold_primary_press = addMinutes(planTime.mixing, config[1].primary_press_start);
                    planTime.pre_press_exit = addMinutes(planTime.mold_primary_press, config[1].stream_in);
                    planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_exit);
                    planTime.primary_press_exit = addMinutes(planTime.primary_press_start, config[0].secondary_press_1_start);
                    planTime.trolley_in = addMinutes(planTime.primary_press_exit, config[0].temp_check_1);
                    planTime.trolley_out = addMinutes(planTime.trolley_in, config[0].secondary_press_2_start);
                    planTime.remove_work = addMinutes(planTime.trolley_out, config[1].temp_check_2);
                    planTime.block = blockUse;

                    planTimeList.push({ ...planTime });
                }
                else {
                    planTime.product_id = products[0].product_id;
                    planTime.run_no = planTimeList.length + 1;
                    planTime.machine = mac[machineIndex];
                    planTime.batch_no = planTimeList.length + 1;
                    planTime.program_no = null
                    planTime.start_time = startTimes;
                    planTime.mixing = addMinutes(planTime.start_time, config[0].mixing_time);
                    planTime.solid_block = addMinutes(planTime.mixing, config[0].extruder_exit_time);
                    planTime.extruder_exit = addMinutes(planTime.solid_block, config[0].pre_press_exit_time);
                    planTime.mold_primary_press = reduceMinutes(planTime.mixing, config[0].primary_press_start);
                    planTime.pre_press_exit = addMinutes(planTime.extruder_exit, config[0].stream_in);
                    planTime.primary_press_start = addMinutes(planTime.pre_press_exit, config[0].primary_press_exit);
                    planTime.primary_press_exit = addMinutes(planTime.primary_press_start, config[0].secondary_press_1_start);
                    planTime.trolley_in = addMinutes(planTime.primary_press_exit, config[0].temp_check_1);
                    planTime.trolley_out = addMinutes(planTime.trolley_in, config[0].secondary_press_2_start);
                    planTime.remove_work = addMinutes(planTime.trolley_out, config[0].temp_check_2);
                    planTime.block = blockUse;

                    planTimeList.push({ ...planTime });
                }
            }
        }

        // สร้าง plantime_id
        let today;
        if (startDate) {
            today = new Date(startDate);
            if (isNaN(today.getTime())) {
                today = new Date();
            }
        } else {
            today = new Date();
        }
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const safeProduct = product_name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const safeColor = color_name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        let basePlntimeId = `PTID${yyyy}${mm}${dd}${safeProduct}${safeColor}`;
        let plantime_id = basePlntimeId;

        // ในกรณีสร้างอีกตัวที่มี plantime_id ซ้ำกัน
        let suffix = 1;
        let isUnique = false;
        while (!isUnique) {
            const checkQuery = `
                SELECT COUNT(plantime_id) AS count FROM PT_plan_time_mst
                WHERE plantime_id = '${plantime_id}';
            `

            const result = await pool.request().query(checkQuery);
            if (result.recordset[0].count === 0) {
                isUnique = true;
            } else {
                suffix++;
                plantime_id = `${basePlntimeId}_${suffix}`;
            }
        }

        // เพิ่มข้อมูลลงในฐานข้อมูล
        for (const plan of planTimeList) {
            const sqlValue = (val) =>
                val === null || val === undefined ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;

            const query = `
                  INSERT INTO PT_plan_time_mst (
                    product_id, plantime_id, run_no, machine, batch_no, program_no,
                    start_time, mixing, solid_block, extruder_exit, mold_primary_press, pre_press_exit, primary_press_start,
                    stream_in, primary_press_exit, secondary_press_1_start,
                    temp_check_1, secondary_press_2_start, temp_check_2, cooling, 
                    trolley_in, trolley_out, secondary_press_exit, remove_work, foam_block
                  ) VALUES (
                    ${sqlValue(plan.product_id)}, '${plantime_id}', ${sqlValue(plan.run_no)}, ${sqlValue(plan.machine)}, ${sqlValue(plan.batch_no)},
                    ${sqlValue(programName)}, ${sqlValue(plan.start_time)}, ${sqlValue(plan.mixing)}, ${sqlValue(plan.solid_block)}, ${sqlValue(plan.extruder_exit)},
                    ${sqlValue(plan.mold_primary_press)}, ${sqlValue(plan.pre_press_exit)}, ${sqlValue(plan.primary_press_start)}, 
                    ${sqlValue(plan.stream_in)}, ${sqlValue(plan.primary_press_exit)}, ${sqlValue(plan.secondary_press_1_start)},
                    ${sqlValue(plan.temp_check_1)}, ${sqlValue(plan.secondary_press_2_start)}, ${sqlValue(plan.temp_check_2)}, 
                    ${sqlValue(plan.cooling)}, ${sqlValue(plan.trolley_in)}, ${sqlValue(plan.trolley_out)},
                    ${sqlValue(plan.secondary_press_exit)}, ${sqlValue(plan.remove_work)}, ${sqlValue(plan.block)}
                  );
                `;

            try {
                await pool.request().query(query);
            } catch (err) {
                console.error(`❌ Insert error for item`, err);
            }
        }

        return res.json({
            message: "Plan Time Data successfully added",
            plantime_id,
            productName: `${product_name} (${color_name})`,
            mac: Array.isArray(mcNames) ? mcNames : [],
            blockPerRound,
            blockUse,
            blockTotal,
            runRound,
            planTimeList
        });

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
