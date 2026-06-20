# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package dependencies
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy source code files
COPY . /app/

# Set environment variable at build-time (default fallback to local dev backend API URL)
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the SPA production bundle
RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:1.25-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
