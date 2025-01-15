import { db } from '../../../models';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const validationResponse = (msg = "") => {
    const error = new Error(msg);
    error.code = 422;
    throw error;
}

const arrayColumn = (arr, n) => arr.map(x => x[n]);

export default {

    async create(req, res, next) {
        const { order_id, property_id, payment_amount, payment_mode, transactionId, booking_id } = req.body;
        try {
            if(booking_id){
                const foodOrder = await db.FoodOrder.findOne({ where: { bookingId: booking_id, deletedAt: null } });
                if (!foodOrder) {
                    validationResponse("Invalid booking_id");
                }
                const property = await db.PropertyMaster.findOne({ where: { id: property_id, deletedAt: null } })
                if (!property) {
                    validationResponse("Invalid property_id");
                }
                await db.FoodOrderPayment.create({ orderId: order_id, bookingId: booking_id, transactionId: transactionId, propertyId: property_id, paymentAmount: payment_amount, paymentMode: payment_mode })
                    .then( async orderPayment => {
                        // Old Query
                        /*let paidAmount = 0;
                        if(foodOrder.paidAmount && foodOrder.paidAmount > 0){
                            paidAmount = foodOrder.paidAmount  + payment_amount;
                        }else{
                            paidAmount = payment_amount;
                        }
                        const status = paidAmount >= foodOrder.orderAmount ? 1 : 0;
                        db.FoodOrder.update({ paymentStatus: status, orderStatus: status, paidAmount }, { where: { bookingId: booking_id, deletedAt: null } })
                            .then(result => {
                                return res.status(200).json({ status: true, data: result, msg: "Payment created successfully" });
                            }).catch(err => {
                                return res.status(400).json({ status: false, message: err.message });
                            }); */
                        //Updating booking table by booking status
                        await db.BookingHotel.findOne({where: {id: booking_id}}).then(result=>{
                            if(result){
                                const totalFoodOrderAmount = result.get('totalFoodAmount');
                                const totalPayment = result.get('collectedFoodAmout') ? result.get('collectedFoodAmout') + payment_amount : payment_amount;
                                const status = totalPayment >= totalFoodOrderAmount ? 1 : 0;
                                result.update({PaymentStatus: status, collectedFoodAmout : totalPayment});
                            }
                        }).catch(err=>{
                            return res.status(400).json({ status: false, message: err.message });
                        })
                        return res.status(200).json({ status: true, message: 'Payment created successfully' });

                    }).catch(err => {
                        return res.status(400).json({ status: false, message: err.message });
                    });
            }else if(order_id){
                const foodOrder = await db.FoodOrder.findOne({ where: { id: order_id, deletedAt: null } });
                if (!foodOrder) {
                    validationResponse("Invalid order_id");
                }
                const property = await db.PropertyMaster.findOne({ where: { id: property_id, deletedAt: null } })
                if (!property) {
                    validationResponse("Invalid property_id");
                }
                await db.FoodOrderPayment.create({ orderId: order_id, bookingId: booking_id, transactionId: transactionId, propertyId: property_id, paymentAmount: payment_amount, paymentMode: payment_mode })
                    .then(result => {
                        let paidAmount = 0;
                        if(foodOrder.paidAmount && foodOrder.paidAmount > 0){
                            paidAmount = foodOrder.paidAmount  + payment_amount;
                        }else{
                            paidAmount = payment_amount;
                        }
                        const status = paidAmount >= foodOrder.orderAmount ? 1 : 0;
                        db.FoodOrder.update({ paymentStatus: status, orderStatus: status, paidAmount }, { where: { id: order_id, deletedAt: null } })
                            .then(result => {
                                return res.status(200).json({ status: true, data: result, msg: "Payment created successfully" });
                            }).catch(err => {
                                return res.status(400).json({ status: false, message: err.message });
                            });
                    }).catch(err => {
                        return res.status(400).json({ status: false, message: err.message });
                    });
            }else{
                return res.status(400).json({ status: false, message: 'No data found!' });
            }
        } catch (error) {
            return res.status(error?.code ? error.code : 500).json({
                status: false,
                msg: error?.message
            });
        }
    },

    async update(req, res, next) {
        const { order_id, property_id, payment_amount, payment_mode, transactionId } = req.body;
        try {
            const foodOrder = await db.FoodOrder.findOne({ where: { id: order_id, deletedAt: null } });
            if (!foodOrder) {
                validationResponse("Invalid order_id");
            }
            const property = await db.PropertyMaster.findOne({ where: { id: property_id, deletedAt: null } })
            if (!property) {
                validationResponse("Invalid property_id");
            }
            const orderPayment = await db.FoodOrderPayment.findOne({ where: { id: req.params.id, deletedAt: null } })
            if (!orderPayment) {
                validationResponse('No record found by this id - ' + req.params.id);
            }
            await db.FoodOrderPayment.update({ orderId: order_id, transactionId: transactionId, propertyId: property_id, paymentAmount: payment_amount, paymentMode: payment_mode }, { where: { id: req.params.id, deletedAt: null } })
                .then(result => {
                    return res.status(200).json({ status: true, data: result, msg: "Payment updated successfully" });
                }).catch(err => {
                    return res.status(400).json({ status: false, message: err.message });
                });
        } catch (error) {
            return res.status(error?.code ? error.code : 500).json({
                status: false,
                msg: error?.message
            });
        }
    },

    async get(req, res) {
        try {
            const { order_id, date, property_id, booking_id, from_at, to_at } = req.query;
            const order = {
                model: db.FoodOrder,
                required: false
            };
            const selection = {
                order: [
                    ['id', 'DESC'],
                    ['updatedAt', 'DESC']
                ],
                include: [order],
                where: [
                    { deletedAt: null }
                ],
            }
            if (property_id && !order_id && !date) {
                selection.where = [{
                    propertyId: property_id,
                    deletedAt: null
                }];
            }
            if (booking_id && !property_id && !order_id && !date) {
                /*order.where = [{
                    bookingId: booking_id,
                    deletedAt: null
                }];
                order.required = true;*/

                selection.where = [{
                    bookingId: booking_id,
                    deletedAt: null
                }];
            }
            if (order_id && !date) {
                selection.where = [{
                    orderId: order_id,
                    deletedAt: null
                }];
            }
            if (date) {
                const dateRegex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
                if (!dateRegex.test(date)) {
                    validationResponse("Invalid date format. e.g: 'YYYY-MM-DD'");
                }
                selection.where = [{
                    deletedAt: null,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('date', Sequelize.col('FoodOrderPayment.createdAt')), '=', date)
                    ]
                }];
            }
            if (!booking_id && !property_id && !order_id && !date && from_at && to_at) {
                const dateRegex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
                if (!dateRegex.test(from_at) || !dateRegex.test(to_at)) {
                    validationResponse("Invalid date format. e.g: 'YYYY-MM-DD'");
                }
                selection.where = [{
                    createdAt: {
                        [Op.between]: [from_at, to_at]
                    },
                    deletedAt: null
                }];
            }

            

            const selector = Object.assign({}, selection);
            console.log('----------', JSON.stringify(selection));
            await db.FoodOrderPayment.findAll(selector)
                .then(result => {
                    let totalAmountPaid = null;
                    if (result.length && order_id) {
                        let paymentAmounts = arrayColumn(result, "paymentAmount");
                        totalAmountPaid = paymentAmounts.reduce((a, b) => a + b, 0);
                    }
                    let response = totalAmountPaid ? {"totalAmountPaid": totalAmountPaid, "result": result} : result;
                    return res.status(200).json({ data: response, status: true });
                }).catch((err) => {
                    return res.status(500).json({ status: false, message: err.message });
                })
        } catch (error) {
            return res.status(error?.code ? error.code : 500).json({
                status: false,
                msg: error?.message
            });
        }
    },

    async getById(req, res) {
        const id = req.params.id;
        db.FoodOrderPayment.findOne({
            where: { id: id }, include: [
                { model: db.FoodOrder, required: false }
            ]
        }).then(result => {
            return res.status(200).json({ data: result, status: true });
        }).catch((err) => {
            return res.status(500).json({ status: false, message: err.message });
        })
    },

    async delete(req, res, next) {
        const id = req.params.id;
        db.FoodOrderPayment.findOne({ where: { id: id } })
            .then(result => {
                db.FoodOrderPayment.destroy({ where: { id: req.params.id } }).then(result => {
                    if (result)
                        return res.status(200).json({ status: true, data: result });
                    else
                        return res.status(200).json({ status: false, msg: 'No record found by this id - ' + req.params.id });
                }).catch(err => {
                    return res.status(500).json({ status: false, message: err.message });
                })
            }).catch((err) => {
                return res.status(500).json({ status: false, message: err.message });
            })
    },
};