import express from 'express';
import { updateNewStartTime } from '../controllers/tempController.js';

const router = express.Router();

router.put('/tempplantime/update/:product_name/:temp_id', updateNewStartTime);

export default router;