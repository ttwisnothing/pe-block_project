import express from 'express';
import { addRecipe } from '../controllers/recipeController.js';
import { addConfig } from '../controllers/configController.js';
import { addPlantime } from '../controllers/plantimeController.js';
import { addTempPlanTime } from '../controllers/tempController.js';
import { addMachine } from '../controllers/machineController.js';

const router = express.Router();

router.post('/recipe/add', addRecipe);
router.post('/config/add', addConfig);
router.post('/machine/add', addMachine);
router.post('/plantime/add/:recipe_name', addPlantime);
router.post('/plantime/temp/add/:recipe_name', addTempPlanTime);


export default router;