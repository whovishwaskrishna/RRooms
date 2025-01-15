// routes/restaurantMenuItem.routes.js
import express from 'express';
import * as RestaurantMenuItemController from './restaurantMenuItem.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const restaurantRouter = express.Router();

restaurantRouter.route('/menu-item')
    .get(sanitize(), RestaurantMenuItemController.getRestaurantMenuItems)
    .post(sanitize(), RestaurantMenuItemController.createRestaurantMenuItem);

restaurantRouter.route('/menu-item/:id')
    .put(sanitize(), RestaurantMenuItemController.updateRestaurantMenuItem)
    .get(sanitize(), RestaurantMenuItemController.getRestaurantMenuItemById)
    .delete(sanitize(), RestaurantMenuItemController.deleteRestaurantMenuItem);

