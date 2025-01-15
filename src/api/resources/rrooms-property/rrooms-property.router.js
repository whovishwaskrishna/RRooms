import express from 'express';
import propertyCategoryController from './property-category.controller';
import rroomCategoryController from './rroom-category.controller';
import amenitiesController from './amenities.controller';
import propertyAmenitiesController from './property-amenities.controller';
import propertyImageController from './property-image.controller';
import propertyController from './property.controller';
import propertyRroomCategoryController from './property-room-category.controller';
import roomsController from './rooms.controller';
import propertyRroomCategoryAmenitiesController from './property-room-category-amenities.controller';
import propertyRroomCategoryImageController from './property-room-category-image.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody } from '../../../middleware/validator';
import propertyRatingController from './rating/property-rating.controller';
import propertyRatingValidation from './rating/property-rating.validation';
import propertyCouponController from './coupon/property-coupon.controller';
import propertyCouponValidation from './coupon/property-coupon.validation';
import serviceTaxController from './service-tax/service-tax.controller';
import serviceTaxValidation from './service-tax/service-tax.validation';
import roomPriceSettingController from './room-price-setting/room-price-setting.controller';
import roomPriceSettingValidation from './room-price-setting/room-price-setting.validation';
import menuCardController from './menu-card/menu-card.controller';
import laundaryServiceController from './laundary/laundary-service/laundary-service.controller';
import laundaryServiceValidation from './laundary/laundary-service/laundary-service.validation';
import laundaryProviderController from './laundary/laundary-provider/laundary-provider.controller';
import laundaryProviderValidation from './laundary/laundary-provider/laundary-provider.validation';
import laundaryRequestController from './laundary/laundary-request/laundary-request.controller';
import laundaryRequestValidation from './laundary/laundary-request/laundary-request.validation';
import searchPropertyController from './search-property/search-property.controller';
import invoiceSiteSettingsController from '../invoice-site-settings/invoice-site-settings.controller';
import itemCategoryController from '../food-order/item-category.controller';
import menuItemController from '../food-order/menu-item.controller';
import menuItemValidation from '../food-order/menu-item.validation';
import orderController from '../food-order/order.controller';
import orderValidation from '../food-order/order.validation';
import orderPaymentController from '../food-order/order-payment.controller';
import orderPaymentValidation from '../food-order/order-payment.validation';
import paymentController from '../payment/payment.controller';
import ncTypeSettingController from '../nc-type-setting/nc-type-setting.controller';
import ncTypeSettingValidation from '../nc-type-setting/nc-type-setting.validation';
import propertySalesController from './hotel-finance/property-sales.controller';
import propertyInvoiceController from './hotel-finance/property-invoice.controller';
import invoiceOfflinePaymentValidation from './hotel-finance/invoice.validation';
import propertyCommissionController from './hotel-finance/property-commission.controller';
import moduleConfigController from './../module-config/module-config.controller';
import moduleConfigValidation from './../module-config/module-config.validation';

export const rroomsProperty = express.Router();
//Property Category
rroomsProperty.route('/property-category').post(sanitize(), propertyCategoryController.createPropertyCategory);
rroomsProperty.route('/property-category/:id').put(sanitize(), propertyCategoryController.updatePropertyCategory);
rroomsProperty.route('/property-category/:id').delete(sanitize(), propertyCategoryController.deletePropertyCategory);
rroomsProperty.route('/property-category').get(sanitize(), propertyCategoryController.getPropertyCategory);
rroomsProperty.route('/property-category/:id').get(sanitize(), propertyCategoryController.getPropertyCategoryById);

//Rroom Category
rroomsProperty.route('/rroom-category').post(sanitize(), rroomCategoryController.createRroomCategory);
rroomsProperty.route('/rroom-category/:id').put(sanitize(), rroomCategoryController.updateRroomCategory);
rroomsProperty.route('/rroom-category/:id').delete(sanitize(), rroomCategoryController.deleteRroomCategory);
rroomsProperty.route('/rroom-category').get(sanitize(), rroomCategoryController.getRroomCategory);
rroomsProperty.route('/rroom-category/:id').get(sanitize(), rroomCategoryController.getRroomCategoryById);

