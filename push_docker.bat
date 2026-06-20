@echo off
if "%~1"=="" (
    echo Usage: push_docker.bat ^<your-dockerhub-username^>
    exit /b 1
)

set DOCKER_USER=%~1
set IMAGE_NAME=inventory-backend
set TAG=latest

echo Building Docker image: %DOCKER_USER%/%IMAGE_NAME%:%TAG%...
docker build -t %DOCKER_USER%/%IMAGE_NAME%:%TAG% -f backend/Dockerfile ./backend

echo Pushing Docker image to Docker Hub...
docker push %DOCKER_USER%/%IMAGE_NAME%:%TAG%

echo Done! Docker image successfully pushed to: https://hub.docker.com/r/%DOCKER_USER%/%IMAGE_NAME%
