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

var channelTimers = {};

function timer_passage(){
    var now = new Date()
    for (timer in channelTimers){
        thisTimer = channelTimers[timer];
        if (thisTimer.hour == now.getHours() && thisTimer.minute == now.getMinutes()){
            sendQuestion(thisTimer.bot, thisTimer.channel);
        }
    }
    setTimeout(timer_passage, 60000) // recheck every minute
}

function timeString(hours, minutes) {
    var hourString = hours.toString();
    var minuteString = minutes.toString();
    if (minuteString.length <= 1) {
        minuteString = "0" + minuteString;
    } 
    return hourString + ":" + minuteString;
}
function startTimer(bot, channelID, time) {
    var now = new Date()
    var hour = now.getHours();
    var minute = now.getMinutes();
    if (time != undefined) {
        time = time.split(':');
        try{
            var givenHour = parseInt(time[0]);
            var givenMinute = parseInt(time[1]);
            if(givenHour >= 0 && givenHour < 24 && givenMinute >= 0 && givenMinute < 60){
                hour = givenHour;
                minute = givenMinute;
            }
        } catch (err) {
            // don't do anything
        }
    }
    channelTimers[channelID] = [];
    channelTimers[channelID].bot = bot;
    channelTimers[channelID].channel = channelID;
    channelTimers[channelID].hour = hour;
    channelTimers[channelID].minute = minute;
    bot.sendMessage({
        to: channelID,
        message: 'You will get a new question every day at ' + timeString(hour, minute) + '!'
    });
}
function stopTimer(bot, channelID) {
    delete channelTimers[channelID];
    bot.sendMessage({
        to: channelID,
        message: 'You will no longer recieve questions of the day!'
    });
}
function checkForTimer(bot, channelID) {
    if (channelTimers[channelID] == undefined) {
        bot.sendMessage({
            to: channelID,
            message: 'This channel is not yet subscribed to recieve a question of the day.'
        });
        return false;
    } else {
        return true;
    }
}
function sendQuestion(bot, channelID){
    bot.sendMessage({
        to: channelID,
        message: getRandomQuestion()
    });
}

bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        if(cmd == "subscribe") { // !subscribe
            logger.info('Subscribed at channel with ID: ' + channelID);
            startTimer(bot, channelID, args[1]);
        } else if (cmd == "unsubscribe") { // !unsubscribe
            if(checkForTimer(bot, channelID)) { 
                logger.info('Unsubscribed at channel with ID: ' + channelID);
                stopTimer(bot, channelID)
            }
        } else if (cmd == "now") { // !now
            logger.info('Question sent to channel with ID: ' + channelID);
            sendQuestion(bot, channelID)
        } else if (cmd == "when") { //!when
            if(checkForTimer(bot, channelID)) {
                var now = new Date();
                var hours = 0;
                var minutes = 0;
                if (channelTimers[channelID].hour <= now.getHours()) {
                    hours = 23 - (now.getHours() - channelTimers[channelID].hour);
                } else {
                    hours = 23 - (24 - (channelTimers[channelID].hour - now.getHours()));
                }
                if (channelTimers[channelID].minute <= now.getMinutes()) {
                    minutes = 59 - (now.getMinutes() - channelTimers[channelID].minute);
                } else {
                    minutes = 59 - (60 - (channelTimers[channelID].minute - now.getMinutes()));
                }
                bot.sendMessage({
                    to: channelID,
                    message: 'You will get the next question in ' + hours + " hours and " + minutes + " minutes."
                });
            }
        } else if (cmd == "help") { // !help
            bot.sendMessage({
                to: channelID,
                message: 'Just send "!subscribe" to subscribe this channel to recieve a question of the day each day at this time! Alternatively you can schedule the time like this "!subscribe 12:00"!\nYou can call "!unsubscribe" at any time.\nOr if you are bored, just call "!now" to get a question now.\nAnd you can see when the next question will come using "!when".'
            });
        }
    }
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    timer_passage();
});