//Amenities
rroomsProperty.route('/amenities').post(sanitize(), amenitiesController.create);
rroomsProperty.route('/amenities/:id').put(sanitize(), amenitiesController.update);
rroomsProperty.route('/amenities/:id').delete(sanitize(), amenitiesController.delete);
rroomsProperty.route('/amenities').get(sanitize(), amenitiesController.get);
rroomsProperty.route('/amenities/:id').get(sanitize(), amenitiesController.getById);

//Property Amenities
rroomsProperty.route('/property-amenities').post(sanitize(), propertyAmenitiesController.create);
rroomsProperty.route('/property-amenities/:id').put(sanitize(), propertyAmenitiesController.update);
rroomsProperty.route('/property-amenities/:id').delete(sanitize(), propertyAmenitiesController.delete);
rroomsProperty.route('/property-amenities').get(sanitize(), propertyAmenitiesController.get);
rroomsProperty.route('/property-amenities/:id').get(sanitize(), propertyAmenitiesController.getById);

//Property Images
rroomsProperty.route('/property-image').post(sanitize(), propertyImageController.create);
rroomsProperty.route('/property-image/:id').put(sanitize(), propertyImageController.update);
rroomsProperty.route('/property-image/:id').delete(sanitize(), propertyImageController.delete);
rroomsProperty.route('/property-image').get(sanitize(), propertyImageController.get);
rroomsProperty.route('/property-image/:id').get(sanitize(), propertyImageController.getById);

//Property
rroomsProperty.route('/property').post(sanitize(), propertyController.create);
rroomsProperty.route('/property/:id').put(sanitize(), propertyController.update);
rroomsProperty.route('/property/:id').delete(sanitize(), propertyController.delete);
rroomsProperty.route('/property').get(sanitize(), propertyController.get);
rroomsProperty.route('/property/:id').get(sanitize(), propertyController.getById);
rroomsProperty.route('/inactive-coupon-property').post(sanitize(), propertyController.inactiveCouponProperty);
//rroomsProperty.route('/property/search').post(sanitize(),propertyController.serachProperty);
rroomsProperty.route('/approved-property').get(sanitize(), propertyController.getApprovedProperty);
rroomsProperty.route('/property-status').put(sanitize(), propertyController.updatePropertyStatus);
rroomsProperty.route('/property-image-profile/:id').put(sanitize(), propertyController.updateProfileImage);
rroomsProperty.route('/assign-unassign-property').post(sanitize(), propertyController.assignUnassignProperty);
//Property Rroom Category
rroomsProperty.route('/property-rroom-category').post(sanitize(), propertyRroomCategoryController.create);
rroomsProperty.route('/property-rroom-category/:id').put(sanitize(), propertyRroomCategoryController.update);
rroomsProperty.route('/property-rroom-category/:id').delete(sanitize(), propertyRroomCategoryController.delete);
rroomsProperty.route('/property-rroom-category').get(sanitize(), propertyRroomCategoryController.get);
rroomsProperty.route('/property-rroom-category/:id').get(sanitize(), propertyRroomCategoryController.getById);

//Property Rroom Category Amenities
rroomsProperty.route('/property-rroom-category-amenities').post(sanitize(), propertyRroomCategoryAmenitiesController.create);
rroomsProperty.route('/property-rroom-category-amenities/:id').put(sanitize(), propertyRroomCategoryAmenitiesController.update);
rroomsProperty.route('/property-rroom-category-amenities/:id').delete(sanitize(), propertyRroomCategoryAmenitiesController.delete);
rroomsProperty.route('/property-rroom-category-amenities').get(sanitize(), propertyRroomCategoryAmenitiesController.get);
rroomsProperty.route('/property-rroom-category-amenities/:id').get(sanitize(), propertyRroomCategoryAmenitiesController.getById);

