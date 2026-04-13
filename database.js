const mongoose = require('mongoose');

// Hàm kết nối DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công!');
    } catch (err) {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
        process.exit(1); // Dừng app nếu không kết nối được DB
    }
};

// Đặt tên Collection và quy định các cột (Schema)
const DealSchema = new mongoose.Schema({
    // Mỗi deal cần có 1 ID duy nhất từ sàn (Shopee/Lazada) để chống đăng trùng
    productId: { type: String, required: true, unique: true }, 
    title: { type: String, required: true },
    price: { type: String },
    affiliateLink: { type: String, required: true },
    // Thời gian tự động lưu lúc insert
    crawledAt: { type: Date, default: Date.now } 
});

// Tạo Model (Mongoose sẽ tự tạo bảng tên là 'deals' trong database 'affiliate_db')
const Deal = mongoose.model('Deal', DealSchema);

module.exports = { connectDB, Deal };