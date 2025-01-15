import { db } from '../../../models';
import multer from 'multer';
import sequelize, { NOW } from 'sequelize';
import moment from 'moment';
const Op = sequelize.Op

var fileName = "";
var images = [];
var certificate = { ownerpanCertificate: "", owneradharCertificate: "", gstCertificate: "", tanCertificate: "", rentAgreement: "", cancelCheque: "", PropertyPanCertificate: "" };
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __basedir + "/uploads/");
    },
    filename: function (req, file, callback) {
        const fileType = file.originalname.split(".");
        fileName = fileType[0] + '-' + Date.now() + "." + fileType[1];
        if (file.fieldname == 'images') {
            images.push(fileName);
        } else {
            certificate[file.fieldname] = fileName;
        }
        callback(null, fileName);
    }
});

const upload = multer({
    storage: storage
}).fields([
    { name: "images", maxCount: 35 },
    { name: "ownerpanCertificate", maxCount: 1 },
    { name: "owneradharCertificate", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "tanCertificate", maxCount: 1 },
    { name: "rentAgreement", maxCount: 1 },
    { name: "cancelCheque", maxCount: 1 },
    { name: "PropertyPanCertificate", maxCount: 1 },
]);

const propertyCity = {
    attributes: ['id', 'name'],
    model: db.cities,
    required: false
};

