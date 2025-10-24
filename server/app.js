import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoute.js';
import getRoutes from './routes/getRoute.js';
import putRoutes from './routes/putRoute.js';
import connectDB from './config/db.js';
import client from 'prom-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6090;

// Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({
    app: 'pe-block-api',
    prefix: 'pe_block_api_',
    timeout: 10000,
    gcDurationHistogram: true,
    register,
});

const httpRequestCounter = new client.Counter({
    name: 'http_request_count',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
});
const httpRequestDurationHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationHistogram);

// Metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestCounter.inc({ method: req.method, path: req.path, status: res.statusCode });
        httpRequestDurationHistogram.observe({ method: req.method, path: req.path, status: res.statusCode }, duration);
    });
    next();
});

app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/post', postRoutes);
app.use('/api/get', getRoutes);
app.use('/api/put', putRoutes);

app.get('/metrics', async (req, res) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch (err) {
        console.error('Error serving metrics:', err);
        res.status(500).send('Error serving metrics');
    }
});

app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
