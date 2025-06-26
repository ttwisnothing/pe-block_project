import express from 'express';
import { getPlanTime, listPlantime } from './../controllers/plantimeController.js';
import { getTempPlanTime, getTempPlanTimeASC } from '../controllers/tempController.js';
import { getChemicals, getProducts, getProductsName } from './../controllers/productController.js';
import { getBatchRecord, getBatchRecordData, getBatchStatus, getProduction } from '../controllers/productionController.js';
import { addPlantime } from '../models/plantimeModel.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProductsName);
router.get('/plantime/:productName', getPlanTime);
router.get('/tempplantime/:product_name', getTempPlanTime);
router.get('/temp-time-asc/:product_name', getTempPlanTimeASC);
router.get('/all-products', getProducts);
router.get('/list-plantime', listPlantime);
router.get('/production/all', getProduction);
router.get('/production/:productionId/batches', getBatchRecord);
router.get('/production/record-data/batches/:recordId', getBatchRecordData)
router.get('/production/batches/status/:productionId', getBatchStatus);

// test route for plantime
router.get('/test-plantime/:product_name', addPlantime);

export default router;