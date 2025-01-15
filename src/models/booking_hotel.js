export default (sequelize, DataTypes) => {
    const BookingHotel = sequelize.define('BookingHotel', {
        bookingCode: DataTypes.STRING,
        userId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'User',
                key: 'userId'
            },
            field: 'userId'
        },
        propertyId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'PropertyMaster',
                key: 'propertyId'
            },
            field: 'propertyId'
        },
        propertyRoomsCategoryId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'PropertyRoomCategory',
                key: 'propertyRoomsCategoryId'
            },
            field: 'propertyRoomsCategoryId'
        },
        fromDate: DataTypes.DATE,
        toDate: DataTypes.DATE,
        noOfRooms: DataTypes.INTEGER(2),
        adults: DataTypes.INTEGER(3),
        children: DataTypes.INTEGER(3),
        paymentMode: DataTypes.INTEGER(2),
        PaymentStatus: DataTypes.INTEGER(2),
        bookingStatus: DataTypes.INTEGER(2),
        bookingAmout: DataTypes.FLOAT,
        bookForOther: DataTypes.INTEGER(2),
        otherPersonName: DataTypes.STRING,
        otherPersonNumber: DataTypes.STRING,
        source: DataTypes.STRING,
        assignRoomNo: DataTypes.STRING,
        assignRoomDetailsId: DataTypes.STRING,
        reason: DataTypes.STRING,
        collectedPayment: DataTypes.FLOAT,
        dueAmount: DataTypes.FLOAT,
        otaBookingId: DataTypes.STRING,
        checkInDateTime: DataTypes.DATE,
        checkOutDateTime:DataTypes.DATE,
        breakFast: DataTypes.TINYINT(2),
        extraCharge1: DataTypes.STRING,
        extraCharge2: DataTypes.STRING,
        bookingHours: DataTypes.FLOAT,
        totalFoodAmount: DataTypes.FLOAT,
        collectedFoodAmout: DataTypes.FLOAT,
        useWalletAmount: DataTypes.FLOAT,
        cuponCode: DataTypes.STRING,
        discountAmount: DataTypes.FLOAT,
        platform: DataTypes.TINYINT(2),
        cancelledBy: DataTypes.STRING,
        createdAt:DataTypes.DATE
    }, {
            timestamps: true,
            paranoid: true,
        });
    BookingHotel.associate = function (models) {
        BookingHotel.belongsTo(models.PropertyMaster, {foreignKey: 'propertyId'});
        BookingHotel.belongsTo(models.RroomCategory, {foreignKey: 'propertyRoomsCategoryId'});
        BookingHotel.belongsTo(models.User, {foreignKey: 'userId'});
        BookingHotel.hasMany(models.GuestDetails, {foreignKey: 'bookedId'});
        BookingHotel.hasOne(models.Payment, {foreignKey: 'bookedId'});
        BookingHotel.hasMany(models.FoodOrderPayment, {foreignKey: 'bookingId'}); 
        BookingHotel.hasOne(models.BookingLogs, {foreignKey: 'bookingId'});
        BookingHotel.hasMany(models.Transaction, {foreignKey: 'bookingId'});        
    };
    return BookingHotel;
};