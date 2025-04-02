import express from 'express';
import { getPlanTime } from './../controllers/plantimeController.js';
import { getTempPlanTime, updateMachine } from '../controllers/tempController.js';
import { getTempPlanTimeASC } from './../controllers/tempController.js';
import { getMachine } from '../controllers/machineController.js';
import { getProducts, getChemicals } from './../controllers/productController.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProducts);
router.get('/machine', getMachine);
router.get('/plantime/:productName', getPlanTime);
router.get('/tempplantime/:product_name', getTempPlanTime);
router.get('/temp-time-asc/:product_name', getTempPlanTimeASC);
router.get('/up-mac/:product_name/:temp_id', updateMachine);




export default router;