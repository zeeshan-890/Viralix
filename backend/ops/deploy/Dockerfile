FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY backend/package.json backend/package-lock.json ./backend/

RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY Procfile ./

ENV NODE_ENV=production
ENV PORT=5000
ENV PROCESS_TYPE=api

EXPOSE 5000

CMD ["node", "backend/server.js"]
