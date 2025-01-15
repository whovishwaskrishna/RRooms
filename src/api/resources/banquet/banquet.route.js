import express from 'express';
import * as BanquetBookingPaymntController from './banquetBookingPayment/banquetBookingPaymentController';
import * as BookedVenueController from './bookedVenue/bookedVenueController';
import * as BookedServiceController from './bookedService/bookedServiceController';
import * as BanquetBookingController from './banquetBooking/banquetBookingController'; // Assuming a controller for banquet booking
import * as BanquetEnquiryController from './banquetEnquiry/banquetEnquiryController'
import * as BanquetEnquiryLogController from './banquetEnquiryLog/banquetEnquiryLogController'
import { sanitize } from '../../../middleware/sanitizer';
const multer = require('multer');
const storage = multer.memoryStorage(); // Use memory storage for handling files before uploading to S3
const upload = multer({ storage: storage });
export const banquetRouter = express.Router();

// Banquet booking payment routes
banquetRouter.route('/banquet-booking-payment')
    .get(sanitize(), BanquetBookingPaymntController.getAllBanquetBookingPayments)
    .post(sanitize(), BanquetBookingPaymntController.createBanquetBookingPayment);

banquetRouter.route('/banquet-booking-payment/:id')
    .get(sanitize(), BanquetBookingPaymntController.getBanquetBookingPaymentById) // Get banquet booking payment by ID
    .patch(sanitize(), BanquetBookingPaymntController.updateBanquetBookingPayment)
    .delete(sanitize(), BanquetBookingPaymntController.deleteBanquetBookingPayment);

banquetRouter.route('/banquet-booking-payment-report').get(BanquetBookingPaymntController.banquetBookingPaymentReport)

// Booked venue routes
banquetRouter.route('/booked-venue')
    .get(sanitize(), BookedVenueController.getAllBookedVenues)
    .post(sanitize(), BookedVenueController.createBookedVenue);

banquetRouter.route('/booked-venue/:id')
    .get(sanitize(), BookedVenueController.getBookedVenueById) // Get booked venue by ID
    .patch(sanitize(), BookedVenueController.updateBookedVenue)
    .delete(sanitize(), BookedVenueController.deleteBookedVenue);

// Booked service routes
banquetRouter.route('/booked-service')
    .get(sanitize(), BookedServiceController.getAllBookedServices)
    .post(sanitize(), BookedServiceController.createBookedService);

banquetRouter.route('/booked-service/:id')
    .get(sanitize(), BookedServiceController.getBookedServiceById) // Get booked service by ID
    .patch(sanitize(), BookedServiceController.updateBookedService)
    .delete(sanitize(), BookedServiceController.deleteBookedService);

// Banquet booking routes
banquetRouter.route('/banquet-booking')
    .get(sanitize(), BanquetBookingController.getAllBanquetBookings)
    .post(sanitize(), upload.single('file'), BanquetBookingController.createBanquetBooking);

banquetRouter.route('/banquet-booking/:id')
    .get(sanitize(), BanquetBookingController.getBanquetBookingById) // Get banquet booking by ID
    .patch(sanitize(), BanquetBookingController.updateBanquetBooking)
    .delete(sanitize(), BanquetBookingController.deleteBanquetBooking);

banquetRouter.route('/banquet-booking-report').get(BanquetBookingController.downloadBanquetBookingReport)

// banquet enquiry
banquetRouter.route('/banquet-enquiry')
    .get(sanitize(), BanquetEnquiryController.getAllBanquetEnquiries) 
    .post(sanitize(), BanquetEnquiryController.createBanquetEnquiry); 

banquetRouter.route('/banquet-enquiry/:id')
    .get(sanitize(), BanquetEnquiryController.getBanquetEnquiryById) 
    .put(sanitize(), BanquetEnquiryController.updateBanquetEnquiry) 
    .delete(sanitize(), BanquetEnquiryController.deleteBanquetEnquiry);

banquetRouter.route('/banquet-enquiry-report').get(BanquetEnquiryController.downloadBanquetEnquiryReport)
// banquet enquiry log
banquetRouter.route('/banquet-enquiry-log')
    .post(sanitize(), BanquetEnquiryLogController.createEnquiryLog);

banquetRouter.route('/banquet-enquiry-log')
    .get(sanitize(), BanquetEnquiryLogController.getEnquiryLogsByBanquetEnquiry);

