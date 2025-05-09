import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoute.js';
import getRoutes from './routes/getRoute.js';
import putRoutes from './routes/putRoute.js';
import connectDB from './config/db.js';

// กำหนดค่า Environment จากไฟล์ .env
dotenv.config();

// สร้าง Express App
const app = express();
const PORT = process.env.PORT;

// middleware สำหรับรับข้อมูลแบบ JSON
app.use(cors(
    // {
    // origin: 'http://192.168.2.83:9920',
    // methods: ['GET', 'POST', 'PUT'],
    // credentials: true
    // }
));
app.use(express.json());

// เชื่อมต่อกับฐานข้อมูล
connectDB();

// กำหนด Route สำหรับการทำงานกับ Recipe
app.use('/api/post', postRoutes);
app.use('/api/get', getRoutes);
app.use('/api/put', putRoutes);

// กำหนด Port ให้ Express App ทำงาน
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});