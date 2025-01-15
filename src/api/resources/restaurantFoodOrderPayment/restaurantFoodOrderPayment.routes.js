import express from 'express';
import * as RestaurantFoodOrderPaymentController from './restaurantFoodOrderPaymentController';
import { sanitize } from '../../../middleware/sanitizer';

export const restaurantFoodOrderPaymentRouter = express.Router();

restaurantFoodOrderPaymentRouter.route('/payment')
    .get(sanitize(), RestaurantFoodOrderPaymentController.get)
    .post(sanitize(), RestaurantFoodOrderPaymentController.create);

restaurantFoodOrderPaymentRouter.route('/payment/:id')
    .get(sanitize(), RestaurantFoodOrderPaymentController.getById)
    .put(sanitize(), RestaurantFoodOrderPaymentController.update)
    .delete(sanitize(), RestaurantFoodOrderPaymentController.deletePayment);

restaurantFoodOrderPaymentRouter.route('/payment-report').get(RestaurantFoodOrderPaymentController.restFoodOrderPaymentReport)