import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios'; 
import * as cheerio from 'cheerio';   


dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

async function scrapeTextFromUrl(url: string): Promise<string> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  let text = '';
  $('p').each((_, el) => {
    text += $(el).text() + '\n';
  });
  return text.trim().slice(0, 3000); 
}

async function summarizeText(text: string): Promise<string> {
  const prompt = `Summarize the following webpage content in 5 lines:\n\n${text}`;

  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'mistralai/mistral-7b-instruct', 
    messages: [
      { role: 'user', content: prompt }
    ],
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-app-name.com', 
      'X-Title': 'TelegramBot'
    }
  });

  return response.data.choices[0].message.content.trim();
}

bot.on('channel_post', async (ctx) => {
  const post = ctx.channelPost;

  if ('text' in post && typeof post.text === 'string') {
    const lower = post.text.toLowerCase();

    if (lower.includes('operation')) {
      await ctx.telegram.sendMessage(post.chat.id, '📢 "Operation" mentioned in the channel!');
    }

    const url = extractUrl(post.text);
    if (url) {
      try {
        await ctx.telegram.sendMessage(post.chat.id, '🔄 Summarizing link...');
        const pageText = await scrapeTextFromUrl(url);
        if (!pageText || pageText.length < 100) {
          await ctx.telegram.sendMessage(post.chat.id, '❗ Not enough content to summarize.');
          return;
        }
        const summary = await summarizeText(pageText);
        await ctx.telegram.sendMessage(post.chat.id, summary, {
          reply_to_message_id: post.message_id
        } as any);
      } catch (err) {
        console.error(err);
        await ctx.telegram.sendMessage(post.chat.id, '⚠️ Could not summarize the link.');
      }
    }
  }
});



bot.start((ctx) => {
  ctx.reply('👋 Hello! I am your bot.');
});

bot.launch().then(() => {
  console.log('🤖 Bot is up and running');
});


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
