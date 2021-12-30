#!/usr/bin/env bash
set -o errexit -o nounset

docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:latest generate \
    --input-spec /local/api.yml \
    --generator-name openapi-yaml \
    --config /local/config.yml \
    --output /local/resolved

mv resolved/openapi/openapi.yaml resolved.yml
rm -rf resolved

# docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:latest generate \
#     --input-spec /local/api.yml \
#     --generator-name typescript-axios \
#     --config /local/config.yml \
#     --output /local/api-client-node

# sed -i "" "s/, COLLECTION_FORMATS, /, /" api.ts
# sed -i "" "s/, setApiKeyToObject, /, /" api.ts
# sed -i "" "s/, setBearerAuthToObject, /, /" api.ts
# sed -i "" "s/AxiosPromise,//" base.ts
# sed -i "" "s/name: \"RequiredError\" = \"RequiredError\";/override name: \"RequiredError\" = \"RequiredError\";/" base.ts

# yarn format
# yarn lint --fix
