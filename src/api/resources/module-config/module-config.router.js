import express from 'express';
import groupConfigController from './group-config.controller';
import menuConfigController from './menu-config.controller';
import moduleConfigController from './module-config.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody } from '../../../middleware/validator';
import moduleConfigValidation from './module-config.validation';

export const moduleConfigRouter = express.Router();

//module config group
moduleConfigRouter.route('/group/:id').get(sanitize(), groupConfigController.getById);
moduleConfigRouter.route('/all-group').get(sanitize(), groupConfigController.get);
moduleConfigRouter.route('/add-group').post(sanitize(), validateBody(moduleConfigValidation.group), groupConfigController.create);
moduleConfigRouter.route('/update-group/:id').put(sanitize(), validateBody(moduleConfigValidation.group), groupConfigController.update);
moduleConfigRouter.route('/delete-group/:id').delete(sanitize(), groupConfigController.delete);

//module config menu
moduleConfigRouter.route('/menu/:id').get(sanitize(), menuConfigController.getById);
moduleConfigRouter.route('/get-all-menus-by-group/:id').get(sanitize(), menuConfigController.getAllByGroupId);
moduleConfigRouter.route('/all-menu').get(sanitize(), menuConfigController.get);
moduleConfigRouter.route('/add-menu').post(sanitize(), validateBody(moduleConfigValidation.menu), menuConfigController.create);
moduleConfigRouter.route('/update-menu/:id').put(sanitize(), validateBody(moduleConfigValidation.menu), menuConfigController.update);
moduleConfigRouter.route('/delete-menu/:id').delete(sanitize(), menuConfigController.delete);