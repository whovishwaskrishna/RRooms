import express from 'express';
import countryController from './country.controller';
import stateController from './state.controller';
import cityController from './city.controller';
import localityController from './locality.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody, schemas } from '../../../middleware/validator';
import { loginCheck } from '../../../middleware/auth';

export const country = express.Router();

//Country Route
country.route('/country').post(sanitize(),countryController.create)
country.route('/country/:id').put(sanitize(),countryController.update)
country.route('/country').get(sanitize(),countryController.get)
country.route('/country/:id').get(sanitize(),countryController.getById)
country.route('/country/:id').delete(sanitize(),countryController.delete)

//State Route
country.route('/state').post(sanitize(),stateController.create)
country.route('/state/:id').put(sanitize(),stateController.update)
country.route('/state').get(sanitize(),stateController.get)
country.route('/state/:id').get(sanitize(),stateController.getById)
country.route('/state-country/:id').get(sanitize(),stateController.getByCountryId)
country.route('/state/:id').delete(sanitize(),stateController.delete)

//City Route
country.route('/city').post(sanitize(),cityController.create)
country.route('/city/:id').put(sanitize(),cityController.update)
country.route('/city').get(sanitize(),cityController.get)
country.route('/city/:id').get(sanitize(),cityController.getById)
country.route('/city-state/:id').get(sanitize(),cityController.getCityByStateId)
country.route('/city/:id').delete(sanitize(),cityController.delete)

//Locality Route
country.route('/locality').post(sanitize(),localityController.create)
country.route('/locality/:id').put(sanitize(),localityController.update)
country.route('/locality').get(sanitize(),localityController.get)
country.route('/locality/:id').get(sanitize(),localityController.getById)
country.route('/locality-city/:id').get(sanitize(),localityController.getByCityId)
country.route('/locality/:id').delete(sanitize(),localityController.delete)  