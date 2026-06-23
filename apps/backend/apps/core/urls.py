from django.urls import path
from .views import admin_dashboard, manager_dashboard, employee_dashboard

urlpatterns = [
    path('admin/', admin_dashboard, name='admin_dashboard'),
    path('manager/', manager_dashboard, name='manager_dashboard'),
    path('employee/', employee_dashboard, name='employee_dashboard'),
    # Base health endpoint scaffold (no business modules)
    path("health/", lambda request: None),
]

