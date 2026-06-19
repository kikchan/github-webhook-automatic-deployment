FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install
RUN apt-get update && apt-get install -y openssh-client

COPY . .

EXPOSE 4000

CMD ["npm", "start"]