import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import { createRecipeTable } from './models/recipeModel.js';
import { createConfigTimeTable } from './models/configModel.js';
import { createPlanTimeTable } from './models/plantimeModel.js';
import { createMachineTable } from './models/machineModel.js';
import postRoutes from './routes/postRoute.js';
import getRoutes from './routes/getRoute.js';

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
        createRecipeTable();
        createConfigTimeTable();
        createPlanTimeTable();
        createMachineTable();
    } catch (error) {
        console.log("❌ Error in connecting database : ", error);
    }
}

// เรียกใช้งานฟังก์ชันเชื่อมต่อฐานข้อมูล
connectDB();

// กำหนด Route สำหรับการทำงานกับ Recipe
app.use('/api', postRoutes);
app.use('/api', getRoutes);

// กำหนด Port ให้ Express App ทำงาน
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});