export default (sequelize, DataTypes) => {
    const PropertyMaster = sequelize.define('PropertyMaster', {
        propertyCode: DataTypes.STRING,
        propertyCategoryId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'PropertyCategories',
                key: 'id'
            },
            field: 'propertyCategoryId'
        },
        name: DataTypes.STRING,
        gstNumber: DataTypes.STRING,
        tanNumber: DataTypes.STRING,
        propertyDescription: DataTypes.TEXT,
        longitude: DataTypes.DECIMAL(7,7),
        latitude: DataTypes.DECIMAL(7,7),
        address: DataTypes.STRING(1200),
        countryId: DataTypes.STRING,
        stateId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'states',
                key: 'id'
            },
            field: 'stateId'
        },
        cityId: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            references: {
                model: 'cities',
                key: 'id'
            },
            field: 'cityId'
        },
        pincode: DataTypes.INTEGER,
        bookingPolicy: DataTypes.TEXT,
        ownerFirstName: DataTypes.STRING,
        ownerLastName: DataTypes.STRING,
        ownerMobile: DataTypes.STRING,
        ownerEmail: DataTypes.STRING,
        ownerPan: DataTypes.STRING,
        ownerAdhar: DataTypes.STRING,
        partialPayment: DataTypes.INTEGER,
        partialPaymentPercentage: DataTypes.STRING,
        partialAmount: DataTypes.FLOAT,
        bookingAmount: DataTypes.FLOAT,
        status: DataTypes.INTEGER,
        noOfRooms: DataTypes.INTEGER(4),
        remarks: DataTypes.STRING(500),
        approved: DataTypes.INTEGER,
        ownerpanCertificate: DataTypes.STRING,
        owneradharCertificate: DataTypes.STRING,
        PropertyPanCertificate: DataTypes.STRING,
        PropertyPanNumber: DataTypes.STRING,
        gstCertificate: DataTypes.STRING,
        tanCertificate: DataTypes.STRING,
        rentAgreement: DataTypes.STRING,
        cancelCheque: DataTypes.STRING,
        landmark: DataTypes.STRING,
        propertyMobileNumber: DataTypes.STRING,
        propertyEmailId: DataTypes.STRING,
        firmType: DataTypes.STRING,
        bankDetails: DataTypes.STRING,
        locaidAccept: DataTypes.INTEGER,
        coupleFriendly: DataTypes.INTEGER,
        locality: DataTypes.STRING,
        travellerChoice: DataTypes.STRING,
        legalName: DataTypes.STRING,
        profileImageID: DataTypes.INTEGER,
        payAtHotel: DataTypes.INTEGER(2),
        createdBy:DataTypes.INTEGER,
        updatedBy:DataTypes.INTEGER,
        createdAt:DataTypes.DATE
    }, {
            timestamps: true,
            paranoid: true
        });
    
    PropertyMaster.addScope('distance', (latitude, longitude, distance, unit = "km") => {
        const constant = unit == "km" ? 6371 : 3959;
        const haversine = `(
            ${constant} * acos(
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude})) * sin(radians(latitude))
            )
        )`;
        return {
            attributes: [
                "id",
                "name",
                "propertyCode",
                "propertyCategoryId",
                "gstNumber",
                "tanNumber",
                "propertyDescription",
                "longitude",
                "latitude",
                "address",
                "countryId",
                "stateId",
                "cityId",
                "pincode",
                "bookingPolicy",
                "ownerFirstName",
                "ownerLastName",
                "ownerMobile",
                "ownerEmail",
                "ownerPan",
                "ownerAdhar",
                "partialPayment",
                "partialPaymentPercentage",
                "partialAmount",
                "bookingAmount",
                "status",
                "noOfRooms",
                //"remarks",
                "approved",
                "ownerpanCertificate",
                "owneradharCertificate",
                "PropertyPanCertificate",
                "PropertyPanNumber",
                "gstCertificate",
                "tanCertificate",
                "rentAgreement",
                "cancelCheque",
                "landmark",
                "propertyMobileNumber",
                "propertyEmailId",
                "firmType",
                "bankDetails",
                "locaidAccept",
                "coupleFriendly",
                "locality",
                "legalName",
                "profileImageID",
                "travellerChoice",
                "createdAt",
                "updatedAt",
                "payAtHotel"
                [sequelize.literal(haversine), 'distance'],
            ],
            order: [sequelize.literal('distance asc')],
            limit: 25,
            having: sequelize.literal(`distance <= ${distance}`)
        }
    })

    PropertyMaster.associate = function (models) {
        PropertyMaster.hasMany(models.PropertyImage, {foreignKey: 'propertyId'});
        PropertyMaster.hasOne(models.PropertyUser, {foreignKey: 'propertyId'});
        PropertyMaster.belongsTo(models.cities, {foreignKey: 'cityId'});
        PropertyMaster.belongsTo(models.states, {foreignKey: 'stateId'});
        PropertyMaster.hasMany(models.PropertyAmenities, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.Rooms, {foreignKey: 'propertyId'});
        PropertyMaster.hasOne(models.BookingHotel, {foreignKey: 'propertyId'});
        PropertyMaster.hasOne(models.Payment, {foreignKey: 'propertyId'});
        PropertyMaster.hasOne(models.InventoryInStocks, {foreignKey: 'propertyId'});
        PropertyMaster.belongsTo(models.PropertyCategory, {foreignKey: 'propertyCategoryId'});
        PropertyMaster.hasMany(models.Rating, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.Coupon, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.UserProperty, {foreignKey: 'propertyId'});
        PropertyMaster.hasOne(models.RRoomsCommission, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.PropertyInvoice, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.DailyExpense, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.RestaurantFoodOrderPayment, {foreignKey: 'propertyId'});
        PropertyMaster.hasMany(models.BanquetEnquiry, {foreignKey: 'propertyId'});
    };
    return PropertyMaster;
};
