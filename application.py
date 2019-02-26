"""
application.py
main entry point for the application
"""

from core import application

debug = application.config['DEBUG']

if debug:
    import win_unicode_console

if __name__ == '__main__':
    if debug:
        win_unicode_console.enable()
    # if not debug:
    #     application.config["DYNAMO_ENABLE_LOCAL"] = False

    application.run(debug=debug)
