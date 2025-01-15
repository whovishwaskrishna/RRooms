import express from 'express';
import * as venueController from './venue.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const venueRouter = express.Router();

venueRouter.route('/')
    .get(sanitize(), venueController.getAllVenues)
    .post(sanitize(), venueController.createVenue);

venueRouter.route('/:id')
    .get(sanitize(), venueController.getVenueById)
    .put(sanitize(), venueController.updateVenueById)
    .delete(sanitize(), venueController.deleteVenueById);

venueRouter.route('/property/:propertyId')
    .get(sanitize(), venueController.getVenuesByPropertyId);

