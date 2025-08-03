const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { BOT_TOKEN } = require('./config');
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let db = require('./storage.json');

function saveDB() {
  fs.writeFileSync('./storage.json', JSON.stringify(db, null, 2));
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.document || msg.photo || msg.video || msg.audio) {
    const file = msg.document || msg.photo?.[msg.photo.length - 1] || msg.video || msg.audio;
    const fileId = file.file_id;
    const fileName = file.file_name || `File_${Date.now()}`;

    bot.getFileLink(fileId).then(link => {
      if (!db[chatId]) db[chatId] = [];
      db[chatId].push({ name: fileName, link: link });
      saveDB();

      bot.sendMessage(chatId, `✅ File saved!\n📂 *${fileName}*\n🔗 Link: ${link}`, { parse_mode: "Markdown" });
    });
  }
});

bot.onText(/\/myfiles/, (msg) => {
  const chatId = msg.chat.id;
  const files = db[chatId];

  if (!files || files.length === 0) {
    bot.sendMessage(chatId, "❌ You haven't uploaded any files yet.");
    return;
  }

  files.forEach((file, index) => {
    bot.sendMessage(chatId, `📂 *${file.name}*\n🔗 [Download](${file.link})`, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: "❌ Delete", callback_data: `delete_${index}` }
        ]]
      }
    });
  });
});

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const userFiles = db[chatId];
  if (!userFiles) return;

  const data = query.data;
  if (data.startsWith("delete_")) {
    const index = parseInt(data.split("_")[1]);
    if (userFiles[index]) {
      const removed = userFiles.splice(index, 1);
      saveDB();
      bot.editMessageText(`🗑️ Deleted: *${removed[0].name}*`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "Markdown"
      });
    }
  }
});

bot.onText(/\/users/, (msg) => {
  const totalUsers = Object.keys(db).length;
  bot.sendMessage(msg.chat.id, `👥 Total users who uploaded files: *${totalUsers}*`, { parse_mode: "Markdown" });
});  const totalUsers = Object.keys(db).length;
  bot.sendMessage(chatId, `👥 Total users who uploaded files: *${totalUsers}*`, { parse_mode: "Markdown" });
});
