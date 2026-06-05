#!/bin/bash
set -e
echo 'Setting up development environment...'
cd backend
pip install -e .
alembic upgrade head
cd ../frontend
npm install
echo 'Setup complete!'