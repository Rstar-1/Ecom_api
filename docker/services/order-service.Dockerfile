FROM node:18-alpine

WORKDIR /app

COPY services/order-service/package*.json ./

RUN npm ci --only=production

COPY services/order-service .

EXPOSE 3004

CMD ["npm", "start"]
