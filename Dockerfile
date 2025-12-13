FROM node:20-alpine

WORKDIR /app

# Copy package files (we'll mount the rest of the volume in compose)
COPY package.json ./

# Install dependencies
RUN npm install

EXPOSE 5173

# CMD will be overridden by docker-compose for dev, but this is a good default
CMD ["npm", "run", "dev", "--", "--host"]
