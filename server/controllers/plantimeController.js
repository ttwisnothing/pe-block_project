import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

// ดึงค่า PlanTime ทั้งหมดจากฐานข้อมูล
export const getPlanTime = async (req, res) => {
    const { productName } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('productName', sql.VarChar, productName);

        const result = await request.query(`
            SELECT pt.*, rt.product_name, rt.color_name
            FROM plan_time_table pt
            INNER JOIN product_mst rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = @productName
            ORDER BY pt.run_no ASC, pt.batch_no ASC
        `);

        const planTimes = result.recordset;

        if (planTimes.length === 0) {
            return res.status(404).json({ message: `❌ No Plan Times found for this Procuct : ${productName}` });
        }

        return res.json({
            productName,
            recipeId: planTimes[0].product_id,
            planTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Plan Times" });
    }
};
