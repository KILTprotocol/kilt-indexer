FROM subquerynetwork/subql-node-substrate:v4.0.1 AS base

WORKDIR /app

COPY package.json ./

# Check if yarn.lock exists before running yarn install
RUN if [ -f yarn.lock ]; then echo "yarn.lock exists"; else echo "yarn.lock does not exist"; fi

RUN yarn install  --immutable && yarn cache clean --all

COPY tsconfig.json  configuration.ts project.ts schema.graphql .env ./

RUN yarn codegen

COPY src ./src

RUN yarn build

ENTRYPOINT ["/sbin/tini", "--", "/bin/run"]


CMD ["-f", "/app"]
