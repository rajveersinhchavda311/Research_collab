from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'collaborators', views.ProjectCollaboratorViewSet)

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/me/', views.me, name='auth_me'),
    path('auth/token/', views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.register, name='register'),
    path('', include(router.urls)),
]


