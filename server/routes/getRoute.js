import express from 'express';
import { addPlantime, getPlanTime } from './../controllers/plantimeController.js';
import { getTempPlanTime, getTempPlanTimeASC } from '../controllers/tempController.js';
import { getProducts, getChemicals } from './../controllers/productController.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProducts);
router.get('/plantime/:productName', getPlanTime);
router.get('/tempplantime/:product_name', getTempPlanTime);
router.get('/temp-time-asc/:product_name', getTempPlanTimeASC);
router.get('/test/plantime/:product_name', addPlantime);
// router.get('/machine/:product_name', updateMac);


export default router;