//Property Rroom Category Images
rroomsProperty.route('/property-rroom-category-image').post(sanitize(), propertyRroomCategoryImageController.create);
rroomsProperty.route('/property-rroom-category-image/:id').put(sanitize(), propertyRroomCategoryImageController.update);
rroomsProperty.route('/property-rroom-category-image/:id').delete(sanitize(), propertyRroomCategoryImageController.delete);
rroomsProperty.route('/property-rroom-category-image').get(sanitize(), propertyRroomCategoryImageController.get);
rroomsProperty.route('/property-rroom-category-image/:id').get(sanitize(), propertyRroomCategoryImageController.getById);

//Create rooms
rroomsProperty.route('/room').post(sanitize(), roomsController.create);
rroomsProperty.route('/room/:id').put(sanitize(), roomsController.update);
rroomsProperty.route('/room-status').put(sanitize(), roomsController.updateRoomStatus);
rroomsProperty.route('/room-detail-status').put(sanitize(), roomsController.updateRoomDetailsStatus);
rroomsProperty.route('/block-unblock-rooms').put(sanitize(), roomsController.blockUnblockRoom);
rroomsProperty.route('/room/:id').delete(sanitize(), roomsController.delete);
rroomsProperty.route('/room').get(sanitize(), roomsController.get);
rroomsProperty.route('/room-image/:id').delete(sanitize(), roomsController.deleteRoomImage);
rroomsProperty.route('/room/:id').get(sanitize(), roomsController.getById);
rroomsProperty.route('/room/property/:id').get(sanitize(), roomsController.getRoomByPropertyId);
rroomsProperty.route('/apply-offers').put(sanitize(), roomsController.applyOffers);
rroomsProperty.route('/room/property/:id/:propertyId').get(sanitize(), roomsController.getRoomByRoomIdPropertyId);
rroomsProperty.route('/room-hero-image/:id').put(sanitize(), roomsController.updateRoomHeroImage);

// Property Ratings
rroomsProperty.route('/ratings').get(sanitize(), validateBody(propertyRatingValidation.index), propertyRatingController.list);
rroomsProperty.route('/ratings').post(sanitize(), validateBody(propertyRatingValidation.store), propertyRatingController.create);
rroomsProperty.route('/ratings/:id').put(sanitize(), validateBody(propertyRatingValidation.store), propertyRatingController.update);

// Property Coupon
rroomsProperty.route('/coupon').get(sanitize(), propertyCouponController.list);
rroomsProperty.route('/coupon-userid/:id').get(sanitize(), propertyCouponController.listByUserId);
rroomsProperty.route('/coupon/validate/:property_id/:code').get(sanitize(), propertyCouponController.validateCoupon);
rroomsProperty.route('/coupon').post(sanitize(), validateBody(propertyCouponValidation.store), propertyCouponController.create);
rroomsProperty.route('/coupon/:id').put(sanitize(), validateBody(propertyCouponValidation.store), propertyCouponController.update);
rroomsProperty.route('/coupon/:id').delete(sanitize(), propertyCouponController.destroy);

// Service Tax
rroomsProperty.route('/service-tax/:id').get(sanitize(), serviceTaxController.get);
rroomsProperty.route('/service-tax/:id').put(sanitize(), validateBody(serviceTaxValidation.update), serviceTaxController.update);

// Room Price Percent
rroomsProperty.route('/room-price-setting/:id').get(sanitize(), roomPriceSettingController.get);
rroomsProperty.route('/room-price-setting/:id').put(sanitize(), validateBody(roomPriceSettingValidation.update), roomPriceSettingController.update);

// Property Menu Card Upload
rroomsProperty.route('/menu-card/:property_id').get(sanitize(), menuCardController.get);
rroomsProperty.route('/menu-card').post(sanitize(), menuCardController.create);
rroomsProperty.route('/menu-card').put(sanitize(), menuCardController.update);
rroomsProperty.route('/menu-card/:id').delete(sanitize(), menuCardController.destroy);

// Laundary Service
rroomsProperty.route('/laundary-service').get(sanitize(), validateBody(laundaryServiceValidation.index), laundaryServiceController.list);
rroomsProperty.route('/laundary-service').post(sanitize(), validateBody(laundaryServiceValidation.store), laundaryServiceController.create);
rroomsProperty.route('/laundary-service/:id').put(sanitize(), validateBody(laundaryServiceValidation.store), laundaryServiceController.update);
rroomsProperty.route('/laundary-service/:id').delete(sanitize(), laundaryServiceController.destroy);

