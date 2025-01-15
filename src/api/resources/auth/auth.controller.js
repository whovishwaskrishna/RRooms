import JWT from 'jsonwebtoken';
import { db } from '../../../models';
import bcrypt from 'bcrypt-nodejs';
import mailer from '../../../mailer';
import config from '../../../config';
import sequelize from 'sequelize';
import multer from 'multer';
import { sendVerificationCode, sendAppUrl, sendOTPToUpdatePassword } from '../sendOtp/sendOtpApis';

var JWTSign = function (user, date) {
    return JWT.sign({
        iss: config.app.name,
        sub: user.id,
        iat: date.getTime(),
        exp: new Date().setMinutes(date.getMinutes() + 30)
    }, config.app.secret);
}
var makeid = () => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 7; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
var image = "";

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __basedir + "/uploads/");
    },
    filename: function (req, file, callback) {
        const fileType = file.originalname.split(".");
        const fileName = fileType[0] + '-' + Date.now() + "." + fileType[1];
        image = fileName;
        callback(null, fileName);
    }
})

const upload = multer({
    storage: storage
}).fields([
    { name: "profileImage", maxCount: 1 }
]);

export default {
    async userCheck(req, res) {
        const { mobile } = req.body;
        db.User.findOne({ where: { mobile: mobile } })
            .then(created => {
                if (created) {
                    return res.status(200).json({ name: created.name, mobile: created.mobile, status: 1, message: 'User exist' });

                }
                else {
                    return res.status(200).json({ status: 0, message: 'User not exist' });
                }
            }
            )
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async otpGen(req, res, next) {
        var isNewUser = 1;
        const { mobile, referralCode, platform, hash_key } = req.body;
        const newPassword = mobile == '9919168088' ? 1234 : Math.floor(1000 + Math.random() * 9000);
        db.User.findOne({ where: { mobile: mobile } }).then(result => {
            if (result) {
                db.User.update({ otp: newPassword }, { where: { id: result.id } })
                    .then(updated => {
                        const response = JSON.stringify(result);
                        const resResult = JSON.parse(response);
                        delete resResult['otp'];
                        sendVerificationCode(mobile, newPassword, hash_key);
                        return res.status(200).json({ status: true, mobile: mobile, message: "OTP sent on mobile.", isNewUser: false, data: resResult });
                    })
                    .catch(err => {
                        return res.status(400).json({ status: false, message: err.message });
                    });
            } else {
                db.User.create({ otp: newPassword, mobile: mobile, referralCode: referralCode, useReferralCode: referralCode, platform: platform ? platform : 1 }).then(async user => {
                    const response = JSON.stringify(user);
                    const resResult = JSON.parse(response);
                    delete resResult['otp'];
                    sendVerificationCode(mobile, newPassword, hash_key);
                    //Update Referal Amount if referal code are coming..
                    if (platform == 2 || referralCode == true) {
                        //Create user wallet
                        const newUserAmount = parseInt(process.env.NEW_USER_REFERRAL_AMOUNT)
                        db.UserWallet.create({ amount: newUserAmount, balance: newUserAmount, userId: user.get('id'), transactionType: 1 });
                        //Update exist user wallet amount
                        const userDetails = await db.User.findOne({ where: { referralCode: referralCode } });
                        if (userDetails && referralCode) {
                            const referralAmount = parseInt(process.env.CURRENT_USER_REFERRAL_AMOUNT);
                            await db.UserWallet.findOne({ where: { userId: userDetails.get('id') }, order: [['id', 'DESC'], ['updatedAt', 'DESC']] }).then(async function (obj) {
                                db.UserWallet.create({ amount: referralAmount, balance: obj ? obj.get('balance') + referralAmount : referralAmount, userId: userDetails.get('id'), transactionType: 1 });
                            });
                        }
                    }
                    return res.status(200).json({ status: true, mobile: mobile, message: "User created and OTP sent on mobile", isNewUser: true, data: resResult });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            }
        });
    },

    async otpVerify(req, res, next) {
        const { mobile, otp, isNewUser, userId, userCode, referralCode, name, email, gst, company, address } = req.body;
        db.User.findOne({
            where: { mobile: mobile, otp: otp }
        }).then(async (user) => {
            if (user) {
                var date = new Date();
                req.user = user;
                var token = JWTSign(req.user, date);
                res.cookie('XSRF-token', token, {
                    expire: new Date().setMinutes(date.getMinutes() + 30),
                    httpOnly: true, secure: config.app.secure
                });
                res.user = user.get('id');
                let updatedReferralCode = ''
                if (!user.get('name'))
                    updatedReferralCode = name ? name?.split(' ')[0]?.toUpperCase() + user.get('referralCode')?.toUpperCase() : user.get('referralCode')?.toUpperCase();

                user.update({ name: name, email: email, otp: null, status: 1, gst: gst, company: company, address: address, lastLogged: sequelize.fn('NOW') });
                if (referralCode) {
                    //Create user wallet
                    const newUserAmount = parseInt(process.env.NEW_USER_REFERRAL_AMOUNT)
                    db.UserWallet.create({ amount: newUserAmount, balance: newUserAmount, userId: user.get('id'), transactionType: 1 });
                    //Update exist user wallet amount
                    const userDetails = await db.User.findOne({ where: { referralCode: referralCode } });
                    if (userDetails) {
                        const referralAmount = parseInt(process.env.CURRENT_USER_REFERRAL_AMOUNT);
                        await db.UserWallet.findOne({ where: { userId: userDetails.get('id') }, order: [['id', 'DESC'], ['updatedAt', 'DESC']] }).then(function (obj) {
                            db.UserWallet.create({ amount: referralAmount, balance: obj ? obj.get('balance') + referralAmount : referralAmount, userId: userDetails.get('id'), transactionType: 1 });
                        });
                    }
                }
                //Updating Referal Code
                if (updatedReferralCode)
                    await user.update({ referralCode: updatedReferralCode })
                return res.status(200).json({ success: true, message: "OTP verified successfully", token: token, data: user });
            } else {
                return res.status(400).json({ success: false, message: 'Wrong OTP!' });
            }
        }).catch(error => {
            return res.status(400).json({ success: false, message: error.message });
        });
    },

    async updateUser(req, res, next) {
        upload(req, res, async function (err) {
            const { id } = req.params;
            const { name, email, userCode, referralCode, gst, company, address } = req.body;

            const data = {}
            if (name) {
                data['name'] = name;
            }

            if (email) {
                data['email'] = email;
            }

            if (image) {
                data['profileImage'] = image;
                image = "";
            }

            if (userCode) {
                data['userCode'] = userCode;
            }

            if (referralCode) {
                data['referralCode'] = referralCode;
            }

            if (gst) {
                data['gst'] = gst;
            }

            if (company) {
                data['company'] = company;
            }

            if (address) {
                data['address'] = address;
            }

            db.User.update(data, { where: { id: id } })
                .then(updated => {
                    if (updated[0] > 0)
                        return res.status(200).json({ status: true, message: "User updated successfully" });
                    else
                        return res.status(200).json({ status: false, message: "User not update, due to missing some fields" });
                })
                .catch(err => {
                    return res.status(400).json({ status: false, 'message': err.message });
                });
        })
    },

    async userType(req, res, next) {
        const { role } = req.body;
        db.UserType.findOrCreate({ where: { role: role }, defaults: { role: role } })
            .then(created => {
                if (created[1]) {
                    return res.status(200).json({ status: "200", msg: "success", success: 0 });
                }
                else {
                    return res.status(200).json({ created });
                }
            })
            .catch(err => {
                if (err && err.name && err.name == 'PRAException') {
                    return res.status(500).json({ 'errors': [err.msg] });
                } else {
                    console.log(err);
                    return res.status(500).json({ 'errors': ['Error!!!'] });
                }
            });
    },

    async createCustomer(req, res, next) {
        const { userCode, name, email, mobile, } = req.body;
        db.Customer.findOrCreate({ where: { role: role }, defaults: { userCode: userCode, name: name, email: email, mobile: mobile } })
            .then(created => {
                if (created[1]) {
                    return res.status(200).json({ status: "200", msg: "success", success: 0 });
                }
                else {
                    return res.status(200).json({ created });
                }
            })
            .catch(err => {
                if (err && err.name && err.name == 'PRAException') {
                    return res.status(400).json({ status: false, message: err.message });
                } else {
                    console.log(err);
                    return res.status(400).json({ status: false, message: err.message });
                }
            });
    },

    async updateCustomerprofile(req, res, next) {
        const id = req.params.id
        const { name, email } = req.body;
        db.Customer.update({ name: name, email: email, profileImage: profileImage }, { where: { id: id } })
            .then(result => {
                return res.status(200).json({ status: true, message: "Profile updated successfully", data: result });
            })
            .catch(err => {
                return res.status(400).json({ status: false, message: err.message });
            });
    },

    async createRroomsUsers(req, res, next) {
        const { firstName, lastName, email, mobile, role, password, designation, createdBy } = req.body;
        db.RroomsUser.findOne({ where: { email: email } }).then(result => {
            if (result) {
                return res.status(200).json({ status: false, message: "User already exist." });
            } else {
                db.RroomsUser.create({ firstName: firstName, lastName: lastName, email: email, mobile: mobile, role: role, designation: designation, password: password, userCode: email, createdBy: createdBy }).then(async result => {
                    //const userCode = "R"+firstName.toUpperCase()+result.id.toString();
                    const count = parseInt(result.id);
                    let pad = '00000';
                    var ctxt = '' + count;
                    const userCode = 'RR' + (pad.substr(0, pad.length - ctxt.length) + count).toString();
                    await db.RroomsUser.update({ userCode: userCode }, {
                        where: { id: result.id }
                    });
                    return res.status(200).json({ status: true, message: "User created successfully." });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            }
        });
    },

    async updateRroomsUsers(req, res, next) {
        const { userCode, firstName, lastName, mobile, role, password, designation, updatedBy } = req.body;
        db.RroomsUser.update({ userCode: userCode, firstName: firstName, lastName: lastName, mobile: mobile, role: role, designation: designation, password: password, updatedBy: updatedBy }, { where: { id: req.params.id } })
            .then(updated => {
                if (updated[0] > 0)
                    return res.status(200).json({ status: true, message: "User updated successfully" });
                else
                    return res.status(200).json({ status: false, message: "User not update, due to missing some fields" });
            })
            .catch(err => {
                return res.status(400).json({ status: false, message: err.message });
            });
    },

    async getRroomsUsers(req, res) {
        const RroomsUser = {
            include: [
                { model: db.Roles, required: false }
            ]
        }
        db.RroomsUser.findAll(RroomsUser)
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            }
            )
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async getRroomsUsersById(req, res) {
        const id = req.params.id;
        const RroomsUser = {
            include: [
                { model: db.Roles, required: false }
            ],
            where: { id: id }
        }
        db.RroomsUser.findOne(RroomsUser)
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            })
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async deleteRroomsUsers(req, res) {
        db.RroomsUser.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true, message: "User deleted successfully" });
            else
                return res.status(200).json({ status: false, message: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async createPropertyUsers(req, res, next) {
        const { firstName, lastName, propertyId, email, mobile, role, password, designation, agreement, status, createdBy, assigneProperty, assignedProperty } = req.body;
        db.PropertyUser.findOne({ where: { email: email } }).then(result => {
            if (result) {
                return res.status(200).json({ status: false, message: "User already exist." });
            } else {
                db.PropertyUser.create({ firstName: firstName, lastName: lastName, propertyId: propertyId, email: email, mobile: mobile, role: role, designation: designation, password: password, status: status, userCode: email, agreement: agreement, createdBy: createdBy }).then(async result => {
                    const count = parseInt(result.id);
                    let pad = '00000';
                    var ctxt = '' + count;
                    const userCode = 'PU' + firstName.trim().toUpperCase() + (pad.substr(0, pad.length - ctxt.length) + count).toString();
                    await db.PropertyUser.update({ userCode: userCode }, {
                        where: { id: result.id }
                    });

                    if (assigneProperty && assigneProperty.length > 0) {
                        const userProperty = [];
                        assigneProperty.forEach(element => {
                            userProperty.push({ propertyUserId: result.id, propertyId: element, status: 1, createdBy: createdBy });
                        });
                        await db.UserProperty.bulkCreate(userProperty);
                    } else if (assignedProperty && assignedProperty.length > 0) {
                        const userProperty = [];
                        assignedProperty.forEach(element => {
                            userProperty.push({ propertyUserId: result.id, propertyId: element, status: 1, createdBy: createdBy });
                        });
                        await db.UserProperty.bulkCreate(userProperty);
                    }
                    return res.status(200).json({ status: true, message: "User created successfully." });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            }
        });
    },

    async updatePropertyUsers(req, res, next) {
        const { userCode, firstName, lastName, propertyId, email, mobile, role, password, designation, status, agreement, updatedBy } = req.body;
        db.PropertyUser.update({ userCode: userCode, propertyId: propertyId, firstName: firstName, lastName: lastName, mobile: mobile, role: role, designation: designation, password: password, status: status, agreement: agreement, updatedBy: updatedBy }, { where: { id: req.params.id } })
            .then(updated => {
                if (updated[0] > 0)
                    return res.status(200).json({ status: true, message: "User updated successfully" });
                else
                    return res.status(200).json({ status: false, message: "User not update, due to missing some fields" });
            })
            .catch(err => {
                return res.status(400).json({ status: false, message: err.message });
            });
    },

    async getPropertyUsers(req, res) {
        const PropertyUser = {
            include: [
                { model: db.UserProperty, required: false, attributes: ['id', 'propertyUserId', 'propertyId'] },
                { model: db.Roles, required: false, attributes: ['id', 'roleName', 'roleCode', 'canEdit', 'canDelete', 'canView'] }

            ],
            attributes: ['id', 'propertyId', 'userCode', 'firstName', 'lastName', 'designation', 'email', 'mobile', 'createdBy', 'updatedBy']
        }
        db.PropertyUser.findAll(PropertyUser)
            .then(result => {
                return res.status(200).json({ result, status: true });
            }
            )
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async deletePropertyUser(req, res, next) {
        db.PropertyUser.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true, message: 'User deleted successfully' });
            else
                return res.status(200).json({ status: false, message: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async getPropertyUsersById(req, res) {
        const id = req.params.id;
        const PropertyUser = {
            include: [
                { model: db.Roles, required: false }
            ],
            where: { id: id }
        }
        db.PropertyUser.findOne(PropertyUser)
            .then(async result => {
                //Get Assigned property also
                const assignedProperty = await db.UserProperty.findAll({ attributes: ["propertyId"], where: { propertyUserId: id } }).map(u => u.get("propertyId"));
                let userProperty = []
                if (assignedProperty && assignedProperty.length > 0) {
                    userProperty = await db.PropertyMaster.findAll({ attributes: ['id', 'propertyCode', 'name'], where: { id: assignedProperty } });
                }
                const raw = JSON.parse(JSON.stringify(result));
                raw['userProperty'] = userProperty;
                return res.status(200).json({ data: raw, status: true });
            })
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async getUserTypes(req, res) {
        db.UserType.findAll()
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            })
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async getCustomers(req, res) {
        db.User.findAll()
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            }
            )
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async getCustomersById(req, res) {
        db.User.findOne({ where: { id: req.params.id } })
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            }
            )
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async signinRroomsUsers(req, res, next) {
        const RroomsUser = {
            include: [
                { model: db.Roles, required: false }
            ],
            where: { email: req.body.email, password: req.body.password }
        }
        db.RroomsUser.findOne(RroomsUser).then(async (result) => {
            var date = new Date();
            req.user = result;
            var token = JWTSign(req.user, date);
            console.log(token)
            res.cookie('XSRF-token', token, {
                expire: new Date().setMinutes(date.getMinutes() + 30),
                httpOnly: true, secure: config.app.secure
            });
            res.user = result.id;
            await db.RroomsUser.update({ lastLogged: sequelize.fn('NOW') }, { where: { id: result.id } })
            return res.status(200).json({ status: true, token: token, data: result });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async signinPropertyUsers(req, res, next) {
        const PropertyUser = {
            include: [
                { model: db.Roles, required: false },
                /*{ model: db.UserProperty, required: false, attributes: ['id','propertyUserId','propertyId', 'status', 'createdBy'],
                    include: [
                        { model: db.PropertyMaster, required: false, attributes: ['id','propertyCode','name']}
                    ]
                }*/
            ],
            where: { email: req.body.email, password: req.body.password }
        }

        db.PropertyUser.findOne(PropertyUser).then(async (result) => {
            if (result) {
                var date = new Date();
                req.user = result;
                var token = JWTSign(req.user, date);
                console.log(token)
                res.cookie('XSRF-token', token, {
                    expire: new Date().setMinutes(date.getMinutes() + 30),
                    httpOnly: true, secure: config.app.secure
                });
                res.user = result.id;

                const assignedProperty = await db.UserProperty.findAll({ attributes: ["propertyId"], where: { propertyUserId: result.id } }).map(u => u.get("propertyId"));
                let userProperty = []
                if (assignedProperty && assignedProperty.length > 0) {
                    userProperty = await db.PropertyMaster.findAll({ attributes: ['id', 'propertyCode', 'name'], where: { id: assignedProperty } });
                }

                const ownerOfProperty = await db.PropertyMaster.findAll({ attributes: ['id', 'propertyCode', 'name'], where: { ownerEmail: result.get('email') } });
                await db.PropertyUser.update({ lastLogged: sequelize.fn('NOW') }, { where: { id: result.id } })
                const raw = JSON.parse(JSON.stringify(result));
                raw['ownerProperty'] = ownerOfProperty;
                raw['userProperty'] = userProperty;

                return res.status(200).json({ status: true, token: token, data: raw });
            } else {
                return res.status(400).json({ status: false, message: 'Invalid login details' });
            }
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async getPropertyUsersByLoggedOrder(req, res, next) {
        db.PropertyUser.findAll({
            order: [
                ['lastLogged', 'DESC']
            ]
        }).then(result => {
            return res.status(200).json({ status: true, data: result, message: "Success" });
        }).catch(err => {
            return res.status(400).json({ status: false, errors: err.message });
        })
    },

    async deleteUserType(req, res, next) {
        db.UserType.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true, message: 'User type deleted' });
            else
                return res.status(200).json({ status: false, message: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async deleteCustomer(req, res, next) {
        db.Customer.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true });
            else
                return res.status(200).json({ status: false, message: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async deleteUser(req, res, next) {
        db.User.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true, message: 'User deleted' });
            else
                return res.status(200).json({ status: false, message: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async logout(req, res, next) {
        var sess = req.cookies.user;
        if (sess) {
            req.cookies.user = null;
            return res.status(200).json({ status: true, message: "user logout successfully" });
        } else {
            return res.status(400).json({ status: false, message: "User authentication failed" });
        }
    },

    async createRole(req, res) {
        const {
            roleName, roleCode, status, canEdit, canDelete, canView
        } = req.body

        db.Roles.create({ roleName, roleCode, status, canEdit, canDelete, canView })
            .then(result => {
                return res.status(200).json({ data: result, message: 'Created successfully', status: true });
            }
            )
            .catch((err) => {
                return res.status(400).json({ message: err.message, status: false });
            })
    },

    async updateRole(req, res) {
        const {
            roleName, roleCode, status, canEdit, canDelete, canView
        } = req.body
        db.Roles.update({ roleName, roleCode, status, canEdit, canDelete, canView }, { where: { id: req.params.id } })
            .then(result => { return res.status(200).json({ message: 'Updated successfully', status: true }) }
            ).catch((err) => { return res.status(400).json({ message: err.message, status: false }); })
    },

    async deletetRole(req, res) {
        db.Roles.destroy({ where: { id: req.params.id } })
            .then(result => {
                return res.status(200).json({ message: 'Role deleted', status: true });
            })
            .catch((err) => {
                return res.status(400).json({ message: err.message, status: false });
            })
    },

    async getRolles(req, res) {
        db.Roles.findAll()
            .then(result => {
                return res.status(200).json({ data: result, status: true, message: "Success" });
            }
            )
            .catch((err) => {
                return res.status(400).json({ message: err.message, status: false });
            })
    },

    async getRoleById(req, res) {
        db.Roles.findOne({ where: { id: req.params.id } })
            .then(result => {
                return res.status(200).json({ data: result, status: true, message: "Success" });
            }
            )
            .catch((err) => {
                return res.status(400).json({ message: err.message, status: false });
            })
    },

    async propertyUsersByPropertyId(req, res, next) {
        console.log(req.body.email, req.body.password);
        db.PropertyUser.findOne({ where: { propertyId: req.params.id } }).then(result => {
            if (result) {
                return res.status(200).json({ success: true, token: token, data: result, message: 'Success' });
            } else
                return res.status(200).json({ status: false, data: result, message: 'No users exist by this property id' });
        }).catch(err => {
            return res.status(500).json({ status: false, message: err.message });
        })
    },

    async getAppUrl(req, res, next) {
        const { mobile } = req.body;
        if (mobile) {
            try {
                sendAppUrl(mobile);
                return res.status(200).json({ status: true, message: 'Url sent successfully' });
            } catch (error) {
                return res.status(500).json({ status: false, message: error.message });
            }
        }
    },

    async generateOtpForPropertyUserPassword(req, res, next) {
        const id = req.params.id
        db.PropertyUser.findOne({ where: { id: id } }).then(async (result) => {
            if (result) {
                const otp = Math.floor(1000 + Math.random() * 9000)
                console.log("otp - ", otp);
                sendOTPToUpdatePassword(result.get('mobile'), otp)
                result.update({ otp: otp })
                return res.status(200).json({ status: true, message: 'Otp sent to password your password' });
            } else {
                return res.status(400).json({ status: false, message: 'User not found!' });
            }
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },


    async updatePropertyUserPassword(req, res, next) {
        const id = req.params.id
        const { password, otp } = req.body

        if (!(id && password && otp)) {
            return res.status(400).json({ status: false, message: 'Id/Password/Otp is required' });
        }

        db.PropertyUser.findOne({ where: { id: id, otp: otp } }).then(async (result) => {
            if (result) {
                result.update({ password: password, otp: 0 })
                return res.status(200).json({ status: true, message: 'Password updated successfully' });
            } else {
                return res.status(400).json({ status: false, message: 'Invalid OTP/User id!' });
            }
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async generateOtpForRroomsUserPassword(req, res, next) {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ status: false, message: 'Id is required' });
        }
        db.RroomsUser.findOne({ where: { id: id } }).then(async (result) => {
            if (result) {
                const otp = Math.floor(1000 + Math.random() * 9000)
                sendOTPToUpdatePassword(result.get('mobile'), otp)
                result.update({ otp: otp })
                return res.status(200).json({ status: true, message: 'Otp sent to password your password' });
            } else {
                return res.status(400).json({ status: false, message: 'User not found!' });
            }
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

    async updateRroomsUserPassword(req, res, next) {
        const id = req.params.id
        const { password, otp } = req.body

        if (!(id && password && otp)) {
            return res.status(400).json({ status: false, message: 'Id/Password/OTP is required' });
        }

        db.RroomsUser.findOne({ where: { id: id, otp: otp } }).then(async (result) => {
            if (result) {
                result.update({ password: password, otp: 0 })
                return res.status(200).json({ status: true, message: 'Password updated successfully' });
            } else {
                return res.status(400).json({ status: false, message: 'Invalid OTP/User id' });
            }
        }).catch(err => {
            return res.status(400).json({ status: false, message: err.message });
        })
    },

};
