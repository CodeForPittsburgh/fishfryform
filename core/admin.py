"""
admin.py

A Flask-Admin-based interface to the Fish Fry database, with add'l muscle
from Flask-Security.

"""

# ---------------------------------------------------------------------------
# IMPORTS

# flask
from flask import redirect, url_for, abort, request
# flask-security
from flask_security import Security, SQLAlchemyUserDatastore, current_user
from flask_security.utils import encrypt_password
# flask-admin
import flask_admin
from flask_admin.contrib import sqla
from flask_admin.contrib.sqla import ModelView
from flask_admin.contrib.geoa import ModelView as GeoModelView
from flask_admin import helpers as admin_helpers
# wtforms
from wtforms.fields import PasswordField
# core application
from . import application, application_db
from .models import User, Role, FishFry


# ---------------------------------------------------------------------------
# Flask Security

# User datastore registration
user_datastore = SQLAlchemyUserDatastore(application_db, User, Role)
# Application Security
security = Security(application, user_datastore)

# ---------------------------------------------------------------------------
# Admin Bluprint (flask-admin)
admin_blueprint = flask_admin.Admin(
    application, 
    name='Fish Fry Map Admin',
    template_mode='bootstrap3'
)

# ---------------------------------------------------------------------------
# Admin Model View classes

class AdminModelView(ModelView):
    """Create custom model view class to limit Admin pages to admins
    """

    def is_accessible(self):
        '''only accessible if user is admin. hidden from everyone else
        '''
        if not current_user.is_active or not current_user.is_authenticated:
            return False
        if current_user.has_role('admin'):
            return True
        return False

    def _handle_view(self, name, **kwargs):
        """Override builtin _handle_view in order to redirect users when a
        view is not accessible.
        """
        if not self.is_accessible():
            if current_user.is_authenticated:
                # permission denied
                abort(403)
            else:
                # login
                return redirect(url_for('security.login', next=request.url))

class AdminGeoModelView(GeoModelView):
    """similiar to AdminModelView, but inherits from the sqla.geo view
    """
    def is_accessible(self):
        '''only accessible if user is admin. hidden from everyone else
        '''
        if not current_user.is_active or not current_user.is_authenticated:
            return False
        if current_user.has_role('admin'):
            return True
        return False

    def _handle_view(self, name, **kwargs):
        """Override builtin _handle_view in order to redirect users when a
        view is not accessible.
        """
        if not self.is_accessible():
            if current_user.is_authenticated:
                # permission denied
                abort(403)
            else:
                # login
                return redirect(url_for('security.login', next=request.url))
                
class AdminFishFryView(AdminGeoModelView):
    column_display_pk = True
    column_list = []
    column_searchable_list = ()
    column_filters = ()
    column_sortable_list = ()
    action_disallowed_list = ['delete']
    form_columns = []
    can_edit = True
    can_delete = True
    can_create = True
    
class AdminUserView(ModelView):

    # Don't display the password on the list of Users
    column_exclude_list = list = ('password',)
    # Don't include the standard password field when creating or editing a User
    # (but see below)
    form_excluded_columns = ('password',)
    # Automatically display human-readable names for the current and available
    # Roles when creating or editing a User
    column_auto_select_related = True
    # On the form for creating or editing a User, don't display a field
    # corresponding to the model's password field. There are two reasons for
    # this. First, we want to encrypt the password before storing in the
    # database. Second, we want to use a password field (with the input masked)
    # rather than a regular text field.
    def scaffold_form(self):
        """Start with the standard form as provided by Flask-Admin. We've
        already told Flask-Admin to exclude the password field from this form.
        """
        form_class = super(AdminUserView, self).scaffold_form()
        # Add a password field, naming it "password2" and labeling it "New Password".
        form_class.password2 = PasswordField('New Password')
        return form_class
    
    def on_model_change(self, form, model, is_created):
        """This callback executes when the user saves changes to a newly-created
        or edited User -- before the changes are committed to the database.
        """
        # If the password field isn't blank...
        if len(model.password2):
            # ... then encrypt the new password prior to storing it in the
            # database. If the password field is blank, the existing password
            # in the database will be retained.
            model.password = encrypt_password(model.password2)

    def is_accessible(self):
        '''only accessible if user is admin. hidden from everyone else
        '''
        if not current_user.is_active or not current_user.is_authenticated:
            return False
        if current_user.has_role('admin'):
            return True
        return False

    def _handle_view(self, name, **kwargs):
        """Override builtin _handle_view in order to redirect users when a
        view is not accessible.
        """
        if not self.is_accessible():
            if current_user.is_authenticated:
                # permission denied
                abort(403)
            else:
                # login
                return redirect(url_for('security.login', next=request.url))

#----------------------------------------------------------------------------
# ADMIN ROUTES
# accessed via /admin, c/o Flask-Admin

admin_blueprint.add_view(AdminUserView(User, application_db.session))
admin_blueprint.add_view(AdminModelView(Role, application_db.session))
admin_blueprint.add_view(AdminFishFryView(FishFry, application_db.session))

# ---------------------------------------------------------------------------
# Supporting things

# define a context processor for merging flask-admin's template context into the
# flask-security views.
@security.context_processor
def security_context_processor():
    return dict(
        admin_base_template=admin_blueprint.base_template,
        admin_view=admin_blueprint.index_view,
        h=admin_helpers,
        get_url=url_for
    )
    