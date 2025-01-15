import express from 'express';
import authController from './auth.controller';
import { JWTSign } from '../../../middleware/strategy';
import { sanitize } from '../../../middleware/sanitizer';
import { validateBody, schemas } from '../../../middleware/validator';
import { loginCheck } from '../../../middleware/auth';
import authValidation from './auth.validation';
import userWalletController from '../user-wallet/user-wallet.controller';
import userWalletValidation from '../user-wallet/user-wallet.validation';

export const authRouter = express.Router();
// authRouter.route('/register').post(sanitize(), authController.register);
authRouter.route('/userCheck').post(sanitize(), validateBody(schemas.userCheckSchema),authController.userCheck);
authRouter.route('/otpGen').post(sanitize(),authController.otpGen);
authRouter.route('/otpVerify').post(sanitize(),authController.otpVerify);
authRouter.route('/create-user-types').post(sanitize(),authController.userType);
authRouter.route('/create-customers').post(sanitize(),authController.createCustomer);
authRouter.route('/update-user/:id').put(sanitize(), /*validateBody(authValidation.updateUser),*/ authController.updateUser);
authRouter.route('/delete-user/:id').delete(sanitize(),authController.deleteUser);

//Property Users
authRouter.route('/property-users').post(sanitize(),authController.createPropertyUsers);
authRouter.route('/property-users/:id').put(sanitize(),authController.updatePropertyUsers);
authRouter.route('/property-users').get(sanitize(),authController.getPropertyUsers);
authRouter.route('/property-users/:id').delete(sanitize(),authController.deletePropertyUser);
authRouter.route('/property-users/:id').get(sanitize(),authController.getPropertyUsersById);
authRouter.route('/property-users-by-property/:id').get(sanitize(),authController.propertyUsersByPropertyId);
authRouter.route('/property-users-by-logged-order').get(sanitize(),authController.getPropertyUsersByLoggedOrder);

authRouter.route('/property-users/generate-otp-password/:id').get(sanitize(),authController.generateOtpForPropertyUserPassword);
authRouter.route('/property-users/update-password/:id').put(sanitize(),authController.updatePropertyUserPassword);
//Rrooms Users
authRouter.route('/rrooms-users').post(sanitize(),authController.createRroomsUsers);
authRouter.route('/rrooms-users/:id').put(sanitize(),authController.updateRroomsUsers);
authRouter.route('/rrooms-users').get(sanitize(),authController.getRroomsUsers);
authRouter.route('/rrooms-users/:id').get(sanitize(),authController.getRroomsUsersById);
authRouter.route('/rrooms-users/:id').delete(sanitize(), authController.deleteRroomsUsers);

authRouter.route('/rrooms-users/generate-otp-password/:id').get(sanitize(),authController.generateOtpForRroomsUserPassword);
authRouter.route('/rrooms-users/update-password/:id').put(sanitize(),authController.updateRroomsUserPassword);

//Get
authRouter.route('/user-types').get(sanitize(),authController.getUserTypes);
authRouter.route('/customers').get(sanitize(),authController.getCustomers);
authRouter.route('/customers/:id').get(sanitize(),authController.getCustomersById);


//Sign
authRouter.route('/signin-rrooms-user').post(sanitize(), authController.signinRroomsUsers);
authRouter.route('/signin-property-user').post(sanitize(), authController.signinPropertyUsers);

//Delete
authRouter.route('/delete-user-type/:id').delete(sanitize(), authController.deleteUserType);
authRouter.route('/delete-customer/:id').delete(sanitize(), authController.deleteCustomer);

//Logout
authRouter.route('/logout').get(sanitize(), authController.logout);

//User Roles
authRouter.route('/roles').get(sanitize(), authController.getRolles);
authRouter.route('/roles/:id').get(sanitize(), authController.getRoleById);
authRouter.route('/roles').post(sanitize(), authController.createRole);
authRouter.route('/roles/:id').put(sanitize(), authController.updateRole);
authRouter.route('/roles/:id').delete(sanitize(), authController.deletetRole);


//User wallet
authRouter.route('/user-wallet').get(sanitize(),  userWalletController.get);
authRouter.route('/user-wallet/:id').get(sanitize(),  userWalletController.getByUserId);
authRouter.route('/use-referral-code').post(sanitize(), validateBody(userWalletValidation.store),  userWalletController.create);
authRouter.route('/use-wallet/:user_id').put(sanitize(), validateBody(userWalletValidation.update),  userWalletController.update);
authRouter.route('/get-user-wallet').post(sanitize(),  userWalletController.getByUserIdOrMobileNo);

//Get app url
authRouter.route('/get-app-url').post(sanitize(),  authController.getAppUrl);
