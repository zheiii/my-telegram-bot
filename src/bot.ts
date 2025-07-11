import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply('👋 Hello! I am your bot.');
});

bot.on('text', (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text.includes('operation')) {
    ctx.reply('🔍 I heard the word "operation"! Stay alert.');
  }
});

bot.on('channel_post', (ctx) => {
  const post = ctx.channelPost;

  if ('text' in post && typeof post.text === 'string' && post.text.toLowerCase().includes('operation')) {
    ctx.telegram.sendMessage(post.chat.id, '📢 "Operation" mentioned in the channel!');
  }
});

bot.launch().then(() => {
  console.log('🤖 Bot is up and running');
});


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
