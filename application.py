"""
application.py
main entry point for the application
"""

from main import app

# Default port:
if __name__ == '__main__':
    app.run(debug=True)
    