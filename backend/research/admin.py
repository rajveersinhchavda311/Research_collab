from django.contrib import admin
from .models import Project, ProjectCollaborator, AccessRequest

admin.site.register(Project)
admin.site.register(ProjectCollaborator)
admin.site.register(AccessRequest)
