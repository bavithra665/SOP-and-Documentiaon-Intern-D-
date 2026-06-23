from rest_framework import permissions
from apps.users.models import Role


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == Role.ADMIN


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [Role.ADMIN, Role.MANAGER]


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE]
