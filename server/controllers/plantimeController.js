import { getPool } from '../config/db.js';
import sql from 'mssql';

// ฟังก์ชันสำหรับแยก product name และ color name
const parseProductNameAndColor = (fullProductName) => {
    if (!fullProductName) {
        return { productName: null, colorName: null };
    }

    // Pattern 1: "RP-300S(WH)" - มีวงเล็บ
    const bracketMatch = fullProductName.match(/^(.+?)\(([^)]+)\)$/);
    if (bracketMatch) {
        return {
            productName: bracketMatch[1].trim(),
            colorName: bracketMatch[2].trim()
        };
    }

    // Pattern 2: "RP-300S WH" - มีช่องว่าง และส่วนท้ายเป็นรหัสสี (2-3 ตัวอักษร)
    const spaceMatch = fullProductName.match(/^(.+)\s+([A-Z]{2,3})$/);
    if (spaceMatch) {
        return {
            productName: spaceMatch[1].trim(),
            colorName: spaceMatch[2].trim()
        };
    }

    // Pattern 3: "RP-300S-WH" - มีเครื่องหมาย dash
    const dashMatch = fullProductName.match(/^(.+)-([A-Z]{2,3})$/);
    if (dashMatch) {
        return {
            productName: dashMatch[1].trim(),
            colorName: dashMatch[2].trim()
        };
    }

    // ถ้าไม่ตรงกับ pattern ใดเลย ให้ส่งกลับเป็น product name ทั้งหมด
    return {
        productName: fullProductName.trim(),
        colorName: null
    };
};

// ฟังก์ชันสำหรับแกะวันที่จาก plantime_id
const extractDateFromPlantimeId = (plantimeId) => {
    const match = plantimeId.match(/^PTID(\d{8})/);
    if (!match) return null;
    const y = match[1].slice(0, 4);
    const m = match[1].slice(4, 6);
    const d = match[1].slice(6, 8);
    return `${y}-${m}-${d}`; // yyyy-mm-dd
};

// ฟังก์ชันแปลง yyyy-mm-dd + HH:mm:ss เป็น Date object
function combineDateTime(dateStr, timeStr) {
    // dateStr: yyyy-mm-dd, timeStr: HH:mm:ss
    return new Date(`${dateStr}T${timeStr}`);
}

export const getPlanTime = async (req, res) => {
    const { plantimeId } = req.params; // เปลี่ยนชื่อ param

    try {
        console.log(`🔄 getPlanTime called for plantime_id: ${plantimeId} at ${new Date().toLocaleString()}`);

        // Query ด้วย plantime_id
        const pool = await getPool();
        const request = pool.request();
        request.input('plantime_id', sql.VarChar, plantimeId);

        const result = await request.query(`
            SELECT pt.*, rt.product_name, rt.color_name
            FROM PT_plan_time_mst pt
            INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
            WHERE pt.plantime_id = @plantime_id
            ORDER BY pt.run_no ASC, pt.batch_no ASC
        `);

        const planTimes = result.recordset;

        if (planTimes.length === 0) {
            return res.status(404).json({ message: `❌ No Plan Times found for this Plantime ID: ${plantimeId}` });
        }

        return res.json({
            plantimeId,
            recipeId: planTimes[0].product_id,
            productName: planTimes[0].product_name,
            colorName: planTimes[0].color_name,
            planTimes
        });
    } catch (error) {
        console.error(`❌ ERROR in getPlanTime for plantime_id: ${plantimeId}`, error);
        res.status(500).json({ message: "❌ Error in fetching Plan Times" });
    }
};

export const listPlantime = async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();

        // ดึงข้อมูลจาก FM_production_record
        const query = `
            SELECT 
                id,
                plantime_id,
                product_name as full_product_name,
                create_date,
                start_time,
                end_time
            FROM FM_production_record
            ORDER BY id DESC
        `;

        const result = await request.query(query);

        // แปลงข้อมูลและแยก product name กับ color name
        const formattedData = result.recordset.map(record => {
            const { productName, colorName } = parseProductNameAndColor(record.full_product_name);

            return {
                product_id: record.id,
                plantime_id: record.plantime_id,
                product_name: productName,
                color_name: colorName,
                full_product_name: record.full_product_name, // เก็บไว้สำหรับ debug
                create_date: record.create_date,
                startTime: record.start_time ?
                    new Date(record.start_time).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }) : null,
                endTime: record.end_time ?
                    new Date(record.end_time).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }) : null
            };
        });

        // ส่ง Array กลับไป
        return res.json(formattedData);

    } catch (error) {
        console.error(`❌ ERROR in listPlantime`, error);
        res.status(500).json({
            message: "❌ Error in fetching Plan Times",
            error: error.message
        });
    }
};

