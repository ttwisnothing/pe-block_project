import db from "../config/db.js";

// บันทึกข้อมูล Machine ลงในฐานข้อมูล
export const addMachine = async (req, res) => {
    const { machine_name } = req.body;
    const query = `
        INSERT INTO machine_table (machine_name) VALUES ('${machine_name}')
    `;
    try {
        await db.query(query);
        res.status(201).send("Machine added successfully");
    } catch (error) {
        res.status(500).send("Error in adding config");
        console.log("❌ Error in adding config : ", error);
    }
}