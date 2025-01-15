import bcrypt from 'bcrypt-nodejs';

export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        mobile: DataTypes.STRING,
        otp: DataTypes.INTEGER,
        createdAt:DataTypes.DATE,
        lastLogged: DataTypes.DATE,
        status: DataTypes.INTEGER,
        gst: DataTypes.STRING,
        company: DataTypes.STRING,
        address: DataTypes.STRING,
        referralCode: {
            type: DataTypes.STRING,
            defaultValue: function() {
                return Math.random().toString(36).slice(2)
            }
        },
        platform: DataTypes.TINYINT(2),
        profileImage: {
            type: DataTypes.STRING
        },
        useReferralCode: {
            type: DataTypes.STRING
        },
    }, {
            timestamps: true,
            paranoid: true,
        });
    User.associate = function (models) {
        User.hasMany(models.BookingHotel, {foreignKey: 'userId'});
    };

    User.prototype.comparePassword = function (password) {
        var dbPass = this.getDataValue('password');
        return bcrypt.compareSync(password, dbPass);
    }
    return User;
};