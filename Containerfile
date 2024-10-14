FROM node:22 AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM node:22
WORKDIR /usr/src/app

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
RUN curl -LO "https://get.helm.sh/helm-v3.9.0-linux-amd64.tar.gz" && \
    tar -zxvf helm-v3.9.0-linux-amd64.tar.gz && \
    mv linux-amd64/helm /usr/local/bin/helm && \
    chmod +x /usr/local/bin/helm && \
    rm -rf helm-v3.9.0-linux-amd64.tar.gz linux-amd64

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
