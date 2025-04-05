import db from "../config/db.js";

export const addProduct = async (req, res) => {
    const { product_name, status, resin, foaming, color, bPerRound, bUse, chemicals } = req.body;

    // ตรวจสอบจำนวน chemicals ที่ส่งมา
    const maxChemicals = 15; // จำนวนสูงสุดของ chemical ที่รองรับ
    const chemicalColumns = Array.from({ length: maxChemicals }, (_, i) => `chemical_${i + 1}`);
    const chemicalValues = Array.from({ length: maxChemicals }, (_, i) => chemicals[i] || null);

    const query = `
        INSERT INTO product_master (
            product_name, status, resin, foaming, color, bPerRound, bUse, ${chemicalColumns.join(", ")}
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ${chemicalColumns.map(() => "?").join(", ")})
    `;

    try {
        // บันทึกข้อมูลลงฐานข้อมูล
        await db.query(query, [product_name, status, resin, foaming, color, bPerRound, bUse, ...chemicalValues]);
        res.status(201).json({ message: "✅ Product added successfully" });
    } catch (error) {
        console.error("❌ Error in adding product: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// บันทึกข้อมูลลง chemical_master
export const addChemical = async (req, res) => {
    const { chemical_name } = req.body;
    const query = `INSERT INTO chemical_master (chemical_name) VALUES ('${chemical_name}')`;

    try {
        await db.query(query);
        res.status(201).json({ message: `✅ ${chemical_name} Chemical added successfully` });
    } catch (error) {
        console.log("❌ Error in adding chemical: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// ดึงชื่อ Product ทั้งหมดจากฐานข้อมูล
export const getProducts = async (req, res) => {
    const query = `SELECT product_name AS name FROM product_master`;

    try {
        const [products] = await db.query(query);
        return res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: "❌ Error in fetching products" });
        console.log(error);
    }
}

// ดึงชื่อ Chemical ทั้งหมดจากฐานข้อมูล
export const getChemicals = async (req, res) => {
    try {
        // ดึงข้อมูล chemicals ทั้งหมด
        const [chemicals] = await db.query(`SELECT chemical_name AS name, type FROM chemical_master`);

        // แยก chemicals ตาม type
        const resin = chemicals.filter((chemical) => chemical.type === 'Resin');
        const foaming = chemicals.filter((chemical) => chemical.type === 'Foaming');
        const color = chemicals.filter((chemical) => chemical.type === 'Color');

        // ส่งข้อมูล chemicals ทั้งหมด พร้อมกับ resin, foaming, และ color
        return res.status(200).json({ chemicals, resin, foaming, color });
    } catch (error) {
        res.status(500).json({ message: "❌ Error in fetching chemicals" });
        console.log(error);
    }
};