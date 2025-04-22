import express from 'express';
import { getPlanTime } from './../controllers/plantimeController.js';
import { getTempPlanTime, getTempPlanTimeASC } from '../controllers/tempController.js';
import { getProducts, getChemicals } from './../controllers/productController.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProducts);
router.get('/plantime/:productName', getPlanTime);
router.get('/tempplantime/:product_name', getTempPlanTime);
router.get('/temp-time-asc/:product_name', getTempPlanTimeASC);
// router.get('/machine/:product_name', updateMac);
// router.get('/test/update/temp/:product_name/:temp_id', updateNewStartTime)

export default router;