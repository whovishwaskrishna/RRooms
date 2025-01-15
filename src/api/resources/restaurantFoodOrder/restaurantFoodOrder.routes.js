import express from 'express';
import * as RestaurantFoodOrderController from './restaurantFoodOrderController';
import { sanitize } from '../../../middleware/sanitizer';
const multer = require('multer');

export const restaurantFoodOrderRouter = express.Router();
const storage = multer.memoryStorage(); // Use memory storage for handling files before uploading to S3
const upload = multer({ storage: storage });

restaurantFoodOrderRouter.route('/order')
    .get(sanitize(), RestaurantFoodOrderController.get)
    .post(sanitize(), RestaurantFoodOrderController.create);

restaurantFoodOrderRouter.route('/order/:id')
    .get(sanitize(), RestaurantFoodOrderController.getById)
    .put(sanitize(), RestaurantFoodOrderController.update)
    .delete(sanitize(), RestaurantFoodOrderController.deleteOrder);


restaurantFoodOrderRouter.route('/order-report').get(RestaurantFoodOrderController.downloadRestFoodOrderReport)