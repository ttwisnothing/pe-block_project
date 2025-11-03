import { getPool } from "../config/db.js";
import sql from "mssql";
import { format } from 'date-fns';

export const addProductRecord = async (req, res) => {
    const { plantime_id, blockTotal, blockUsed } = req.body;

    const query = `
        SELECT pt.product_id, CONCAT(rt.product_name, '(', rt.color_name, ')') AS production_name, 
        pt.plantime_id, pt.start_time, pt.secondary_press_exit, pt.remove_work
        FROM PT_plan_time_mst pt
        INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
        WHERE pt.plantime_id = @plantime_id
        ORDER BY pt.run_no ASC
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('plantime_id', sql.VarChar, plantime_id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสำหรับ plantime_id นี้" });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        let lastValidTime = null;
        for (const record of result.recordset) {
            if (record.remove_work) {
                lastValidTime = record.remove_work;
            } else if (record.secondary_press_exit) {
                lastValidTime = record.secondary_press_exit;
            }
        }

        const startTime = result.recordset[0].start_time;
        let endDate = currentDate;

        if (startTime && lastValidTime) {
            const startHour = parseInt(startTime.split(':')[0], 10);
            const endHour = parseInt(lastValidTime.split(':')[0], 10);
            if (endHour < startHour) {
                const nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                endDate = nextDay.toISOString().split('T')[0];
            }
        }

        const formattedStartTime = startTime ?
            `${currentDate} ${startTime}` : null;

        const formattedEndTime = lastValidTime ?
            `${endDate} ${lastValidTime}` : null;

        const queryIns = `
            INSERT INTO FM_production_record (
                product_id, product_name, plantime_id, create_date, start_time, end_time, total_block, block_use
            ) VALUES (
                @productId, @productName, @plantimeId, @recordDate, @startTime, @endTime, @totalBlock, @blockUsed
            )
        `;

        const insertRequest = pool.request();

        insertRequest.input('productId', sql.Int, result.recordset[0].product_id);
        insertRequest.input('productName', sql.VarChar, result.recordset[0].production_name);
        insertRequest.input('plantimeId', sql.VarChar, result.recordset[0].plantime_id);
        insertRequest.input('recordDate', sql.Date, currentDate);
        insertRequest.input('startTime', sql.VarChar, formattedStartTime);
        insertRequest.input('endTime', sql.VarChar, formattedEndTime);
        insertRequest.input('totalBlock', sql.Int, parseInt(blockTotal, 10));
        insertRequest.input('blockUsed', sql.Int, parseInt(blockUsed, 10));

        await insertRequest.query(queryIns);

        res.status(201).json({
            message: "✅ บันทึกข้อมูลผลิตภัณฑ์สำเร็จ",
            productId: result.recordset[0].product_id,
            productName: result.recordset[0].production_name,
            plantimeId: result.recordset[0].plantime_id,
            recordDate: currentDate,
            startTime: formattedStartTime ? formattedStartTime.toLocaleString('th-TH') : null,
            endTime: formattedEndTime ? formattedEndTime.toLocaleString('th-TH') : null,
            totalBlock: parseInt(blockTotal, 10),
            blockUsed: parseInt(blockUsed, 10)
        });

    } catch (error) {
        console.error("❌ Error in adding product record: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addChemicalNameStep = async (req, res) => {
    const { runId } = req.params; 
    const { chemistryName } = req.body;

    const chemicalList = Array.from({ length: 15 }, (_, i) => `chemical_name_${i + 1}`);

    const queryName = `
        INSERT INTO FM_chemical_name_step (
            run_record_id, ${chemicalList.join(", ")}
        ) VALUES (
            @runId, ${chemicalList.map((_, i) => `@chemical_name_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('runId', sql.Int, runId);

        for (let i = 0; i < 15; i++) {
            const chemicalValue = chemistryName[i] || " ";
            request.input(`chemical_name_${i + 1}`, sql.NVarChar, chemicalValue);
        }

        await request.query(queryName);
        res.status(201).json({
            message: "✅ Chemical Step added successfully",
            data: {
                runRecordId: runId,
                chemical_name: chemistryName
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalWeightStep = async (req, res) => {
    const { runId } = req.params; 
    const { chemistryWeight } = req.body;

    const weightList = Array.from({ length: 15 }, (_, i) => `chemical_weight_${i + 1}`);

    const queryWeight = `
        INSERT INTO FM_chemical_weight_step (
            run_record_id, ${weightList.join(", ")}
        ) VALUES (
            @runId, ${weightList.map((_, i) => `@chemical_weight_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('runId', sql.Int, runId);

        for (let i = 0; i < 15; i++) {
            const weightValue = chemistryWeight[i] || 0.00;
            request.input(`chemical_weight_${i + 1}`, sql.Float, weightValue);
        }

        await request.query(queryWeight);
        res.status(201).json({
            message: "✅ Chemical Weight Step added successfully",
            data: {
                run_no: runId,
                chemistry_weight: chemistryWeight
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical weight step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addMixingStep = async (req, res) => {
    const { runId } = req.params; 
    const { hopperWeight, actualStart,
        mixFinish, lip, casingA, casingB,
        tempHopper, longScrew, shortScrew, waterHeat,
        programHopper, programKneader, programExtruder
    } = req.body;

    const query = `
        INSERT INTO FM_mixing_step (
            run_record_id, hopper_weight, actual_start,
            mix_finish, lip, casing_a, casing_b,
            temp_hopper, long_screw, short_screw, water_heat, 
            program_hopper, program_kneader, program_extruder
        ) VALUES (
            @runId, @hopperWeight, @actualStart,
            @mixFinish, @lip, @casingA, @casingB,
            @tempHopper, @longScrew, @shortScrew, @waterHeat,
            @programHopper, @programKneader, @programExtruder
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("hopperWeight", sql.Int, hopperWeight);
        request.input("actualStart", sql.NVarChar, actualStart);
        request.input("mixFinish", sql.NVarChar, mixFinish);
        request.input("lip", sql.Int, lip);
        request.input("casingA", sql.Int, casingA);
        request.input("casingB", sql.Int, casingB);
        request.input("tempHopper", sql.Int, tempHopper);
        request.input("longScrew", sql.Int, longScrew);
        request.input("shortScrew", sql.Int, shortScrew);
        request.input("waterHeat", sql.Int, waterHeat);
        request.input("programHopper", sql.Int, programHopper);
        request.input("programKneader", sql.Int, programKneader);
        request.input("programExtruder", sql.Int, programExtruder);

        await request.query(query);
        res.status(201).json({
            message: "✅ Mixing step added successfully",
            data: {
                run_no: runId,
                hopper_weight: hopperWeight,
                actual_start: actualStart,
                mixing_finish: mixFinish,
                lip_heat: lip,
                casing_a_heat: casingA,
                casing_b_heat: casingB,
                temp_hopper: tempHopper,
                long_screw: longScrew,
                short_screw: shortScrew,
                water_heating: waterHeat,
                program_hopper: programHopper,
                program_kneader: programKneader,
                program_extruder: programExtruder
            }
        });
    } catch (error) {
        console.error("Error adding mixing step:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addCuttingStep = async (req, res) => {
    const { runId } = req.params; 
    const { wb1, wb2, wb3,
        wb4, wb5, wb6, wb7,
        wb8, wb9, weightRemain } = req.body;

    const query = `
        INSERT INTO FM_cut_step (
            run_record_id, weight_block_1, weight_block_2, weight_block_3,
            weight_block_4, weight_block_5, weight_block_6,
            weight_block_7, weight_block_8, weight_block_9,
            weight_block_remain
        ) VALUES (
            @runId, @wb1, @wb2, @wb3,
            @wb4, @wb5, @wb6, @wb7,
            @wb8, @wb9, @weightRemain
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("wb1", sql.Float, wb1);
        request.input("wb2", sql.Float, wb2);
        request.input("wb3", sql.Float, wb3);
        request.input("wb4", sql.Float, wb4);
        request.input("wb5", sql.Float, wb5);
        request.input("wb6", sql.Float, wb6);
        request.input("wb7", sql.Float, wb7);
        request.input("wb8", sql.Float, wb8);
        request.input("wb9", sql.Float, wb9);
        request.input("weightRemain", sql.Float, weightRemain);

        await request.query(query);
        res.status(201).json({
            message: "✅ Cutting step added successfully",
            data: {
                run_no: runId,
                weight_block_1: wb1,
                weight_block_2: wb2,
                weight_block_3: wb3,
                weight_block_4: wb4,
                weight_block_5: wb5,
                weight_block_6: wb6,
                weight_block_7: wb7,
                weight_block_8: wb8,
                weight_block_9: wb9,
                weight_remain: weightRemain,
            }
        });
    } catch (error) {
        console.error("Error adding cutting step:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addPrePress = async (req, res) => {
    const { runId } = req.params; 
    const { tempPrePress, waterHeat1, waterHeat2,
        bakeTimePrePress
    } = req.body;

    const query = `
        INSERT INTO FM_pre_press_step (
            run_record_id, temp_pre_press, water_heat_1, water_heat_2,
            bake_time_pre_press
        ) VALUES (
            @runId, @tempPrePress, @waterHeat1, @waterHeat2,
            @bakeTimePrePress
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("tempPrePress", sql.Int, tempPrePress);
        request.input("waterHeat1", sql.Int, waterHeat1);
        request.input("waterHeat2", sql.Int, waterHeat2);
        request.input("bakeTimePrePress", sql.NVarChar, bakeTimePrePress);

        await request.query(query);
        res.status(201).json({
            message: "✅ Pre-press added successfully",
            data: {
                run_no: runId,
                pre_press_heat: tempPrePress,
                water_heating_a: waterHeat1,
                water_heating_b: waterHeat2,
                bake_time_pre_press: bakeTimePrePress,
            }
        });
    } catch (error) {
        console.error("Error adding pre-press:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addPrimaryPress = async (req, res) => {
    const { runId } = req.params; 
    const {
        programNo, topTemp, tempBlock1,
        tempBlock2, tempBlock3, tempBlock4,
        tempBlock5, tempBlock6, empSpray, bakeTimePrimary
    } = req.body;

    const query = `
        INSERT INTO FM_primary_press_step (
            run_record_id, program_no, top_temp, temp_block_1,
            temp_block_2, temp_block_3, temp_block_4,
            temp_block_5, temp_block_6, emp_spray, bake_time_primary
        ) VALUES (
            @runId, @programNo, @topTemp, @tempBlock1,
            @tempBlock2, @tempBlock3, @tempBlock4,
            @tempBlock5, @tempBlock6, @empSpray, @bakeTimePrimary
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("programNo", sql.Int, programNo);
        request.input("topTemp", sql.Int, topTemp);
        request.input("tempBlock1", sql.Int, tempBlock1);
        request.input("tempBlock2", sql.Int, tempBlock2);
        request.input("tempBlock3", sql.Int, tempBlock3);
        request.input("tempBlock4", sql.Int, tempBlock4);
        request.input("tempBlock5", sql.Int, tempBlock5);
        request.input("tempBlock6", sql.Int, tempBlock6);
        request.input("empSpray", sql.NVarChar, empSpray);
        request.input("bakeTimePrimary", sql.NVarChar, bakeTimePrimary);

        await request.query(query);
        res.status(201).json({
            message: "✅ Primary press added successfully",
            data: {
                run_no: runId,
                program_no: programNo,
                top_temp: topTemp,
                temp_block_1: tempBlock1,
                temp_block_2: tempBlock2,
                temp_block_3: tempBlock3,
                temp_block_4: tempBlock4,
                temp_block_5: tempBlock5,
                temp_block_6: tempBlock6,
                emp_spray: empSpray,
                bake_time_primary: bakeTimePrimary
            }
        });
    }
    catch (error) {
        console.error("Error adding primary press:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addSecondPrepress = async (req, res) => {
    const { runId } = req.params; 
    const {
        machineNo, programNo, streamInPress,
        foamWidth, foamLength, bakeSecondaryTime,
        injectEmp, tempCheck1, tempCheck2, tempOut
    } = req.body;

    const query = `
        INSERT INTO FM_secondary_press_step (
            run_record_id, machine_no, program_no, steam_in_press,
            width_foam, length_foam, bake_secondary_time,
            inject_emp, temp_check_1, temp_check_2, temp_out
        ) VALUES (
            @runId, @machineNo, @programNo, @streamInPress,
            @foamWidth, @foamLength, @bakeSecondaryTime,
            @injectEmp, @tempCheck1, @tempCheck2, @tempOut
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("machineNo", sql.Int, machineNo);
        request.input("programNo", sql.Int, programNo);
        request.input("streamInPress", sql.NVarChar, streamInPress);
        request.input("foamWidth", sql.Float, foamWidth);
        request.input("foamLength", sql.Float, foamLength);
        request.input("bakeSecondaryTime", sql.NVarChar, bakeSecondaryTime);
        request.input("injectEmp", sql.NVarChar, injectEmp);
        request.input("tempCheck1", sql.Float, tempCheck1);
        request.input("tempCheck2", sql.Float, tempCheck2);
        request.input("tempOut", sql.Float, tempOut);

        await request.query(query);
        res.status(201).json({
            message: "✅ Second pre-press added successfully",
            data: {
                run_no: runId,
                machine_no: machineNo,
                program_no: programNo,
                stream_in_press: streamInPress,
                width_foam: foamWidth,
                length_foam: foamLength,
                bake_secondary_time: bakeSecondaryTime,
                inject_emp: injectEmp,
                temp_check_1: tempCheck1,
                temp_check_2: tempCheck2,
                temp_out: tempOut
            }
        });
    } catch (error) {
        console.error("Error adding second pre-press:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const foamCheck = async (req, res) => {
    const { runId } = req.params; 
    const {
        runNo, foamBlock1, foamBlock2,
        foamBlock3, foamBlock4, foamBlock5,
        foamBlock6, employeeRecord, exitSecondaryPress
    } = req.body;

    const query = `
        INSERT INTO FM_foam_check_step (
            run_record_id, run_no, foam_block_1,
            foam_block_2, foam_block_3, foam_block_4,
            foam_block_5, foam_block_6, employee_record,
            exit_secondary_press
        ) VALUES (
            @runId, @runNo, @foamBlock1,
            @foamBlock2, @foamBlock3, @foamBlock4,
            @foamBlock5, @foamBlock6, @employeeRecord,
            @exitSecondaryPress
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("runId", sql.Int, runId);
        request.input("runNo", sql.Int, runNo);
        request.input("foamBlock1", sql.NVarChar, foamBlock1);
        request.input("foamBlock2", sql.NVarChar, foamBlock2);
        request.input("foamBlock3", sql.NVarChar, foamBlock3);
        request.input("foamBlock4", sql.NVarChar, foamBlock4);
        request.input("foamBlock5", sql.NVarChar, foamBlock5);
        request.input("foamBlock6", sql.NVarChar, foamBlock6);
        request.input("employeeRecord", sql.NVarChar, employeeRecord);
        request.input("exitSecondaryPress", sql.NVarChar, exitSecondaryPress);

        await request.query(query);
        res.status(201).json({
            message: "✅ Foam check added successfully",
            data: {
                run_no: runId,
                run_no_ref: runNo,
                foam_block_1: foamBlock1,
                foam_block_2: foamBlock2,
                foam_block_3: foamBlock3,
                foam_block_4: foamBlock4,
                foam_block_5: foamBlock5,
                foam_block_6: foamBlock6,
                employee_record: employeeRecord,
                exit_secondary_press: exitSecondaryPress
            }
        });
    } catch (error) {
        console.error("Error adding foam check:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addRunRecord = async (req, res) => {
    const { productionId } = req.params;

    const getQuery = `
        SELECT pr.id, pr.product_id, pr.product_name, pr.total_block, pm.bUse
        FROM FM_production_record pr
        INNER JOIN PT_product_mst pm ON pr.product_id = pm.product_id
        WHERE pr.id = @productionId
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('productionId', sql.Int, productionId);

        const result = await request.query(getQuery);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการผลิตที่ระบุ" });
        }

        const productionData = result.recordset[0];
        const { id, product_name, total_block, bUse } = productionData;

        const runCount = Math.ceil(total_block / bUse);

        const insertRunQuery = `
            INSERT INTO FM_run_record (production_record_id, run_no, product_name)
            VALUES (@productionRecord, @runNo, @productName)
        `;

        const insertedRuns = [];

        for (let i = 1; i <= runCount; i++) {
            const runRequest = pool.request();

            runRequest.input('productionRecord', sql.Int, id);
            runRequest.input('runNo', sql.Int, i);
            runRequest.input('productName', sql.VarChar, product_name);

            await runRequest.query(insertRunQuery);

            insertedRuns.push({
                production_record: id,
                run_no: i,
                product_name: product_name
            });
        }

        res.status(201).json({
            message: "✅ สร้าง Run Records สำเร็จ",
            productionData: productionData,
            insertedRuns: insertedRuns,
            totalRunsCreated: runCount,
            totalBlock: total_block
        });
    }
    catch (error) {
        console.error("❌ Error in creating run records: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const newProductionRecord = async (req, res) => {
    const { plantime_id, blockTotal, startDate, startTime, blockUsed } = req.body;

    const query = `
        SELECT pt.product_id, CONCAT(rt.product_name, '(', rt.color_name, ')') AS production_name, 
        pt.plantime_id, pt.start_time, pt.secondary_press_exit
        FROM PT_plan_time_mst pt
        INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
        WHERE pt.plantime_id = @plantime_id
        ORDER BY pt.run_no ASC
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('plantime_id', sql.VarChar, plantime_id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสำหรับ plantime_id นี้" });
        }

        let sDate;
        if (startDate) {
            const tempDate = new Date(startDate);
            if (!isNaN(tempDate.getTime())) {
                sDate = tempDate.toISOString().split('T')[0];
            } else {
                sDate = format(new Date(), 'yyyy-MM-dd');
            }
        } else {
            sDate = format(new Date(), 'yyyy-MM-dd');
        }

        const sTime = startTime;
        
        let eTime = null;
        const lastRecord = result.recordset[result.recordset.length - 1];
        if (lastRecord && lastRecord.secondary_press_exit) {
            eTime = lastRecord.secondary_press_exit;
        }
    

        let eDate = sDate;

        if (sTime && eTime) {
            const startHour = parseInt(sTime.split(':')[0], 10);
            const endHour = parseInt(eTime.split(':')[0], 10);
            if (endHour < startHour) {
                const nextDay = new Date(sDate);
                nextDay.setDate(nextDay.getDate() + 1);
                eDate = nextDay.toISOString().split('T')[0];
            }
        }

        const formattedStartTime = sTime ?
            `${sDate} ${sTime}` : null;

        const formattedEndTime = eTime ?
            `${eDate} ${eTime}` : null;
        
        const insertQuery = `
            INSERT INTO FM_production_record (
                product_id, product_name, plantime_id, create_date, start_time, end_time, total_block, block_use
            ) VALUES (
                @productId, @productName, @plantimeId, @createDate, @startTime, @endTime, @totalBlock, @blockUsed
            )
        `;
        
        const insertRequest = pool.request();

        insertRequest.input('productId', sql.Int, result.recordset[0].product_id);
        insertRequest.input('productName', sql.VarChar, result.recordset[0].production_name);
        insertRequest.input('plantimeId', sql.VarChar, result.recordset[0].plantime_id);
        insertRequest.input('createDate', sql.Date, sDate);
        insertRequest.input('startTime', sql.VarChar, formattedStartTime);
        insertRequest.input('endTime', sql.VarChar, formattedEndTime);
        insertRequest.input('totalBlock', sql.Int, parseInt(blockTotal, 10));
        insertRequest.input('blockUsed', sql.Int, parseInt(blockUsed, 10));

        await insertRequest.query(insertQuery);

        res.status(201).json({
            message: "✅ บันทึกข้อมูลผลิตภัณฑ์สำเร็จ",
            productId: result.recordset[0].product_id,
            productName: result.recordset[0].production_name,
            plantimeId: result.recordset[0].plantime_id,
            recordDate: sDate,
            startTime: formattedStartTime ? formattedStartTime.toLocaleString('th-TH') : null,
            endTime: formattedEndTime ? formattedEndTime.toLocaleString('th-TH') : null,
            totalBlock: parseInt(blockTotal, 10),
            blockUsed: parseInt(blockUsed, 10)
        });
    } catch (error) {
        console.error("❌ Error in newProductionRecord:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const new1 = async (req, res) => {
    const { plantime_id, blockTotal } = req.body;

    const query = `
        SELECT pt.product_id, CONCAT(rt.product_name, '(', rt.color_name, ')') AS production_name, 
        pt.plantime_id, pt.start_time, pt.secondary_press_exit, pt.remove_work
        FROM PT_plan_time_mst pt
        INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
        WHERE pt.plantime_id = @plantime_id
        ORDER BY pt.run_no ASC
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('plantime_id', sql.VarChar, plantime_id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสำหรับ plantime_id นี้" });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        let lastValidTime = null;
        for (const record of result.recordset) {
            if (record.remove_work) {
                lastValidTime = record.remove_work;
            } else if (record.secondary_press_exit) {
                lastValidTime = record.secondary_press_exit;
            }
        }

        const startTime = result.recordset[0].start_time;
        let endDate = currentDate;

        if (startTime && lastValidTime) {
            const startHour = parseInt(startTime.split(':')[0], 10);
            const endHour = parseInt(lastValidTime.split(':')[0], 10);
            if (endHour < startHour) {
                const nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                endDate = nextDay.toISOString().split('T')[0];
            }
        }

        const formattedStartTime = startTime ?
            `${currentDate} ${startTime}` : null;

        const formattedEndTime = lastValidTime ?
            `${endDate} ${lastValidTime}` : null;

        const queryIns = `
            INSERT INTO FM_production_record (
                product_id, product_name, plantime_id, create_date, start_time, end_time, total_block
            ) VALUES (
                @productId, @productName, @plantimeId, @recordDate, @startTime, @endTime, @totalBlock
            )
        `;

        const insertRequest = pool.request();

        insertRequest.input('productId', sql.Int, result.recordset[0].product_id);
        insertRequest.input('productName', sql.VarChar, result.recordset[0].production_name);
        insertRequest.input('plantimeId', sql.VarChar, result.recordset[0].plantime_id);
        insertRequest.input('recordDate', sql.Date, currentDate);
        insertRequest.input('startTime', sql.VarChar, formattedStartTime);
        insertRequest.input('endTime', sql.VarChar, formattedEndTime);
        insertRequest.input('totalBlock', sql.Int, parseInt(blockTotal, 10));

        await insertRequest.query(queryIns);

        res.status(201).json({
            message: "✅ บันทึกข้อมูลผลิตภัณฑ์สำเร็จ",
            productId: result.recordset[0].product_id,
            productName: result.recordset[0].production_name,
            plantimeId: result.recordset[0].plantime_id,
            recordDate: currentDate,
            startTime: formattedStartTime ? formattedStartTime.toLocaleString('th-TH') : null,
            endTime: formattedEndTime ? formattedEndTime.toLocaleString('th-TH') : null,
            totalBlock: parseInt(blockTotal, 10)
        });

    } catch (error) {
        console.error("❌ Error in adding product record: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};