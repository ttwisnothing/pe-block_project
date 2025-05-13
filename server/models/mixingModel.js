import { getPool } from "../config/db.js";
import sql from "mssql";

export const addMixingStep = async (req, res) => {
    const { batchNo, programNo, hopperWeight, actualTime,
        MixingFinish, lipHeat, casingA, casingB,
        tempHopper, longScrew, shortScrew, waterHeat } = req.body;

    const query = `
        INSERT INTO mixing_step (
            product_record_id, program_no, hopper_weight, actual_press,
            mixing_finish, lip_heat, casing_a_heat, casing_b_heat,
            hopper_heat, long_screw, short_screw, water_heating
        ) VALUES (
            @batchNo, @programNo, @hopperWeight, @actualTime,
            @MixingFinish, @lipHeat, @casingA, @casingB,
            @tempHopper, @longScrew, @shortScrew, @waterHeat
        )
    `
}