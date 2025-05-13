import express from 'express';
import { getPlanTime } from './../controllers/plantimeController.js';
import { getTempPlanTime, getTempPlanTimeASC } from '../controllers/tempController.js';
import { getChemicals, getProducts, getProductsName } from './../controllers/productController.js';
// import { testPlantime } from '../models/plantimeModel.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProductsName);
router.get('/plantime/:productName', getPlanTime);
router.get('/tempplantime/:product_name', getTempPlanTime);
router.get('/temp-time-asc/:product_name', getTempPlanTimeASC);
router.get('/all-products', getProducts);

export default router;