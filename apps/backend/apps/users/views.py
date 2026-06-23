from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from apps.common.permissions import IsAdmin
from .serializers import UserManagementSerializer, UserCreateSerializer, UserUpdateSerializer, UserPasswordResetSerializer

User = get_user_model()


class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserManagementSerializer

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = UserPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'You cannot deactivate yourself'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        return Response({'message': 'User deactivated successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'message': 'User activated successfully'}, status=status.HTTP_200_OK)
