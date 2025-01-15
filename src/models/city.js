export default (sequelize, DataTypes) => {
    const cities = sequelize.define('cities', {
        name: DataTypes.STRING,
        state_id: DataTypes.INTEGER,
        state_code: DataTypes.STRING,
        country_id: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        createdAt:DataTypes.DATE
    }, {
            timestamps: true,
            paranoid: true,
    });
    cities.associate = function (models) {
        cities.hasOne(models.PropertyMaster, {foreignKey: 'cityId'});
        cities.hasMany(models.Locality, {foreignKey: 'city_id'});
    };
    return cities;
};