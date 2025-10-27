# Use Node.js LTS
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend
COPY . .

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "src/index.js"]
