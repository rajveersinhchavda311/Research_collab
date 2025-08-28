from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import ProjectCollaborator


class IsProjectViewer(BasePermission):
    def has_object_permission(self, request, view, obj):
        project = getattr(obj, "project", obj)
        if request.method in SAFE_METHODS:
            return ProjectCollaborator.objects.filter(project=project, user=request.user).exists() or project.owner_id == request.user.id
        return False


class IsProjectEditor(BasePermission):
    def has_object_permission(self, request, view, obj):
        project = getattr(obj, "project", obj)
        if project.owner_id == request.user.id:
            return True
        return ProjectCollaborator.objects.filter(project=project, user=request.user, role__in=["editor", "manager"]).exists()