const propertyState = {
    attributes: ['id', 'name'],
    model: db.states,
    required: false
};
export default {
    async create(req, res, next) {
        upload(req, res, async function (err) {
            const {
                propertyCategoryId,
                name,
                gstNumber,
                tanNumber,
                propertyDescription,
                longitude,
                latitude,
                address,
                countryId,
                stateId,
                city,
                pincode,
                bookingPolicy,
                ownerFirstName,
                ownerLastName,
                ownerMobile,
                ownerEmail,
                ownerPan,
                ownerAdhar,
                status,
                amenities,
                partialPayment,
                partialPaymentPercentage,
                partialAmount,
                bookingAmount,
                landmark,
                propertyMobileNumber,
                propertyEmailId,
                firmType,
                PropertyPanNumber,
                noOfRooms,
                remarks,
                bankDetails,
                locaidAccept,
                coupleFriendly,
                locality,
                travellerChoice,
                legalName,
                profileImageID,
                createdBy,
                assigneProperty,
                payAtHotel
            } = req.body;

            const propertyEmailOrMobile = await db.PropertyMaster.findOne({
                where: {
                    [Op.or]: [
                        {
                            propertyEmailId:
                            {
                                [Op.eq]: propertyEmailId
                            }
                        },
                        {
                            propertyMobileNumber:
                            {
                                [Op.eq]: propertyMobileNumber
                            }
                        }
                    ]
                }
            }).catch(err => {
                return res.status(400).json({ status: false, message: err.message });
            });

            if (propertyEmailOrMobile) {
                return res.status(409).json({ status: false, message: 'Property already exist by property email/mobile number!' });
            }

            await db.PropertyMaster.create({
                propertyCategoryId: propertyCategoryId,
                name: name,
                gstNumber: gstNumber,
                tanNumber: tanNumber,
                propertyDescription: propertyDescription,
                longitude: longitude,
                latitude: latitude,
                address: address,
                countryId: countryId,
                stateId: stateId,
                cityId: city,
                pincode: pincode,
                bookingPolicy: bookingPolicy,
                ownerFirstName: ownerFirstName,
                ownerLastName: ownerLastName,
                ownerMobile: ownerMobile,
                ownerEmail: ownerEmail,
                ownerPan: ownerPan,
                ownerAdhar: ownerAdhar,
                status: 0,
                noOfRooms: noOfRooms,
                remarks: remarks,
                partialPayment: partialPayment,
                partialPaymentPercentage: partialPaymentPercentage,
                partialAmount: partialAmount,
                bookingAmount: bookingAmount,
                landmark: landmark,
                propertyMobileNumber: propertyMobileNumber,
                propertyEmailId: propertyEmailId,
                firmType: firmType,
                PropertyPanNumber: PropertyPanNumber,
                PropertyPanCertificate: certificate?.PropertyPanCertificate,
                ownerpanCertificate: certificate?.ownerpanCertificate,
                owneradharCertificate: certificate?.owneradharCertificate,
                gstCertificate: certificate?.gstCertificate,
                tanCertificate: certificate?.tanCertificate,
                rentAgreement: certificate?.rentAgreement,
                cancelCheque: certificate?.cancelCheque,
                bankDetails: bankDetails,
                locaidAccept: locaidAccept,
                coupleFriendly: coupleFriendly,
                locality: locality,
                travellerChoice: travellerChoice,
                legalName: legalName,
                profileImageID: profileImageID,
                createdBy: createdBy,
                payAtHotel: payAtHotel
            })
                .then(async (result) => {
                    //reset data
                    certificate = { ownerpanCertificate: "", owneradharCertificate: "", gstCertificate: "", tanCertificate: "", rentAgreement: "", cancelCheque: "", PropertyPanCertificate: "" };
                    const cityDetails = await db.cities.findOne({ where: { id: city }, attributes: ['name'] });
                    let propertyId = result.id;
                    let cityName = "RR";//cityDetails ? "RR" + cityDetails?.name?.toUpperCase() : "RR";
                    const idP = parseInt(propertyId);
                    let pad = '00000';
                    var ctxt = '' + idP;
                    let propertyCode = cityName + (pad.substr(0, pad.length - ctxt.length) + idP).toString()
                    result['propertyCode'] = propertyCode;
                    db.PropertyMaster.update({ propertyCode: propertyCode }, {
                        where: { id: propertyId }
                    });

                    if (amenities && amenities.length > 0) {
                        let itemsParamsAme = [];
                        amenities.forEach(element => {
                            itemsParamsAme.push({ propertyAmenitiesId: element, propertyId: propertyId })
                        });

                        await db.PropertyAmenities.bulkCreate(itemsParamsAme).then().catch(err => {
                            return res.status(400).json({ status: false, message: err.message });
                        });
                    }
                    if (images && images.length > 0) {
                        let itemsParamsImages = [];
                        images.forEach(element => {
                            itemsParamsImages.push({ image: element, propertyId: propertyId })
                        });
                        await db.PropertyImage.bulkCreate(itemsParamsImages).then().catch(error => {
                            return res.status(400).json({ status: false, message: error.message });
                        });
                        images = [];
                    }

                    const propertyEmailOrMobile = await db.PropertyUser.findOne({
                        where: {
                            [Op.or]: [
                                {
                                    email:
                                    {
                                        [Op.eq]: ownerEmail
                                    }
                                },
                                {
                                    mobile:
                                    {
                                        [Op.eq]: ownerMobile
                                    }
                                }
                            ]
                        }
                    }).catch(err => {
                        //return res.status(400).json({ status: false, message: err.message });
                    });

                    if (!propertyEmailOrMobile) {
                        await db.PropertyUser.create({
                            firstName: ownerFirstName,
                            lastName: ownerLastName,
                            propertyId: propertyId,
                            email: ownerEmail,
                            mobile: ownerMobile,
                            role: '3',
                            designation: "3",
                            password: `${ownerFirstName}@123`,
                            userCode: ownerEmail
                        }).then(async user => {
                            const count = parseInt(user.id);
                            let pad = '00000';
                            var ctxt = '' + count;
                            const userCode = propertyCode + (pad.substr(0, pad.length - ctxt.length) + count).toString();
                            await db.PropertyUser.update({ userCode: userCode }, {
                                where: { id: user.id }
                            });
                            if (assigneProperty && assigneProperty.length > 0) {
                                const userProperty = [];
                                assigneProperty.forEach(element => {
                                    userProperty.push({ propertyUserId: user.id, propertyId: element, status: 1, createdBy: createdBy });
                                });
                                await db.UserProperty.bulkCreate(userProperty);
                            } else {
                                await db.UserProperty.create({ propertyUserId: user.id, propertyId: propertyId, status: 1, createdBy: createdBy });
                            }
                        }).catch(err => {
                            return res.status(400).json({ status: false, message: err.message });
                        });
                    }

                    return res.status(200).json({ status: true, data: result, message: "Property created successfully" });
                })
                .catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
        });
    },

    async update(req, res, next) {
        const propertyId = req.params.id
        upload(req, res, async function (err) {
            const {
                propertyCategoryId,
                name,
                gstNumber,
                tanNumber,
                propertyDescription,
                longitude,
                latitude,
                address,
                countryId,
                stateId,
                city,
                pincode,
                bookingPolicy,
                ownerFirstName,
                ownerLastName,
                ownerMobile,
                ownerEmail,
                ownerPan,
                ownerAdhar,
                status,
                amenities,
                partialPayment,
                partialPaymentPercentage,
                partialAmount,
                bookingAmount,
                landmark,
                propertyMobileNumber,
                propertyEmailId,
                firmType,
                PropertyPanNumber,
                imageTitle,
                noOfRooms,
                remarks,
                bankDetails,
                locaidAccept,
                coupleFriendly,
                locality,
                travellerChoice,
                legalName,
                profileImageID,
                updatedBy,
                payAtHotel
            } = req.body;

            //const cityDetails = await db.cities.findOne({where: {id: city}, attributes: ['name']});
            //let cityName = cityDetails ? "RR" + cityDetails?.name?.toUpperCase() : 'RR';
            //const idP = parseInt(propertyId);
            //let pad = '000000';
            //var ctxt = '' + idP;
            //let propertyCode =  city ? cityName+(pad.substr(0, pad.length - ctxt.length) + idP).toString() : null
            const data2 = {
                //propertyCode: propertyCode,
                propertyCategoryId: propertyCategoryId,
                name: name, gstNumber: gstNumber,
                tanNumber: tanNumber,
                propertyDescription: propertyDescription,
                longitude: longitude,
                latitude: latitude,
                address: address,
                countryId: countryId,
                stateId: stateId,
                cityId: city,
                pincode: pincode,
                bookingPolicy: bookingPolicy,
                ownerFirstName: ownerFirstName,
                ownerLastName: ownerLastName,
                ownerMobile: ownerMobile,
                ownerEmail: ownerEmail,
                ownerPan: ownerPan,
                ownerAdhar: ownerAdhar,
                status: status == 'Active' ? 0 : 1,
                noOfRooms: noOfRooms,
                remarks: remarks,
                partialPayment: partialPayment,
                partialPaymentPercentage: partialPaymentPercentage,
                partialAmount: partialAmount,
                bookingAmount: bookingAmount,
                landmark: landmark,
                propertyMobileNumber: propertyMobileNumber,
                propertyEmailId: propertyEmailId,
                firmType: firmType,
                PropertyPanNumber: PropertyPanNumber,
                PropertyPanCertificate: certificate?.PropertyPanCertificate,
                ownerpanCertificate: certificate?.ownerpanCertificate,
                owneradharCertificate: certificate?.owneradharCertificate,
                gstCertificate: certificate?.gstCertificate,
                tanCertificate: certificate?.tanCertificate,
                rentAgreement: certificate?.rentAgreement,
                cancelCheque: certificate?.cancelCheque,
                bankDetails: bankDetails,
                locaidAccept: locaidAccept,
                coupleFriendly: coupleFriendly,
                locality: locality,
                travellerChoice: travellerChoice,
                legalName: legalName,
                profileImageID: profileImageID,
                updatedBy: updatedBy,
                payAtHotel: payAtHotel
            }

            const data = {}
            Object.keys(data2).forEach((key) => {
                if (data2[key] && data2[key] != '' && data2[key] != undefined) {
                    data[key] = data2[key]
                }
            })

            db.PropertyMaster.update(data, { where: { id: req.params.id } })
                .then(async (updated) => {
                    certificate = { ownerpanCertificate: "", owneradharCertificate: "", gstCertificate: "", tanCertificate: "", rentAgreement: "", cancelCheque: "", PropertyPanCertificate: "" };
                    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
                        let itemsParamsAme = [];
                        amenities.forEach(element => {
                            itemsParamsAme.push({ propertyAmenitiesId: element, propertyId: req.params.id })
                        });
                        await db.PropertyAmenities.destroy({ where: { propertyId: req.params.id } });
                        await db.PropertyAmenities.bulkCreate(itemsParamsAme).then().catch(err => {
                            return res.status(500).json({ status: false, message: err.message });
                        });
                    }

                    if (images && images.length > 0) {
                        let itemsParamsImages = [];
                        images.forEach((element, index) => {
                            const title = imageTitle[index] != undefined ? imageTitle[index] : "Rroom Property Image"
                            itemsParamsImages.push({ propertyId: req.params.id, title: title, image: element })
                        });
                        await db.PropertyImage.bulkCreate(itemsParamsImages).then().catch(err => {
                            return res.status(500).json({ status: false, message: err.message });
                        });
                        images = [];
                    }
                    return res.status(200).json({ status: true, msg: "Property updated successfully" });
                })
                .catch(err => {
                    return res.status(500).json({ status: false, message: err.message });
                });
        });
    },

    async assignUnassignProperty(req, res, next) {
        const { assigneProperty, status, createdBy, propertyUserId } = req.body;
        if (assigneProperty && assigneProperty.length > 0 && propertyUserId) {
            const userProperty = [];
            assigneProperty.forEach(element => {
                userProperty.push({ propertyUserId: propertyUserId, propertyId: element, status: status, createdBy: createdBy });
            });
            if (status == true) {
                await db.UserProperty.bulkCreate(userProperty).then(result => {
                    return res.status(200).json({ status: true, message: 'Property assigned successfully' });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            } else if (status == false) {
                await db.UserProperty.destroy({ where: { propertyUserId: propertyUserId, propertyId: assigneProperty } }).then(result => {
                    return res.status(200).json({ status: true, message: 'Property unassigned successfully' });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            }
        } else {
            return res.status(400).json({ status: false, message: 'Property ids required' });
        }
    },

    async updateProfileImage(req, res, next) {
        const id = req.params.id;
        const { profileImageID } = req.body;
        if (id && profileImageID) {
            await db.PropertyMaster.findOne({ where: { id: id } }).then(result => {
                if (result) {
                    result.update({ profileImageID: profileImageID });
                    return res.status(200).json({ status: true, message: 'Profile image updated successfully.' });
                } else {
                    return res.status(400).json({ status: false, message: 'Property does not exist by submitted id' });
                }
            }).catch(err => {
                return res.status(400).json({ status: false, message: err.message });
            });
        } else {
            return res.status(400).json({ status: false, message: 'Property id and profileImageID is required' });
        }
    },

    async get(req, res) {
        const showDetails = req?.query?.showDetails
        const { ownerEmail } = req.query;
        let propertySelection = {}
        if (showDetails == 'true') {
            propertySelection = {
                //attributes: ['id', 'propertyCode', 'name', 'createdAt', 'landmark', 'approved', 'status', 'updatedAt'],
                through: { attributes: [] },
                include: [
                    {
                        model: db.PropertyAmenities, attributes: ['id', 'propertyId', 'propertyAmenitiesId'], required: false, where: [
                            { deletedAt: null }
                        ]
                    },
                    {
                        model: db.PropertyImage, attributes: ['id', 'propertyId', 'title', 'image'], required: false, where: [
                            { deletedAt: null }
                        ]
                    },
                    {
                        model: db.Rooms, required: false,
                        /*include: [
                            { model: db.RoomImages, attributes: ['id'], required: false},
                            { model: db.RoomAmenities, attributes: ['id'], required: false},
                            { model: db.RoomDetails, attributes: ['id'], required: false}
                        ]*/
                    },
                    propertyCity,
                    { model: db.PropertyUser, required: false, attributes: ['agreement'] }
                ],
                order: [
                    ['id', 'DESC'],
                    ['updatedAt', 'DESC']
                ],
                where: { deletedAt: null, ...(ownerEmail ? { ownerEmail: ownerEmail } : {}) }
            }
        } else {
            propertySelection = {
                attributes: ['id', 'propertyCode', 'name', 'ownerEmail', 'createdAt', 'noOfRooms', 'approved', 'status', 'locality'],
                through: { attributes: [] },
                include: [
                    {
                        model: db.PropertyUser, required: false, attributes: ['agreement'],
                        where: { email: { [Op.col]: 'PropertyMaster.ownerEmail' } },
                    }
                ],
                order: [
                    ['id', 'DESC'],
                    ['updatedAt', 'DESC']
                ],
                where: { deletedAt: null, ...(ownerEmail ? { ownerEmail: ownerEmail } : {}) }
            }
        }
        const selector = Object.assign({}, propertySelection);
        await db.PropertyMaster.findAll(selector).then(result => {
            return res.status(200).json({ data: result, status: true });
        })
            .catch((err) => {
                return res.status(500).json({ status: true, message: err.message });
            });

    },

    async getApprovedProperty(req, res) {
        const propertySelection = {
            include: [
                { model: db.PropertyAmenities, required: false },
                { model: db.PropertyImage, required: false },
                {
                    model: db.Rooms, required: false,
                    include: [
                        { model: db.RoomImages, required: false },
                        { model: db.RoomAmenities, required: false },
                        //{ model: db.RoomDetails, required: false}
                    ]
                },
                propertyCity,
                propertyState
            ],
            order: [
                ['id', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            where: [
                { approved: 1, deletedAt: null }
            ],
        }

        const selector = Object.assign({}, propertySelection);
        await db.PropertyMaster.findAll(selector).then(result => {
            return res.status(200).json({ data: result, status: true });
        })
            .catch((err) => {
                res.send(err);
            });

    },

    async updatePropertyStatus(req, res) {
        const {
            id,
            status,
            approved,
            remarks
        } = req.body;
        db.PropertyMaster.update({
            status: status, approved: approved, remarks: remarks
        }, { where: { id: id } })
            .then(updated => {
                if (updated)
                    return res.status(200).json({ status: true, msg: "Propert status updated successfully" });
                else
                    return res.status(200).json({ status: false, msg: "Propert status updating failed" });
            })
            .catch(err => {
                return res.status(500).json({ status: false, 'errors': err });
            })
    },

    async getById(req, res) {
        const id = req.params.id
        const showDetails = req?.query?.showDetails === 'true' ? true : false;
        const fromDate = req?.query?.fromDate ? moment(new Date(req?.query?.fromDate)).format('YYYY-MM-DD') : moment(new Date()).format('YYYY-MM-DD');
        const toDate = req?.query?.toDate ? moment(new Date(req?.query?.toDate)).format('YYYY-MM-DD') : moment(new Date()).format('YYYY-MM-DD');

        const today = moment(new Date()).format('YYYY-MM-DD')
        let specialApplyPrice = false;
        if (fromDate == moment(new Date('2024-03-30')).format('YYYY-MM-DD') || toDate == moment(new Date('2024-03-30')).format('YYYY-MM-DD')) {
            specialApplyPrice = true;
        }

        const where = {
            [Op.or]: [{
                fromDate: {
                    [Op.between]: [fromDate, toDate]
                }
            }, {
                toDate: {
                    [Op.between]: [fromDate, toDate]
                }
            }],
            propertyId: id,
            bookingStatus: [1, 2]
        };

        const roomDetailsWhereCluase = {
            [Op.or]: [{
                fromDate: {
                    [Op.notBetween]: [fromDate, toDate]
                }
            }, {
                fromDate: {
                    [Op.is]: null
                }
            },
            {
                fromDate: {
                    [Op.is]: null
                }
            }],
            [Op.or]: [{
                toDate: {
                    [Op.notBetween]: [fromDate, toDate]
                }
            }, {
                toDate: {
                    [Op.is]: null
                }
            },
            {
                toDate: {
                    [Op.is]: null
                }
            }]
        }

        /*return await db.RoomDetails.findAll({ attributes: ['id', 'roomId', 'categoryId', 'floorNumber', 'roomNumber', 'occupancy', 'adult', 'child', 'status', 'fromDate', 'toDate'], where: roomDetailsWhereCluase}).then(ress=>{
            return res.status(200).json({ data: ress, status: true});
        }).catch(err=>{
            return res.status(200).json({ data: '', status: true, message: err.message});
        })*/

        const attributes = ['propertyRoomsCategoryId', [sequelize.fn('sum', sequelize.col('noOfRooms')), 'totalRooms']]
        const groupBy = ['propertyRoomsCategoryId']

        let existBooking = await db.BookingHotel.findAll({ where, attributes: attributes, group: groupBy });
        //return res.status(200).json({ data: existBooking, status: true})
        try {
            let attributesList = [];
            if (!showDetails) {
                attributesList = [
                    'id', 'name', 'propertyCategoryId', 'address', 'partialPayment', 'partialPaymentPercentage',
                    'partialAmount', 'bookingAmount', 'status', 'noOfRooms', 'landmark', 'locaidAccept',
                    'coupleFriendly', 'locality', 'profileImageID', 'travellerChoice', 'stateId', 'cityId',
                    'longitude', 'latitude', 'bookingPolicy'
                ];
            }
            const queryOptions = { 
                where: { id: id } 
            };
            
            if (!showDetails) {
                queryOptions.attributes = attributesList;
            }
            const propertyDetails = await db.PropertyMaster.findOne(queryOptions);

            if (propertyDetails) {
                const propertiesAmenities = await db.PropertyAmenities.findAll({ attributes: ['id', 'propertyId', 'propertyAmenitiesId'], where: { propertyId: id } })
                const propertyImages = await db.PropertyImage.findAll({ attributes: ['id', 'propertyId', 'title', 'image'], where: { propertyId: id } })
                const city = await db.cities.findAll({ attributes: ['id', 'name'], where: { id: propertyDetails?.get('cityId') } })
                const states = await db.states.findAll({ attributes: ['id', 'name'], where: { id: propertyDetails?.get('stateId') } })

                const selectorRoomDetails = {
                    include: [
                        { model: db.RoomImages, required: false, attributes: ['id', 'roomId', 'imageName'] },
                        { model: db.RoomAmenities, required: false, attributes: ['id', 'roomId', 'amenitiesId'] },
                        { model: db.RoomDetails, required: false, attributes: ['id', 'roomId', 'categoryId', 'floorNumber', 'roomNumber', 'occupancy', 'adult', 'child', 'status', 'fromDate', 'toDate'], where: roomDetailsWhereCluase },
                    ],
                    attributes: ['id', 'propertyId', 'categoryId', 'minPrice', 'maxPrice', 'regularPrice', 'offerPrice', 'roomDescription', 'occupancy', 'breakFastPrice', 'ap', 'map', 'heroImage', 'status', 'fromDate', 'toDate', 'createdBy'],
                    where: { propertyId: id }
                }
                const roomDetails = await db.Rooms.findAll(selectorRoomDetails);
                let rows = JSON.stringify(propertyDetails);
                rows = JSON.parse(rows);
                rows['city'] = JSON.parse(JSON.stringify(city));
                rows['state'] = JSON.parse(JSON.stringify(states));
                rows['PropertyAmenities'] = JSON.parse(JSON.stringify(propertiesAmenities));
                rows['PropertyImage'] = JSON.parse(JSON.stringify(propertyImages));
                let rooms = JSON.parse(JSON.stringify(roomDetails));
                if (existBooking && existBooking.length > 0) {
                    existBooking = JSON.parse(JSON.stringify(existBooking));
                }
                rooms = rooms.map(element => {
                    let totalAvaiableRooms = 0
                    if (existBooking && existBooking.length > 0) {
                        const totalRoomAllotedCategoryWise = existBooking.filter(obj => {
                            return obj.propertyRoomsCategoryId == element?.categoryId
                        });
                        const totalRooms = element.RoomDetails ? element.RoomDetails.length : 0;
                        if (totalRoomAllotedCategoryWise && totalRoomAllotedCategoryWise.length > 0) {
                            totalAvaiableRooms = totalRooms > parseInt(totalRoomAllotedCategoryWise[0]?.totalRooms) ? totalRooms - parseInt(totalRoomAllotedCategoryWise[0]?.totalRooms) : 0
                        } else {
                            totalAvaiableRooms = element.RoomDetails ? element.RoomDetails.length : 0;
                        }
                    } else {
                        totalAvaiableRooms = element.RoomDetails ? element.RoomDetails.length : 0;
                    }
                    element['avaiableRooms'] = totalAvaiableRooms;
                    //Special price update
                    if (element?.fromDate && element?.toDate) {
                        let from = moment(new Date(element?.fromDate)).format('YYYY-MM-DD')
                        let to = moment(new Date(element?.toDate)).format('YYYY-MM-DD')
                        if ((fromDate >= from && fromDate <= to) || (toDate >= from && toDate <= to) && element?.offerPrice > 0) {
                            element['regularPrice'] = element['offerPrice']
                        }
                    }
                    return element;
                })
                rows['Rooms'] = rooms;
                return res.status(200).json({ data: rows, status: true });
            } else {
                return res.status(400).json({ data: [], status: false, message: 'No data found' });
            }
        } catch (err) {
            return res.status(500).json({ data: [], status: false, message: err.message });
        }
    },

    async delete(req, res, next) {
        await db.PropertyAmenities.destroy({ where: { propertyId: req.params.id } });
        await db.PropertyImage.destroy({ where: { propertyId: req.params.id } });
        await db.Rooms.destroy({ where: { propertyId: req.params.id } });
        await db.PropertyMaster.destroy({ where: { id: req.params.id } }).then(result => {
            if (result)
                return res.status(200).json({ status: true });
            else
                return res.status(200).json({ status: false, msg: 'No record found by this id - ' + req.params.id });
        }).catch(err => {
            return res.status(500).json({ status: false, errors: err });
        })
    },

    async inactiveCouponProperty(req, res, next) {
        const { propertyId, status, createdBy, couponId } = req.body;
        if (propertyId && propertyId.length > 0 && couponId) {
            const couponProperty = [];
            propertyId.forEach(element => {
                couponProperty.push({ couponId: couponId, propertyId: element, createdBy: createdBy });
            });
            if (status == true) {
                await db.InactiveCoupanProperties.bulkCreate(couponProperty).then(result => {
                    return res.status(200).json({ status: true, message: 'Coupon deactive successfully' });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            } else if (status == false) {
                await db.InactiveCoupanProperties.destroy({ where: { couponId: couponId, propertyId: propertyId } }).then(result => {
                    return res.status(200).json({ status: true, message: 'Coupon deactive deleted successfully' });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
            }
        } else {
            return res.status(400).json({ status: false, message: 'Property ids required' });
        }
    }
};
