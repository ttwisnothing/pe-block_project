import express from 'express';
import { updateNewStartTime, updateMac } from '../models/tempplanModel.js';
import {
  upFirstStep,
  upChemicalNameStep,
  upChemicalWeightStep,
  upMixStep,
  upCutStep,
  upPrePressStep,
  upPrimaryPressStep,
  upSecondaryPressStep,
  upFoamCheckStep
} from '../controllers/productionController.js';

const router = express.Router();

router.put('/tempplantime/update/:product_name/:temp_id', updateNewStartTime);
router.put('/tempplantime/upmachine/:product_name', updateMac);


router.put('/production/update/record/:recordId', upFirstStep);
router.put('/production/update/chemical-name/:recordId', upChemicalNameStep);
router.put('/production/update/chemical-weight/:recordId', upChemicalWeightStep);
router.put('/production/update/mixing/:recordId', upMixStep);
router.put('/production/update/cutting/:recordId', upCutStep);
router.put('/production/update/prepress/:recordId', upPrePressStep);
router.put('/production/update/primarypress/:recordId', upPrimaryPressStep);
router.put('/production/update/secondarypress/:recordId', upSecondaryPressStep);
router.put('/production/update/foamcheck/:recordId', upFoamCheckStep);

export default router;