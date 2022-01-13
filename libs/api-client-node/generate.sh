#!/usr/bin/env bash
set -o errexit -o nounset

docker run --rm -v "$PWD/..:/local" openapitools/openapi-generator-cli:v5.3.1 generate \
    --input-spec /local/api-spec/resolved/openapi/openapi.yaml \
    --generator-name typescript-axios \
    --config /local/api-spec/config.yml \
    --output /local/api-client-node

ts_ignore_rep="s|// @ts-ignore||"
config_rep="s|import { Configuration|import type { Configuration|"

for r in \
"$ts_ignore_rep" \
"$config_rep" \
"s|, COLLECTION_FORMATS, |, |" \
"s|, RequiredError|, |" \
"s|, setBasicAuthToObject, |, |" \
"s|, setOAuthToObject, |, |" \
"s|, setApiKeyToObject, |, |" \
"s|, setBearerAuthToObject, |, |" \
"s|import { CreateUser|import type { CreateUser, User|" \
"s|import { User } from '../models';||" \
; do
  sed -i "" "$r" apis/users-api.ts
done

for r in \
"$ts_ignore_rep" \
"$config_rep" \
"s|AxiosPromise,||" \
; do
  sed -i "" "$r" base.ts
done

for r in \
"$ts_ignore_rep" \
"$config_rep" \
"s|import { AxiosInstance|import type { AxiosInstance|;" \
; do
  sed -i "" "$r" common.ts
done
