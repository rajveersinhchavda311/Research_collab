from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q

from .models import (
    Project,
    Source,
    Note,
    Tag,
    ProjectSource,
    ProjectCollaborator,
)
from .serializers import (
    ProjectSerializer,
    SourceSerializer,
    NoteSerializer,
    TagSerializer,
    ProjectSourceSerializer,
    ProjectCollaboratorSerializer,
)
from .permissions import IsProjectEditor


def health_check(_request):
    return JsonResponse({"status": "ok"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    email = request.data.get("email", "").strip()

    if not username or not password:
        return response.Response({"detail": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return response.Response({"detail": "username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    user = User(username=username, email=email)
    user.set_password(password)
    user.save()

    return response.Response({"id": user.id, "username": user.username, "email": user.email}, status=status.HTTP_201_CREATED)


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


class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().select_related("user", "source")
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProjectSourceViewSet(viewsets.ModelViewSet):
    queryset = ProjectSource.objects.all()
    serializer_class = ProjectSourceSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProjectCollaboratorViewSet(viewsets.ModelViewSet):
    queryset = ProjectCollaborator.objects.select_related("project", "user")
    serializer_class = ProjectCollaboratorSerializer
    permission_classes = [permissions.IsAuthenticated]

# Create your views here.
