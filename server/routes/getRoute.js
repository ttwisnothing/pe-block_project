import express from 'express';
import { getNewPlantime, getPlanTime, listPlantime } from './../controllers/plantimeController.js';
import { getTempPlanTime, getTempPlanTimeASC } from '../controllers/tempController.js';
import { getChemicals, getProducts, getProductsName } from './../controllers/productController.js';
import { getProduction, getRunRecord, getRunRecordData, getRunStatus } from '../controllers/productionController.js';
import { addPlantime } from '../models/plantimeModel.js';
import { updateNewStartTime } from '../models/tempplanModel.js';
import { AvailabilityQuery, MachineOEEQuery, MachineQuery, OEEQuery, PerformanceQuery, QualityQuery, selectDate, selectPlanId } from '../models/oeeModel.js';

const router = express.Router();

router.get('/chemicals', getChemicals);
router.get('/products', getProductsName);
router.get('/plantime/:plantimeId', getPlanTime);
router.get('/tempplantime/:plantime_id', getTempPlanTime);
router.get('/temp-time-asc/:plantime_id', getTempPlanTimeASC);
router.get('/all-products', getProducts);
router.get('/list-plantime', listPlantime);
router.get('/production/all', getProduction);
router.get('/production/:productionId/run', getRunRecord);
router.get('/production/record-data/run/:recordId', getRunRecordData);
router.get('/production/run/status/:productionId', getRunStatus);
router.get('/oee/availability/', AvailabilityQuery);
router.get('/oee/performance/', PerformanceQuery);
router.get('/oee/quality/', QualityQuery);
router.get('/oee/', OEEQuery);
router.get('/oee/machine/block-total', MachineQuery);
router.get('/oee/machine/oee/', MachineOEEQuery);
router.get('/oee/get/plantime', selectPlanId);
router.get('/oee/get/select-date/', selectDate);

// test route for plantime
router.get('/test-plantime/:product_name', addPlantime);
router.get('/test-new-plantime/:plantimeId', getNewPlantime);
router.get('/test-temp-plantime/:product_name/:temp_id', updateNewStartTime);

export default router;