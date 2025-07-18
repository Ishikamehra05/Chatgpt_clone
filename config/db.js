const mongoose = require("mongoose")
const colors = require('colors')

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`connected to mongodb database ${mongoose.connection.host}` .bgGreen.white)
    }
    catch (error) {
        console.log(`mongoose daatabase error ${error}` .bgRed.white)
    }
}

module.exports = connectDB