from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, DocumentCategoryViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'categories', DocumentCategoryViewSet, basename='documentcategory')

urlpatterns = [
    path('', include(router.urls)),
]
