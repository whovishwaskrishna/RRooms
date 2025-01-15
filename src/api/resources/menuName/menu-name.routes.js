// routes/menuName.routes.js

import express from 'express';
import * as menuNameController from './menu-name.controller';
import { sanitize } from '../../../middleware/sanitizer';

export const menuNameRouter = express.Router();

menuNameRouter.route('/')
    .get(sanitize(), menuNameController.getAllMenuNames)
    .post(sanitize(), menuNameController.createMenuName);

menuNameRouter.route('/:id')
    .get(sanitize(), menuNameController.getMenuNameById)
    .put(sanitize(), menuNameController.updateMenuNameById)
    .delete(sanitize(), menuNameController.deleteMenuNameById);
    
menuNameRouter.route('/property/:propertyId')
    .get(sanitize(), menuNameController.getMenuNamesByPropertyId);
