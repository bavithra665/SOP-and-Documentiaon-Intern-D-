from django.urls import path

urlpatterns = [
    # Base health endpoint scaffold (no business modules)
    path("health/", lambda request: None),
]

