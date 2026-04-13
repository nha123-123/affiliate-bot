# Dùng bản Linux đã cài sẵn Node.js và Google Chrome
FROM ghcr.io/puppeteer/puppeteer:latest

# Báo cho Puppeteer biết là xài Chrome của hệ thống, khỏi tải lại
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Chạy con bot
CMD ["node", "index.js"]