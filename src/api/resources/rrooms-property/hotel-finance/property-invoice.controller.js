import sequelize from 'sequelize';
import moment from 'moment';
const Op = sequelize.Op
import { db } from '../../../../models';
import { getPagination, getPagingData } from '../../pagination';
const invoiceFileUploader = require('../../../../utils/aws-s3-util').default;

// paymentMode-> 1 online, 0 offline
// paymentSource->'ONLINE', 'CASH', 'UPI', 'CHEQUE', 'PAYLATER',

function getPaymentStatus(code) {
    switch (code) {
        case 0:
            return "pending";
        case 1:
            return "paid";
        case 2:
            return "inreview";
        default:
            return "failed";
    }
}
export default {

    async getInvoiceByMonth(req, res) {
        const { endDate, propertyId } = req.query;
        if (!propertyId || propertyId <= 0) {
            return res.status(400).json({
                status: false,
                message: "Property ID must be provided and greater than 0."
            });
        }

        if (!endDate) {
            return res.status(400).json({
                status: false,
                message: "Please provide any valid date(YYYY-MM-DD) of the month for which you want to generate the report."
            });
        }

        if (!moment(endDate, true).isValid()) {
            return res.status(500).json({
                status: false,
                message: 'Invalid Date format. Server required YYYY-MM-DD date format.'
            });
        }

        var dateDiff = moment(new Date(endDate)).diff(new Date(), 'months', true);

        if (dateDiff > 0) {
            return res.status(400).json({
                status: false,
                message: "Can not create invoice report for the current and up-coming month."
            });
        }

        //get the property details by propertyId
        const propertyDetail = await db.PropertyMaster.findOne({
            where: { id: propertyId },
            attributes: ['id', 'name', 'propertyCode', 'gstNumber', 'tanNumber', 'address', 'pincode', 'propertyMobileNumber',
                'propertyEmailId', 'locality'
            ],
        })
        if (!propertyDetail) {
            return res.status(404).json({
                status: false,
                message: `Property details does not exist for property id:${propertyId}`
            });
        }

        const commissionData = await db.RRoomsCommission.findOne({
            where: { propertyId: propertyId },
            attributes: ['commissionPercentage']
        }).catch(err => {
            return res.status(err?.code ? err.code : 500).json({
                status: false,
                message: err?.message
            });
        })
        let commissionPercentage = commissionData?.get('commissionPercentage') ?? 20;

        //var fromDate = moment(endDate).subtract(1,'months').startOf('month').format('YYYY-MM-DD');
        //var toDate = moment(endDate).subtract(1,'months').endOf('month').format('YYYY-MM-DD');
        var fromDate = moment(endDate).startOf('month').format('YYYY-MM-DD');
        var toDate = moment(endDate).endOf('month').format('YYYY-MM-DD');

        const filter = {}
        filter['toDate'] = { [Op.between]: [fromDate, toDate] }
        filter['propertyId'] = parseInt(propertyId)
        filter['bookingStatus'] = 3 // only checkout
        filter['source'] = 'RRooms'


        const bookingDetails = await db.BookingHotel.findAll({
            where: filter,
            attributes: [
                [sequelize.fn('sum', sequelize.col('bookingAmout')), 'totalSale']
            ]
        }).catch(err => {
            return res.status(err?.code ? err.code : 500).json({
                status: false,
                message: err?.message
            });
        })
        if (bookingDetails && bookingDetails[0].dataValues && bookingDetails[0].dataValues.totalSale) {

            const invoiceModelData = fillInvoiceModelData(propertyDetail.dataValues.id, propertyDetail.dataValues.propertyCode, bookingDetails[0].dataValues.totalSale, commissionPercentage, toDate)

            await db.PropertyInvoice.findOrCreate({ where: { propertyId: invoiceModelData.propertyId, invoiceMonth: invoiceModelData.invoiceMonth }, defaults: invoiceModelData }).spread((result, isCreated) => {
                if (isCreated) {
                    let finalResponse = result.dataValues
                    finalResponse.propertyDetail = propertyDetail.dataValues
                    return res.status(200).json({
                        status: true,
                        data: finalResponse
                    });
                }
                else {
                    let finalResponse = result.dataValues
                    finalResponse.propertyDetail = propertyDetail.dataValues
                    return res.status(200).json({ status: true, data: finalResponse });
                }

            }).catch(err => {
                return res.status(err?.code ? err.code : 500).json({
                    status: false,
                    message: err?.message
                });
            })
        } else {
            return res.status(404).json({
                status: false,
                message: `Booking details does not exist for property id:${propertyId}`
            });
        }
    },

    async generateInvoicesForAllPropertiesByMonth(req, res) {
        const { endDate } = req.query;

        if (!endDate) {
            return res.status(400).json({
                status: false,
                message: "Please provide any valid date(YYYY-MM-DD) of the month for which you want to generate the report."
            });
        }

        if (!moment(endDate, true).isValid()) {
            return res.status(500).json({
                status: false,
                message: 'Invalid Date format. Server required YYYY-MM-DD date format.'
            });
        }

        var dateDiff = moment(new Date(endDate)).diff(new Date(), 'months', true);

        if (dateDiff > 0) {
            return res.status(400).json({
                status: false,
                message: "Can not create invoice report for the current and up-coming month."
            });
        }

        // var fromDate = moment(endDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        // var toDate = moment(endDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
        var fromDate = moment(endDate).startOf('month').format('YYYY-MM-DD');
        var toDate = moment(endDate).endOf('month').format('YYYY-MM-DD');

        const allProperties = await db.PropertyMaster.findAll({
            where: { deletedAt: null },
            attributes: ['id', 'name', 'propertyCode', 'gstNumber', 'tanNumber', 'address', 'pincode', 'propertyMobileNumber',
                'propertyEmailId', 'locality'
            ],
            include: [
                {
                    model: db.RRoomsCommission,
                    required: false
                }
            ]
        })

        const propertyIds = allProperties.map(property => property.id);

        const filter = {}
        filter['propertyId'] = propertyIds
        filter['toDate'] = { [Op.between]: [fromDate, toDate] }
        filter['bookingStatus'] = 3 // only checkout
        filter['source'] = 'RRooms'

        const selection = {
            where: [filter],
            attributes: ['propertyId',
                [sequelize.fn('sum', sequelize.col('bookingAmout')), 'totalSale']
            ],
            group: ['propertyId']
        }
        const selector = Object.assign({}, selection);

        const bookingDetails = await db.BookingHotel.findAll(selector).catch(err => {
            return res.status(err?.code ? err.code : 500).json({
                status: false,
                message: err?.message
            });
        })
        const createdInvoices = [];
        const failedInvoices = [];

        const propertyWithTotalSale = allProperties.map(property => {
            const matchedObj = bookingDetails.find(booking => booking.propertyId === property.id);
            if (matchedObj) {
                let newObj = property.dataValues
                newObj['totalSale'] = matchedObj.dataValues.totalSale ?? 0
                return newObj;
            } else {
                let newObj = property.dataValues
                newObj['totalSale'] = 0
                return newObj;
            }
        });
        for (const propertyDetail of propertyWithTotalSale) {

            let commissionPercentage = propertyDetail.RRoomsCommission?.dataValues?.commissionPercentage ?? 20;

            const invoiceModelData = fillInvoiceModelData(propertyDetail.id, propertyDetail.propertyCode, propertyDetail.totalSale, commissionPercentage, toDate)

            const [result, isCreated] = await db.PropertyInvoice.findOrCreate({ where: { propertyId: invoiceModelData.propertyId, invoiceMonth: invoiceModelData.invoiceMonth }, defaults: invoiceModelData }).catch(err => {
                failedInvoices.push({
                    propertyId: invoiceModelData.propertyId,
                    error: err.message
                })
            })
            if (isCreated) {
                createdInvoices.push({
                    propertyId: result.dataValues.propertyId,
                    month: result.dataValues.invoiceMonth,
                    status: 'new'
                })
            }
            else {
                createdInvoices.push({
                    propertyId: result.dataValues.propertyId,
                    month: result.dataValues.invoiceMonth,
                    status: 'already exist'
                })
            }
        }
        const finalRes = {
            success: createdInvoices,
            failed: failedInvoices
        }
        return res.status(200).json({ data: finalRes, status: true });
    },

    async getAllInvoices(req, res) {
        const propertyId = req.params.id;
        if (!propertyId || propertyId <= 0) {
            return res.status(400).json({
                status: false,
                message: "Property ID must be provided and greater than 0."
            });
        }

        await db.PropertyInvoice.findAll({ where: { propertyId: propertyId } }).then(result => {
            if (result) {
                return res.status(200).json({
                    status: true,
                    data: result
                });
            }
            else {
                return res.status(404).json({
                    status: false,
                    message: `Invoice details does not exist for property id:${propertyId}`
                });
            }
        }).catch(err => {
            return res.status(err?.code ? err.code : 500).json({
                status: false,
                message: err?.message
            });
        })
    },

    async initInvoiceOfflinePayment(req, res) {

        invoiceFileUploader(req, res, async function (err) {
            if (err) {
                console.log(err);
                if (err.message) {
                    return res.status(400).send({ message: err.message })
                } else {
                    return res.status(400).send({ message: err })
                }
            }

            const file = req.file;
            if (file) {
                
                const { invoice_id, payment_source, ref_number, payment_date } = req.body
                if (!moment(payment_date, true).isValid()) {
                    return res.status(500).json({
                        status: false,
                        message: 'Invalid Date format. Server required YYYY-MM-DD date format.'
                    });
                }

                const invoiceData = await db.PropertyInvoice.findOne({ where: { invoice_id: invoice_id } });

                if (!invoiceData) {
                    return res.status(404).json({ status: false, message: 'Invoice data does not exist.' });
                }
                invoiceData.paymentMode = 0; //offline
                invoiceData.paymentSource = payment_source;
                invoiceData.merchantTransactionId = ref_number;
                invoiceData.paymentDate = payment_date;
                invoiceData.documentUrl = req.file.location;
                invoiceData.paymentStatus = 'inreview'

                await invoiceData.save().then(result => {
                    return res.status(200).json({ status: true, data: result });
                }).catch(err => {
                    return res.status(500).json({ status: false, 'errors': err });
                });

            } else {
                return res.status(400).send({ message: 'Invoice payment proof file is required in image/pdf format.' })
            }
        })
    },

    async updateInvoiceOfflinePayment(req, res) {

        const { invoice_id, payment_source, ref_number, payment_date, payment_status } = req.body
         // payment_status-> 0=pending, 1=paid, 2=inreview

        if (!invoice_id) {
            return res.status(500).json({
                status: false,
                message: 'Invoice id required.'
            });
        }

        if (!moment(payment_date, true).isValid()) {
            return res.status(500).json({
                status: false,
                message: 'Invalid Date format. Server required YYYY-MM-DD date format.'
            });
        }

        const invoiceData = await db.PropertyInvoice.findOne({ where: { invoice_id: invoice_id } });

        if (!invoiceData) {
            return res.status(404).json({ status: false, message: 'Invoice data does not exist.' });
        }
        invoiceData.paymentMode = 0; //offline
        if(payment_source){
            invoiceData.paymentSource = payment_source;
        }
       
        if(ref_number){
            invoiceData.merchantTransactionId = ref_number;
        }
       
        if(payment_date){
            invoiceData.paymentDate = payment_date;
        }

        if(payment_status){
            invoiceData.paymentStatus = getPaymentStatus(parseInt(payment_status))
            invoiceData.collectedPayment = invoiceData.totalPayableAmount;
        }

        await invoiceData.save().then(result => {
            return res.status(200).json({ status: true, data: result });
        }).catch(err => {
            return res.status(500).json({ status: false, 'errors': err });
        });
    },

    async getInvoiceTransactionsDetail(req, res) {
        const { fromDate, toDate, propertyId, paymentStatus, page, size } = req.query;
        const { limit, offset } = getPagination(page, size);
        const filter = {};
        if (fromDate && toDate) {
            filter['createdAt'] = {
                [Op.between]: [moment(fromDate).format('YYYY-MM-DD'), moment(toDate).format('YYYY-MM-DD')]
            }
        } else if (fromDate) {
            filter['createdAt'] = {
                [Op.gte]: moment(fromDate).format('YYYY-MM-DD')
            }
        } else if (toDate) {
            filter['createdAt'] = {
                [Op.lte]: moment(toDate).format('YYYY-MM-DD')
            }
        }
        if (propertyId) {
            filter['propertyId'] = parseInt(propertyId)
        }
        if (paymentStatus) {
            filter['paymentStatus'] = getPaymentStatus(parseInt(paymentStatus))
        }

        const selection = {
            where: [filter],
            attributes: ['invoice_id', 'propertyId', 'totalPayableAmount', 'merchantTransactionId', 'paymentMode', 'paymentSource', 'paymentStatus', 'paymentDate', 'createdAt'],
            include: [
                { model: db.PropertyMaster, attributes: ['name', 'propertyCode'] }
            ],
            offset: offset,
            limit: limit,
        }

        const selector = Object.assign({}, selection);
        await db.PropertyInvoice.findAndCountAll(selector).then(result => {
            return res.status(200).json({ ...getPagingData(result, page, limit), status: true });
        }).catch((err) => {
            return res.status(400).json({ status: false, message: err.message });
        });
    },

    async getInvoiceById(req, res) {
        const id = req.params.id
        await db.PropertyInvoice.findOne({ where: { invoice_id: id } }).then(result => {
            return res.status(200).json({ status: true, data: result });
        }).catch(err => {
            return res.status(500).json({ status: false, 'errors': err });
        });
    },
};


function fillInvoiceModelData(propertyId, propertyCode, totalAmount, commissionPer, invoiceMonth) {
    let totalCommission = Math.round(totalAmount * commissionPer) / 100;
    const invoiceData = {
        propertyId: propertyId,
        propertyCode: propertyCode,
        totalCommission: totalCommission,
        totalPayableAmount: Math.round(totalCommission + (totalCommission * 18 / 100)),
        totalSale: totalAmount,
        sgstPercentage: 9,
        cgstPercentage: 9,
        sgstAmount: Math.round(totalCommission * 9) / 100,
        cgstAmount: Math.round(totalCommission * 9) / 100,
        paymentStatus: 'pending',
        invoiceMonth: invoiceMonth,
    };
    return invoiceData;
}