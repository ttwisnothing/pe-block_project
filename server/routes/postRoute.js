import express from 'express';
import { addRecipe } from '../controllers/recipeController.js';
import { addConfig } from '../controllers/configController.js';
import { addPlantime } from '../controllers/plantimeController.js';
import { addTempMB, addTempPlanTime } from '../controllers/tempController.js';
import { addMachine } from '../controllers/machineController.js';

const router = express.Router();

router.post('/recipe/add', addRecipe);
router.post('/config/add', addConfig);
router.post('/machine/add', addMachine);
router.post('/plantime/add/:recipe_name', addPlantime);
router.post('/plantime/temp/add/:recipe_name', addTempPlanTime);
router.post('/plantime/temp-mb/add/:recipe_name', addTempMB);


export default router;