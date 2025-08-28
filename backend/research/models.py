from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_VIEWER = 'viewer'
    ROLE_EDITOR = 'editor'
    ROLE_MANAGER = 'manager'
    ROLE_CHOICES = [
        (ROLE_VIEWER, 'Viewer'),
        (ROLE_EDITOR, 'Editor'),
        (ROLE_MANAGER, 'Manager'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.name


class Project(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class Source(models.Model):
    TYPE_ARTICLE = 'article'
    TYPE_BOOK = 'book'
    TYPE_WEBSITE = 'website'
    TYPE_REPORT = 'report'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_ARTICLE, 'Article'),
        (TYPE_BOOK, 'Book'),
        (TYPE_WEBSITE, 'Website'),
        (TYPE_REPORT, 'Report'),
        (TYPE_OTHER, 'Other'),
    ]

    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_OTHER)

    def __str__(self) -> str:
        return self.title


class ProjectSource(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_sources')
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='source_projects')

    class Meta:
        unique_together = ('project', 'source')


class ProjectCollaborator(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=UserProfile.ROLE_CHOICES, default=UserProfile.ROLE_VIEWER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')


class Note(models.Model):
    text = models.TextField()
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Note by {self.user.username} on {self.source.title}"


class NoteTag(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='note_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='tag_notes')

    class Meta:
        unique_together = ('note', 'tag')


# Advanced query helpers
def generate_project_bibliography(project: Project) -> str:
    sources = Source.objects.filter(source_projects__project=project).distinct()
    entries: list[str] = []
    for source in sources:
        author = source.author or 'Unknown Author'
        year = source.publication_year if source.publication_year else 'n.d.'
        title = source.title
        entries.append(f"{author} ({year}). {title}.")
    return "\n".join(entries)

# Create your models here.
