from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q

from .models import (
    Project,
    ProjectCollaborator,
    AccessRequest,
)
from .serializers import (
    ProjectSerializer,
    ProjectCollaboratorSerializer,
    UserSerializer,
    AccessRequestSerializer,
)
from .permissions import IsProjectEditor


def health_check(_request):
    return JsonResponse({"status": "ok"})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return response.Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return response.Response({"detail": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return response.Response({"detail": "username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    user = User(username=username)
    user.set_password(password)
    user.save()

    return response.Response({"id": user.id, "username": user.username}, status=status.HTTP_201_CREATED)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related("owner")
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Project.objects
            .filter(Q(owner=user) | Q(collaborators__user=user))
            .select_related("owner")
            .distinct()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if project.owner_id != request.user.id:
            return response.Response({"detail": "Only the owner can delete this project"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def by_username(self, request):
        username = request.query_params.get("username", "").strip()
        if not username:
            return response.Response({"detail": "username is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return response.Response([], status=status.HTTP_200_OK)
        projects = Project.objects.filter(owner=user).select_related("owner").order_by("-created_at")
        return response.Response(ProjectSerializer(projects, many=True).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsProjectEditor])
    def invite(self, request, pk=None):
        project = self.get_object()
        username = request.data.get("username")
        role = request.data.get("role", "viewer")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return response.Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        collaborator, _ = ProjectCollaborator.objects.update_or_create(
            project=project,
            user=user,
            defaults={"role": role},
        )
        return response.Response(ProjectCollaboratorSerializer(collaborator).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsProjectEditor])
    def complete(self, request, pk=None):
        project = self.get_object()
        project.status = Project.STATUS_COMPLETED
        project.save(update_fields=["status"])
        return response.Response(ProjectSerializer(project).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def request_access(self, request, pk=None):
        try:
            project = Project.objects.select_related("owner").get(pk=pk)
        except Project.DoesNotExist:
            return response.Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if project.owner_id == request.user.id:
            return response.Response({"detail": "You already own this project"}, status=status.HTTP_400_BAD_REQUEST)
        ar, created = AccessRequest.objects.get_or_create(project=project, requester=request.user)
        if not created and ar.status != AccessRequest.STATUS_PENDING:
            ar.status = AccessRequest.STATUS_PENDING
            ar.save(update_fields=["status"])
        return response.Response(AccessRequestSerializer(ar).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @decorators.action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated, IsProjectEditor])
    def incoming_requests(self, request, pk=None):
        project = self.get_object()
        qs = project.access_requests.filter(status=AccessRequest.STATUS_PENDING).select_related("requester")
        return response.Response(AccessRequestSerializer(qs, many=True).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsProjectEditor])
    def approve_request(self, request, pk=None):
        project = self.get_object()
        req_id = request.data.get("request_id")
        role = request.data.get("role", "manager")
        if role not in ["viewer", "editor", "manager"]:
            return response.Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            ar = AccessRequest.objects.get(id=req_id, project=project, status=AccessRequest.STATUS_PENDING)
        except AccessRequest.DoesNotExist:
            return response.Response({"detail": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        ProjectCollaborator.objects.update_or_create(project=project, user=ar.requester, defaults={"role": role})
        ar.status = AccessRequest.STATUS_APPROVED
        ar.save(update_fields=["status"])
        return response.Response(AccessRequestSerializer(ar).data)


class ProjectCollaboratorViewSet(viewsets.ModelViewSet):
    queryset = ProjectCollaborator.objects.select_related("project", "user")
    serializer_class = ProjectCollaboratorSerializer
    permission_classes = [permissions.IsAuthenticated]
