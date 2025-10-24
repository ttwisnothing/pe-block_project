import express from "express";
import { addConfig } from "../models/configModel.js";
import { addPlantime } from "../models/plantimeModel.js";
import { addTempMB, addTempPlanTime } from "../models/tempplanModel.js";
import { addProduct, addChemical } from "../models/productModel.js";
import {
  addChemicalNameStep,
  addChemicalWeightStep,
  addCuttingStep,
  addMixingStep,
  addPrePress,
  addPrimaryPress,
  addProductRecord,
  addRunRecord,
  addSecondPrepress,
  foamCheck,
  newProductionRecord,
} from "../models/productionModel.js";

const router = express.Router();

router.post("/config/add", addConfig);
router.post("/product/add", addProduct);
router.post("/chemical/add", addChemical);
router.post("/plantime/add/:product_name", addPlantime);
router.post("/plantime/temp/add/:plantime_id", addTempPlanTime);
router.post("/plantime/temp-mb/add/:plantime_id", addTempMB);
router.post("/production/:productionId/run-record/add", addRunRecord);
router.post("/production/:runId/chemical-name/add", addChemicalNameStep);
router.post("/production/:runId/chemical-weight/add", addChemicalWeightStep);
router.post("/production/:runId/mixing-step/add", addMixingStep);
router.post("/production/:runId/cutting-step/add", addCuttingStep);
router.post("/production/:runId/pre-press-step/add", addPrePress);
router.post("/production/:runId/second-press/add", addSecondPrepress);
router.post("/production/:runId/foam-check/add", foamCheck);
router.post("/production/:runId/primary-press/add", addPrimaryPress);
router.post("/production/head", addProductRecord);
router.post("/new-production/head", newProductionRecord);

export default router;
