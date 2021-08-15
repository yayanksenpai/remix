FROM node:16-buster-slim
RUN apt update && apt upgrade -y && apt install ffmpeg git -y
COPY . /app
WORKDIR /app
RUN npm install http-server -g
RUN npm install
CMD ["bash","start.sh"]
