from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'sources', views.SourceViewSet)
router.register(r'notes', views.NoteViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'project-sources', views.ProjectSourceViewSet)
router.register(r'collaborators', views.ProjectCollaboratorViewSet)

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/token/', views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.register, name='register'),
    path('', include(router.urls)),
]


