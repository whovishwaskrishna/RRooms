export default (sequelize, DataTypes) => {
    const BookingLogs = sequelize.define('BookingLogs', {
        bookingId: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            references: {
                model: 'BookingHotel',
                key: 'bookingId'
            },
            field: 'bookingId'
        },
        action: { type: DataTypes.STRING, allowNull: true },
        actionBy: { type: DataTypes.STRING, allowNull: true },
        userType: { type: DataTypes.STRING, allowNull: true },
        createdAt:DataTypes.DATE,
        updatedAt:DataTypes.DATE,
        deletedAt:DataTypes.DATE
    }, {
            timestamps: true,
            paranoid: true,
        });
    BookingLogs.associate = function (models) {
        BookingLogs.belongsTo(models.BookingHotel, {foreignKey: 'bookingId'});    
    };
    return BookingLogs;
};