export const getNewPlantime = async (req, res) => {
    const { plantimeId } = req.params;

    try {
        console.log(`🔄 getNewPlantime called for PlantimeID: ${plantimeId} at ${new Date().toLocaleString()}`);

        const pool = await getPool();
        const request = pool.request();
        request.input('plantime_id', sql.VarChar, plantimeId);

        const result = await request.query(`
            SELECT 
                pt.id, pt.machine, pt.batch_no, pt.run_no, pt.plantime_id,
                rt.product_name + '(' + rt.color_name + ')' AS productDisplay,
                v.processName, v.processTime
            FROM PT_plan_time_mst pt
            INNER JOIN PT_product_mst rt 
                ON pt.product_id = rt.product_id
            CROSS APPLY (VALUES
                ('start_time', pt.start_time), ('mixing', pt.mixing),
                ('solid_block', pt.solid_block), ('extruder_exit', pt.extruder_exit),
                ('mold_primary_press', pt.mold_primary_press), ('pre_press_exit', pt.pre_press_exit),
                ('primary_press_start', pt.primary_press_start), ('stream_in', pt.stream_in),
                ('primary_press_exit', pt.primary_press_exit), ('secondary_press_1_start', pt.secondary_press_1_start),
                ('temp_check_1', pt.temp_check_1), ('secondary_press_2_start', pt.secondary_press_2_start),
                ('temp_check_2', pt.temp_check_2), ('cooling', pt.cooling),
                ('trolley_in', pt.trolley_in), ('trolley_out', pt.trolley_out),
                ('secondary_press_exit', pt.secondary_press_exit), ('remove_work', pt.remove_work)
            ) AS v(processName, processTime)
            WHERE pt.plantime_id = @plantime_id
              AND v.processTime IS NOT NULL
            ORDER BY TRY_CONVERT(time, v.processTime)
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: `❌ No Plan Times found for this Plantime ID: ${plantimeId}` });
        }

        // หา index ของ process start_time (batch 1, run 1)
        const startIdx = result.recordset.findIndex(
            row => row.processName === "start_time" && row.batch_no === 1 && row.run_no === 1
        );

        // ถ้าเจอ start_time ให้ reorder array โดยเอา start_time ขึ้นก่อน
        let orderedRecordset = result.recordset;
        if (startIdx > 0) {
            orderedRecordset = [
                ...result.recordset.slice(startIdx),
                ...result.recordset.slice(0, startIdx)
            ];
        }

        // เพิ่ม logic ข้ามวัน
        const dateFromId = extractDateFromPlantimeId(plantimeId);
        let prevTime = null;
        let dayOffset = 0;

        let planTimes = orderedRecordset.map((row, idx) => {
            // แปลง processTime เป็น string HH:mm:ss
            let timeStr = null;
            if (row.processTime instanceof Date) {
                timeStr = row.processTime.toTimeString().slice(0, 8);
            } else if (typeof row.processTime === "string") {
                timeStr = row.processTime.slice(0, 8);
            }

            // เช็คข้ามวัน
            if (prevTime && timeStr && prevTime > timeStr) {
                dayOffset += 1;
            }
            prevTime = timeStr;

            // คำนวณวันที่ใหม่
            const dateObj = new Date(dateFromId);
            dateObj.setDate(dateObj.getDate() + dayOffset);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            const dd = String(dateObj.getDate()).padStart(2, "0");
            const thisDate = `${yyyy}-${mm}-${dd}`;

            return {
                ...row,
                dateFromId: thisDate,
                fullDateTime: `${thisDate}T${timeStr}`
            };
        });

        // Sort ใหม่ด้วย fullDateTime
        planTimes = planTimes.sort((a, b) => {
            return new Date(a.fullDateTime) - new Date(b.fullDateTime);
        });

        return res.json({
            plantimeId,
            productName: result.recordset[0].productDisplay,
            planTimes
        });
    } catch (error) {
        console.error(`❌ ERROR in getNewPlantime for plantime_id: ${plantimeId}`, error);
        res.status(500).json({ message: "❌ Error in fetching New Plan Times" });
    }
}