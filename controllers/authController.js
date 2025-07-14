const errorHandler = require('../middlewares/errorMiddleware');
const userModel = require('../models/userModel');
const errorResponse = require('../utils/errorResponse');

//jwt token
exports.sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken
    res.status(statusCode).json({
        success: true,
        token,
    });
};

//register
exports.registerController = async(req, res, next) => {
    try{
        const {username, email, password} = req.body
        //exisitng user
        const exisitngEmail = await userModel.findOne({email})
        if(exisitngEmail){
            return next(new errorResponse('email is already registered', 500))
        }
        const user = await userModel.create({username, email, password})
        this.sendToken(user, 201, res)
    } catch(error){
        console.log(error)
        next(error)
    }
};

//login
exports.loginController = async(req, res, next) => {
    try{
        const { email, password} = req.body

        //validation
        if(!email || !password){
            return next(new errorResponse('please provide email and password'))
        }
        const user = await userModel.findOne({email})
        if(!user){
            return next(new errorResponse('Invalid creaditals', 401))
        }
        const isMatch = await userModel.matchPassword(password)
         if(!isMatch){
            return next(new errorHandler('Invalid creaditals', 401))
        }
        //RESPONSE
        this.sendToken(user, 200, res)
    } catch(error){
        console.log(error)
        next(error)
    }
};
exports.logoutController = async(req, res) => {
    res.clearCookie('refreshToken')
    return res.status(200).json({
        success:true,
        message: "logout successfully",
    })
};