#!/bin/bash
set -e

echo "Deployment started ..."

# Pull the latest version of the app
git pull origin master
echo "New changes copied to server !"

# change directory to the app
cd /home/anurag/splitr_backend
export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh 
# Install dependencies
echo "Installing Dependencies..."
npm install --yes

# restart pm2
echo "Restarting pm2..."
pm2 restart all

echo "Deployment Finished!"