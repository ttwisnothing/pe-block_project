import express from 'express';
import { getPlanTime } from './../controllers/plantimeController.js';
import { getRecipes } from './../controllers/recipeController.js';
import { getTempPlanTime } from '../controllers/tempController.js';
import { getTempPlanTimeASC } from './../controllers/tempController.js';
import { newAddPlantime } from './../controllers/plantimeController.js';

const router = express.Router();

router.get('/plantime/:recipe_name', getPlanTime);
router.get('/recipes', getRecipes);
router.get('/tempplantime/:recipe_name', getTempPlanTime);
router.get('/temp-time-asc/:recipe_name', getTempPlanTimeASC);
router.get('/new-plantime/:product_name', newAddPlantime);

export default router;