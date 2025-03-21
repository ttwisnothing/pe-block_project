import express from 'express';
import { getPlanTime, getTempPlanTime, editTempPlanTime } from './../controllers/plantimeController.js';
import { getRecipes } from './../controllers/recipeController.js';

const router = express.Router();

router.get('/plantime/:recipe_name', getPlanTime);
router.get('/recipe/:recipe_name', getRecipes);
router.get('/tempplantime/:recipe_name', getTempPlanTime);
router.get('/tempplantime/edit/:recipe_name/:temp_id', editTempPlanTime);

export default router;