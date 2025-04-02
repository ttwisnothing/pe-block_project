import express from 'express';
import { getPlanTime } from './../controllers/plantimeController.js';
import { getRecipes } from './../controllers/recipeController.js';
import { getTempPlanTime, updateMachine } from '../controllers/tempController.js';
import { getTempPlanTimeASC } from './../controllers/tempController.js';
import { newAddPlantime } from './../controllers/plantimeController.js';
import { getMachine } from '../controllers/machineController.js';
import { getProducts, getChemicals } from './../controllers/productController.js';


const router = express.Router();

router.get('/plantime/:recipe_name', getPlanTime);
router.get('/recipes', getRecipes);
router.get('/tempplantime/:recipe_name', getTempPlanTime);
router.get('/temp-time-asc/:recipe_name', getTempPlanTimeASC);
router.get('/new-plantime/:product_name', newAddPlantime);
router.get('/up-mac/:recipe_name/:temp_id', updateMachine);
router.get('/machine', getMachine);
router.get('/products', getProducts);
router.get('/chemicals', getChemicals);

export default router;