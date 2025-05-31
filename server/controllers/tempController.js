import { getPool } from "../config/db.js"; // นำเข้า getPool จาก db.js
import sql from "mssql";

export const getTempPlanTime = async (req, res) => {
    const { product_name } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('product_name', sql.VarChar, product_name);

        const tempPlanTimesResult = await request.query(`
            SELECT pt.*
            FROM PT_temp_time_mst pt
            INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = @product_name
        `);
        const tempPlanTimes = tempPlanTimesResult.recordset;

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this recipe' });
        }

        return res.status(200).json({
            product_name,
            productId: tempPlanTimes[0]?.product_id, // ใช้ optional chaining ป้องกัน error ถ้าไม่มีข้อมูล
            tempPlanTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
};

export const getTempPlanTimeASC = async (req, res) => {
    const { product_name } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('product_name', sql.VarChar, product_name);

        const tempPlanTimesResult = await request.query(`
            SELECT pt.*
            FROM PT_temp_time_mst pt
            INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = @product_name
            ORDER BY pt.run_no, pt.batch_no;
        `);
        const tempPlanTimes = tempPlanTimesResult.recordset;

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this recipe' });
        }

        return res.status(200).json({
            product_name,
            productId: tempPlanTimes[0]?.product_id, // ใช้ optional chaining ป้องกัน error ถ้าไม่มีข้อมูล
            tempPlanTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
};
