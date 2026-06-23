from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SOPViewSet

router = DefaultRouter()
router.register(r'sops', SOPViewSet, basename='sop')

urlpatterns = [
    path('', include(router.urls)),
]
