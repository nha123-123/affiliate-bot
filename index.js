require('dotenv').config();
const cron = require('node-cron');
const puppeteer = require('puppeteer'); 
const express = require('express'); // Thêm thư viện express tạo web server
const { connectDB, Deal } = require('./database.js');
const { sendDealToTelegram } = require('./bot.js');

// === HÀM TẠO LINK AFFILIATE CHUẨN V6 ACCESSTRADE ===
const makeAffiliateLink = (originalUrl) => {
    const pubId = process.env.ACCESSTRADE_PUB_ID;
    // Mã hóa link gốc sang định dạng Base64
    const encodedUrl = Buffer.from(originalUrl).toString('base64');
    
    // Cấu trúc chuẩn v6 với Campaign ID (6956...) và Publisher ID của bạn
    return `https://go.isclix.com/deep_link/v6/6956725054812078390/${pubId}?url_enc=${encodedUrl}`;
};

// === HÀM CÀO DỮ LIỆU BẰNG PUPPETEER ===
const scrapeDeals = async () => {
    console.log('--- Đang khởi động Chrome tàng hình ---');
    
    // 👇 ĐÃ SỬA CẤU HÌNH PUPPETEER ĐỂ CHẠY ĐƯỢC TRÊN DOCKER/RENDER 👇
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage'
        ] 
    });
    
    const page = await browser.newPage();

    try {
        console.log('Đang truy cập trang web săn sale...');
        await page.goto('https://magiamgia.com/shopee/', { waitUntil: 'networkidle2' });

        await page.setViewport({ width: 1280, height: 800 });
        // Tắt tính năng chụp ảnh khi đẩy lên Server để tiết kiệm dung lượng và CPU
        // await page.screenshot({ path: 'bot_nhin_thay_gi.png', fullPage: true });

        const rawDeals = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.ticket-wrap'); 

            items.forEach(item => {
                const supplierEl = item.querySelector('.mini-title-supplier span');
                const supplier = supplierEl ? supplierEl.textContent.trim() : 'Shopee';

                const descEl = item.querySelector('div[style="display: none"] span[style="display: block"]');
                const desc = descEl ? descEl.textContent.trim() : 'Siêu Sale';

                const highlightEl = item.querySelector('div[style*="color: #265414"] span');
                const highlight = highlightEl ? highlightEl.textContent.trim() : '';

                let code = '';
                const codeMatch = item.innerHTML.match(/copyCouponCode\([^,]+,\s*'[^']*',\s*'shopee',\s*'[^']*',\s*'([^']+)'/);
                if (codeMatch) {
                    code = codeMatch[1]; 
                }

                let link = '';
                const originMatch = item.innerHTML.match(/origin_link=(https%3A%2F%2Fshopee\.vn[^&"']+)/);
                if (originMatch) {
                    link = decodeURIComponent(originMatch[1]);
                }

                if (link) {
                    results.push({
                        productId: link.split('?')[0].substring(0, 60) + (code ? `-${code}` : ''), 
                        title: `[${supplier}] ${desc}` + (code ? `\n🎁 Mã Voucher: ${code}` : ''),
                        price: highlight ? `Giảm ${highlight}` : 'Lưu mã ngay',
                        originalLink: link
                    });
                }
            });
            return results;
        });

        await browser.close();
        console.log(`Đã cào được ${rawDeals.length} deal thô. Đang chuyển đổi link...`);

        return rawDeals.map(item => ({
            productId: item.productId,
            title: item.title,
            price: item.price,
            affiliateLink: makeAffiliateLink(item.originalLink)
        })).slice(0, 5); 

    } catch (error) {
        console.error('Lỗi khi cào dữ liệu:', error.message);
        await browser.close(); 
        return [];
    }
};

// === LOGIC CHÍNH XỬ LÝ DATABASE & TELEGRAM ===
const mainProcessor = async () => {
    try {
        const listDeals = await scrapeDeals(); 

        if (listDeals.length === 0) {
            console.log('Chưa cào được deal nào hoặc class CSS bị sai.');
            return;
        }

        for (let item of listDeals) {
            const checkExist = await Deal.findOne({ productId: item.productId });
            
            if (!checkExist) {
                await sendDealToTelegram(item);
                
                await Deal.create({
                    productId: item.productId,
                    title: item.title,
                    price: item.price,
                    affiliateLink: item.affiliateLink
                });
                
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log(`Bỏ qua: ${item.title.split('\n')[0]} (Đã đăng)`);
            }
        }
    } catch (error) {
        console.error('Lỗi hệ thống:', error);
    }
};

// === KHỞI ĐỘNG BOT ===
const startApp = async () => {
    await connectDB();
    await mainProcessor();
    cron.schedule('*/30 * * * *', () => {
        console.log('⏰ Đến giờ cào deal mới...');
        mainProcessor();
    });
};

startApp();

// 👇 ĐÃ THÊM WEB SERVER GIẢ ĐỂ RENDER KHÔNG TẮT BOT 👇
const app = express();
app.get('/', (req, res) => res.send('🚀 Cỗ máy săn sale đang hoạt động 24/7!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Web server đang chạy giả lập trên port ${PORT}`));