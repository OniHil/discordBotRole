'use strict';
var mongoose = require('mongoose');

var Members = require('../model/member.js');

module.exports = {
    name: 'list',
    description: 'List memebers',
    execute(message, args) {
        if (args.length === 0) {
            listMembers(message);
        } else {
            args = args.join(' ');
            listMembersBasedOnRole(message, args);
        }
    },
};

function listMembers(message) {

}

function listMembersBasedOnRole(message, args) {
    mongoose.model('Member').find({
        'roles.name': args
    }, function (err, foundMembers) {
        if (err)
            throw err;
        else if (foundMembers.length > 0) {
            for (var i = 0; i < foundMembers.length; i++) {
                message.channel.send(foundMembers[i].name);
            }
        } else {
            return;
        }
    });
}
