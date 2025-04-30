import { getPool } from '../config/db.js';
import sql from 'mssql';

export const getConfig = async (req, res) => {

    try {
        const pool = await getPool();
        const request = pool.request();

        const result = await request.query('SELECT * FROM Config');
        const configData = result.recordset[0]; // Assuming you want the first row of the result

        return res.json(configData);
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
