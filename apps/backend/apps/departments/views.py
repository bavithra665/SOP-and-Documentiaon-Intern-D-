from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import IsAdmin
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        department = self.get_object()
        from apps.users.serializers import UserManagementSerializer
        users = department.users.all()
        serializer = UserManagementSerializer(users, many=True)
        return Response(serializer.data)
