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

// ดึงข้อมูล Machine ทั้งหมดจากฐานข้อมูล
export const getMachine = async (req, res) => {
    const query = `SELECT * FROM machine_table`;

    try {
        const [machines] = await db.query(query);
        if (machines.lenght === 0) {
            res.status(404).send("No Machine found");
            console.log("❌ No Machine found");
        } else {
            res.status(200).json(mschine);
            console.log("✅ Machine data fetched successfully");
        }
    } catch (error) {
        res.status(500).send("Error in fetching machine data");
        console.log("❌ Error in fetching machine data : ", error);
    }
}