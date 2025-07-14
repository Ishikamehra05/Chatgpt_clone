import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

//model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username is required']
    },
     email: {
        type: String,
        required: [true, 'email is required'],
        unique:true
    },
     password: {
        type: String,
        required: [true, 'password is required'],
        minlength: [ 6, 'password should be 6 character long']
    },
     customerId: {
        type: String,
        default: ""
    },
    subscription: {
        type: String,
        default: ""
    },
})

//hased password
userSchema.pre('save', async function(next) {
    //update
    if(!this.isModified("password")){
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

//match password
userSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password)
}

//sign token
userSchema.methods.getSignedToken = function(res){
    const accessToken = jwt.sign({id:this._id},process.env.JWT_ACCESS_SECRET, {expireIn:JWT_ACCESS_EXPIRE})
    const refreshToken = jwt.sign({id:this._id},process.env.JWT_REFRESH_TOKEN, {expireIn:JWT_REFRESH_EXPIRE})
    res.cookie('refreshToken', `${refreshToken}`, {
        maxAge: 86400 * 7000,
        httpOnly: true,
    });
};

export const User = mongoose.model('User', userSchema)
export default User;