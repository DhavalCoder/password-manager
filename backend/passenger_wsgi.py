import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app.main import app

# Passenger expects the WSGI app to be named 'application'
application = app
