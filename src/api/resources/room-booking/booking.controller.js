import { db } from '../../../models';
import sequelize, { NOW } from 'sequelize';
import { bookingConfirmed, cancelBooking, paymentDeclinedSms } from '../sendOtp/sendOtpApis';
import { sendMail } from '../zoptomail/zeptomail';
import { getPagination, getPagingData } from '../pagination';
import {createAtDateFormat} from '../../../utils/date-query'

import moment from 'moment';
const Op = sequelize.Op

function datediff(checkIn, checkOut) {
    const date1 = new Date(checkIn);
    const date2 = new Date(checkOut);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    if(diffDays > 0)
        return diffDays
    else
        return 1
}

function arr_diff (a1, a2) {
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
}

export default {
    async create(req, res, next) {
        const {
            propertyId,
            propertyRoomsCategoryId,
            userId,
            fromDate,
            toDate,
            noOfRooms,
            adults,
            children,
            paymentMode,
            PaymentStatus,
            bookingStatus,
            bookingAmout,
            checkInDateTime,
            checkOutDateTime,
            bookForOther,
            otherPersonName,
            otherPersonNumber,
            source,
            collectedPayment,
            dueAmount,
            otaBookingId,
            guestDetails,
            breakFast,
            extraCharge1,
            extraCharge2,
            bookingHours,
            totalFoodAmount,
            collectedFoodAmout,
            useWalletAmount,
            cuponCode,
            discountAmount,
            platform
        } = req.body;
        const start = moment(new Date(fromDate)).format('YYYY-MM-DD')
        const end = moment(new Date(toDate)).format('YYYY-MM-DD')

        if(!(fromDate && toDate)){
            return res.status(400).json({ status: false ,message: "From date and to date are required!"});
        }

        if(start > end){
            return res.status(400).json({ status: false ,message: "toDate must be greator than or equal from fromDate"});
        }

        if(!(userId || otherPersonName)){
            return res.status(400).json({ status: false ,message: "User id or person any one is required"});
        }

        if(!(bookingAmout && bookingAmout > 0 && source && source !='')){
            return res.status(400).json({ status: false ,message: "Booking amount and source are required!"});
        }

        await db.BookingHotel.create({
            propertyId : propertyId,
            propertyRoomsCategoryId : propertyRoomsCategoryId,
            userId: userId,
            fromDate:fromDate,
            toDate:toDate,
            noOfRooms:noOfRooms,
            adults:adults,
            children:children,
            paymentMode:paymentMode,
            PaymentStatus:PaymentStatus,
            bookingStatus:bookingStatus,
            bookingAmout:bookingAmout,
            checkInDateTime:checkInDateTime,
            checkOutDateTime:checkOutDateTime,
            bookForOther: bookForOther,
            otherPersonName: otherPersonName,
            otherPersonNumber: otherPersonNumber,
            source: source,
            collectedPayment:collectedPayment,
            dueAmount: dueAmount,
            otaBookingId: otaBookingId,
            breakFast:breakFast,
            extraCharge1: extraCharge1,
            extraCharge2: extraCharge2,
            bookingHours:bookingHours,
            totalFoodAmount: totalFoodAmount,
            collectedFoodAmout: collectedFoodAmout,
            useWalletAmount: useWalletAmount,
            cuponCode:cuponCode,
            discountAmount: discountAmount,
            platform: platform ? platform : 1
        })
        .then(async(result) => {
            if(result){
                const count = parseInt(result.id);
                let pad = '000000';
                var ctxt = '' + count;
                let bookingCode = '';
                if(platform && platform == 2){
                    bookingCode = "RRU" + Math.floor(100000 + Math.random() * 900000).toString();
                }else{
                    bookingCode = "RRP" + Math.floor(100000 + Math.random() * 900000).toString();
                }

                /*if(userId && userId != undefined && userId > 0){
                    bookingCode = "P"+propertyId +'U'+userId+ (pad.substr(0, pad.length - ctxt.length) + count).toString();
                }else{
                    bookingCode = "P"+propertyId+"PPU"+ (pad.substr(0, pad.length - ctxt.length) + count).toString();
                }*/
                result['bookingCode'] = bookingCode;
                await db.BookingHotel.update({bookingCode: bookingCode}, {
                    where: { id: result.id }
                });
                
                if(guestDetails && guestDetails.length > 0){
                    let itemsParams = [];
                    guestDetails.forEach(element => {
                        itemsParams.push({name: element.name, age: element.age, gender: element.gender, document_number: element.document_number, document_type: element.document_type, bookedId: result.id})
                    });

                    await db.GuestDetails.bulkCreate(itemsParams).then().catch(err=>{
                        return res.status(500).json({'error': JSON.stringify(err)});
                    }); 
                }
                return res.status(200).json({ status: true ,message: "Booked successfully", data: result});
            }                
            else
                return res.status(200).json({ status: false ,message: "Booking failed!"});
        })
        .catch(err => {
            return res.status(400).json({status: false, message: err.message});
        });
        
    },

    async confirmBooking(req, res, next){
        const id = req.params.id;
        const {status, paymentMode, cancelledBy} = req.body
        const bookingSelection = {
            include: [
                { model: db.PropertyMaster, required: true},
                { model: db.RroomCategory, required: true,
                    include:[
                        { model: db.Rooms, required: true }
                    ]
                }
            ],
            where : {id: id}
        }
        const selector = Object.assign({}, bookingSelection);
        db.BookingHotel.findOne(selector).then(async (result)=> {
            if(result){
                result.update({bookingStatus: status == 7  ? 1 : status, paymentMode: paymentMode, cancelledBy: cancelledBy});
                if(status == 1){
                    const propertyDetails = result.PropertyMaster
                    await db.User.findOne({where: { id: result.get('userId') }}).then(res=>{
                        bookingConfirmed(res.mobile, propertyDetails.propertyMobileNumber, result.get('bookingCode'), propertyDetails ? propertyDetails?.name : "Rrooms Hotel");
                        const mailDetails = {
                            userEmail: res.email,
                            userName: res.name,
                            userMobile: res.mobile,
                            totalBookingAmount:result.bookingAmout,
                            roomPrice:result.RroomCategory.Rooms.regularPrice,
                            useWalletAmount: result.useWalletAmount,
                            roomCategoryName: result.RroomCategory.name,
                            mealPlanName: result.breakFast == 0 ? 'NILL' : result.breakFast == 1 ? 'CP' : result.breakFast == 2 ? 'AP' : result.breakFast == 3 ? 'AMP' : 'NILL',
                            numberOfAdult:result.adults,
                            bookingId: result.bookingCode,
                            fromDate: result.fromDate,
                            toDate: result.toDate,
                            dateDifference: moment(result.toDate).diff(moment(result.fromDate), 'days', false),
                            discountAmount: result.discountAmount,
                            numberOfRooms: result.noOfRooms,
                            totalCollectedAmount: result.collectedPayment,
                            totalDueAmount: result.dueAmount,
                            hotelName: propertyDetails.name,
                            hotelMobileNumber: propertyDetails.propertyMobileNumber,
                            propertyUserEmail: propertyDetails.propertyEmailId,
                            propertyUserName: propertyDetails.propertyEmailId,
                            hotelAddressOne: propertyDetails.address,
                            hotelAddressTwo: propertyDetails.locality,
                            mapUrl:`https://www.google.com/maps/place/${propertyDetails.latitude},${propertyDetails.longitude}`,
                        }                   
                        sendMail(mailDetails);
                    }).catch(error=>{});
                }               
                return res.status(200).json({ status: true ,msg: "Booking status updated successfully"});
            }else{
                return res.status(200).json({ status: false ,msg: "Booking status updating failed"});
            }
        }).catch(error=>{
            return res.status(400).json({ status: false ,msg: error.message});
        })
    },
    
    async updateBookingStatus (req, res, next) {
        const id = req.params.id
        const {           
            bookingStatus,
            checkInDateTime,
            checkOutDateTime,
            reason,
            paymentMode,
            PaymentStatus,
            cancelledBy
        } = req.body;
        
        const updateFields = {};

        if(cancelledBy){
            updateFields['cancelledBy'] = cancelledBy;
        }

        if(bookingStatus)
            updateFields['bookingStatus'] = bookingStatus == 7 ? 1 : bookingStatus;

        if(bookingStatus == 2)
            updateFields['checkInDateTime'] = sequelize.fn('NOW');

        if(bookingStatus == 3)
            updateFields['checkOutDateTime'] = sequelize.fn('NOW');

        if(reason)
            updateFields['reason'] = reason;

        if(paymentMode)
            updateFields['paymentMode'] = paymentMode;

        if(PaymentStatus)
            updateFields['PaymentStatus'] = PaymentStatus;
        
        
        await db.BookingHotel.update(updateFields, { where: {id:id }}).then(async (result)=>{
            if(result){
                const bookingDetails = await db.BookingHotel.findOne({ where: {id: id }});
                if(bookingDetails){
                    const roomDetailsIds = bookingDetails.get('assignRoomDetailsId') ? bookingDetails.get('assignRoomDetailsId').split(',') : [];
                    if(bookingStatus == 4){ // 4 cancel booking                        
                        //Readding user wallet balance
                        if(bookingDetails.get('useWalletAmount') && bookingDetails.get('useWalletAmount') > 0){
                            const wallet = await db.UserWallet.findOne({
                                where: { userId: bookingDetails.userId },
                                order: [
                                    ['id', 'DESC'],
                                    ['updatedAt', 'DESC']
                                ]
                            });
                            if(wallet){
                                await db.UserWallet.create({
                                    userId: bookingDetails.userId,
                                    amount: bookingDetails.get('useWalletAmount'),
                                    balance: wallet.balance + bookingDetails.get('useWalletAmount'),
                                    transactionType: 1
                                }).catch(err => {
                                    return res.status(400).json({ status: false, message: err.message });
                                });
                            }
                        }
                        const propertyDetails = await db.PropertyMaster.findOne({where: { id: bookingDetails.get('propertyId')}});
                        await db.User.findOne({where: { id: bookingDetails.get('userId')}}).then(res=>{
                            cancelBooking(res.mobile, propertyDetails.propertyMobileNumber,  bookingDetails.bookingCode, propertyDetails ? propertyDetails?.name : 'Rrooms');
                        }).catch(error=>{});
                    }else if(bookingStatus == 3){ // 3 Checkout , 2 darty room
                        const bookingSource = bookingDetails.get('source')
                        if(roomDetailsIds && roomDetailsIds.length > 0){
                            await db.RoomDetails.update({status: 2}, {where : {id: roomDetailsIds}});
                        }
                        //Adding RRooms provinding percentage to users between - 10 to 25 percentage
                        if(bookingSource == 'RRooms'){
                            const bookingAmount = bookingDetails.get('bookingAmout')
                            if(bookingAmount && bookingAmount > 0){
                                const randomPercent = Math.floor(Math.random() * 24) + 10;
                                const bookingAmountOfPercent = Math.floor(randomPercent * bookingAmount / 100)
                                const wallet = await db.UserWallet.findOne({
                                    where: { userId: bookingDetails.userId },
                                    order: [
                                        ['id', 'DESC'],
                                        ['updatedAt', 'DESC']
                                    ]
                                });
                                if(wallet){
                                    await db.UserWallet.create({
                                        userId: bookingDetails.userId,
                                        amount: bookingAmountOfPercent,
                                        balance: wallet.balance + bookingAmountOfPercent,
                                        transactionType: 1
                                    }).catch(err => {
                                        return res.status(400).json({ status: false, message: err.message });
                                    });
                                }
                            }
                        }
                    }

                    if(bookingStatus == 7){
                        await db.User.findOne({where: { id: bookingDetails.get('userId')}}).then(user=>{
                            if(user){
                                paymentDeclinedSms(user.get('mobile'), bookingDetails.get('bookingCode'))
                            }                            
                        }).catch(error=>{

                        });
                    }
                }
                return res.status(200).json({ status: true ,msg: "Booking status updated successfully"});
            }
            else
                return res.status(200).json({ status: true ,msg: "Booking status updating failed"});
        }).catch(error=>{
            return res.status(500).json({ status: false, message: error.message });
        })
    },

    async update(req, res, next) {
        try{
            const {
                propertyId,
                propertyRoomsCategoryId,
                userId,
                fromDate,
                toDate,
                noOfRooms,
                adults,
                children,
                paymentMode,
                PaymentStatus,
                bookingStatus,
                bookingAmout,
                checkInDateTime,
                checkOutDateTime,
                bookForOther,
                otherPersonName,
                otherPersonNumber,
                source,
                assignRoomNo,
                collectedPayment,
                guestDetails,
                dueAmount,
                otaBookingId,
                breakFast,
                extraCharge1,
                extraCharge2,
                bookingHours,
                totalFoodAmount,
                collectedFoodAmout,
                useWalletAmount,
                cuponCode,
                cancelledBy
            } = req.body;
            db.BookingHotel.update({
                propertyId : propertyId,
                propertyRoomsCategoryId : propertyRoomsCategoryId,
                userId: userId,
                fromDate:fromDate,
                toDate:toDate,
                noOfRooms:noOfRooms,
                adults:adults,
                children:children,
                paymentMode:paymentMode,
                PaymentStatus:PaymentStatus,
                bookingStatus:bookingStatus == 7 ? 1 : bookingStatus,
                bookingAmout:bookingAmout,
                //checkInDateTime:checkInDateTime,
                //checkOutDateTime:checkOutDateTime,
                bookForOther: bookForOther,
                otherPersonName: otherPersonName,
                otherPersonNumber: otherPersonNumber,
                source: source,
                assignRoomNo: assignRoomNo,
                collectedPayment:collectedPayment,
                dueAmount:dueAmount,
                otaBookingId: otaBookingId,
                breakFast: breakFast,
                extraCharge1: extraCharge1,
                extraCharge2: extraCharge2,
                bookingHours:bookingHours,
                totalFoodAmount: totalFoodAmount,
                collectedFoodAmout: collectedFoodAmout,
                useWalletAmount: useWalletAmount,
                cuponCode: cuponCode,
                cancelledBy: cancelledBy
            }, { where: {id:req.params.id }})
            .then(async (updated) => {
                if(guestDetails && guestDetails.length > 0){
                    let itemsParams = [];
                    guestDetails.forEach(element => {
                        itemsParams.push({name: element.name, age: element.age, gender: element.gender, document_number: document_number, document_type: document_type, bookedId: req.params.id})
                    });
                    //db.GuestDetails.destroy({where: {bookedId: req.params.id}});
                    db.GuestDetails.bulkCreate(itemsParams);
                }

                await db.BookingHotel.findOne({where: {id: req.params.id}}).then(result => {
                    return res.status(200).json({ data: result, status: true, msg: "Booking details updated successfully",});
                })
                .catch((err) => {
                    return res.status(400).json({ status: false ,message: err.message});
                });
            })
            .catch(err => {
                return res.status(400).json({ status: false, message: err.message });                
            });
        }catch(error){
            return res.status(500).json({ status: false, message: error.message });
        }
    },

    async get(req, res) {
        const {fromDate, toDate, bookingStatus, page, size, order} = req.query;
        const { limit, offset } = getPagination(page, size);
        const filter = {};
        if(fromDate && toDate){
            filter['createdAt'] = {
                [Op.between]: [moment(fromDate).format('YYYY-MM-DD'), moment(toDate).format('YYYY-MM-DD')]
            }
        }else if(fromDate){
            filter['createdAt'] = {
                [Op.gte]: moment(fromDate).format('YYYY-MM-DD')
            }
        }else if(toDate){
            filter['createdAt'] = {
                [Op.lte]: moment(toDate).format('YYYY-MM-DD')
            }
        }
        if(bookingStatus){
            filter['bookingStatus'] =  parseInt(bookingStatus)
        }else{
            filter['bookingStatus'] = {[Op.not]: 0}
        }

        const selection = {
            include: [
                { model: db.PropertyMaster, attributes: ['id', 'name', 'propertyCode']},
                { model: db.RroomCategory, attributes: ['id', 'name']},
                { model: db.User},
                //{ model: db.GuestDetails, attributes}
            ],
            where : [filter],
            attributes: ['id', 'bookingCode', 'otaBookingId', 'adults', 'source', 'checkInDateTime',
             'checkOutDateTime', 'noOfRooms', 'bookingHours', 'bookingAmout', 'totalFoodAmount', 'collectedFoodAmout', 'updatedAt',
             'breakFast', 'paymentMode', 'bookingStatus', 'createdAt', 'otherPersonName', 'otherPersonNumber', 'assignRoomNo', 'fromDate', 'toDate'
            ],
            where : [filter],
            order: [
                ['id', order ? order : 'desc'],
                ['updatedAt', order ? order : 'desc']
            ],
            offset: offset, 
            limit: limit,
            distinct: true,
            col: 'id'
        }

        const selector = Object.assign({}, selection);
        await db.BookingHotel.findAndCountAll(selector).then(result => {
            return res.status(200).json({ ...getPagingData(result, page, limit), status: true});
        }).catch((err) => {
            return res.status(400).json({ status: false, message: err.message});
        });
    },

    async getById(req, res) {
        const id = req.params.id;
        const propertySelection = {
            include: [
                { model: db.PropertyMaster, required: false,
                    attributes: ['id', 'name', 'locality'],
                    include: [
                        { model: db.PropertyImage, required: false, attributes: ['title', 'image']},
                    ]
                },
                //{ model: db.RroomCategory, required: false, attributes: []},
               { model: db.User, required: false},
                //{ model: db.GuestDetails, required: false, attributes: []}
            ],
            attributes: ['id', 'propertyId', 'bookingCode', 'userId', 'propertyRoomsCategoryId', 'fromDate', 'toDate', 'noOfRooms', 'adults', 'paymentMode', 'paymentStatus', 'bookingStatus', 'bookingAmout', 'bookForOther', 'otherPersonName', 'otherPersonNumber', 'source', 'assignRoomNo', 'assignRoomDetailsId', 'reason', 'collectedPayment', 'dueAmount', 'otaBookingId', 'checkInDateTime', 'checkOutDateTime', 'breakFast', 'extraCharge1', 'extraCharge2', 'totalFoodAmount', 'collectedFoodAmout', 'useWalletAmount', 'discountAmount', 'cancelledBy'],
            order: [
                ['id', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            where : {id: id}
        }
        const selector = Object.assign({}, propertySelection);
        db.BookingHotel.findOne(selector)
        .then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.send(err);
        });
    },

    async getByBookingCode(req, res) {
        const bookingCode = req.params.id;
        const propertySelection = {
            include: [
                { model: db.PropertyMaster, required: false,
                    include: [
                        { model: db.PropertyImage, required: false},
                    ]
                },
                { model: db.RroomCategory, required: false},
                { model: db.User, required: false},
                { model: db.GuestDetails, required: false}
            ],
            order: [
                ['id', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            where : {bookingCode: bookingCode}
        }
        const selector = Object.assign({}, propertySelection);
        db.BookingHotel.findOne(selector)
        .then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.send(err);
        });
    },

    async getBookingDetailsByCode(req, res) {
        const bookingCode = req.params.id;
        const propertySelection = {
            include: [
                { model: db.PropertyMaster, required: false,
                    // include: [
                    //     { model: db.PropertyImage, required: false},
                    // ]
                },
                { model: db.RroomCategory, required: false},
                { model: db.User, required: false},
                { model: db.GuestDetails, required: false},
                { model: db.BookingLogs, required: false},
                { model: db.Payment, required: false},
                { model: db.Transaction, required: false }
            ],
            order: [
                ['id', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            where : {bookingCode: bookingCode}
        }
        const selector = Object.assign({}, propertySelection);
        db.BookingHotel.findOne(selector)
        .then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.send(err);
        });
    },

    async getByPropertyId(req, res) {
        const id = req.params.id;
        const {fromDate, toDate, bookingStatus, page, size, order} = req.query;
        const { limit, offset } = getPagination(page, size);
        const filter = {
            propertyId: id
        }
        
        if(fromDate && toDate){
            filter['createdAt'] = {
                [Op.between]: [moment(fromDate).format('YYYY-MM-DD'), moment(toDate).format('YYYY-MM-DD')]
            }
        }else if(fromDate){
            filter['createdAt'] = {
                [Op.gte]: moment(fromDate).format('YYYY-MM-DD')
            }
        }else if(toDate){
            filter['createdAt'] = {
                [Op.lte]: moment(toDate).format('YYYY-MM-DD')
            }
        }
        if(bookingStatus){
            filter['bookingStatus'] =  parseInt(bookingStatus)
        }else{
            filter['bookingStatus'] = {[Op.not]: 0}
        }

        const selection = {
            include: [
                { model: db.PropertyMaster, attributes: ['name', 'propertyCode']},
                { model: db.RroomCategory, attributes: ['name']},
                { model: db.User, attributes: ['name', 'email', 'mobile']},
            ],
            where : [filter],
            attributes: ['id', 'bookingCode', 'adults', 'source', 'checkInDateTime',
             'checkOutDateTime', 'noOfRooms', 'bookingHours', 'bookingAmout', 'totalFoodAmount', 'collectedFoodAmout', 'updatedAt',
             'dueAmount', 'breakFast', 'paymentMode', 'bookingStatus', 'createdAt', 'otherPersonName', 'otherPersonNumber', 'assignRoomNo', 'fromDate', 'toDate'
            ],
            where : [filter],
            order: [
                ['id', order ? order : 'desc'],
                ['updatedAt', order ? order : 'desc']
            ],
            offset: offset, 
            limit: limit,
            distinct: true,
            col: 'id'
        }
        const selector = Object.assign({}, selection);
        await db.BookingHotel.findAndCountAll(selector).then(result => {
            return res.status(200).json({ ...getPagingData(result, page, limit), status: true});
        }).catch((err) => {
            return res.status(400).json({ status: false, message: err.message});
        });
    },

    async getByUserId(req, res) {
        const id = req.params.id;
        if(!id){
            return res.status(400).json({ status: false, message: 'User id is required!'});
        }
        const selection = {
            attributes: ['id', 'bookingCode', 'propertyId', 'propertyRoomsCategoryId', 'userId', 'adults', 'noOfRooms', 'fromDate', 'toDate', 'bookingAmout', 'assignRoomNo', 'assignRoomDetailsId', 'userId', 'bookingStatus' ],
            include: [
                { model: db.PropertyMaster, required: false, attributes: ["name", 'longitude', 'latitude', 'id', 'locality',  ],
                    include: [
                        { model: db.PropertyImage, required: false},
                    ]
                },
                //{ model: db.RroomCategory, required: false},
                { model: db.User, required: false, attributes: ['id', 'name', 'email', 'mobile']},
                { model: db.GuestDetails, required: false}
            ],
            order: [
                ['id', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            where : {userId:id, bookingStatus: {[Op.not]: 0}}
        }
        const selector = Object.assign({}, selection);
        db.BookingHotel.findAll(selector)
            .then(result => {
                return res.status(200).json({ data: result, status: true});
            })
            .catch((err) => {
                res.send(err);
            });
    },

    async filterBooking(req, res) {
        const {fromDate, toDate, noOfRooms, paymentMode, PaymentStatus, bookingStatus, order, page, size} = req.body;
        const { limit, offset } = getPagination(page, size);
        const filter = await createAtDateFormat(fromDate, toDate)

        if(bookingStatus){
            filter['bookingStatus'] =  parseInt(bookingStatus)
        }else{
            filter['bookingStatus'] = {[Op.not]: 0}
        }

        if(noOfRooms)
            filter['noOfRooms'] = noOfRooms

        if(paymentMode)
            filter['paymentMode'] = paymentMode

        if(PaymentStatus)
            filter['PaymentStatus'] = PaymentStatus
        

        const selection = {
            include: [
                { model: db.PropertyMaster, attributes: ['name', 'propertyCode']},
                { model: db.RroomCategory, attributes: ['name']},
                { model: db.User, attributes: ['name', 'email']}
            ],
            where : [filter],
            attributes: ['id', 'bookingCode', 'adults', 'source', 'checkInDateTime',
             'checkOutDateTime', 'noOfRooms', 'bookingHours', 'bookingAmout', 'totalFoodAmount', 'collectedFoodAmout', 'updatedAt',
             'breakFast', 'paymentMode', 'bookingStatus', 'createdAt', 'otherPersonName', 'assignRoomNo', 'fromDate', 'toDate'
            ],
            order: [
                ['id', order ? order : 'desc'],
                ['updatedAt', order ? order : 'desc']
            ],
            offset: offset, 
            limit: limit,
            distinct: true,
            col: 'id'
        }
        const selector = Object.assign({}, selection);

        await db.BookingHotel.findAndCountAll(selector).then(result => {
            return res.status(200).json({ ...getPagingData(result, page, limit), status: true});
        }).catch((err) => {
            return res.status(400).json({ status: false, message: err.message});
        });
    },

    async delete(req, res, next) {
        await db.BookingHotel.destroy({ where: { id: req.params.id } }).then(result => {
            if(result)
                return res.status(200).json({ status: true});
            else
                return res.status(200).json({ status: false, msg: 'No record found by this id - ' + req.params.id});
        }).catch(err => {
            return res.status(200).json({ status: false, message: err.message});
        })
    },

    async addGuestDetailsByBookingId(req, res, next){
        const {
            name,
            age,
            gender,
            bookedId,
            document_number,
            document_type
        } = req.body;
            let itemsParams = [];            
            itemsParams.push({name: name, age: age, gender: gender, bookedId: bookedId, document_number: document_number, document_type: document_type })
            db.GuestDetails.bulkCreate(itemsParams).then(result=>{
                if(result){
                    return res.status(200).json({ status: true, msg: 'Guest added successfully'});
                }else{
                    return res.status(200).json({ status: false, msg: 'Guest adding failed!'});
                }

            }).catch(err=>{
                return res.status(200).json({ status: false, message: err.message});
        })
    },

    async deleteGuestDetailById(req, res, next){
        await db.GuestDetails.destroy({ where: { id: req.params.id } }).then(result => {
            if(result)
                return res.status(200).json({ status: true});
            else
                return res.status(200).json({ status: false, msg: 'No record found by this id - ' + req.params.id});
        }).catch(err => {
            return res.status(200).json({ status: false, message: err.message});
        })
    },

    async payAmout(req, res, next){
        const {bookedId, paymentAmount, paymentMode, propertyId, transactionID} = req.body;
        await db.Payment.create({
            bookedId: bookedId,
            paymentAmount:paymentAmount,
            paymentMode:paymentMode,
            propertyId:propertyId,
            paymentDate: new Date(),
            transactionID: transactionID
        }).then(result =>{
            if(result){                
                db.BookingHotel.findOne({where: {id:bookedId}})
                .then(booking => {
                    if(booking){                    
                        const boookingAmount        = booking?.dataValues?.bookingAmout;                        
                        const collectedPayment      = booking?.dataValues?.collectedPayment + paymentAmount;
                        const dueAmount             = boookingAmount - collectedPayment;
                        result['dataValues']['totalPayment'] = collectedPayment;
                        result['dataValues']['dueAmount'] = dueAmount > 0 ? dueAmount : 0;
                        booking.update({collectedPayment: collectedPayment, dueAmount: dueAmount > 0 ? dueAmount : 0});
                        return res.status(200).json({ status: true , data: result, message: "Payment done successfully" });
                    }else{
                        return res.status(200).json({ status: false , data: result, message: "Payment failed due to missing booking id" });
                    }
                })
                .catch((err) => {
                    return res.status(500).json({ status: false, message: err.message });
                });                
            }                
            else{
                return res.status(500).json({ status: false, message: 'Payment failed' });
            }            
        }).catch(error=>{
            return res.status(500).json({ status: false, message: error.message });
        })
    },

    async updatePaymentDetails(req, res, next){
        const {bookedId, paymentAmount, paymentMode, propertyId, transactionID} = req.body;
        await db.Payment.update(
            {
                bookedId: bookedId,
                paymentAmount:paymentAmount,
                paymentMode:paymentMode,
                propertyId:propertyId,
                transactionID:transactionID
            },
            {where: { id: req.params.id }}
        ).then(result =>{
            if(result)
                return res.status(200).json({ status: true ,message: "Payment updated successfully" });
            else
                return res.status(500).json({ status: false, message: "Payment updating failed" });
        }).catch(error=>{
            return res.status(500).json({ status: false,message: error.message });
        })
    },

    async getPaymentList(req, res) {
        const {id, bookedId, propertyId, paymentDate, fromDate, toDate, paymentMode} = req.body;
        const filter = await createAtDateFormat(fromDate, toDate)
        
        if(id){
            filter['id'] = id;
        }
        
        if(bookedId){
            filter['bookedId'] = bookedId
        }

        if(propertyId){
            filter['propertyId'] = propertyId
        }

        if(paymentMode){
            filter['paymentMode'] = paymentMode
        }
        
        const paymentSelection = {
            include: [
                { model: db.PropertyMaster, required: false},
                { model: db.BookingHotel, required: false}
            ],
            where : [filter]
        }
    
        const selector = Object.assign({}, paymentSelection);
        await db.Payment.findAll(selector).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            return res.status(500).json({ status: false, message: err.message });
        });
            
    },

    async getRoomsAviability(req, res, next) {
        const {
            propertyId,
            categoryId
        } = req.body;
        const conditions = []
        if(propertyId){
            conditions.push({propertyId: propertyId})
        }

        if(categoryId){
            conditions.push({categoryId: categoryId})
        }

        const roomSelection = {
            include: [           
                { model: db.RroomCategory, required: true,
                    include: [
                        { model: db.RoomDetails, required: false},
                    ]
                }
            ],
            where: conditions
        }
    
        const selector = Object.assign({}, roomSelection);
        await db.Rooms.findAll(selector).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(500).json({ status: false, message: err.message});
        });
    },

    async assignRoomByBookingId(req, res, next) {
        const {
            bookedId,
            roomDetailsId
        } = req.body;       
        db.BookingHotel.findOne({where: {id: bookedId}}).then(async (booking) =>{
            if(booking){
                let roomNumber = []                
                if(roomDetailsId && roomDetailsId.length > 0){
                   roomNumber = await db.RoomDetails.findAll({ attributes: ["roomNumber"], where:{id : roomDetailsId}}).map(u => u.get("roomNumber"));
                }
                //Release pervious assigned rooms
                const assignedRoomDetailsIds = booking.get('assignRoomDetailsId') ? booking.get('assignRoomDetailsId')?.split(',') : null;
                if(assignedRoomDetailsIds && assignedRoomDetailsIds.length > 0){
                    await db.RoomDetails.update({status: 0}, {where: {id: assignedRoomDetailsIds}});
                }
                //Reassign rooms
                booking.update({assignRoomNo: roomNumber.join(","), assignRoomDetailsId: roomDetailsId.join(',')})
                await db.RoomDetails.update({status: 1}, {where: {id: roomDetailsId}});
                return res.status(200).json({ status: true, msg: "Room assigned successfully"});
            }else{
                return res.status(200).json({ status: false, msg: "No details found by this booked id"});
            }   
        }).catch(err=>{
            res.status(500).json({ status: false, message: err.message});
        })
    },

    async createLog(req, res){
        const { bookingId, action, actionBy, userType } = req.body;
        db.BookingLogs.create({bookingId, action, actionBy, userType}).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Log created successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async updateLog(req, res){
        const id = req.params.id
        const { bookingId, action, actionBy, userType } = req.body;
        db.BookingLogs.update({bookingId, action, actionBy, userType} , {where: {id: id}}).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Log updated successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async getBookingLogById(req, res){
        const id = req.params.id;
        const fieldDetails = {
            include: [
                { model: db.BookingHotel, required: false}
            ],
            where: {id: id}
        }
        db.BookingLogs.findOne(fieldDetails).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Room assigned successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async getBookingLogByBookingId(req, res){
        const id = req.params.id;
        const fieldDetails = {
            // include: [
            //     { model: db.BookingHotel, required: false, attributes: ['']}
            // ],
            where: {bookingId: id},
            attributes: ['bookingId', 'action', 'actionBy', 'userType', 'createdAt']
        }
        db.BookingLogs.findAll(fieldDetails).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Room assigned successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async getBookingLogs(req, res){
        const fieldDetails = {
            include: [
                { model: db.BookingHotel, required: false}
            ]
        }
        db.BookingLogs.findAll(fieldDetails).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Room assigned successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async deleteLog(req, res){
        const id = req.params.id;
        db.BookingLogs.destroy({where: {id: id}}).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Log deleted"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async deleteLogByBookingId(req, res){
        const id = req.params.id;
        db.BookingLogs.destroy({where: {bookingId: id}}).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Log deleted"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async getWalkInGuestList(req, res){
        
        const {mobile, name, bookingCode, propertyId, fromDate, toDate} = req.body
        const startDate = moment(new Date(fromDate)).format('YYYY-MM-DD')
        const endDate = moment(new Date(toDate)).format('YYYY-MM-DD')
        let where = {}
        const orCondition = [] 

        if(mobile){
            orCondition.push({
                otherPersonNumber: {
                    [Op.eq]: mobile
                }
            })
        }

        if(name){
            orCondition.push({
                otherPersonName: {
                    [Op.eq]: name
                }
            })
        }

        if(bookingCode){
            orCondition.push({
                bookingCode: {
                    [Op.eq]: bookingCode
                }
            })
        }

        if(propertyId){
            where = {
                propertyId: propertyId,                
            }
        }

        if(fromDate && toDate){
            where['fromDate'] = {
                [Op.between]: [moment(new Date(startDate)).format('YYYY-MM-DD'), moment(new Date(endDate)).format('YYYY-MM-DD')]
            }
        }else if(fromDate){
            where['fromDate'] = {
                [Op.gte]: moment(new Date(startDate)).format('YYYY-MM-DD')
            }
        }else if(toDate){
            where['fromDate'] = {
                [Op.lte]: moment(new Date(endDate)).format('YYYY-MM-DD')
            }
        }

        if(orCondition?.length > 0){
            where[Op.or] = orCondition
        }

        const selection = {
            attributes: ['id', 'bookingCode', 'adults', 'source', 'checkInDateTime', 'checkOutDateTime', 'noOfRooms', 'bookingAmout', 'totalFoodAmount', 'collectedFoodAmout', 'dueAmount', 'breakFast', 'paymentMode', 'bookingStatus', 'createdAt', 'otherPersonName', 'otherPersonNumber', 'assignRoomNo', 'fromDate', 'toDate', 'propertyId', 'userId'],
            where: [where]
        }

        db.BookingHotel.findAll(selection).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Guest list fetched successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },

    async updateBookingAmountOnMidCheckout(req, res){
        const {bookingId, roomDetailId} = req.body
        db.BookingHotel.findOne({where: {id: bookingId}}).then(async resp => {
            if(resp){
                const bookingAmount  = resp.get('bookingAmout')
                //console.log(bookingAmount);
                const roomDetailsIds = resp.get('assignRoomDetailsId')?.split(',')
                //console.log(roomDetailsIds);
                const totalRooms = roomDetailsIds?.length;
                //console.log(totalRooms)
                const reamingRoomDetailsIds =  arr_diff(roomDetailId, roomDetailsIds) //roomDetailsIds.filter(x => !roomDetailId.includes(x))
                //console.log('reamingRoomDetailsIds', reamingRoomDetailsIds)
                const checkInDate    = moment(new Date(resp.get('checkInDateTime'))).format('YYYY-MM-DD') 
                const checkoutDate   = moment(new Date(resp.get('checkOutDateTime'))).format('YYYY-MM-DD')
                const totalBookingDays = datediff(checkInDate, checkoutDate)
                //console.log("totalBookingDays", totalBookingDays)
                const totalStayDays = datediff(checkInDate, moment(new Date()).format('YYYY-MM-DD'))             
                //console.log('totalStayDays', totalStayDays)                
                if(totalRooms > 1 && (totalBookingDays - totalStayDays) > 1){
                    const perDayAmount  = bookingAmount / totalBookingDays;
                    //console.log('perDayAmount', perDayAmount)
                    const perDayRoomAmount = perDayAmount / totalRooms;
                    //console.log('perDayRoomAmount', perDayRoomAmount)
                    const leavingRooms     = roomDetailId?.length;
                    //console.log('leavingRooms', leavingRooms)
                    const totalAm          = totalStayDays * perDayRoomAmount * leavingRooms;
                    //console.log('totalAm', totalAm)
                    const updatedBookingAmount = bookingAmount - totalAm;
                    //console.log('updatedBookingAmount', updatedBookingAmount)
                    resp.update({bookingAmout: updatedBookingAmount, assignRoomDetailsId: reamingRoomDetailsIds?.join(',')})
                    await db.RoomDetails.update({status: 2}, {where: {id : roomDetailId}})
                    res.status(200).json({ status: true, message: 'Booking amount and room status updated.'});
                }else{
                    res.status(400).json({ status: false, message: 'This room cannot be released due to 1 room being booked and releasing days not being less than booking days.'});
                }
            }else{
                res.status(400).json({ status: false, message: 'Booking not found!'});
            }
        }).catch(error => {
            res.status(400).json({ status: false, message: error.message});
        })

    },

    async getBookingListByUserMobile(req, res){        
        const {mobile, propertyId, fromDate, toDate} = req.body
        const startDate = moment(new Date(fromDate)).format('YYYY-MM-DD')
        const endDate = moment(new Date(toDate)).format('YYYY-MM-DD')
        let where = {source: 'RRooms'}
        let user_id = 0;
        if(mobile){
           const userId =  await db.User.findOne({where: {mobile: mobile}, attributes: ['id']});
           if(userId){
            user_id = userId.get('id');
           }else{
            res.status(400).json({ status: false, message: 'No user found by this mobile number'});
           }
        }

        if(propertyId){
            where = {
                propertyId: propertyId 
            }
        }

        if(user_id && user_id > 0){

            where['userId'] = user_id
        }

        if(fromDate && toDate){
            where['fromDate'] = {
                [Op.between]: [moment(new Date(startDate)).format('YYYY-MM-DD'), moment(new Date(endDate)).format('YYYY-MM-DD')]
            }
        }else if(fromDate){
            where['fromDate'] = {
                [Op.gte]: moment(new Date(startDate)).format('YYYY-MM-DD')
            }
        }else if(toDate){
            where['fromDate'] = {
                [Op.lte]: moment(new Date(endDate)).format('YYYY-MM-DD')
            }
        }
        const selection = {
            where: [where],
            include: [{model: db.User, attributes: ['id', 'name', 'email', 'mobile']}]
        }

        db.BookingHotel.findAll(selection).then(result=>{
            return res.status(200).json({ data: result, status: true, message: "Guest list fetched successfully"});
        }).catch(error=>{
            res.status(400).json({ status: false, message: error.message});
        })
    },
    
};

