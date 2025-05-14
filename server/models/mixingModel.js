import { getPool } from "../config/db.js";
import sql from "mssql";

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
         wb8, wb9, weightRemain, staffSave } = req.body;

    const query = `
        INSERT INTO cut_step (
            product_record_id, weight_block_1, weight_block_2, weight_block_3,
            weight_block_4, weight_block_5, weight_block_6,
            weight_block_7, weight_block_8, weight_block_9,
            weight_remain, staff_save
        ) VALUES (
            @batchNo, @wb1, @wb2, @wb3,
            @wb4, @wb5, @wb6, @wb7,
            @wb8, @wb9, @weightRemain, @staffSave
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
                staff_save: staffSave
            }
        });
    } catch (error) {
        console.error("Error adding cutting step:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}