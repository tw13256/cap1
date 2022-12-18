FROM node:19-bullseye
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 444 3000 3001
CMD ["npm","start"]