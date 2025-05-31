import { getPool } from '../config/db.js'; // Assuming app.js exports getPool
import sql from 'mssql';

export const addProduct = async (req, res) => {
    const { product_name, color_name, status, resin, foaming, color, bPerRound, bUse, chemicals } = req.body;

    const maxChemicals = 15; // จำนวนสูงสุดของ chemical ที่รองรับ
    const chemicalColumns = Array.from({ length: maxChemicals }, (_, i) => `chemical_${i + 1}`);

    const query = `
        INSERT INTO PT_product_mst (
            product_name, color_name, status, resin, foaming, color, bPerRound, bUse, ${chemicalColumns.join(", ")}
        ) VALUES (
            @product_name, @color_name, @status, @resin, @foaming, @color, @bPerRound, @bUse, ${chemicalColumns.map(col => `@${col}`).join(", ")}
        )
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        // กำหนด Parameters
        request.input('product_name', sql.VarChar, product_name);
        request.input('color_name', sql.VarChar, color_name);
        request.input('status', sql.VarChar, status);
        request.input('resin', sql.VarChar, resin);
        request.input('foaming', sql.VarChar, foaming);
        request.input('color', sql.VarChar, color);
        request.input('bPerRound', sql.Int, bPerRound);
        request.input('bUse', sql.Int, bUse);

        // กำหนด Chemical Parameters
        for (let i = 0; i < maxChemicals; i++) {
            request.input(`chemical_${i + 1}`, sql.VarChar, chemicals[i] || null);
        }

        await request.query(query);
        res.status(201).json({ message: "✅ Product added successfully" });
    } catch (error) {
        console.error("❌ Error in adding product: ", error);
        res.status(500).json({ message: "Internal server error" });
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