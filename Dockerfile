FROM node:latest AS build

WORKDIR /app

COPY package*.json .

RUN npm i dotenv

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:latest AS run

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
RUN ulimit -c unlimited
ENTRYPOINT "npx prisma migrate deploy && node build"
