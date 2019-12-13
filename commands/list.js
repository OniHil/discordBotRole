'use strict';
const mongoose = require('mongoose');

// var Members = require('../model/member.js');

module.exports = {
    name: 'list',
    description: 'List memebers',
    execute(message, args) {
        if (args.length === 0) {
            asyncCall(message);
        } else {
            args = args.join(' ');
            listMembersBasedOnRole(message, args);
        }
    }
};

function fillRoleMemberList(message, exampleEmbed) {
    var roleCount = 0;
    return new Promise(resolve => {
        message.guild.roles.forEach(role => {
            mongoose.model('Member').find({
                'roles.name': role.name
            }, function (err, foundMembers) {
                if (err) {
                    throw err;
                } else {
                    if (role.name === '@everyone') {
                        roleCount++;
                        return;
                    }
                    roleCount++;
                    var roleMemberList = [];
                    if (foundMembers.length > 0) {
                        for (var i = 0; i < foundMembers.length; i++) {
                            roleMemberList.push(foundMembers[i].name);
                        }
                        exampleEmbed.fields.push({
                            name: role.name,
                            value: '```glsl\n' +
                                roleMemberList.join('\n') +
                                '```'
                        });
                    } else {
                        exampleEmbed.fields.push({
                            name: role.name,
                            value: '```glsl\n' +
                                'No members' +
                                '```'
                        });
                    }

                    if (message.guild.roles.size === roleCount) {
                        resolve('resolved');
                    }
                }
            });
        });
    });
};

async function asyncCall(message) {
    const exampleEmbed = {
        color: 0x0099ff,
        title: 'All roles and their members',
        thumbnail: {
            url: 'https://i.imgur.com/JQfLlO7.png'
        },
        fields: [],
        timestamp: new Date(),
        footer: {
            icon_url: 'https://i.imgur.com/SvhVOe5.png',
            text: 'Cireni#1004'
        }
    };

    await fillRoleMemberList(message, exampleEmbed);
    message.channel.send({ embed: exampleEmbed });
}

function listMembersBasedOnRole(message, args) {
    mongoose.model('Member').find({
        'roles.name': args
    }, function (err, foundMembers) {
        if (err) {
            throw err;
        } else if (foundMembers.length > 0) {
            for (var i = 0; i < foundMembers.length; i++) {
                message.channel.send(foundMembers[i].name);
            }
        }
    });
}
