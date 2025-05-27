import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

const fetchPlanTimes = async (productName) => {
    const pool = await getPool();
    const request = pool.request();
    request.input('productName', sql.VarChar, productName);

    const result = await request.query(`
        SELECT pt.*, rt.product_name, rt.color_name
        FROM plan_time_mst pt
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

export const listPlantime = async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();

        // JOIN product_mst เพื่อดึงชื่อ product และสี
        const query = `
            SELECT pt.id, pt.product_id, pt.start_time, pt.mixing
                ,pt.solid_block, pt.extruder_exit, pt.pre_press_exit, pt.primary_press_start
                ,pt.stream_in, pt.primary_press_exit, pt.secondary_press_1_start, pt.temp_check_1
                ,pt.secondary_press_2_start, pt.temp_check_2, pt.cooling, pt.secondary_press_exit
                ,pt.remove_work
                ,pm.product_name, pm.color_name
            FROM plan_time_mst pt
            INNER JOIN product_mst pm ON pt.product_id = pm.product_id
            ORDER BY pt.product_id ASC, pt.id ASC
        `;

        const result = await request.query(query);
        const planTimes = result.recordset;

        const timeColumns = [
            'start_time', 'mixing', 'solid_block', 'extruder_exit', 'pre_press_exit',
            'primary_press_start', 'stream_in', 'primary_press_exit', 'secondary_press_1_start',
            'temp_check_1', 'secondary_press_2_start', 'temp_check_2', 'cooling',
            'secondary_press_exit', 'remove_work'
        ];

        // แยกข้อมูลตาม product_id
        const grouped = {};
        for (const row of planTimes) {
            if (!grouped[row.product_id]) grouped[row.product_id] = [];
            grouped[row.product_id].push(row);
        }

        // สร้างผลลัพธ์สำหรับแต่ละ product_id
        const resultArr = Object.entries(grouped).map(([product_id, rows]) => {
            const firstRow = rows[0];
            const lastRow = rows[rows.length - 1];
            const startTime = timeColumns.map(col => firstRow[col]).find(Boolean) || null;
            const lastTimes = timeColumns.map(col => lastRow[col]).filter(Boolean);
            const endTime = lastTimes.length > 0 ? lastTimes[lastTimes.length - 1] : null;

            return {
                product_id,
                product_name: firstRow.product_name,
                color_name: firstRow.color_name,
                startTime,
                endTime
            };
        });

        return res.json(resultArr);
    } catch (error) {
        console.error(`❌ ERROR in listPlantime`, error);
        res.status(500).json({ message: "❌ Error in fetching Plan Times" });
    }
}