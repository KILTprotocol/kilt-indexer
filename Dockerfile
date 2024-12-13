FROM subquerynetwork/subql-node-substrate:v4.0.1 AS base

# change user to root to have permission to install dependencies
USER root

# Install dependencies like Python
RUN apk add --update --no-cache python3 make g++

# change back to the user used by subquery
USER 1000

# Save the passed environment variables
ARG CRAWL_PEREGRINE
ARG RPC_ENDPOINTS

# Print out the values used for this image
RUN echo "Building docker image with: CRAWL_PEREGRINE=${CRAWL_PEREGRINE} & RPC_ENDPOINTS=${RPC_ENDPOINTS}"

WORKDIR /kilt_indexer

COPY package.json yarn.lock ./

# Check if yarn.lock exists before running yarn install
RUN if [ -f yarn.lock ]; then echo "yarn.lock exists"; else echo "yarn.lock does not exist"; fi

RUN yarn install  --immutable && yarn cache clean --all

COPY tsconfig.json  configuration.ts project.ts schema.graphql ./

RUN yarn codegen

COPY src ./src

RUN yarn build

ENTRYPOINT ["/sbin/tini", "--", "/bin/run"]


CMD ["-f", "/kilt_indexer"]


## To build this docker image on your local machine run:
## docker build --debug -t local_indexer --build-arg RPC_ENDPOINTS=https://your-rpc-endpoint.com .