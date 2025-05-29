import { getPool } from "../config/db.js";
import sql from "mssql";

export const getProduction = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.body || {};
        const pool = await getPool();
        const request = pool.request();

        let query = "SELECT * FROM production_record";
        if (dateFrom && dateTo) {
            query += " WHERE record_date BETWEEN @dateFrom AND @dateTo";
            request.input("dateFrom", sql.DateTime, dateFrom);
            request.input("dateTo", sql.DateTime, dateTo);
        }

        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching production data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

