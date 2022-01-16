#!/usr/bin/env bash
set -o errexit -o nounset

git diff HEAD^ HEAD --quiet . || git diff HEAD^ HEAD --quiet ../../libs/core
