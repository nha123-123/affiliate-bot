const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

const sendDealToTelegram = async (dealData) => {
    // Format tin nhắn cho đẹp, dùng kí tự xuống dòng \n
    const message = `
🔥 <b>DEAL GIẢM GIÁ MỚI</b> 🔥

📦 <b>Sản phẩm:</b> ${dealData.title}
💰 <b>Giá cực sốc:</b> ${dealData.price}

👉 <b>Link mua hàng:</b> <a href="${dealData.affiliateLink}">Bấm vào đây</a>
    `;
    
    try {
        // parse_mode: 'HTML' giúp tin nhắn hiển thị chữ in đậm và link ẩn
        await bot.sendMessage(process.env.CHAT_ID, message, { parse_mode: 'HTML' });
        console.log(`Đã gửi thành công: ${dealData.title}`);
    } catch (error) {
        console.error('Lỗi khi gửi lên Telegram:', error.response ? error.response.body : error);
    }
};

module.exports = { sendDealToTelegram };