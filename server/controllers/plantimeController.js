import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

const fetchPlanTimes = async (productName) => {
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

    return result.recordset;
}

export const getPlanTime = async (req, res) => {
    const { productName } = req.params;

    try {
        console.log(`🔄 getPlanTime called for product: ${productName} at ${new Date().toLocaleString()}`);

        const planTimes = await fetchPlanTimes(productName);

        if (planTimes.length === 0) {
            return res.status(404).json({ message: `❌ No Plan Times found for this Product: ${productName}` });
        }

        // setupAlertInterval(productName, planTimes);

        return res.json({
            productName,
            recipeId: planTimes[0].product_id,
            planTimes
        });
    } catch (error) {
        console.error(`❌ ERROR in getPlanTime for product: ${productName}`, error);
        res.status(500).json({ message: "❌ Error in fetching Plan Times" });
    }
};