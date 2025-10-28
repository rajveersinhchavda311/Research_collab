from django.contrib.auth.models import User
from rest_framework import serializers

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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ["id", "user", "role"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ["id", "title", "author", "publication_year", "type"]


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


class ProjectSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSource
        fields = ["id", "project", "source"]


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "text", "source", "user", "created_at"]
        read_only_fields = ["created_at"]


class NoteTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteTag
        fields = ["id", "note", "tag"]


