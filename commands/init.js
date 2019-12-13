'use strict';
var mongoose = require('mongoose');

var Members = require('../model/member.js');

module.exports = {
    name: 'init',
    description: 'List memebers',
    execute(message, args) {
        findUsers(message);
    }
};

function findUsers(message) {
    message.guild.fetchMembers().then((guild) => {
        guild.members.forEach(member => {
            mongoose.model('Member').find({
                discordID: member.id
            }, function (err, foundMembers) {
                if (err) {
                    throw err;
                } else if (foundMembers.length < 1) {
                    createUser(member);
                }
            });
        });
    });
    message.channel.send('Memberlist updated');
}

function createUser(member) {
    var Member = new Members({
        name: member.user.tag,
        discordID: member.id
    });

    member.roles.forEach(role => {
        Member.roles.push({ id: role.id, name: role.name });
    });

    Member.save(function (err) {
        if (err) throw err;
    });
}
