import { getPool } from "../config/db.js";
import sql from "mssql";

export const addPrePress = async (req, res) => {
    const { batchNo, prePressHeat, waterHeat1, waterHeat2,
        bakeTimePre, topHeat, layerHeat1, layerHeat2,
        layerHeat3, layerHeat4, layerHeat5, layerHeat6,
        injectorStaff, bakeTimePrimary
    } = req.body;

    const query = `
        INSERT INTO pre_press (
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
        INSERT INTO second_pre_press (
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
        request.input("foamWidth", sql.Int, foamWidth);
        request.input("foamLength", sql.Int, foamLength);
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
        INSERT INTO foam_check (
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