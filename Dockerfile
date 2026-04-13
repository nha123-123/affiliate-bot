# Dùng bản Linux đã cài sẵn Node.js và Google Chrome của Puppeteer
FROM ghcr.io/puppeteer/puppeteer:latest

# Chuyển thư mục làm việc về đúng "nhà" của pptruser
WORKDIR /home/pptruser/app

# Copy file và ép quyền sở hữu
COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

# Copy toàn bộ code còn lại
COPY --chown=pptruser:pptruser . .

# Chạy con bot
CMD ["node", "index.js"]