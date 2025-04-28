import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

export const getPlanTime = async (req, res) => {
    const { productName } = req.params;

    try {
        const startTime = new Date();
        console.log(`🔄 getPlanTime called for product: ${productName} at ${startTime.toLocaleString()}`);

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
            return res.status(404).json({ message: `❌ No Plan Times found for this Product: ${productName}` });
        }

        // คำนวณเวลาที่เหลือจนถึงวินาทีที่ 00
        const now = new Date();
        const millisecondsUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

        // ใช้ setTimeout เพื่อเริ่ม setInterval ในวินาทีที่ 00
        setTimeout(() => {
            const intervalId = setInterval(async () => {
                try {
                    await alertNotification(productName);
                } catch (error) {
                    console.error(`❌ ERROR in alertNotification interval for product: ${productName}`, error);
                    // ไม่หยุด interval ทันที แต่บันทึกข้อผิดพลาดไว้
                }
            }, 60000); // เรียกทุก 1 นาที

            // เก็บ intervalId ไว้เพื่อหยุดการทำงานในภายหลัง (ถ้าจำเป็น)
            global.intervalIds = global.intervalIds || {};
            global.intervalIds[productName] = intervalId;
        }, millisecondsUntilNextMinute);

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

const alertNotification = async (productName) => {
    try {
        console.log(`✅ alertNotification started for product: ${productName}`);

        // ดึงข้อมูลใหม่จากฐานข้อมูลทุกครั้ง
        const pool = await getPool();
        const request = pool.request();
        request.input('productName', sql.VarChar, productName);

        const result = await request.query(`
            SELECT pt.start_time,
                   pt.mixing,
                   pt.extruder_exit,
                   pt.pre_press_exit,
                   pt.primary_press_start,
                   pt.stream_in,
                   pt.primary_press_exit,
                   pt.secondary_press_1_start,
                   pt.temp_check_1,
                   pt.secondary_press_2_start,
                   pt.temp_check_2,
                   pt.cooling,
                   pt.secondary_press_exit
            FROM plan_time_table pt
            INNER JOIN product_mst rt ON pt.product_id = rt.product_id
            WHERE rt.product_name = @productName
            ORDER BY pt.run_no ASC, pt.batch_no ASC
        `);

        const planTimes = result.recordset;

        if (!planTimes || planTimes.length === 0) {
            console.log(`❌ No Plan Times found for product: ${productName}`);
            return;
        }

        console.log(`✅ Found ${planTimes.length} plan times for product: ${productName}`);

        // ดำเนินการแจ้งเตือนตามปกติ
        const currentTime = new Date();
        const notificationThresholdStart = 5 * 60 * 1000; // 5 นาที
        const notificationThresholdEnd = 10 * 60 * 1000; // 10 นาที
        const exactMatchThreshold = 60 * 1000; // ±1 นาที

        planTimes.forEach(firstRow => {
            for (const [key, value] of Object.entries(firstRow)) {
                if (value === null) {
                    continue; // ข้ามค่า null
                }

                // แปลงค่า value เป็นเวลาโดยใช้วันปัจจุบัน
                const [hours, minutes, seconds] = value.split(':');
                const eventTime = new Date(currentTime);
                eventTime.setHours(hours, minutes, seconds || 0); // ตั้งค่าวินาทีเป็น 0

                if (isNaN(eventTime.getTime())) {
                    continue; // ข้ามค่าที่ไม่ใช่เวลา
                }

                const timeDiff = eventTime - currentTime;

                // แจ้งเตือนเมื่อเวลาของเหตุการณ์อยู่ในช่วง 5-10 นาทีล่วงหน้า
                if (timeDiff > notificationThresholdStart && timeDiff <= notificationThresholdEnd) {
                    console.log(`⏰ Event "${key}" for product "${productName}" is within 5-10 minutes (at ${eventTime.toLocaleString()})!`);
                }

                // แจ้งเตือนเมื่อเวลาตรงกันแบบเป๊ะ ๆ (±1 นาที)
                if (Math.abs(timeDiff) <= exactMatchThreshold) {
                    console.log(`🚨 Event "${key}" for product "${productName}" is happening now (at ${eventTime.toLocaleString()})!`);
                }
            }
        });

        console.log(`✅ alertNotification completed successfully for product: ${productName}`);
    } catch (error) {
        console.error(`❌ ERROR for product: ${productName}`, error);
    };
}    