"""
Production server using Waitress (Windows-compatible WSGI server).
Usage: python run_production.py
"""
import os
import sys

# Ensure Django settings are loaded
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eeu_tracker.settings')

# Force production mode
os.environ.setdefault('DEBUG', 'False')

from waitress import serve
from eeu_tracker.wsgi import application

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8000'))

if __name__ == '__main__':
    print(f'Starting EEU Document Tracker (production) on {HOST}:{PORT}')
    print('Press Ctrl+C to stop')
    serve(application, host=HOST, port=PORT, threads=4)
