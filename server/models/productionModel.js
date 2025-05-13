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
        res.status(201).json({ message: "✅ Chemical Step added successfully" });
    } catch (error) {
        console.error("❌ Error in adding chemical step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalWeightStep = async (req, res) => {
    const { batchNo, Ref, chemicalWeight } = req.body;

    const weightList = Array.from({ length: 15 }, (_, i) => `weight_${i + 1}`);

    const queryWeight = `
        INSERT INTO chemical_weight_step (
            product_record_id, , ${weightList.join(", ")}
        ) VALUES (
            @product_record_id, ${weightList.map((_, i) => `@weight_${i + 1}`).join(", ")}
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('product_record_id', sql.Int, batchNo);

        // กำหนด Weight Parameters
        for (let i = 0; i < 15; i++) {
            request.input(`weight_${i + 1}`, sql.VarChar, chemical_weight[i] || null);
        }

        await request.query(queryWeight);
        res.status(201).json({ message: "✅ Chemical Weight Step added successfully" });
    } catch (error) {
        console.error("❌ Error in adding chemical weight step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}