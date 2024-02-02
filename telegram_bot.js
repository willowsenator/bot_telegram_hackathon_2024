const yargs = require('yargs');
const TelegramBot = require('node-telegram-bot-api');
const wallet = require('./wallet');

const token = 'token';
const numReminderMax = 3;
const buttonCooldown = 6000; // 6 seconds cooldown

const options = yargs
    .option('interval', {
        alias: 'interval',
        describe: 'Interval of ads',
        type: 'number',
        demandOption: true
    })
    .argv;

const interval = options.interval;

const bot = new TelegramBot(token, {
    polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});

const userStatus = {};
const userViewStatus = {};
const buttonCooldownStatus = {};
const reminderIntervals = {};

function getUserStatus(chatId) {
    return userStatus[chatId];
}

function updateUserStatus(chatId, status) {
    userStatus[chatId] = status;
}

function isButtonCooldownActive(chatId) {
    return buttonCooldownStatus[chatId] || false;
}

function setButtonCooldown(chatId) {
    buttonCooldownStatus[chatId] = true;
    setTimeout(() => {
        buttonCooldownStatus[chatId] = false;
    }, buttonCooldown);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userHasSeenAd = getUserStatus(chatId);

    if (!userHasSeenAd) {
        const adMessage = '🌟 NCT Team bot ads 🌟';

        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: 'Click me!',
                            callback_data: 'button_clicked'
                        }
                    ]
                ]
            })
        };

        bot.sendMessage(chatId, adMessage, opts);

        if (userViewStatus[chatId] === undefined) {
            userViewStatus[chatId] = 0;
        }

        reminderIntervals[chatId] = setInterval(() => {
            if (userViewStatus[chatId] === numReminderMax) {
                bot.sendMessage(chatId, adMessage, opts);
                userViewStatus[chatId] = 0;
            } else {
                bot.sendMessage(chatId, 'Reminder: Don\'t forget to check our latest updates!');
                userViewStatus[chatId]++;
            }
        }, interval);
    } else {
        bot.sendMessage(chatId, 'Welcome back! You have already seen the ad.');
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    if (data === 'button_clicked') {
        console.log(`ChatId: ${chatId} - Has viewed the ad`);

        if (!isButtonCooldownActive(chatId)) {
            updateUserStatus(chatId, true);
            setButtonCooldown(chatId);
            clearInterval(reminderIntervals[chatId]);

            bot.sendMessage(chatId, await wallet.sendTransaction());
            bot.sendPhoto(chatId, './resources/vottun-logo.png');
            /*const adMessage = '🌟 NCT Team bot ads 🌟';

            const opts = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text: 'Click me!',
                                callback_data: 'button_clicked'
                            }
                        ]
                    ]
                })
            };

            setTimeout(() => {
                updateUserStatus(chatId, false); // Reset the userHasSeenAd flag
                userViewStatus[chatId] = 0;
                userViewStatus[chatId] = numReminderMax;
                reminderIntervals[chatId] = setInterval(() => {
                    if (userViewStatus[chatId] === numReminderMax) {
                        bot.sendMessage(chatId, adMessage, opts);
                        userViewStatus[chatId] = 0;
                    } else {
                        bot.sendMessage(chatId, 'Reminder: Don\'t forget to check our latest updates!');
                        userViewStatus[chatId]++;
                    }
                }, interval);
            }, 6000);*/
        } else {
            bot.answerCallbackQuery(callbackQuery.id, { text: 'Button is on cooldown.' });
        }
    }
});
