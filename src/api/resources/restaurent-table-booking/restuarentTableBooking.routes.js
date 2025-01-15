import express from 'express';
import * as RestaurantBookingController from './restaurentTableBooking.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const restaurantBookingRouter = express.Router();

restaurantBookingRouter.route('/table-booking')
    .post(sanitize(), RestaurantBookingController.createRestaurantBooking)
    .get(sanitize(), RestaurantBookingController.getRestaurantAllBooking);
    

    restaurantBookingRouter.route('/table-booking/:id')
    .put(sanitize(), RestaurantBookingController.updateRestaurantBookingById)
    .delete(sanitize(), RestaurantBookingController.deleteRestaurantBookingById);

