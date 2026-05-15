FROM node:18-alpine

WORKDIR /app

COPY services/cart-service/package*.json ./

RUN npm ci --only=production

COPY services/cart-service .

EXPOSE 3003

CMD ["npm", "start"]
