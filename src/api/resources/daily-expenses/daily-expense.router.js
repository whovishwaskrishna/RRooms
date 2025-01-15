import express from 'express';
import dailyExpenseController from './daily-expense.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody } from '../../../middleware/validator';
import dailyExpenseValidation from './daily-expense.validation';

export const dailyExpenseRouter = express.Router();

dailyExpenseRouter.route('/:id').get(sanitize(), dailyExpenseController.getById);
dailyExpenseRouter.route('').get(sanitize(), dailyExpenseController.get);
dailyExpenseRouter.route('').post(sanitize(), validateBody(dailyExpenseValidation.schema), dailyExpenseController.create);
dailyExpenseRouter.route('/:id').put(sanitize(), validateBody(dailyExpenseValidation.schema), dailyExpenseController.update);
dailyExpenseRouter.route('/:id').delete(sanitize(), dailyExpenseController.delete);