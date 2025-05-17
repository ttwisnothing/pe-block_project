import { getPool } from "../config/db.js";
import sql from "mssql";

export const addProduction = async (req, res) => {
    const { batchNo, recordDate, employeeShift, productStatus, weighingStaff, productName } = req.body;
    const query = `
        INSERT INTO production_record (
            batch_no, record_date, employee_shift, product_status, weighing_staff, product_name
        ) VALUES (
            @batchNo, @recordDate, @employeeShift, @productStatus, @weighingStaff, @productName
        )
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('batchNo', sql.Int, batchNo);
        request.input('recordDate', sql.NVarChar, recordDate);
        request.input('employeeShift', sql.VarChar, employeeShift);
        request.input('productStatus', sql.VarChar, productStatus);
        request.input('weighingStaff', sql.VarChar, weighingStaff);
        request.input('productName', sql.VarChar, productName);

        await request.query(query);
        res.status(201).json({
            message: "✅ Production added successfully",
            data: {
                batch_no: batchNo,
                record_date: recordDate,
                employee_shift: employeeShift,
                product_status: productStatus,
                weighing_staff: weighingStaff,
                product_name: productName
            }
        });
    } catch (error) {
        console.error("❌ Error in adding production: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalNameStep = async (req, res) => {
    const { batchNo, chemistryName } = req.body;

    const chemistryList = Array.from({ length: 15 }, (_, i) => `chemistry_${i + 1}`);

    const queryName = `
        INSERT INTO chemical_name_step (
            product_record_id, ${chemistryList.join(", ")}
        ) VALUES (
            @batchNo, ${chemistryList.map((_, i) => `@chemistry_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('batchNo', sql.Int, batchNo);

        // กำหนด Chemistry Parameters
        for (let i = 0; i < 15; i++) {
            request.input(`chemistry_${i + 1}`, sql.NVarChar, chemistryName[i] || null);
        }

        await request.query(queryName);
        res.status(201).json({
            message: "✅ Chemical Step added successfully",
            data: {
                batch_no: batchNo,
                chemistry_name: chemistryName
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalWeightStep = async (req, res) => {
    const { batchNo, Ref, chemistryWeight } = req.body;

    const weightList = Array.from({ length: 15 }, (_, i) => `chemistry_${i + 1}`);

    const queryWeight = `
        INSERT INTO chemical_weight_step (
            product_record_id, ref, ${weightList.join(", ")}
        ) VALUES (
            @product_record_id, @Ref, ${weightList.map((_, i) => `@chemistry_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('product_record_id', sql.Int, batchNo);
        request.input('Ref', sql.Float, Ref);

        // กำหนด Weight Parameters
        for (let i = 0; i < 15; i++) {
            request.input(`chemistry_${i + 1}`, sql.Float, chemistryWeight[i] || null);
        }

        await request.query(queryWeight);
        res.status(201).json({
            message: "✅ Chemical Weight Step added successfully",
            data: {
                batch_no: batchNo,
                ref: Ref,
                chemistry_weight: chemistryWeight
            }
        });
    } catch (error) {
        console.error("❌ Error in adding chemical weight step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addMixingStep = async (req, res) => {
    const { batchNo, programNo, hopperWeight, actualTime,
        mixingFinish, lipHeat, casingA, casingB,
        tempHopper, longScrew, shortScrew, waterHeat } = req.body;

    const query = `
        INSERT INTO mixing_step (
            product_record_id, program_no, hopper_weight, actual_press,
            mixing_finish, lip_heat, casing_a_heat, casing_b_heat,
            hopper_heat, long_screw, short_screw, water_heating
        ) VALUES (
            @batchNo, @programNo, @hopperWeight, @actualTime,
            @mixingFinish, @lipHeat, @casingA, @casingB,
            @tempHopper, @longScrew, @shortScrew, @waterHeat
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchNo", sql.Int, batchNo);
        request.input("programNo", sql.Int, programNo);
        request.input("hopperWeight", sql.Int, hopperWeight);
        request.input("actualTime", sql.NVarChar, actualTime);
        request.input("mixingFinish", sql.NVarChar, mixingFinish);
        request.input("lipHeat", sql.Int, lipHeat);
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
                batch_no: batchNo,
                program_no: programNo,
                hopper_weight: hopperWeight,
                actual_time: actualTime,
                mixing_finish: mixingFinish,
                lip_heat: lipHeat,
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
    const { batchNo, wb1, wb2, wb3,
        wb4, wb5, wb6, wb7,
        wb8, wb9, weightRemain, staffSave,
        startPress, mixFinish } = req.body;

    const query = `
        INSERT INTO cut_step (
            product_record_id, weight_block_1, weight_block_2, weight_block_3,
            weight_block_4, weight_block_5, weight_block_6,
            weight_block_7, weight_block_8, weight_block_9,
            weight_remain, staff_data_save, start_press, mixing_finish
        ) VALUES (
            @batchNo, @wb1, @wb2, @wb3,
            @wb4, @wb5, @wb6, @wb7,
            @wb8, @wb9, @weightRemain, @staffSave,
            @startPress, @mixFinish
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchNo", sql.Int, batchNo);
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
        request.input("staffSave", sql.NVarChar, staffSave);
        request.input("startPress", sql.NVarChar, startPress);
        request.input("mixFinsh", sql.NVarChar, mixFinsh);

        await request.query(query);
        res.status(201).json({
            message: "✅ Cutting step added successfully",
            data: {
                batch_no: batchNo,
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
                staff_save: staffSave,
                start_press: startPress,
                mixing_finish: mixFinish
            }
        });
    } catch (error) {
        console.error("Error adding cutting step:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addPrePress = async (req, res) => {
    const { batchNo, prePressHeat, waterHeat1, waterHeat2,
        bakeTimePre, topHeat, layerHeat1, layerHeat2,
        layerHeat3, layerHeat4, layerHeat5, layerHeat6,
        injectorStaff, bakeTimePrimary
    } = req.body;

    const query = `
        INSERT INTO pre_press_step (
            product_record_id, pre_press_heat, water_heating_a, water_heating_b,
            bake_time_pre_press, top_heat, layer_a_heat, layer_b_heat,
            layer_c_heat, layer_d_heat, layer_e_heat, layer_f_heat,
            injector_agent, bake_time_primary_press
        ) VALUES (
            @batchNo, @prePressHeat, @waterHeat1, @waterHeat2,
            @bakeTimePre, @topHeat, @layerHeat1, @layerHeat2,
            @layerHeat3, @layerHeat4, @layerHeat5, @layerHeat6,
            @injectorStaff, @bakeTimePrimary
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchNo", sql.Int, batchNo);
        request.input("prePressHeat", sql.Int, prePressHeat);
        request.input("waterHeat1", sql.Int, waterHeat1);
        request.input("waterHeat2", sql.Int, waterHeat2);
        request.input("bakeTimePre", sql.NVarChar, bakeTimePre);
        request.input("topHeat", sql.Int, topHeat);
        request.input("layerHeat1", sql.Int, layerHeat1);
        request.input("layerHeat2", sql.Int, layerHeat2);
        request.input("layerHeat3", sql.Int, layerHeat3);
        request.input("layerHeat4", sql.Int, layerHeat4);
        request.input("layerHeat5", sql.Int, layerHeat5);
        request.input("layerHeat6", sql.Int, layerHeat6);
        request.input("injectorStaff", sql.NVarChar, injectorStaff);
        request.input("bakeTimePrimary", sql.NVarChar, bakeTimePrimary);

        await request.query(query);
        res.status(201).json({
            message: "✅ Pre-press added successfully",
            data: {
                batch_no: batchNo,
                pre_press_heat: prePressHeat,
                water_heating_a: waterHeat1,
                water_heating_b: waterHeat2,
                bake_time_pre_press: bakeTimePre,
                top_heat: topHeat,
                layer_a_heat: layerHeat1,
                layer_b_heat: layerHeat2,
                layer_c_heat: layerHeat3,
                layer_d_heat: layerHeat4,
                layer_e_heat: layerHeat5,
                layer_f_heat: layerHeat6,
                injector_agent: injectorStaff,
                bake_time_primary_press: bakeTimePrimary
            }
        });
    } catch (error) {
        console.error("Error adding pre-press:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const addSecondPrepress = async (req, res) => {
    const { batchNo, machineNo, streamInPress,
        foamWidth, foamLength, bakeTimeSecondary,
        sprayAgent, heatCheckA, heatCheckB, heatExit
    } = req.body;

    const query = `
        INSERT INTO secondary_press_step (
            product_record_id, machine_no, stream_in_press,
            foam_width, foam_length, bake_time_secondary,
            spray_agent, heat_check_a, heat_check_b, heat_exit
        ) VALUES (
            @batchNo, @machineNo, @streamInPress,
            @foamWidth, @foamLength, @bakeTimeSecondary,
            @sprayAgent, @heatCheckA, @heatCheckB, @heatExit
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchNo", sql.Int, batchNo);
        request.input("machineNo", sql.Int, machineNo);
        request.input("streamInPress", sql.NVarChar, streamInPress);
        request.input("foamWidth", sql.Float, foamWidth);
        request.input("foamLength", sql.Float, foamLength);
        request.input("bakeTimeSecondary", sql.NVarChar, bakeTimeSecondary);
        request.input("sprayAgent", sql.NVarChar, sprayAgent);
        request.input("heatCheckA", sql.Int, heatCheckA);
        request.input("heatCheckB", sql.Int, heatCheckB);
        request.input("heatExit", sql.Int, heatExit);

        await request.query(query);
        res.status(201).json({
            message: "✅ Second pre-press added successfully",
            data: {
                batch_no: batchNo,
                machine_no: machineNo,
                stream_in_press: streamInPress,
                foam_width: foamWidth,
                foam_length: foamLength,
                bake_time_secondary: bakeTimeSecondary,
                spray_agent: sprayAgent,
                heat_check_a: heatCheckA,
                heat_check_b: heatCheckB,
                heat_exit: heatExit
            }
        });
    } catch (error) {
        console.error("Error adding second pre-press:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const foamCheck = async (req, res) => {
    const { batchNo, runNo, layer1,
        layer2, layer3, layer4, layer5,
        layer6, entryData
    } = req.body;

    const query = `
        INSERT INTO foam_check_step (
            product_record_id, run_no, layer_1,
            layer_2, layer_3, layer_4,
            layer_5, layer_6, clerk_entry_data
        ) VALUES (
            @batchNo, @runNo, @layer1,
            @layer2, @layer3, @layer4,
            @layer5, @layer6, @entryData
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("batchNo", sql.Int, batchNo);
        request.input("runNo", sql.Int, runNo);
        request.input("layer1", sql.NVarChar, layer1);
        request.input("layer2", sql.NVarChar, layer2);
        request.input("layer3", sql.NVarChar, layer3);
        request.input("layer4", sql.NVarChar, layer4);
        request.input("layer5", sql.NVarChar, layer5);
        request.input("layer6", sql.NVarChar, layer6);
        request.input("entryData", sql.NVarChar, entryData);

        await request.query(query);
        res.status(201).json({
            message: "✅ Foam check added successfully",
            data: {
                batch_no: batchNo,
                run_no: runNo,
                layer_1: layer1,
                layer_2: layer2,
                layer_3: layer3,
                layer_4: layer4,
                layer_5: layer5,
                layer_6: layer6,
                clerk_entry_data: entryData
            }
        });
    } catch (error) {
        console.error("Error adding foam check:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}