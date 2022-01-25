var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

const fs = require('fs')
function readTextFile(file)
{
    try {
        const data = fs.readFileSync('questions.txt', 'utf8')
        return data;
    } catch (err) {
        console.error(err)
    }
}

function getRandomQuestion() {
    var fileText = readTextFile("questions.txt");
    var lines = fileText.split("\n");
    var randLineNum = Math.floor(Math.random() * lines.length);
    return "**" + lines[randLineNum] + "**"; // random question in **bold**
}

const dayInMilliseconds = 1000 * 60 * 60 * 24;
var channelTimers = {};

bot.on('message', function (user, userID, channelID, message, evt) {
// Our bot needs to know if it will execute a command
// It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        if(cmd == "subscribe") { // !subscribe
            logger.info('Subscribed at channel with ID: '+channelID);
            clearInterval(channelTimers[channelID]);
            channelTimers[channelID] = setInterval(() => {
                logger.info(channelTimers);
                logger.info('Question sent to channel with ID: '+channelID);
                bot.sendMessage({
                    to: channelID,
                    message: getRandomQuestion()
                });
            }, dayInMilliseconds);
            bot.sendMessage({
                to: channelID,
                message: 'You will get a new question every day at this time!'
            });
        } else if (cmd == "unsubscribe") { // !unsubscribe
            if(channelTimers[channelID] == undefined) {
                bot.sendMessage({
                    to: channelID,
                    message: 'This channel is not yet subscribed to recieve a question of the day.'
                });
            } else { 
                logger.info('Unsubscribed at channel with ID: '+channelID);
                clearInterval(channelTimers[channelID]);
                delete channelTimers[channelID];
                bot.sendMessage({
                    to: channelID,
                    message: 'You will no longer recieve questions of the day!'
                });
            }
        } else if (cmd == "now") { // !now
            logger.info('Resubscribed at channel with ID: '+channelID);
            clearInterval(channelTimers[channelID]);
            channelTimers[channelID] = setInterval(() => {
                logger.info(channelTimers);
                logger.info('Question sent to channel with ID: '+channelID);
                bot.sendMessage({
                    to: channelID,
                    message: getRandomQuestion()
                });
            }, dayInMilliseconds);
            bot.sendMessage({
                to: channelID,
                message: 'Here\'s a question:\n' + getRandomQuestion() + '\nYou will get the next question in 24 hours!'
            });
        } else if (cmd == "when") { //!when
            if(channelTimers[channelID] == undefined) {
                bot.sendMessage({
                    to: channelID,
                    message: 'This channel is not yet subscribed to recieve a question of the day.'
                });
            } else { 
                var timeLeft = Math.ceil((channelTimers[channelID]._idleStart + channelTimers[channelID]._idleTimeout - Date.now()) / 1000);
                bot.sendMessage({
                    to: channelID,
                    message: 'You will get the next question in ' + timeLeft + " seconds."
                });
            }
        } else if (cmd == "help") { // !help
            bot.sendMessage({
                to: channelID,
                message: 'Just send "!subscribe" to subscribe this channel to recieve a question of the day each day at this time!\nYou can call "!unsubscribe" at any time.\nOr if you are bored, just call "!now" to get a question now.\nAnd you can see when the next question will come using "!when".'
            });
        }
    }
});