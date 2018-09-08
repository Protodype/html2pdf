FROM node:alpine

# Installs latest Chromium
RUN apk add --no-cache chromium

# Change working directory
WORKDIR /app

COPY . /app/

RUN npm install

CMD ["node", "/app/app.js"]
