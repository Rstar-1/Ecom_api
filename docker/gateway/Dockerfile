FROM node:18-alpine

WORKDIR /app

COPY gateway/package*.json ./

RUN npm ci --only=production

COPY gateway .

EXPOSE 5000

CMD ["npm", "start"]
