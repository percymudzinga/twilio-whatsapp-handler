FROM node:20.9.0-bullseye-slim
# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json (if available)
COPY package*.json ./
COPY prisma ./prisma/

# Step 4: Install dependencies
RUN npm install

RUN npm install -g prisma

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the TypeScript code (for production)
RUN npm run build

RUN npx prisma generate

# Step 7: Expose the port your application will run on (optional, based on your app)
EXPOSE 8080

# Step 8: Define environment variables (optional)
# For example, you could define NODE_ENV as either "production" or "development"
ENV NODE_ENV=production

# Step 9: Default command (use npm scripts based on the environment)
# For production, use the `start` script
# For development, you might want to override this command to use `dev`
CMD ["npm", "run", "deploy"]