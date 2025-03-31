import db from "../config/db.js";

// บันทึกข้อมูลลง product_master
export const addProduct = async (req, res) => {
    const { product_name, status, resin, foaming, color, chemical_1, chemical_2, chemical_3, chemical_4, chemical_5, chemical_6, chemical_7, chemical_8, chemical_9, chemical_10, chemical_11, chemical_12, chemical_13, chemical_14, chemical_15 } = req.body;
    const query = `INSERT INTO product_master (product_name, status, resin, foaming, color, chemical_1, chemical_2, chemical_3, chemical_4, chemical_5, chemical_6, chemical_7, chemical_8, chemical_9, chemical_10, chemical_11, chemical_12, chemical_13, chemical_14, chemical_15) VALUES ('${product_name}', '${status}', '${resin}', '${foaming}', '${color}', '${chemical_1}', '${chemical_2}', '${chemical_3}', '${chemical_4}', '${chemical_5}', '${chemical_6}', '${chemical_7}', '${chemical_8}', '${chemical_9}', '${chemical_10}', '${chemical_11}', '${chemical_12}', '${chemical_13}', '${chemical_14}', '${chemical_15}')`;

    try {
        await db.query(query);
        res.status(201).json({ message: "✅ Product added successfully" });
    } catch (error) {
        console.log("❌ Error in adding product: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// บันทึกข้อมูลลง chemical_master
export const addChemical = async (req, res) => {
    const { chemical_name } = req.body;
    const query = `INSERT INTO chemical_master (chemical_name) VALUES ('${chemical_name}')`;

    try {
        await db.query(query);
        res.status(201).json({ message: "✅ Chemical added successfully" });
    } catch (error) {
        console.log("❌ Error in adding chemical: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}