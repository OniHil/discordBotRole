"use strict";
var fs = require('fs');
var Discord = require('discord.js');
var mongoose = require('mongoose');

var client = new Discord.Client();
client.commands = new Discord.Collection();

mongoose.connect('mongodb://localhost/discordMembers', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

var db = mongoose.connection;
var token = 'NjU0MDU3MzIwMTQxMjkxNTQx.XfAX9Q.VeFRChW8W92l39-SijuM6vP33oU';
var prefix = '!';
var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

var allRoles = [];
var newRoles;
var removedRoles;

var matchedNewRole;
var matchedRemovedRole;

client.once('ready', () => {
    console.log('logged in as ' + client.user.tag);

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log('Connected to DB');
    });

    for (var i = 0; i < commandFiles.length; i++) {
        var command = require('./commands/' + commandFiles[i]);
        client.commands.set(command.name, command);
    }

    client.guilds.forEach(guild => {
        guild.roles.forEach(role => {
            allRoles.push({ name: role.name, id: role.id });
        });
    });
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    var role = message.member.roles.find(role => role.name == 'mod');
    if (role == null) return;

    var args = message.content.slice(prefix.length).split(/ +/);
    var command = args.shift().toLowerCase();

    if (commandFiles.includes(command + '.js')) {
        client.commands.get(command).execute(message, args);
    }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    newRoles = [];
    removedRoles = [];
    matchedNewRole = [];
    matchedRemovedRole = [];

    if (oldMember._roles == newMember._roles) {
        return;
    } else if (oldMember._roles < newMember._roles) { // added
        for (var Ri = 0; Ri < newMember._roles.length; Ri++) {
            matchedNewRole = allRoles.filter(role => {
                return role.id == newMember._roles[Ri];
            });
            newRoles.push({
                id: matchedNewRole[0].id,
                name: matchedNewRole[0].name
            });
            changeRoles(newMember.id);
        }
    } else if (oldMember._roles > newMember._roles) { // removed
        for (var Ri = 0; Ri < oldMember._roles.length; Ri++) {
            matchedRemovedRole = allRoles.filter(role => {
                return role.id == oldMember._roles[Ri];
            });
            removedRoles.push({
                id: matchedRemovedRole[0].id,
                name: matchedRemovedRole[0].name
            });
            changeRoles(newMember.id);
        }
    }
});

function changeRoles(userID) {
    if (removedRoles.length > 0) {
        for (var rRi = 0; rRi < removedRoles.length; rRi++) {
            mongoose.model('Member').updateOne({
                discordID: userID,
            }, {
                $pull: {
                    roles: {
                        id: matchedRemovedRole[0].id,
                        name: matchedRemovedRole[0].name
                    }
                }
            }, function (err) {
                if (err) throw err;
                else {
                    console.log('Role removed.');
                }
            });
        }
    }

    if (newRoles.length > 0) {
        for (var nRi = 0; nRi < newRoles.length; nRi++) {
            mongoose.model('Member').updateOne({
                discordID: userID,
            }, {
                $push: {
                    roles: {
                        id: matchedNewRole[0].id,
                        name: matchedNewRole[0].name
                    }
                }
            }, function (err) {
                if (err) throw err;
                else {
                    console.log('Role added.');
                }
            });
        }
    }
}

client.login(token);