FROM subquerynetwork/subql-node-substrate:v4.0.1 AS base

# Install Node.js version manager 'n' and the desired Node.js version
USER root
RUN apt-get update && \
    apt-get install -y curl && \
    curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o /usr/local/bin/n && \
    chmod +x /usr/local/bin/n && \
    n 20.15.1 && \
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install  --immutable && yarn cache clean --all

COPY tsconfig.json  configuration.ts project.ts schema.graphql .env ./

RUN yarn codegen

COPY src ./src

RUN yarn build

ENTRYPOINT ["/sbin/tini", "--", "/bin/run"]


CMD ["-f", "/app"]
