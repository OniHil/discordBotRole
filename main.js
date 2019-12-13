'use strict';
var fs = require('fs');
var Discord = require('discord.js');
var mongoose = require('mongoose');

var config = require('./config.json');
var Members = require('./model/member.js');

var client = new Discord.Client();
client.commands = new Discord.Collection();

mongoose.connect('mongodb://localhost/discordMembers', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

var db = mongoose.connection;
var token = config.token;
var prefix = config.prefix;
var adminRole = config.adminRole;
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

client.once('message', message => {
    client.commands.get('init').execute(message);
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    var role = message.member.roles.find(role => role.name === adminRole);
    if (role === null) return;

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

    if (oldMember._roles > newMember._roles) {
        for (var rRi = 0; rRi < oldMember._roles.length; rRi++) {
            matchedRemovedRole = allRoles.filter(role => {
                return role.id === oldMember._roles[rRi];
            });
            removedRoles.push({
                id: matchedRemovedRole[0].id,
                name: matchedRemovedRole[0].name
            });
            changeRoles(newMember.id);
        }
    } else if (oldMember._roles < newMember._roles) {
        for (var nRi = 0; nRi < newMember._roles.length; nRi++) {
            matchedNewRole = allRoles.filter(role => {
                return role.id === newMember._roles[nRi];
            });
            newRoles.push({
                id: matchedNewRole[0].id,
                name: matchedNewRole[0].name
            });
            changeRoles(newMember.id);
        }
    }
});

client.on('guildMemberAdd', GuildMember => {
    mongoose.model('Member').find({
        discordID: GuildMember.id
    }, function (err, foundMember) {
        if (err) {
            throw err;
        } else if (foundMember.lenght === 0) {
            var Member = new Members({
                name: GuildMember.user.username,
                discordID: GuildMember.id
            });

            Member.save(function (err) {
                if (err) throw err;
            });
        }
    });
});

function changeRoles(userID) {
    if (removedRoles.length > 0) {
        for (var rRi = 0; rRi < removedRoles.length; rRi++) {
            mongoose.model('Member').updateOne({
                discordID: userID
            }, {
                $pull: {
                    roles: {
                        id: matchedRemovedRole[0].id,
                        name: matchedRemovedRole[0].name
                    }
                }
            }, function (err) {
                if (err) throw err;
            });
        }
    }

    if (newRoles.length > 0) {
        for (var nRi = 0; nRi < newRoles.length; nRi++) {
            mongoose.model('Member').updateOne({
                discordID: userID
            }, {
                $push: {
                    roles: {
                        id: matchedNewRole[0].id,
                        name: matchedNewRole[0].name
                    }
                }
            }, function (err) {
                if (err) throw err;
            });
        }
    }
}

client.login(token);
