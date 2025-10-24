import { getPool } from '../config/db.js'; // Assuming app.js exports getPool
import sql from 'mssql';

export const addProduct = async (req, res) => {
    const { product_name, color_name, status, resin, foaming, color, bPerRound, bUse, chemicals } = req.body;

    const maxChemicals = 15; // จำนวนสูงสุดของ chemical ที่รองรับ
    const chemicalColumns = Array.from({ length: maxChemicals }, (_, i) => `chemical_${i + 1}`);

    // ตรวจสอบว่ามี product ซ้ำหรือไม่
    const checkQuery = `
        SELECT COUNT(*) AS count, product_name, color_name
        FROM PT_product_mst
        WHERE product_name = @product_name AND color_name = @color_name
        GROUP BY product_name, color_name
    `;

    const insertQuery = `
        INSERT INTO PT_product_mst (
            product_name, color_name, status, resin, foaming, color, bPerRound, bUse, ${chemicalColumns.join(", ")}
        ) VALUES (
            @product_name, @color_name, @status, @resin, @foaming, @color, @bPerRound, @bUse, ${chemicalColumns.map(col => `@${col}`).join(", ")}
        )
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters สำหรับเช็คซ้ำ
        request.input('product_name', sql.VarChar, product_name);
        request.input('color_name', sql.VarChar, color_name);

        // ตรวจสอบซ้ำ
        const checkResult = await request.query(checkQuery);
        if (checkResult.recordset.length > 0 && checkResult.recordset[0].count > 0) {
            return res.status(409).json({ 
                message: `ผลิตภัณฑ์ "${product_name}" สี "${color_name}" มีอยู่แล้วในระบบ`,
                duplicate: true,
                existing_product: {
                    product_name: product_name,
                    color_name: color_name
                }
            });
        }

        // สร้าง request ใหม่สำหรับ insert
        const insertRequest = pool.request();
        insertRequest.input('product_name', sql.VarChar, product_name);
        insertRequest.input('color_name', sql.VarChar, color_name);
        insertRequest.input('status', sql.VarChar, status);
        insertRequest.input('resin', sql.VarChar, resin);
        insertRequest.input('foaming', sql.VarChar, foaming);
        insertRequest.input('color', sql.VarChar, color);
        insertRequest.input('bPerRound', sql.Int, bPerRound);
        insertRequest.input('bUse', sql.Int, bUse);

        // กำหนด Chemical Parameters
        for (let i = 0; i < maxChemicals; i++) {
            insertRequest.input(`chemical_${i + 1}`, sql.VarChar, chemicals[i] || null);
        }

        await insertRequest.query(insertQuery);
        res.status(201).json({ 
            message: `เพิ่มผลิตภัณฑ์ "${product_name}" สำเร็จแล้ว`,
            success: true,
            product_data: {
                product_name: product_name,
                color_name: color_name,
                status: status,
                resin: resin,
                foaming: foaming,
                color: color,
                bPerRound: bPerRound,
                bUse: bUse,
                chemicals: chemicals.slice(0, maxChemicals)
            }
        });
    } catch (error) {
        console.error("❌ Error in adding product: ", error);
        
        // ตรวจสอบประเภทของ error
        if (error.code === 'EREQUEST') {
            return res.status(400).json({ 
                message: "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบใหม่",
                error: "Invalid request data"
            });
        } else if (error.code === 'ETIMEOUT') {
            return res.status(408).json({ 
                message: "การเชื่อมต่อฐานข้อมูลหมดเวลา กรุณาลองใหม่",
                error: "Database timeout"
            });
        } else {
            return res.status(500).json({ 
                message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
                error: "Internal server error"
            });
        }
    }
}

export const addChemical = async (req, res) => {
    const { chemical_name } = req.body;
    const query = `INSERT INTO PT_chemical_mst (chemical_name) VALUES (@chemical_name)`;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameter
        request.input('chemical_name', sql.VarChar, chemical_name);

        await request.query(query);
        res.status(201).json({ message: `✅ ${chemical_name} Chemical added successfully` });
    } catch (error) {
        console.error("❌ Error in adding chemical: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}