require('dotenv').config();
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;


const userSchema = new Schema({
    firstName: String,
    lastName: String,
    username: { type: String },
    password: { type: String },
    membershipStatus: String,
    messages: [{ title: String, timestamp: Date, text: String }],
    isAdmin: String

})


const messageSchema = new Schema({
    title: String,
    timestamp: Date,
    membershipStatus: String,
    text: String,
    author: String

})


const User = mongoose.model("User", userSchema);

const Message = mongoose.model("Message", messageSchema);

//const user1 = new User({ firstName: 'Jane', lastName: 'Fonda' });
//user1.save()
module.exports = { User, Message };