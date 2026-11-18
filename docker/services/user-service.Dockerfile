FROM node:18-alpine

WORKDIR /app

COPY services/user-service/package*.json ./

RUN npm ci --only=production

COPY services/user-service .

EXPOSE 8083

CMD ["node", "server.js"]

