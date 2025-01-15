import { CanceledError } from 'axios';
import { db } from '../../../models';
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
import moment from 'moment';

const validationResponse = (msg = "") => {
    const error = new Error(msg);
    error.code = 422;
    throw error;
}

const arrayColumn = (arr, n) => arr.map(x => x[n]);

export default {

    async create(req, res, next) {
        const { user_id, booking_id, room_number, order_amount, order_items, order_note, nc_type, otherGuestName, remark, created_by } = req.body;
        try {
            // const User = await db.User.findOne({ where: { id: user_id, deletedAt: null } });
            // if (!User) {
            //     validationResponse("Invalid user_id");
            // }
            /*if (booking_id) {
                const bookingHotel = await db.BookingHotel.findOne({ where: { id: booking_id, deletedAt: null } })
                if (!bookingHotel) {
                    validationResponse("Invalid booking_id");
                }else{
                    if(order_amount && order_amount > 0)
                        bookingHotel.update({totalFoodAmount: order_amount + bookingHotel.get('totalFoodAmount')})
                }
            }*/
            let finalOrderItems = [];
            const menuItem = await db.FoodMenuItem.findAll({ where: { id: arrayColumn(order_items, "id"), deletedAt: null } })
            if (!menuItem.length) {
                validationResponse("No menu item found");
            }/* else {
                menuItem.map((item) => {
                    order_items.forEach(orderItem => {
                        if (orderItem.id == item.id) {
                            item.qty = orderItem.qty;
                            item.totalAmount = item.price * orderItem.qty;
                        }
                    });
                    finalOrderItems = [...finalOrderItems, {
                        "id": item.id,
                        "name": item.name,
                        "price": item.price,
                        "qty": item.qty,
                        "totalAmount": item.totalAmount,
                        "amountBeforeTax":item.amountBeforeTax,
                        "taxAmount":item.taxAmount,
                        //"categoryId": item.categoryId,
                        "propertyId": item.propertyId
                    }];
                });

                //console.log('----------------',finalOrderItems);
                //return;

                let prices = arrayColumn(menuItem, "totalAmount");
                let totalPrice = prices.reduce((a, b) => a + b, 0);
                // if (totalPrice != order_amount) {
                //     validationResponse("Order amount not matched with menu items total price");
                // }
            }*/
            await db.FoodOrder.create({ userId: user_id, bookingId: booking_id, roomNumber: room_number, orderAmount: order_amount, orderNote: order_note, ncType: nc_type, otherGuestName: otherGuestName, orderItems: order_items, remark: remark, createdBy: created_by })
                .then(result => {
                    return res.status(200).json({ status: true, data: result, message: "Order created successfully" });
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

    async update(req, res, next) {
        const { user_id, booking_id, room_number, order_amount, order_note, nc_type, otherGuestName, order_items, remark, created_by } = req.body;
        try {
            // const User = await db.User.findOne({ where: { id: user_id, deletedAt: null } });
            // if (!User) {
            //     validationResponse("Invalid user_id");
            // }
            if (booking_id) {
                const bookingHotel = await db.BookingHotel.findOne({ where: { id: booking_id, deletedAt: null } })
                if (!bookingHotel) {
                    validationResponse("Invalid booking_id");
                } else {
                    //if(order_amount && order_amount > 0)
                    // bookingHotel.update({totalFoodAmount: order_amount + bookingHotel.get('totalFoodAmount')})
                }
            }
            let finalOrderItems = [];
            const menuItem = await db.FoodMenuItem.findAll({ where: { id: arrayColumn(order_items, "id"), deletedAt: null } })
            if (!menuItem.length) {
                validationResponse("No menu item found");
            }/* else {
                menuItem.map((item) => {
                    // order_items.forEach(orderItem => {
                    //     if (orderItem.id == item.id) {
                    //         item.qty = orderItem.qty;
                    //         item.totalAmount = item.price * orderItem.qty;
                    //     }
                    // });
                    finalOrderItems = [...finalOrderItems, {
                        "id": item.id,
                        "name": item.name,
                        "price": item.price,
                        "qty": item.qty,
                        "totalAmount": item.totalAmount,
                        "amountBeforeTax":item.amountBeforeTax,
                        "taxAmount":item.taxAmount,
                        //"categoryId": item.categoryId,
                        "propertyId": item.propertyId
                    }];
                });
                let prices = arrayColumn(menuItem, "totalAmount");
                let totalPrice = prices.reduce((a, b) => a + b, 0);
                // if (totalPrice != order_amount) {
                //     validationResponse("Order amount not matched with menu items total price");
                // }
            }*/
            const order = await db.FoodOrder.findOne({ where: { id: req.params.id, deletedAt: null } })
            if (!order) {
                validationResponse("Invalid order");
            }
            await db.FoodOrder.update({ userId: user_id, bookingId: booking_id, roomNumber: room_number, orderAmount: order_amount, orderNote: order_note, ncType: nc_type, otherGuestName: otherGuestName, orderItems: order_items, remark: remark, createdBy: created_by }, { where: { id: req.params.id, deletedAt: null } })
                .then(async result => {
                    const totalFoodOrderUpdatedAmount = await db.FoodOrder.findAll({ where: { bookingId: booking_id, orderStatus: [1, 2, 3] }, attributes: ["bookingId", [Sequelize.fn('sum', Sequelize.col('orderAmount')), 'totalOrderAmount'], [Sequelize.fn('sum', Sequelize.col('paidAmount')), 'totalPaidAmount']], group: ['bookingId'] })
                    if (totalFoodOrderUpdatedAmount) {
                        await db.BookingHotel.update({ totalFoodAmount: totalFoodOrderUpdatedAmount[0]?.get('totalOrderAmount'), collectedFoodAmout: totalFoodOrderUpdatedAmount[0]?.get('totalPaidAmount') }, { where: { id: booking_id } })
                    }
                    return res.status(200).json({ status: true, data: result, message: "Order updated successfully" });
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

    async updateStatus(req, res, next) {
        const { id } = req.params;
        const { payment_status, order_status } = req.body;
        try {
            const order = await db.FoodOrder.findOne({ where: { id: id, deletedAt: null } })
            if (!order) {
                validationResponse("Invalid order");
            }
            await db.FoodOrder.update({
                paymentStatus: payment_status ? payment_status : order.paymentStatus,
                orderStatus: order_status ? order_status : order.orderStatus
            }, { where: { id: id, deletedAt: null } })
                .then(async result => {
                    ///Updating Booking table amount status
                    if (order_status == 1 || order_status == 4) {
                        await db.BookingHotel.findOne({ where: { id: order.bookingId } }).then(booking => {
                            if (booking) {
                                let totalFoodOrderAmount = booking.get('totalFoodAmount') && booking.get('totalFoodAmount') > 0 ? booking.get('totalFoodAmount') : 0;
                                let orderAmount = order.orderAmount && order.orderAmount > 0 ? order.orderAmount : 0;

                                if (order_status == 1) {
                                    totalFoodOrderAmount = totalFoodOrderAmount + orderAmount
                                } else {
                                    if (totalFoodOrderAmount >= orderAmount) {
                                        totalFoodOrderAmount = totalFoodOrderAmount - orderAmount;
                                    } else {
                                        totalFoodOrderAmount = 0;
                                    }
                                }

                                if (!(order.orderStatus == 1 && order_status == 1)) {
                                    booking.update({ totalFoodAmount: totalFoodOrderAmount });
                                }
                            }
                        })
                    }
                    return res.status(200).json({ status: true, data: result, msg: "Order updated successfully" });
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
            const { booking_id, date } = req.query;
            const selection = {
                order: [
                    ['id', 'DESC'],
                    ['updatedAt', 'DESC']
                ],
                include: [
                    {
                        attributes: ['id', 'bookingCode'],
                        model: db.BookingHotel,
                        required: false
                    }
                ],
                where: [
                    { deletedAt: null }
                ],
            }
            if (booking_id && !date) {
                selection.where = [{
                    bookingId: booking_id,
                    deletedAt: null
                }];
            }
            if (!booking_id && date) {
                const dateRegex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
                if (!dateRegex.test(date)) {
                    validationResponse("Invalid date format. e.g: 'YYYY-MM-DD'");
                }
                selection.where = [{
                    deletedAt: null,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('date', Sequelize.col('createdAt')), '=', date)
                    ]
                }];
            }
            if (booking_id && date) {
                const dateRegex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
                if (!dateRegex.test(date)) {
                    validationResponse("Invalid date format. e.g: 'YYYY-MM-DD'");
                }
                selection.where = [{
                    bookingId: booking_id,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('date', Sequelize.col('createdAt')), '=', date)
                    ],
                    deletedAt: null
                }];
            }
            const selector = Object.assign({}, selection);
            await db.FoodOrder.findAll(selector)
                .then(result => {
                    return res.status(200).json({ data: result, status: true });
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
        db.FoodOrder.findOne({ where: { id: id } })
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            })
            .catch((err) => {
                return res.status(500).json({ status: false, message: err.message });
            })
    },

    async getByBookingId(req, res) {
        //const propertyId = req.params.propertyId;
        const bookingId = req.params.id;
        const selection = {
            include: [
                {
                    attributes: ['id', 'bookingCode'],
                    model: db.BookingHotel,
                    required: false
                }
            ],
            where: [
                { deletedAt: null, bookingId: bookingId }
            ],
            attributes: ['id', 'userId', 'bookingId', 'roomNumber', 'orderAmount', 'paidAmount', 'paymentStatus', 'orderStatus', 'ncType', 'orderItems']
        }

        db.FoodOrder.findAll(selection)
            .then(result => {
                return res.status(200).json({ data: result, status: true });
            })
            .catch((err) => {
                return res.status(400).json({ status: false, message: err.message });
            })
    },

    async getByPropertyId(req, res) {
        const propertyId = req.params.id;
        const bookingId = await db.BookingHotel.findAll({ attributes: ['id'], where: { propertyId: propertyId, bookingStatus: [1, 2, 3, 4] } }).map(u => u.get("id"));
        const selection = {
            include: [
                {
                    attributes: ['id', 'bookingCode'],
                    model: db.BookingHotel,
                    required: false
                }
            ],
            attributes: ['id', 'userId', 'bookingId', 'roomNumber', 'orderAmount', 'paidAmount', 'paymentStatus', 'orderStatus', 'orderNote', 'ncType', 'otherGuestName', 'orderItems', 'remark', 'createdBy', 'createdAt'],
            where: [
                { deletedAt: null, bookingId: bookingId }
            ],
        }
        if (bookingId && bookingId.length > 0) {
            db.FoodOrder.findAll(selection)
                .then(result => {
                    return res.status(200).json({ data: result, status: true });
                })
                .catch((err) => {
                    return res.status(400).json({ status: false, message: err.message });
                })
        } else {
            return res.status(204).json({ status: false, message: 'No food order avaiable by this property id' });
        }

    },

    async delete(req, res, next) {
        const id = req.params.id;
        db.FoodOrder.findOne({ where: { id: id } })
            .then(result => {
                const bookingId = result?.get('bookingId')
                db.FoodOrder.destroy({ where: { id: req.params.id } }).then(async resu => {
                    if (result) {
                        const totalFoodOrderUpdatedAmount = await db.FoodOrder.findAll({ where: { bookingId: bookingId, status: [1, 2, 3] }, attributes: ["bookingId", [Sequelize.fn('sum', Sequelize.col('orderAmount')), 'totalOrderAmount'], [Sequelize.fn('sum', Sequelize.col('paidAmount')), 'totalPaidAmount']], group: ['bookingId'] })
                        if (totalFoodOrderUpdatedAmount) {
                            await db.BookingHotel.update({ totalFoodAmount: totalFoodOrderUpdatedAmount[0]?.get('totalOrderAmount'), collectedFoodAmout: totalFoodOrderUpdatedAmount[0]?.get('totalPaidAmount') }, { where: { id: bookingId } })
                        }
                        return res.status(200).json({ status: true, data: result });
                    } else
                        return res.status(200).json({ status: false, msg: 'No record found by this id - ' + req.params.id });
                }).catch(err => {
                    return res.status(500).json({ status: false, message: err.message });
                })
            }).catch((err) => {
                return res.status(500).json({ status: false, message: err.message });
            })
    }
};