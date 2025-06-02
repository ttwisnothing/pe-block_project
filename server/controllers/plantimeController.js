import { getPool } from '../config/db.js';
import sql from 'mssql';

const fetchPlanTimes = async (productName) => {
    const pool = await getPool();
    const request = pool.request();
    request.input('productName', sql.VarChar, productName);

    const result = await request.query(`
        SELECT pt.*, rt.product_name, rt.color_name
        FROM PT_plan_time_mst pt
        INNER JOIN PT_product_mst rt ON pt.product_id = rt.product_id
        WHERE rt.product_name = @productName
        ORDER BY pt.run_no ASC, pt.batch_no ASC
    `);

    return result.recordset;
}

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

        // ดึงข้อมูลจาก FM_production_record
        const query = `
            SELECT 
                id,
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
}