// Laundary Provider
rroomsProperty.route('/laundary-provider').get(sanitize(), validateBody(laundaryProviderValidation.index), laundaryProviderController.list);
rroomsProperty.route('/laundary-provider').post(sanitize(), validateBody(laundaryProviderValidation.store), laundaryProviderController.create);
rroomsProperty.route('/laundary-provider/:id').put(sanitize(), validateBody(laundaryProviderValidation.store), laundaryProviderController.update);
rroomsProperty.route('/laundary-provider/:id').delete(sanitize(), laundaryProviderController.destroy);

// Laundary Request
rroomsProperty.route('/laundary-request').get(sanitize(), laundaryRequestController.list);
rroomsProperty.route('/laundary-request/change-status/:id').put(sanitize(), laundaryRequestController.changeStatus);
rroomsProperty.route('/laundary-request').post(sanitize(), validateBody(laundaryRequestValidation.store), laundaryRequestController.create);
rroomsProperty.route('/laundary-request/:id').put(sanitize(), validateBody(laundaryRequestValidation.update), laundaryRequestController.update);
rroomsProperty.route('/laundary-request/:id').delete(sanitize(), laundaryRequestController.destroy);

// Search Property
rroomsProperty.route('/search').get(searchPropertyController.index)
rroomsProperty.route('/suggestion').get(sanitize(), searchPropertyController.suggestion)
rroomsProperty.route('/search-logs').get(sanitize(), searchPropertyController.getSearchLogs)

// Invoice Site Settings
rroomsProperty.route('/invoice-site-setting').post(sanitize(), invoiceSiteSettingsController.create);
rroomsProperty.route('/invoice-site-setting/:id').put(sanitize(), invoiceSiteSettingsController.update);
rroomsProperty.route('/invoice-site-setting/:id').delete(sanitize(), invoiceSiteSettingsController.delete);
rroomsProperty.route('/invoice-site-setting').get(sanitize(), invoiceSiteSettingsController.get);
rroomsProperty.route('/invoice-site-setting/:id').get(sanitize(), invoiceSiteSettingsController.getById);

// Food Item Category
rroomsProperty.route('/food-item-category').get(sanitize(), itemCategoryController.get);
rroomsProperty.route('/food-item-category').post(sanitize(), itemCategoryController.create);
rroomsProperty.route('/food-item-category/:id').put(sanitize(), itemCategoryController.update);
rroomsProperty.route('/food-item-category/:id').get(sanitize(), itemCategoryController.getById);
rroomsProperty.route('/food-item-category/:id').delete(sanitize(), itemCategoryController.delete);

// Food Menu Item : 
rroomsProperty.route('/food-menu-item').get(sanitize(), menuItemController.get);
rroomsProperty.route('/food-menu-item').post(sanitize(), validateBody(menuItemValidation.store), menuItemController.create);
rroomsProperty.route('/food-menu-item/:id').put(sanitize(), menuItemController.update);
rroomsProperty.route('/food-menu-item/:id').get(sanitize(), menuItemController.getById);
rroomsProperty.route('/food-menu-item/:id').delete(sanitize(), menuItemController.delete);

// Food Order
rroomsProperty.route('/food-order').get(sanitize(), orderController.get);
rroomsProperty.route('/food-order').post(sanitize(), validateBody(orderValidation.store), orderController.create);
rroomsProperty.route('/food-order/:id').put(sanitize(), validateBody(orderValidation.store), orderController.update);
rroomsProperty.route('/food-order/:id').get(sanitize(), orderController.getById);
rroomsProperty.route('/food-order/booking-id/:id').get(sanitize(), orderController.getByBookingId);
rroomsProperty.route('/food-order/property-id/:id').get(sanitize(), orderController.getByPropertyId);
rroomsProperty.route('/food-order/:id').delete(sanitize(), orderController.delete);
rroomsProperty.route('/food-order/status/:id').patch(sanitize(), validateBody(orderValidation.updateStatus), orderController.updateStatus);

