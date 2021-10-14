FROM node:14
COPY . .
RUN npm install
RUN npm i aws-sdk
EXPOSE 3001
CMD [ "node", "server.js" ]