FROM node:18-alpine

WORKDIR /app

COPY services/product-service/package*.json ./

RUN npm ci --only=production

COPY services/product-service .

EXPOSE 3002

CMD ["npm", "start"]
