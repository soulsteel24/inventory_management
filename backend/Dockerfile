# Use a slim official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for compiling psycopg2 if binary isn't precompiled,
# though we use psycopg2-binary, having libpq-dev is good practice for PostgreSQL apps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory to /app/backend to match absolute imports
COPY . /app/backend/

# Expose the API port
EXPOSE 8000

# Start uvicorn from /app so python resolves backend.app correctly
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
