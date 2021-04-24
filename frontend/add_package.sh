#!/bin/bash
docker-compose run --rm node sh -c "cd react-sample && npm install -g $1 && yarn add $1"