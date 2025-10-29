from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Project,
    ProjectCollaborator,
    AccessRequest,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "title", "description", "status", "created_at", "owner"]


class ProjectCollaboratorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectCollaborator
        fields = ["id", "project", "user", "role", "joined_at"]
        read_only_fields = ["joined_at"]


class AccessRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)

    class Meta:
        model = AccessRequest
        fields = ["id", "project", "requester", "status", "created_at"]
        read_only_fields = ["status", "created_at", "requester"]


