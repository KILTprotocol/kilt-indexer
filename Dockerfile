FROM subquerynetwork/subql-node-substrate:v4.0.1 AS base

WORKDIR /app

COPY package.json ./

RUN yarn install  --immutable && yarn cache clean --all

COPY tsconfig.json  configuration.ts project.ts schema.graphql ./

RUN yarn codegen

COPY src ./src

RUN yarn build

ENTRYPOINT ["/sbin/tini", "--", "/bin/run"]

CMD ["/bin/sh", "-c", "${SUB_COMMAND:-} -f=/app --targetHeight=${CUTOFF_HEIGHT:-4200000} --db-schema=${DB_SCHEMA:-public} --workers=4 --batch-size=30 --unfinalized-blocks=true"]

