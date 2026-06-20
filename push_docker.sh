#!/bin/bash

# Prompt user for Docker Hub username if not provided
if [ -z "$1" ]; then
    echo "Usage: ./push_docker.sh <your-dockerhub-username>"
    exit 1
fi

DOCKER_USER=$1
IMAGE_NAME="inventory-backend"
TAG="latest"

echo "Building Docker image: $DOCKER_USER/$IMAGE_NAME:$TAG..."
docker build -t "$DOCKER_USER/$IMAGE_NAME:$TAG" -f backend/Dockerfile ./backend

echo "Pushing Docker image to Docker Hub..."
docker push "$DOCKER_USER/$IMAGE_NAME:$TAG"

echo "Done! Docker image successfully pushed to: https://hub.docker.com/r/$DOCKER_USER/$IMAGE_NAME"