// Food Order Payment
rroomsProperty.route('/food-order-payment').get(sanitize(), orderPaymentController.get);
rroomsProperty.route('/food-order-payment').post(sanitize(), validateBody(orderPaymentValidation.store), orderPaymentController.create);
rroomsProperty.route('/food-order-payment/:id').put(sanitize(), validateBody(orderPaymentValidation.store), orderPaymentController.update);
rroomsProperty.route('/food-order-payment/:id').get(sanitize(), orderPaymentController.getById);
rroomsProperty.route('/food-order-payment/:id').delete(sanitize(), orderPaymentController.delete);

// Payment
rroomsProperty.route('/initiate-payment').get(sanitize(), paymentController.initPayment);
rroomsProperty.route('/status-update').post(sanitize(), paymentController.statusUpdate);
rroomsProperty.route('/check-status').get(sanitize(), paymentController.checkStatus);

// Invoice Site Settings
rroomsProperty.route('/nc-type-setting').post(sanitize(), validateBody(ncTypeSettingValidation.store), ncTypeSettingController.create);
rroomsProperty.route('/nc-type-setting/:id').put(sanitize(), validateBody(ncTypeSettingValidation.store), ncTypeSettingController.update);
rroomsProperty.route('/nc-type-setting').get(sanitize(), ncTypeSettingController.get);
rroomsProperty.route('/nc-type-setting/:id').get(sanitize(), ncTypeSettingController.getById);

// hotel finance
rroomsProperty.route('/property-sale-summary/:id').get(sanitize(), propertySalesController.getById);
rroomsProperty.route('/property-sale-by-month').get(sanitize(), propertySalesController.getSaleByMonth);
rroomsProperty.route('/property-sale-download/:id').get(sanitize(), propertySalesController.saleExportToExcel);

//commission
rroomsProperty.route('/property-commission').post(sanitize(), propertyCommissionController.create);
rroomsProperty.route('/property-commission/:id').put(sanitize(), propertyCommissionController.update);
rroomsProperty.route('/property-commission/:id').delete(sanitize(), propertyCommissionController.delete);
rroomsProperty.route('/property-commission').get(sanitize(), propertyCommissionController.get);
rroomsProperty.route('/property-commission/:id').get(sanitize(), propertyCommissionController.getById);

//invoice generation
rroomsProperty.route('/generate-invoice-by-month').get(sanitize(), propertyInvoiceController.getInvoiceByMonth);
rroomsProperty.route('/property-invoices/:id').get(sanitize(), propertyInvoiceController.getAllInvoices);
rroomsProperty.route('/property-invoice/:id').get(sanitize(), propertyInvoiceController.getInvoiceById);
rroomsProperty.route('/generate-all-invoices').post(sanitize(), propertyInvoiceController.generateInvoicesForAllPropertiesByMonth);
rroomsProperty.route('/invoices-transaction-detail').get(sanitize(), propertyInvoiceController.getInvoiceTransactionsDetail);

//invoice payment online
rroomsProperty.route('/initiate-invoice-payment').get(sanitize(), paymentController.initInvoicePayment);
rroomsProperty.route('/invoice-payment-status-update').post(sanitize(), paymentController.statusUpdateForInvoicePayment);
rroomsProperty.route('/invoice-payment-check-status').get(sanitize(), paymentController.checkStatusForInvoicePayment);
//invoice payment offline
rroomsProperty.route('/invoice-offline-payment').post(sanitize(), propertyInvoiceController.initInvoiceOfflinePayment);
rroomsProperty.route('/invoice-offline-payment').put(sanitize(), propertyInvoiceController.updateInvoiceOfflinePayment);
// rroomsProperty.route('/status-update-invoice-offline-payment/:id').put(sanitize(), propertyInvoiceController.statusUpdateInvoiceOfflinePayment);

//Module Config Setting
rroomsProperty.route('/get-module-config').get(sanitize(), moduleConfigController.get);
rroomsProperty.route('/add-update-module-config').post(sanitize(), validateBody(moduleConfigValidation.moduleConfig), moduleConfigController.save);
