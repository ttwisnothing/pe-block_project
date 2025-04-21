import { getPool } from '../config/db.js'; // นำเข้า getPool จาก db.js
import sql from 'mssql';

// ดึงชื่อ Product ทั้งหมดจากฐานข้อมูล
export const getProducts = async (req, res) => {
    const query = `SELECT DISTINCT product_name AS name FROM product_mst`;

    try {
        const pool = await getPool();
        const result = await pool.request().query(query);
        return res.status(200).json({ products: result.recordset });
    } catch (error) {
        console.error("❌ Error in fetching products: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ดึงชื่อ Chemical ทั้งหมดจากฐานข้อมูล
export const getChemicals = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT chemical_name AS name, type_chem FROM chemical_mst`);
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