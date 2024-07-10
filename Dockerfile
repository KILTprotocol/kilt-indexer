FROM subquerynetwork/subql-node-substrate:v4.0.1

COPY . /app

ENTRYPOINT ["/bin/sh", "-c"]


CMD ["-f" "/app"]