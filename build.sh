#!/bin/bash
set -e

cd site
npm ci
npm run build
cd ..

rm -rf outputdist
mkdir -p outputdist
cp -r site/dist/* outputdist/