import express from 'express';
import bookingController from './booking.controller';
import downloadreportController from './downloadreport.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody } from '../../../middleware/validator';
import focController from './foc/foc.controller';
import focValidation from './foc/foc.validation';
import bookingValidation from './booking.validation';

export const roomBooking = express.Router();
//Property Category
roomBooking.route('/room-booking').post(sanitize(), bookingController.create);
roomBooking.route('/room-booking-confirm/:id').put(sanitize(),bookingController.confirmBooking);
roomBooking.route('/room-booking/:id').put(sanitize(),bookingController.update);
roomBooking.route('/room-booking/:id').patch(sanitize(),bookingController.updateBookingStatus);
roomBooking.route('/room-booking/:id').delete(sanitize(),bookingController.delete);
roomBooking.route('/room-booking').get(sanitize(),bookingController.get);
roomBooking.route('/room-booking/:id').get(sanitize(),bookingController.getById);
roomBooking.route('/room-booking/by-booking-code/:id').get(sanitize(),bookingController.getByBookingCode);

roomBooking.route('/room-booking/booking-details/:id').get(sanitize(),bookingController.getBookingDetailsByCode);

roomBooking.route('/room-booking/by-property/:id').get(sanitize(),bookingController.getByPropertyId);
roomBooking.route('/room-booking/by-user/:id').get(sanitize(),bookingController.getByUserId);
roomBooking.route('/room-booking/filter').post(sanitize(),bookingController.filterBooking);
roomBooking.route('/assign-rooms').post(sanitize(),bookingController.assignRoomByBookingId)
roomBooking.route('/room-booking/add-guest-user').post(sanitize(),bookingController.addGuestDetailsByBookingId);
roomBooking.route('/room-booking/delete-guest-user/:id').delete(sanitize(),bookingController.deleteGuestDetailById);
roomBooking.route('/rooms-aviability').post(sanitize(),bookingController.getRoomsAviability);
//Payment Details:
roomBooking.route('/payment').post(sanitize(),bookingController.payAmout);
roomBooking.route('/payment/:id').put(sanitize(),bookingController.updatePaymentDetails);
roomBooking.route('/payment-details').post(sanitize(),bookingController.getPaymentList);

//FOC Request
roomBooking.route('/foc-request').get(sanitize(), focController.list);
roomBooking.route('/foc-request').post(sanitize(), validateBody(focValidation.store), focController.create);
roomBooking.route('/foc-request/:id').put(sanitize(), validateBody(focValidation.update), focController.update);

//Booking Logs
roomBooking.route('/booking-logs').post(sanitize(),bookingController.createLog);
roomBooking.route('/booking-logs/:id').put(sanitize(),bookingController.updateLog);
roomBooking.route('/booking-logs').get(sanitize(),bookingController.getBookingLogs);
roomBooking.route('/booking-logs/:id').get(sanitize(),bookingController.getBookingLogById);
roomBooking.route('/booking-logs-bookingid/:id').get(sanitize(),bookingController.getBookingLogByBookingId);
roomBooking.route('/booking-logs/:id').delete(sanitize(),bookingController.deleteLog);
roomBooking.route('/booking-logs-bookingid/:id').delete(sanitize(),bookingController.deleteLogByBookingId);
//Download booking report
roomBooking.route('/download-report').get(sanitize(),downloadreportController.downloadReport);

//Fetch Guest List
roomBooking.route('/guest-list').post(sanitize(),bookingController.getWalkInGuestList);
roomBooking.route('/user-booking-list').post(sanitize(),bookingController.getBookingListByUserMobile);
roomBooking.route('/checkout-guest').post(sanitize(),bookingController.updateBookingAmountOnMidCheckout);
