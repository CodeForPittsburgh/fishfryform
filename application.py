"""
application.py
main entry point for the application
"""

from core import application

# Default port:
if __name__ == '__main__':
    application.run(debug=True)
    