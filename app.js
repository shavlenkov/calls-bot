import { Telegraf } from "telegraf";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { BOT_TOKEN, ADMINS_ID } = process.env;
const bot = new Telegraf(BOT_TOKEN);
const chats = JSON.parse(fs.readFileSync("database/db.json", "utf8"));
const adminUsersId = [];

ADMINS_ID.split(", ").forEach((id) => adminUsersId.push(+id));
let stateMsg = 'pool';

bot.start((ctx) => {
  chats.push(ctx.message.chat);
  fs.writeFileSync("database/db.json", JSON.stringify(chats));
  ctx.reply('Hello');
});

const checkUser = (ctx, next) => adminUsersId.includes(ctx.from.id) ? next() : ctx.reply('У тебя нет прав доступа админа');

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

let users = []

bot.on('poll_answer', (ctx) => {

  let { username, first_name } = ctx.update.poll_answer.user;
  let option_id = ctx.update.poll_answer.option_ids[0];

  if(option_id == 0) {
    users.push({username: username, first_name: first_name})
  }

})

bot.command('getpollusers', (ctx) => {

  let str = `
     На созвоне никого не будет
    `

  if(users.length != 0) {
    str = `
     На совзоне будут:
    `

    users.map((user) => {
      str += `\n<a href="https://${user.username}.t.me">${user.first_name}</a>`
    })
  }


  ctx.replyWithHTML(str, { disable_web_page_preview: true });
})

let chat;

const options = [
  'Я буду',
  'Меня не будет',
  'Буду позже',
];

bot.on('message', async (ctx) => {
  const regExpValidateTime = /^([01]\d|2[0-3])[:., ]([0-5]\d)$/;
  const regExpValidateTime2 = /^[0-2][0-4]$/;
  const regExpTime = /^([01]\d|2[0-9])[:., ]([0-9]\d)$/;
  const regExpTime2 = /^[0-9][4-9]$/;
  const regExpTitleChat = /(?<=чате ).*$/;
  const regExpTimeMessage = /[ ,.]/g;
  const text_message = ctx.message.text;

  if (ctx.message.chat.type === "private") {

    if (regExpValidateTime.test(text_message) || regExpValidateTime2.test(text_message) && stateMsg === 'time') {
      let time_message;

      if (regExpValidateTime.test(text_message)) {
        time_message = text_message.replace(regExpTimeMessage, ':');
      } else if (regExpValidateTime2.test(text_message)) {
        time_message = text_message + ':00';
      }

      const question = `Созвон на ${time_message}`;

      await bot.telegram.sendMessage(chat.id, `${ctx.message.chat.username} хочет сегодня организовать созвон в ${time_message}`);

      await bot.telegram.sendPoll(chat.id, question, options, { is_anonymous: false });


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