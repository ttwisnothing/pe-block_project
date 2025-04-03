import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import { createConfigTimeTable } from './models/configModel.js';
import { createPlanTimeTable, createSummaryTable } from './models/plantimeModel.js';
import { createTempPlanTimeTable } from './models/tempplanModel.js';
import { createProductTable, createChemicalTable } from './models/productModel.js';
import postRoutes from './routes/postRoute.js';
import getRoutes from './routes/getRoute.js';
import putRoutes from './routes/putRoute.js';

// กำหนดค่า Environment จากไฟล์ .env
dotenv.config();

// สร้าง Express App
const app = express();
const PORT = process.env.PORT || 6090;

// middleware สำหรับรับข้อมูลแบบ JSON
app.use(cors());
app.use(express.json());

// connect กับฐานข้อมูล
const connectDB = async () => {
    try {
        await db.getConnection();
        console.log("✅ Database connected successfully");
        createProductTable();
        createChemicalTable(); 
        createConfigTimeTable();
        createPlanTimeTable();
        createTempPlanTimeTable();
        createSummaryTable();      
    } catch (error) {
        console.log("❌ Error in connecting database : ", error);
    }
}

// เรียกใช้งานฟังก์ชันเชื่อมต่อฐานข้อมูล
connectDB();

// กำหนด Route สำหรับการทำงานกับ Recipe
app.use('/api/post', postRoutes);
app.use('/api/get', getRoutes);
app.use('/api/put', putRoutes);

// กำหนด Port ให้ Express App ทำงาน
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});