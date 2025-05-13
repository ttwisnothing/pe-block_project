import express from 'express';
import { addConfig } from '../models/configModel.js';
import { addPlantime } from '../models/plantimeModel.js';
import { addTempMB, addTempPlanTime } from '../models/tempplanModel.js';
import { addProduct, addChemical } from '../models/productModel.js';
import { addChemicalNameStep, addChemicalWeightStep, addProduction } from '../models/productionModel.js';

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

export default router;