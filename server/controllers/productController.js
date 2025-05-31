import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

// ดึงชื่อ Product ทั้งหมดจากฐานข้อมูล
export const getProductsName = async (req, res) => {
    const query = `SELECT DISTINCT product_name AS name FROM PT_product_mst`;

    try {
        const pool = await getPool();
        const result = await pool.request().query(query);
        return res.status(200).json({ products: result.recordset });
    } catch (error) {
        console.error("❌ Error in fetching products: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ดึงข้อมูล Product ทั้งหมดจากฐานข้อมูล
export const getProducts = async (req, res) => {
    const { product_name, color } = req.body;

    try {
        const pool = await getPool();
        const request = pool.request();

        const columnQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'PT_product_mst' AND COLUMN_NAME LIKE 'chemical_%'
            ORDER BY COLUMN_NAME
        `

        const columnResult = await request.query(columnQuery);
        const chemicalColumns = columnResult.recordset.map(row => row.COLUMN_NAME);

        const query = `
            SELECT ${chemicalColumns.join(', ')} 
            FROM PT_product_mst 
            WHERE product_name = @product_name AND color_name = @color
        `;

        request.input('product_name', sql.VarChar, product_name);
        request.input('color', sql.VarChar, color);
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "❌ Product not found" });
        }
        
        // แปลงข้อมูล chemical จาก column เป็น array
        const productData = result.recordset[0];
        const chemicals = [];
        
        for (const column of chemicalColumns) {
            if (productData[column]) {
                chemicals.push(productData[column]);
            }
        }
        
        return res.status(200).json({
            productName: product_name + (color ? ` (${color})` : ''),
            chemicals: chemicals
        });
    } catch (error) {
        console.error("❌ Error in fetching products: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ดึงชื่อ Chemical ทั้งหมดจากฐานข้อมูล
export const getChemicals = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT chemical_name AS name, type_chem FROM PT_chemical_mst`);
        const chemicals = result.recordset;

        // แยก chemicals ตาม type
        const resin = chemicals.filter((chemical) => chemical.type_chem === 'Resin');
        const foaming = chemicals.filter((chemical) => chemical.type_chem === 'Foaming');
        const color = chemicals.filter((chemical) => chemical.type_chem === 'Color');

        // ส่งข้อมูล chemicals ทั้งหมด พร้อมกับ resin, foaming, และ color
        return res.status(200).json({ chemicals, resin, foaming, color });
    } catch (error) {
        console.error("❌ Error in fetching chemicals: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};