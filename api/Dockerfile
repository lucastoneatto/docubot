FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
# --trust-lockfile: el lockfile es propio y ya revisado; pnpm 12+ por defecto
# rechaza paquetes publicados hace <72h como protección supply-chain, lo que
# bloquearía builds reproducibles de dependencias recién fijadas a propósito.
# pnpm-workspace.yaml (allowBuilds) aprueba los postinstall de deps con
# binarios nativos (sharp, onnxruntime, esbuild, etc.) — antes vivía en el
# campo deprecado pnpm.onlyBuiltDependencies de package.json.
RUN pnpm install --no-frozen-lockfile --trust-lockfile

COPY . .
RUN pnpm build

EXPOSE 3001

CMD ["node", "dist/main.js"]
