import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // โหลดค่าจากไฟล์ .env

// สร้างการ connection ไปยังฐานข้อมูล
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

export default db; // ส่งออก db ออกไปใช้งาน