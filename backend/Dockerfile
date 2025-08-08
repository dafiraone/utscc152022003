# Use newest Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY . .

# Expose the port your app listens on (adjust if needed)
EXPOSE 3000

# Start the node app
CMD ["node", "app.js"]