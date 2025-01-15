// routes/menuCategory.routes.js
import express from 'express';
import * as menuCategoryController from './menuCategory.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const menuCategoryRouter = express.Router();

menuCategoryRouter.route('/')
    .get(sanitize(), menuCategoryController.getAllMenuCategories)
    .post(sanitize(), menuCategoryController.createMenuCategory);



menuCategoryRouter.route('/:id')
    .get(sanitize(), menuCategoryController.getMenuCategoryById)
    .put(sanitize(), menuCategoryController.updateMenuCategoryById)
    .delete(sanitize(), menuCategoryController.deleteMenuCategoryById);

menuCategoryRouter.route('/property/:propertyId')
    .get(sanitize(), menuCategoryController.getMenuCategoriesByPropertyId);