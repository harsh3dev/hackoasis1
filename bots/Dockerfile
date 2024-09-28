# Dockerfile for Python service

# Use an official Python image as the base image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the requirements file to the container
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script and other necessary files
COPY . .

# Expose port 5000 for the Flask API
EXPOSE 5000

# Run the Python script to start the Flask server
CMD ["python", "script2.py"]
