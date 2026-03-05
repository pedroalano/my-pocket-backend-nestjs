FROM node:22-slim AS dependencies

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy root package files and workspace configs
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Copy prisma and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Build shared package
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./
RUN npm run build --workspace=@my-pocket/shared


FROM dependencies AS build

COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/src ./apps/api/src
RUN npm run build --workspace=@my-pocket/api


FROM dependencies AS development

COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/src ./apps/api/src

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["npm", "run", "dev"]


FROM node:22-slim AS production

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Copy node_modules and prune
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Copy built artifacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=dependencies /app/packages/shared/dist ./packages/shared/dist
COPY prisma ./prisma

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
