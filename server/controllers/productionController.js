import { getPool } from "../config/db.js";
import sql from "mssql";

export const getProduction = async (req, res) => {
    try {
        // เปลี่ยนจาก req.body เป็น req.query สำหรับ GET request
        const { dateFrom, dateTo } = req.query || {};
        const pool = await getPool();
        const request = pool.request();

        let query = "SELECT * FROM FM_production_record";
        
        if (dateFrom && dateTo) {
            query += " WHERE CAST(create_date AS DATE) BETWEEN @dateFrom AND @dateTo";
            request.input("dateFrom", sql.Date, dateFrom);
            request.input("dateTo", sql.Date, dateTo);
        }
        
        // เพิ่ม ORDER BY เพื่อเรียงลำดับ
        query += " ORDER BY create_date DESC";

        const result = await request.query(query);
        res.status(200).json(result.recordset);
        
    } catch (error) {
        console.error("Error fetching production data:", error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
};

