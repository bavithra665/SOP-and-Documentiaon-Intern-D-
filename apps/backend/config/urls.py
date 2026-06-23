from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication endpoints
    path("api/auth/", include("apps.authentication.urls")),

    # Management endpoints (Admin only)
    path("api/management/", include("apps.departments.urls")),
    path("api/management/", include("apps.users.urls")),

    # Document management
    path("api/documents/", include("apps.documents.urls")),

    # SOP management
    path("api/sops/", include("apps.sops.urls")),

    # AI features
    path("api/", include("apps.ai.urls")),

    # Base API routing placeholder
    path("api/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

