import express from 'express';
import categoryController from './category.controller';
import itemController from './item.controller'
import suplierController from './supliers.controller'
import inStockController from './instock.controller'
import outstocksController from './outstocks.controller';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody, schemas } from '../../../middleware/validator';
import { loginCheck } from '../../../middleware/auth';
import inventoryStock from './inventory.controller';
import inventoryValidation from './inventory.validation';

export const inventory = express.Router();
inventory.route('/category').post(sanitize(),categoryController.create)
inventory.route('/category/:id').put(sanitize(),categoryController.update)
inventory.route('/category').get(sanitize(),categoryController.get)
inventory.route('/category/:id').get(sanitize(),categoryController.getById)
inventory.route('/category-user/:id').get(sanitize(),categoryController.getByUserId)
inventory.route('/category-property/:id').get(sanitize(),categoryController.getByPropertyId)

//Items
inventory.route('/items').post(sanitize(),itemController.create)
inventory.route('/items/:id').put(sanitize(),itemController.update)
inventory.route('/items').get(sanitize(),itemController.get)
inventory.route('/items/:id').get(sanitize(),itemController.getById)
inventory.route('/items-user/:id').get(sanitize(),itemController.getByUserId)
inventory.route('/items-property/:id').get(sanitize(),itemController.getByPropertyId)
inventory.route('/items-category/:id').get(sanitize(),itemController.getByCategoryId)

//Supliers
inventory.route('/supliers').post(sanitize(),suplierController.create)
inventory.route('/supliers/:id').put(sanitize(),suplierController.update)
inventory.route('/supliers').get(sanitize(),suplierController.get)
inventory.route('/supliers/:id').get(sanitize(),suplierController.getById)
inventory.route('/supliers-user/:id').get(sanitize(),suplierController.getByUserId)
inventory.route('/supliers-property/:id').get(sanitize(),suplierController.getByPropertyId)
inventory.route('/supliers-category/:id').get(sanitize(),suplierController.getByCategoryId)

//Inventory InStock
inventory.route('/in-stock').post(sanitize(),inStockController.create)
inventory.route('/in-stock/:id').put(sanitize(),inStockController.update)
inventory.route('/in-stock').get(sanitize(),inStockController.get)
inventory.route('/in-stock/:id').get(sanitize(),inStockController.getById)
inventory.route('/in-stock-user/:id').get(sanitize(),inStockController.getByUserId)
inventory.route('/in-stock-property/:id').get(sanitize(),inStockController.getByPropertyId)
inventory.route('/in-stock-category/:id').get(sanitize(),inStockController.getByCategoryId)
inventory.route('/in-stock-suplier/:id').get(sanitize(),inStockController.getBySuplierId)

//Inventory OutStock
inventory.route('/out-stock').post(sanitize(),outstocksController.create)
inventory.route('/out-stock/:id').put(sanitize(),outstocksController.update)
inventory.route('/out-stock').get(sanitize(),outstocksController.get)
inventory.route('/out-stock/:id').get(sanitize(),outstocksController.getById)
inventory.route('/out-stock-user/:id').get(sanitize(),outstocksController.getByUserId)
inventory.route('/out-stock-property/:id').get(sanitize(),outstocksController.getByPropertyId)
inventory.route('/out-stock-category/:id').get(sanitize(),outstocksController.getByCategoryId)
inventory.route('/out-stock-suplier/:id').get(sanitize(),outstocksController.getBySuplierId)

//Inventory Management
inventory.route('/inventory-stock').post(sanitize(), validateBody(inventoryValidation.store), inventoryStock.create)
inventory.route('/inventory-stock-out').post(sanitize(), validateBody(inventoryValidation.out), inventoryStock.out)
inventory.route('/inventory-stock/:id').put(sanitize(),inventoryStock.update)
inventory.route('/inventory-stock').get(sanitize(),inventoryStock.get)
inventory.route('/inventory-stock/:id').get(sanitize(),inventoryStock.getById)
inventory.route('/inventory-stock-user/:id').get(sanitize(),inventoryStock.getByUserId)
inventory.route('/inventory-stock-property/:id').get(sanitize(),inventoryStock.getByPropertyId)
inventory.route('/inventory-stock-category/:id').get(sanitize(),inventoryStock.getByCategoryId)
inventory.route('/inventory-stock-suplier/:id').get(sanitize(),inventoryStock.getBySuplierId)
inventory.route('/inventory-suplier-item').post(sanitize(),inventoryStock.addSuplierItems)
inventory.route('/inventory-suplier-item/:id').put(sanitize(),inventoryStock.updateSuplierItemById)
inventory.route('/inventory-suplier-item/:id').delete(sanitize(),inventoryStock.deleteSuplierItemById)
inventory.route('/inventory-suplier-item-get').post(sanitize(),inventoryStock.getSuplierItems)



