#!/bin/bash

docker build . -t gallery/ui --no-cache
docker-compose up -d
