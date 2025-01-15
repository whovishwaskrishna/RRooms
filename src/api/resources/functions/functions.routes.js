// routes/functions.routes.js
import express from 'express';
import * as FunctionsController from './functions.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const functionsRouter = express.Router();

functionsRouter.route('/')
    .get(sanitize(), FunctionsController.getAllFunctions)
    .post(sanitize(), FunctionsController.createFunction);

functionsRouter.route('/:id')
    .get(sanitize(), FunctionsController.getFunctionById)
    .put(sanitize(), FunctionsController.updateFunctionById)
    .delete(sanitize(), FunctionsController.deleteFunctionById);
    
functionsRouter.route('/property/:propertyId')
    .get(sanitize(), FunctionsController.getFunctionsByPropertyId);
