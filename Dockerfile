FROM node:22-alpine

WORKDIR /app

# Copy manifests first so `npm ci` is cached until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/app.js"]
