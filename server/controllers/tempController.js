import { getPool } from "../config/db.js";
import sql from "mssql";

export const getTempPlanTime = async (req, res) => {
    const { plantime_id } = req.params; // เปลี่ยนจาก product_name เป็น plantime_id

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('plantime_id', sql.VarChar, plantime_id);

        const tempPlanTimesResult = await request.query(`
            SELECT pt.*
            FROM PT_temp_time_mst pt
            WHERE pt.plantime_id = @plantime_id
        `);
        const tempPlanTimes = tempPlanTimesResult.recordset;

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this plantime_id' });
        }

        return res.status(200).json({
            plantime_id,
            productId: tempPlanTimes[0]?.product_id,
            tempPlanTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
};

export const getTempPlanTimeASC = async (req, res) => {
    const { plantime_id } = req.params; // เปลี่ยนจาก product_name เป็น plantime_id

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('plantime_id', sql.VarChar, plantime_id);

        const tempPlanTimesResult = await request.query(`
            SELECT pt.*
            FROM PT_temp_time_mst pt
            WHERE pt.plantime_id = @plantime_id
            ORDER BY pt.run_no, pt.batch_no
        `);
        const tempPlanTimes = tempPlanTimesResult.recordset;

        if (tempPlanTimes.length === 0) {
            return res.status(404).json({ message: '❌ No Temp Plan Times found for this plantime_id' });
        }

        return res.status(200).json({
            plantime_id,
            productId: tempPlanTimes[0]?.product_id,
            tempPlanTimes
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ message: "❌ Error in fetching Temp Plan Times" });
    }
};
