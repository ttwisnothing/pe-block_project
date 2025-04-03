import db from "../config/db.js";

// สร้าง Product_Table เพื่อเก็บข้อมูล
export const createProductTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS product_master (
                product_id INT PRIMARY KEY AUTO_INCREMENT,
                product_name VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL,
                resin VARCHAR(255),
                foaming VARCHAR(255),
                color VARCHAR(255), bPerRound INT NOT NULL, bUse INT NOT NULL,
                chemical_1 VARCHAR(255), chemical_2 VARCHAR(255), chemical_3 VARCHAR(255), chemical_4 VARCHAR(255), chemical_5 VARCHAR(255),
                chemical_6 VARCHAR(255), chemical_7 VARCHAR(255), chemical_8 VARCHAR(255), chemical_9 VARCHAR(255), chemical_10 VARCHAR(255),
                chemical_11 VARCHAR(255), chemical_12 VARCHAR(255), chemical_13 VARCHAR(255), chemical_14 VARCHAR(255), chemical_15 VARCHAR(255)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'product_table' : ", error);
    }
}

// สร้าง Chemical_Table เพื่อเก็บข้อมูล
export const createChemicalTable = async () => {
    try {
        await db.query(
            `
            CREATE TABLE IF NOT EXISTS chemical_master (
                chemical_id INT PRIMARY KEY AUTO_INCREMENT,
                chemical_name VARCHAR(255) NOT NULL,
                type VARCHAR(255)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
            `
        )
    } catch (error) {
        console.log("❌ Error in creating table 'chemical_table' : ", error);
    }
}
