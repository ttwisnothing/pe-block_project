import { getPool } from "../config/db.js";
import sql from "mssql";

export const getStatusPlan = async (req, res) => {
    const { plantimeId } = req.params;

    const query = `
        SELECT plantime_id, product_name, start_time, end_time
        FROM FM_production_reccord
        WHERE plantime_id = @plantimeId
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("plantimeId", sql.VarChar, plantimeId);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Status plan not found" });
        }

    } catch (err) {
        console.error("Error fetching status plan:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}