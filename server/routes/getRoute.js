import express from 'express';
import { getPlanTime, calPlantime } from './../controllers/plantimeController.js';
import { getRecipes, addRecipe } from './../controllers/recipeController.js';

const router = express.Router();

router.get('/plantime/:recipe_name', getPlanTime);
router.get('/plantime/cal/:recipe_name', calPlantime);
router.get('/recipe/:recipe_name', getRecipes);


export default router;