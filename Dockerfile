FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install
RUN apk add --no-cache git

COPY . .

EXPOSE 4000

CMD ["npm", "start"]