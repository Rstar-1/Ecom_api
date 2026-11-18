FROM node:18-alpine

WORKDIR /app

COPY services/role-service/package*.json ./

RUN npm ci --only=production

COPY services/role-service .

EXPOSE 8081

CMD ["node", "server.js"]

