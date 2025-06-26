import { getPool } from "../config/db.js";
import sql from "mssql";

export const addProductRecord = async (req, res) => {
    const { proName } = req.params;
    const { recordDate } = req.query; // รับวันที่จาก query parameter

    const query = `
        SELECT pt.product_id, CONCAT(rt.product_name, '(', rt.color_name, ')') AS production_name, 
        plantime_id, batch_no, start_time, secondary_press_exit, remove_work
        FROM PT_plan_time_mst pt
        INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
        WHERE rt.product_name = @proName
        ORDER BY pt.run_no ASC, pt.batch_no ASC
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('proName', sql.VarChar, proName);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสำหรับผลิตภัณฑ์นี้" });
        }

        // รับค่าวันที่จาก query หรือใช้วันที่ปัจจุบันถ้าไม่มี
        const currentDate = recordDate || new Date().toISOString().split('T')[0];

        // Find the last valid time value
        let lastValidTime = null;
        let maxBatchNo = 0;

        for (const record of result.recordset) {
            if (record.remove_work) {
                lastValidTime = record.remove_work;
            } else if (record.secondary_press_exit) {
                lastValidTime = record.secondary_press_exit;
            }

            // หาค่า batc_no ที่สูงสุด
            if (record.batch_no > maxBatchNo) {
                maxBatchNo = record.batch_no;
            }
        }

        // ตรวจสอบว่าเวลาเริ่มต้นและเวลาสิ้นสุดควรเป็นวันเดียวกันหรือไม่
        const startTime = result.recordset[0].start_time;
        let endDate = currentDate;

        // ถ้ามีทั้งเวลาเริ่มต้นและเวลาสิ้นสุด ให้ตรวจสอบว่าเวลาสิ้นสุดควรเป็นวันถัดไปหรือไม่
        if (startTime && lastValidTime) {
            const startHour = parseInt(startTime.split(':')[0], 10);
            const endHour = parseInt(lastValidTime.split(':')[0], 10);

            // ถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่มต้น แสดงว่าข้ามวัน
            if (endHour < startHour) {
                // สร้างวันถัดไป
                const nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                endDate = nextDay.toISOString().split('T')[0];
            }
        }

        // รวมวันที่กับเวลา พร้อมระบุ timezone offset ให้ชัดเจน
        const formattedStartTime = startTime ?
            `${currentDate} ${startTime}` : null;

        const formattedEndTime = lastValidTime ?
            `${endDate} ${lastValidTime}` : null;

        // Insert ข้อมูลลงในตาราง product_record
        const queryIns = `
            INSERT INTO FM_production_record (
                product_id, product_name, plantime_id, create_date, start_time, end_time, total_batch
            ) VALUES (
                @productId, @productName, @plantimeId, @recordDate, @startTime, @endTime, @totalBatch
            )
        `;

        const insertRequest = pool.request();
        
        // กำหนด Parameters สำหรับ INSERT
        insertRequest.input('productId', sql.Int, result.recordset[0].product_id);
        insertRequest.input('productName', sql.VarChar, result.recordset[0].production_name);
        insertRequest.input('plantimeId', sql.VarChar, result.recordset[0].plantime_id); // เพิ่ม plantime_id
        insertRequest.input('recordDate', sql.Date, currentDate);
        insertRequest.input('startTime', sql.DateTimeOffset, formattedStartTime);
        insertRequest.input('endTime', sql.DateTimeOffset, formattedEndTime);
        insertRequest.input('totalBatch', sql.Int, maxBatchNo);

        await insertRequest.query(queryIns);

        res.status(201).json({
            message: "✅ บันทึกข้อมูลผลิตภัณฑ์สำเร็จ",
            productId: result.recordset[0].product_id,
            productName: result.recordset[0].production_name,
            plantimeId: result.recordset[0].plantime_id, // ส่งกลับ plantime_id ด้วย
            recordDate: currentDate,
            startTime: formattedStartTime ? formattedStartTime.toLocaleString('th-TH') : null,
            endTime: formattedEndTime ? formattedEndTime.toLocaleString('th-TH') : null,
            totalBatch: maxBatchNo
        });

    } catch (error) {
        console.error("❌ Error in adding product record: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addBatchRecord = async (req, res) => {
    const { productionId } = req.params; // รับ podId จาก URL parameters
    
    const getQuery = `
        SELECT id, product_name, total_batch FROM FM_production_record
        WHERE id = @productionId
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('productionId', sql.Int, productionId);

        const result = await request.query(getQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการผลิตที่ระบุ" });
        }

        const productionData = result.recordset[0];
        const { id, product_name, total_batch } = productionData;

        // สร้าง batch records ตามจำนวน total_batch
        const insertBatchQuery = `
            INSERT INTO FM_batch_record (production_record_id, batch_no, product_name)
            VALUES (@productionRecord, @batchNo, @productName)
        `;

        const insertedBatches = [];

        // วนลูปสร้าง batch record ตามจำนวน total_batch
        for (let i = 1; i <= total_batch; i++) {
            const batchRequest = pool.request();
            
            batchRequest.input('productionRecord', sql.Int, id);
            batchRequest.input('batchNo', sql.Int, i);
            batchRequest.input('productName', sql.VarChar, product_name);

            await batchRequest.query(insertBatchQuery);
            
            insertedBatches.push({
                production_record: id,
                batch_no: i,
                product_name: product_name
            });
        }

        res.status(201).json({
            message: "✅ สร้าง Batch Records สำเร็จ",
            productionData: productionData,
            insertedBatches: insertedBatches,
            totalBatchesCreated: total_batch
        });
    }
    catch (error) {
        console.error("❌ Error in creating batch records: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalNameStep = async (req, res) => {
    const { batchId } = req.params;
    const { chemistryName } = req.body;

    // เปลี่ยนจาก chemistry_ เป็น chemical_name_
    const chemicalList = Array.from({ length: 15 }, (_, i) => `chemical_name_${i + 1}`);

    const queryName = `
        INSERT INTO FM_chemical_name_step (
            batch_record_id, ${chemicalList.join(", ")}
        ) VALUES (
            @batchId, ${chemicalList.map((_, i) => `@chemical_name_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('batchId', sql.Int, batchId);

        for (let i = 0; i < 15; i++) {
            const chemicalValue = chemistryName[i] || " ";
            request.input(`chemical_name_${i + 1}`, sql.NVarChar, chemicalValue);
        }

        await request.query(queryName);
        res.status(201).json({
            message: "✅ Chemical Step added successfully",
            data: {
                batchRecordId: batchId,
                chemical_name: chemistryName
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalWeightStep = async (req, res) => {
    const { batchId } = req.params;
    const { chemistryWeight } = req.body;

    // เปลี่ยนจาก chemistry_ เป็น chemical_weight_
    const weightList = Array.from({ length: 15 }, (_, i) => `chemical_weight_${i + 1}`);

    const queryWeight = `
        INSERT INTO FM_chemical_weight_step (
            batch_record_id, ${weightList.join(", ")}
        ) VALUES (
            @batchId, ${weightList.map((_, i) => `@chemical_weight_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('batchId', sql.Int, batchId);

        for (let i = 0; i < 15; i++) {
            // เปลี่ยนจาก null เป็น 0.00 เมื่อไม่มีข้อมูล
            const weightValue = chemistryWeight[i] || 0.00;
            request.input(`chemical_weight_${i + 1}`, sql.Float, weightValue);
        }

        await request.query(queryWeight);
        res.status(201).json({
            message: "✅ Chemical Weight Step added successfully",
            data: {
                batch_no: batchId,
                chemistry_weight: chemistryWeight
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical weight step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addMixingStep = async (req, res) => {
    const { batchId } = req.params; // เปลี่ยนจาก podId เป็น batchId
    const { programNo, hopperWeight, actualStart,
        mixFinish, lip, casingA, casingB,
        tempHopper, longScrew, shortScrew, waterHeat } = req.body;

    const query = `
        INSERT INTO FM_mixing_step (
            batch_record_id, program_no, hopper_weight, actual_start,
            mix_finish, lip, casing_a, casing_b,
            temp_hopper, long_screw, short_screw, water_heat
        ) VALUES (
            @batchId, @programNo, @hopperWeight, @actualStart,
            @mixFinish, @lip, @casingA, @casingB,
            @tempHopper, @longScrew, @shortScrew, @waterHeat
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId); // เปลี่ยนชื่อ parameter
        request.input("programNo", sql.Int, programNo);
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

        await request.query(query);
        res.status(201).json({
            message: "✅ Mixing step added successfully",
            data: {
                batch_no: batchId,
                program_no: programNo,
                hopper_weight: hopperWeight,
                actual_start: actualStart,
                mixing_finish: mixFinish,
                lip_heat: lip,
                casing_a_heat: casingA,
                casing_b_heat: casingB,
                temp_hopper: tempHopper,
                long_screw: longScrew,
                short_screw: shortScrew,
                water_heating: waterHeat
            }
        });
    } catch (error) {
        console.error("Error adding mixing step:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addCuttingStep = async (req, res) => {
    const { batchId } = req.params; // เปลี่ยนจาก podId เป็น batchId
    const { wb1, wb2, wb3,
        wb4, wb5, wb6, wb7,
        wb8, wb9, weightRemain } = req.body;

    const query = `
        INSERT INTO FM_cut_step (
            batch_record_id, weight_block_1, weight_block_2, weight_block_3,
            weight_block_4, weight_block_5, weight_block_6,
            weight_block_7, weight_block_8, weight_block_9,
            weight_block_remain
        ) VALUES (
            @batchId, @wb1, @wb2, @wb3,
            @wb4, @wb5, @wb6, @wb7,
            @wb8, @wb9, @weightRemain
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId);
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
                podId: batchId,
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
    const { batchId } = req.params; // เปลี่ยนจาก podId เป็น batchId
    const { tempPrePress, waterHeat1, waterHeat2,
        bakeTimePrePress
    } = req.body;

    const query = `
        INSERT INTO FM_pre_press_step (
            batch_record_id, temp_pre_press, water_heat_1, water_heat_2,
            bake_time_pre_press
        ) VALUES (
            @batchId, @tempPrePress, @waterHeat1, @waterHeat2,
            @bakeTimePrePress
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId);
        request.input("tempPrePress", sql.Int, tempPrePress);
        request.input("waterHeat1", sql.Int, waterHeat1);
        request.input("waterHeat2", sql.Int, waterHeat2);
        request.input("bakeTimePrePress", sql.NVarChar, bakeTimePrePress);

        await request.query(query);
        res.status(201).json({
            message: "✅ Pre-press added successfully",
            data: {
                batch_no: batchId,
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
    const { batchId } = req.params; // เปลี่ยนจาก podId เป็น batchId
    const { 
        programNo, topTemp, tempBlock1,
        tempBlock2, tempBlock3, tempBlock4,
        tempBlock5, tempBlock6, empSpray, bakeTimePrimary
    } = req.body;

    const query = `
        INSERT INTO FM_primary_press_step (
            batch_record_id, program_no, top_temp, temp_block_1,
            temp_block_2, temp_block_3, temp_block_4,
            temp_block_5, temp_block_6, emp_spray, bake_time_primary
        ) VALUES (
            @batchId, @programNo, @topTemp, @tempBlock1,
            @tempBlock2, @tempBlock3, @tempBlock4,
            @tempBlock5, @tempBlock6, @empSpray, @bakeTimePrimary
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId);
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
                batch_no: batchId,
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
    const { batchId } = req.params; // เปลี่ยนจาก podId เป็น batchId
    const { 
        machineNo, programNo, streamInPress,
        foamWidth, foamLength, bakeSecondaryTime,
        injectEmp, tempCheck1, tempCheck2, tempOut
    } = req.body;

    const query = `
        INSERT INTO FM_secondary_press_step (
            batch_record_id, machine_no, program_no, steam_in_press,
            width_foam, length_foam, bake_secondary_time,
            inject_emp, temp_check_1, temp_check_2, temp_out
        ) VALUES (
            @batchId, @machineNo, @programNo, @streamInPress,
            @foamWidth, @foamLength, @bakeSecondaryTime,
            @injectEmp, @tempCheck1, @tempCheck2, @tempOut
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId);
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
                batch_no: batchId,
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
    const { batchId } = req.params;
    const { 
        runNo, foamBlock1, foamBlock2,
        foamBlock3, foamBlock4, foamBlock5,
        foamBlock6, employeeRecord
    } = req.body;

    const query = `
        INSERT INTO FM_foam_check_step (
            batch_record_id, run_no, foam_block_1,
            foam_block_2, foam_block_3, foam_block_4,
            foam_block_5, foam_block_6, employee_record
        ) VALUES (
            @batchId, @runNo, @foamBlock1,
            @foamBlock2, @foamBlock3, @foamBlock4,
            @foamBlock5, @foamBlock6, @employeeRecord
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchId", sql.Int, batchId);
        request.input("runNo", sql.Int, runNo);
        request.input("foamBlock1", sql.NVarChar, foamBlock1);
        request.input("foamBlock2", sql.NVarChar, foamBlock2);
        request.input("foamBlock3", sql.NVarChar, foamBlock3);
        request.input("foamBlock4", sql.NVarChar, foamBlock4);
        request.input("foamBlock5", sql.NVarChar, foamBlock5);
        request.input("foamBlock6", sql.NVarChar, foamBlock6);
        request.input("employeeRecord", sql.NVarChar, employeeRecord);

        await request.query(query);
        res.status(201).json({
            message: "✅ Foam check added successfully",
            data: {
                batch_no: batchId,
                run_no: runNo,
                foam_block_1: foamBlock1,
                foam_block_2: foamBlock2,
                foam_block_3: foamBlock3,
                foam_block_4: foamBlock4,
                foam_block_5: foamBlock5,
                foam_block_6: foamBlock6,
                employee_record: employeeRecord
            }
        });
    } catch (error) {
        console.error("Error adding foam check:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}