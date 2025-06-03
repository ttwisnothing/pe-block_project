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

export const getBatchHeader = async (req, res) => {
    const { productionId } = req.params;

    try {
        const pool = await getPool();
        
        // ตรวจสอบว่ามี batch records อยู่แล้วหรือไม่
        const checkBatchQuery = `
            SELECT 
                fs.id,
                fs.batch_no,
                fs.record_date,
                fs.operator_name,
                fs.product_status,
                pr.product_name
            FROM FM_production_record pr
            LEFT JOIN FM_first_step fs ON pr.id = fs.product_record_id
            WHERE pr.id = @productionId
            ORDER BY fs.batch_no
        `;
        
        const checkRequest = pool.request();
        checkRequest.input('productionId', sql.Int, productionId);
        const checkResult = await checkRequest.query(checkBatchQuery);

        // ถ้าไม่มี batch records หรือมีแค่ row เดียวที่ batch_no เป็น null
        if (checkResult.recordset.length === 0 || 
            (checkResult.recordset.length === 1 && checkResult.recordset[0].batch_no === null)) {
            
            // ดึงข้อมูล production_record เพื่อหา total_batch
            const productionQuery = `
                SELECT id, product_name, total_batch, create_date 
                FROM FM_production_record 
                WHERE id = @productionId
            `;
            
            const prodRequest = pool.request();
            prodRequest.input('productionId', sql.Int, productionId);
            const prodResult = await prodRequest.query(productionQuery);
            
            if (prodResult.recordset.length > 0) {
                const { id, product_name, total_batch, create_date } = prodResult.recordset[0];
                
                // สร้าง batch records ตามจำนวน total_batch
                for (let i = 1; i <= total_batch; i++) {
                    const insertQuery = `
                        INSERT INTO FM_first_step (
                            product_record_id, batch_no, product_name, record_date
                        ) VALUES (
                            @productRecordId, @batchNo, @productName, @recordDate
                        )
                    `;
                    
                    const insertRequest = pool.request();
                    insertRequest.input('productRecordId', sql.Int, id);
                    insertRequest.input('batchNo', sql.Int, i);
                    insertRequest.input('productName', sql.NVarChar, product_name);
                    insertRequest.input('recordDate', sql.Date, create_date);
                    
                    await insertRequest.query(insertQuery);
                }
                
                // ดึงข้อมูลใหม่หลังสร้าง batch records
                const newResult = await checkRequest.query(checkBatchQuery);
                return res.status(200).json(newResult.recordset || []);
            }
        }

        // ถ้ามี batch records อยู่แล้ว ส่งข้อมูลกลับไปตามปกติ
        return res.status(200).json(checkResult.recordset || []);
        
    } catch (error) {
        console.error("❌ Error in fetching/creating batch details: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBatchRecordData = async (req, res) => {
    const { recordId } = req.params;

    const query = `
        SELECT
            t2.id, t2.product_record_id, t2.batch_no, t2.record_date, t2.product_status, t2.program_no, t2.product_name,
            t2.shift_time, t2.operator_name, t1.chemistry_1, t1.chemistry_2, t1.chemistry_3, t1.chemistry_4,
            t1.chemistry_5, t1.chemistry_6, t1.chemistry_7, t1.chemistry_8, t1.chemistry_9, t1.chemistry_10,
            t1.chemistry_11, t1.chemistry_12, t1.chemistry_13, t1.chemistry_14, t1.chemistry_15
        FROM
            FM_first_step AS t2
        LEFT JOIN
            FM_chemical_name_step AS t1 ON t2.product_record_id = t1.product_record_id
        WHERE
            t2.id = @recordId;
    `

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('recordId', sql.Int, recordId);

        const result = await request.query(query);

        // Format record_date และกรอง chemistry ที่ไม่เป็น null
        const formatted = (result.recordset || []).map(row => {
            // แยกข้อมูล chemistry ออกมา
            const chemistryFields = {};
            const otherFields = {};

            Object.keys(row).forEach(key => {
                if (key.startsWith('chemistry_')) {
                    // เก็บเฉพาะ chemistry ที่ไม่เป็น null และไม่เป็น empty string
                    if (row[key] !== null && row[key] !== '') {
                        chemistryFields[key] = row[key];
                    }
                } else {
                    if (key === 'record_date' && row[key]) {
                        // แปลงวันที่เป็น dd/MM/yyyy ปี ค.ศ.
                        const d = new Date(row[key]);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear(); // ปี ค.ศ.
                        otherFields[key] = `${day}/${month}/${year}`;
                    } else {
                        otherFields[key] = row[key];
                    }
                }
            });

            return {
                ...otherFields,
                ...chemistryFields
            };
        });

        return res.status(200).json(formatted);
    }
    catch (error) {
        console.error("❌ Error in fetching record data: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const upFirstStep = async (req, res) => {
    const { productStatus, programNo, shiftTime, operatorName } = req.body;
    const { recordId } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();

        // Update the first step with the provided data
        const query = `
            UPDATE FM_first_step
            SET product_status = @productStatus,
                program_no = @programNo,
                shift_time = @shiftTime,
                operator_name = @operatorName
            WHERE id = @recordId;
        `;

        request.input('productStatus', sql.NVarChar, productStatus);
        request.input('programNo', sql.NVarChar, programNo);
        request.input('shiftTime', sql.NVarChar, shiftTime);
        request.input('operatorName', sql.NVarChar, operatorName);
        request.input('recordId', sql.Int, recordId);

        await request.query(query);

        res.status(200).json({ message: "First step updated successfully." });
    } catch (error) {
        console.error("❌ Error in updating first step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}