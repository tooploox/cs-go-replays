FROM node:12.4.0 as frontend

WORKDIR /dist
COPY frontend/package.json .
RUN npm install -g yarn

COPY frontend/yarn.lock .
RUN yarn install

COPY frontend .
ENV API /
RUN yarn run build --public-url /dist/ --target browser

FROM python:3-buster

RUN apt update && apt install -y ffmpeg

WORKDIR /srv

RUN mkdir anim

RUN mkdir dist
COPY --from=frontend /dist/dist/* ./dist/

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend .

EXPOSE 8080
ENTRYPOINT ["python", "prod.py", "--listen=0.0.0.0", "--port=8080"]
