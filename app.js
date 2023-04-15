import { Telegraf } from "telegraf";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { BOT_TOKEN, ADMINS_ID } = process.env;
const bot = new Telegraf(BOT_TOKEN);
const chats = JSON.parse(fs.readFileSync("database/db.json", "utf8"));
const adminUsersId = [];

const checkUser = (ctx, next) => adminUsersId.includes(ctx.from.id) ? next() : ctx.reply('У тебя нет прав доступа админа');
ADMINS_ID.split(", ").forEach((id) => adminUsersId.push(+id));
let stateMsg = 'pool';
let chat;
let callDay = 'сегодня';

bot.start((ctx) => {
  chats.push(ctx.message.chat);
  fs.writeFileSync("database/db.json", JSON.stringify(chats));
  ctx.reply('Hello');
});

bot.hears('/allconnects', checkUser, (ctx) => {
  const privates = chats.filter(chat => chat.type === "private");
  const groups = chats.filter(chat => chat.type === "supergroup" || chat.type === "group");
  let str = '';

  str += 'Users:';
  privates.forEach(user => str += `\n <a href="https://${user.username}.t.me">${user.first_name}</a>`);
  str += '\nGroups: ';
  groups.forEach(group => str += `\n ${group.title}`);
  ctx.replyWithHTML(str, { disable_web_page_preview: true });
});

// on future)))

/*function getNextWeekdayDate(weekday) {
  const weekdaysRegex = /понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресенье/i;
  if (!weekdaysRegex.test(weekday)) {
    throw new Error("Invalid weekday name");
  }

  const weekdaysMap = {
    "понедельник": 1,
    "вторник": 2,
    "среду": 3,
    "четверг": 4,
    "пятницу": 5,
    "субботу": 6,
    "воскресенье": 0
  };

  const today = new Date();
  let date = today.getDate();
  let dayOfWeek = today.getDay();
  let daysUntilNextWeekday = (7 + weekdaysMap[weekday] - dayOfWeek) % 7;

  if (daysUntilNextWeekday === 0) {
    daysUntilNextWeekday = 7;
  }

  date += daysUntilNextWeekday;

  return new Date(today.getFullYear(), today.getMonth(), date);
}

// Пример использования
const weekday = "субботу";
const nextWeekdayDate = getNextWeekdayDate(weekday);
console.log(getNextWeekdayDate(weekday))
console.log(`Следующий ${weekday} - ${nextWeekdayDate.toLocaleDateString()}`);*/

bot.on('message', (ctx) => {
  const regExpValidateTime = /^([01]\d|2[0-3])[:., ]([0-5]\d)$/;
  const regExpValidateTime2 = /^[0-2][0-4]$/;
  const regExpTime = /^([01]\d|2[0-9])[:., ]([0-9]\d)$/;
  const regExpTime2 = /^[0-9][4-9]$/;
  const regExpTitleChat = /(?<=чате ).*$/;
  const regExpTimeMessage = /[ ,.]/g;
  const regExpTomorrow = /завтра/gi;
  const regExpWeekDays = /понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресенье/gi;
  const text_message = ctx.message.text;

  if (ctx.message.chat.type === "private") {
    if (regExpValidateTime.test(text_message) || regExpValidateTime2.test(text_message) && stateMsg === 'time') {
      let time_message;
      if (regExpValidateTime.test(text_message)) {
        time_message = text_message.replace(regExpTimeMessage, ':');
      } else if (regExpValidateTime2.test(text_message)) {
        time_message = text_message + ':00';
      }
      bot.telegram.sendMessage(chat.id, `${ctx.message.chat.username} хочет организовать созвон ${callDay} на ${time_message}`);
      callDay = 'сегодня';
      chat = {};
      ctx.reply('Время зафиксировано');
      stateMsg = 'pool';
    } else if(regExpTime.test(text_message) || regExpTime2.test(text_message)) {
      stateMsg = 'time';
      ctx.reply('Уууупс, такого времени еще не придумали))))');
    } else if (regExpTitleChat.test(text_message)[0] || regExpTitleChat.test(text_message)) {
      let title_chat = text_message.match(regExpTitleChat)[0];
      chat = chats.find(chat => chat.title === title_chat);
      if (chat) {
        if (regExpTomorrow.test(text_message)) {
          callDay = 'завтра';
        } else if (regExpWeekDays.test(text_message)) {
          callDay = 'в ' + text_message.match(regExpWeekDays)[0]
        }
        stateMsg = 'time';
        ctx.reply('Во сколько ты хочешь организовать созвон?(формат ввода: XX.XX, XX,XX, XX:XX, XX XX или XX)');
      } else {
        stateMsg = 'pool';
        ctx.reply('Такого чата в базе не найдено!!!');
      }
    } else {
      ctx.reply('Не валидное сообщение...');
    }
  }
});

bot.launch();