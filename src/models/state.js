export default (sequelize, DataTypes) => {
    const states = sequelize.define('states', {
        name: DataTypes.STRING,
        iso2: DataTypes.STRING,
        country_id: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        createdAt:DataTypes.DATE
    }, {
            timestamps: true,
            paranoid: true,
    });
    states.associate = function (models) {
        states.hasOne(models.PropertyMaster, {foreignKey: 'stateId'});
    };
    return states;
};