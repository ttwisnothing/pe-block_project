import sql from 'mssql'
import dotenv from 'dotenv';

dotenv.config(); // โหลดค่าจากไฟล์ .env

let dbPool;

// สร้างการ connection ไปยังฐานข้อมูล
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: false,
      trustServerCertificate: false
    }
};

// connect กับฐานข้อมูล
const connectDB = async () => {
  try {
      dbPool = await sql.connect(config);
      console.log("✅ Database connected successfully");
      return dbPool;
  } catch (error) {
      console.error("❌ Error in connecting database : ", error);
      throw error; // throw error เพื่อให้สามารถจัดการกับ error ได้ในที่อื่น
  }
};

// ฟังก์ชันสำหรับเข้าถึง Connection Pool ที่สร้างไว้
export const getPool = () => {
  if (!dbPool) {
      throw new Error("Database pool not initialized. Call connectDB() first.");
  }
  return dbPool;
};

// ตัวอย่างการปิด Connection Pool เมื่อแอปพลิเคชันปิด
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  try {
      if (dbPool) {
          await dbPool.close();
          console.log('✅ Database connection closed.');
      }
  } catch (err) {
      console.error('❌ Error closing database connection:', err);
  } finally {
      process.exit(0);
  }
});

export default connectDB; // ส่งออก db ออกไปใช้งาน