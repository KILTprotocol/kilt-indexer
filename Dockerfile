FROM subquerynetwork/subql-node-substrate:v4.0.1 AS base

ENV NODE_VERSION=20.15.1

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install  --immutable && yarn cache clean --all

COPY tsconfig.json  configuration.ts project.ts schema.graphql .env ./

RUN yarn codegen

COPY src ./src

RUN yarn build

ENTRYPOINT ["/sbin/tini", "--", "/bin/run"]


CMD ["-f", "/app"]
