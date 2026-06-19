FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install
RUN apk add --no-cache git openssh-client

RUN git config --global --add safe.directory '*'
RUN apk add --no-cache git openssh-client && \
    mkdir -p /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts

COPY . .

EXPOSE 4000

CMD ["npm", "start"]