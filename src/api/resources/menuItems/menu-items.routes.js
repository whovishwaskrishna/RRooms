// routes/menuItem.routes.js
import express from 'express';
import * as menuItemController from './menu-items.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const menuItemRouter = express.Router();

menuItemRouter.route('/')
    .get(sanitize(), menuItemController.getAllMenuItems)
    .post(sanitize(), menuItemController.createMenuItem);

menuItemRouter.route('/:id')
    .get(sanitize(), menuItemController.getMenuItemById)
    .put(sanitize(), menuItemController.updateMenuItemById)
    .delete(sanitize(), menuItemController.deleteMenuItemById);

menuItemRouter.route('/property/:propertyId')
    .get(sanitize(), menuItemController.getMenuItemsByPropertyId);