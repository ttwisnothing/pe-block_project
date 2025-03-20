import express from 'express';
import { addRecipe } from '../controllers/recipeController.js';
import { addConfig } from '../controllers/configController.js';
import { addPlanTime } from '../controllers/plantimeController.js';
import { addMachine } from '../controllers/machineController.js';

const router = express.Router();

router.post('/recipe', addRecipe);
router.post('/config', addConfig);
router.post('/plantime', addPlanTime);
router.post('/machine', addMachine);

export default router;