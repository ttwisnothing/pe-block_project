import express from 'express';
import { updateNewStartTime } from '../models/tempplanModel.js';
import { updateMac } from '../models/tempplanModel.js';

const router = express.Router();

router.put('/tempplantime/update/:product_name/:temp_id', updateNewStartTime);
router.put('/tempplantime/upmachine/:product_name', updateMac);

export default router;