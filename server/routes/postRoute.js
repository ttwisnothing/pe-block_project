import express from 'express';
import { addConfig } from '../models/configModel.js';
import { addPlantime } from '../models/plantimeModel.js';
import { addTempMB, addTempPlanTime } from '../models/tempplanModel.js';
import { addProduct, addChemical } from '../models/productModel.js';
import {
    addChemicalNameStep, addChemicalWeightStep,
    addCuttingStep, addMixingStep,
    addPrePress, addProduction,
    addProductRecord,
    addSecondPrepress, foamCheck
} from '../models/productionModel.js';

const router = express.Router();

router.post('/config/add', addConfig);
router.post('/product/add', addProduct);
router.post('/chemical/add', addChemical);
router.post('/plantime/add/:product_name', addPlantime);
router.post('/plantime/temp/add/:product_name', addTempPlanTime);
router.post('/plantime/temp-mb/add/:product_name', addTempMB);
router.post('/production/add', addProduction);
router.post('/production/chemical-name/add', addChemicalNameStep);
router.post('/production/chemical-weight/add', addChemicalWeightStep);
router.post('/production/mixing-step/add', addMixingStep);
router.post('/production/cutting-step/add', addCuttingStep);
router.post('/production/pre-press-step/add', addPrePress);
router.post('/production/second-press/add', addSecondPrepress);
router.post('/production/foam-check/add', foamCheck);
router.post('/production/head/:proName', addProductRecord);

export default router;