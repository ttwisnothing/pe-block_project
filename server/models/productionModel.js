import { getPool } from "../config/db.js";
import sql from "mssql";

export const addProduction = async (req, res) => {
    const { batchNo, recordDate, employeeShift, productStatus, weighingStaff } = req.body;
    const query = `
        INSERT INTO production_mst (
            batchNo, recordDate, employeeShift, productStatus, weighingStaff
        ) VALUES (
            @batchNo, @recordDate, @employeeShift, @productStatus, @weighingStaff
        )
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('batchNo', sql.VarChar, batchNo);
        request.input('recordDate', sql.DateTime, recordDate);
        request.input('employeeShift', sql.VarChar, employeeShift);
        request.input('productStatus', sql.VarChar, productStatus);
        request.input('weighingStaff', sql.VarChar, weighingStaff);

        await request.query(query);
        res.status(201).json({ message: "✅ Production added successfully" });
    } catch (error) {
        console.error("❌ Error in adding production: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addChemicalStep = async (req, res) => {
    const { chemicalName1 } = req.body;
}