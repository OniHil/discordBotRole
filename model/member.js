var mongoose = require('mongoose');

var memberSchema = new mongoose.Schema({
    name: String,
    discordID: Number,
    roles: [{
        name: String,
        id: Number
    }]
});

module.exports = mongoose.model('Member', memberSchema);
