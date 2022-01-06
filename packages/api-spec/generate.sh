#!/usr/bin/env bash
set -o errexit -o nounset

docker run --rm -v "$PWD:/local" openapitools/openapi-generator-cli:latest generate \
    --input-spec /local/api.yml \
    --generator-name openapi-yaml \
    --config /local/config.yml \
    --output /local/resolved
