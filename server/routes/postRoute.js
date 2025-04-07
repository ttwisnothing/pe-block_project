import express from 'express';
import { addConfig } from '../controllers/configController.js';
import { addPlantime } from '../controllers/plantimeController.js';
import { addTempMB, addTempPlanTime } from '../controllers/tempController.js';
import { addProduct, addChemical } from '../controllers/productController.js';

const router = express.Router();

router.post('/config/add', addConfig);
router.post('/product/add', addProduct);
router.post('/chemical/add', addChemical);
router.post('/plantime/add/:product_name', addPlantime);
router.post('/plantime/temp/add/:product_name', addTempPlanTime);
router.post('/plantime/temp-mb/add/:product_name', addTempMB);


export default router;