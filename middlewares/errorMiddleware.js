const errorResponse = require('../utils/errorResponse')

const errorHandler = (req, res, next) => {
    let error = {...error}
    error.message = error.message

    //mongoose cast error(handle mongoose error)
    if(error.name === 'castError'){
        const message = 'resources not found'
        error = new errorResponse(message, 404 )
    }

    //duplicate key error
    if(error.code === 11000){
        const message = 'duplicate field value'
        error = new errorResponse(message, 400 )
    }

    //mongoose validation
    if (error.name === 'validationError'){
        const message = Object.values(err.errors).map(val => val.message)
        error = new errorResponse(message, 404)
        res.status(error.statusCode || 500).json({
            status : false,
            error: error.message || 'Server Error'
        })
    }
}

module.exports = errorHandler;