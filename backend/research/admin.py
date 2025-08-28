from django.contrib import admin
from .models import (
    UserProfile,
    Tag,
    Project,
    Source,
    ProjectSource,
    ProjectCollaborator,
    Note,
    NoteTag,
)

admin.site.register(UserProfile)
admin.site.register(Tag)
admin.site.register(Project)
admin.site.register(Source)
admin.site.register(ProjectSource)
admin.site.register(ProjectCollaborator)
admin.site.register(Note)
admin.site.register(NoteTag)

# Register your models here.
