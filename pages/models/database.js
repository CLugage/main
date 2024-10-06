require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the User model
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    userID: String,
    balance: Number,
    pteroID: Number,
    password: String,

    notif: Boolean,
    serverLimit: Number,

    nextEarnCuty: Number,
    nextAFK: Number
}));

// Define the VPS model
const VPS = mongoose.models.Server || mongoose.model('Server', new mongoose.Schema({
    userID: String,
    proxID: Number,
    name: String,
    sshPort: Number,
    password: String,
    ip: String,
    ipv6: String,
    os: String,
    cost: Number,
    expiry: Number,
    status: String // creating | active | error
}));

// Define the Node model
const Node = mongoose.models.Node || mongoose.model('Node', new mongoose.Schema({
    name: String,
    nextID: Number,
    maxVPS: Number
}));

// Define the Port model
const Port = mongoose.models.Port || mongoose.model('Port', new mongoose.Schema({
    port: Number,
    isUsed: Boolean,
    vpsID: String,
    intPort: Number
}));

// Money
const Earn = mongoose.models.Earn || mongoose.model('Earn', new mongoose.Schema({
    userID: String,
    isUsed: Boolean,
    creditCount: Number,
    token: String,
    url: String
}));

// Blog
const Blog = mongoose.models.Blog || mongoose.model('Blog', new mongoose.Schema({
    title: String,
    date: Number,
    content: String,
    id: String
}));

module.exports = {
    User,
    VPS,
    Earn,
    Node,
    Port,
    Blog,
    mongoose
};
