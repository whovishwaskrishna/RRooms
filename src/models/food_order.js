export default (sequelize, DataTypes) => {
    const FoodOrder = sequelize.define('FoodOrder', {
        userId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'User',
                key: 'userId'
            },
            field: 'userId'
        },
        bookingId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'BookingHotel',
                key: 'bookingId'
            },
            field: 'bookingId'
        },
        roomNumber: DataTypes.STRING,
        orderAmount: DataTypes.INTEGER,
        paidAmount: DataTypes.INTEGER,
        paymentStatus: DataTypes.INTEGER,
        orderStatus: DataTypes.INTEGER,
        orderNote: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ncType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        otherGuestName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        orderItems: {
            type: DataTypes.INTEGER,
            set: function(value) {
              return this.setDataValue("orderItems", JSON.stringify(value));
            }
        },
        remark:{
            type: DataTypes.STRING,
            allowNull: true
        },
        createdBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
        },
        createdAt: DataTypes.DATE
    }, {
        timestamps: true,
        paranoid: true,
    });
    FoodOrder.associate = function (models) {
        FoodOrder.belongsTo(models.User, { foreignKey: 'userId' });
        FoodOrder.belongsTo(models.BookingHotel, { foreignKey: 'bookingId' });
        FoodOrder.hasMany(models.FoodOrderPayment, { foreignKey: 'orderId' });
    };
    return FoodOrder;
};