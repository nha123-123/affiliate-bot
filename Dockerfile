# Dùng bản Linux đã cài sẵn Node.js và Google Chrome
FROM ghcr.io/puppeteer/puppeteer:latest

# Báo cho Puppeteer biết là xài Chrome của hệ thống
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Chuyển thư mục làm việc về đúng "nhà" của pptruser để không bị lỗi quyền
WORKDIR /home/pptruser/app

# Copy file và ép quyền sở hữu (chown) cho pptruser
COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

# Copy toàn bộ code còn lại cũng ép quyền luôn
COPY --chown=pptruser:pptruser . .

# Chạy con bot
CMD ["node", "index.js"]