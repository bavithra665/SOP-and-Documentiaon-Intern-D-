from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse
from django.conf import settings
from django.db import models as django_models
from django.utils import timezone
import os
from apps.common.permissions import IsAdmin, IsManager
from .models import Document, DocumentCategory, DocumentStatus
from .serializers import (
    DocumentSerializer,
    DocumentCreateSerializer,
    DocumentUpdateSerializer,
    DocumentApprovalSerializer,
    DocumentCategorySerializer
)


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'department', 'created_by']
    search_fields = ['title', 'description', 'file_name']
    ordering_fields = ['created_at', 'title', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Document.objects.select_related('category', 'department', 'created_by', 'approved_by')
        user = self.request.user
        
        # Non-admin users can only see documents from their department or their own
        if user.role != 'admin':
            queryset = queryset.filter(
                django_models.Q(department=user.department) | django_models.Q(created_by=user)
            ).distinct()
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DocumentUpdateSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        file_path = document.document_file.path
        
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        
        file_response = FileResponse(open(file_path, 'rb'))
        file_response['Content-Disposition'] = f'attachment; filename="{document.file_name}"'
        file_response['Content-Type'] = 'application/octet-stream'
        return file_response

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManager])
    def submit_for_approval(self, request, pk=None):
        document = self.get_object()
        if document.status != DocumentStatus.DRAFT:
            return Response(
                {'error': 'Only draft documents can be submitted for approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.status = DocumentStatus.PENDING_APPROVAL
        document.save()
        
        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManager])
    def approve(self, request, pk=None):
        document = self.get_object()
        if document.status != DocumentStatus.PENDING_APPROVAL:
            return Response(
                {'error': 'Only pending approval documents can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DocumentApprovalSerializer(data=request.data)
        if serializer.is_valid():
            document.status = serializer.validated_data['status']
            document.approved_by = request.user
            document.approved_at = timezone.now()
            
            if document.status == DocumentStatus.REJECTED:
                document.rejection_reason = serializer.validated_data['rejection_reason']
            else:
                document.rejection_reason = ''
            
            document.save()
            response_serializer = DocumentSerializer(document)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        documents = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'You do not have permission to view pending approvals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        documents = self.get_queryset().filter(status=DocumentStatus.PENDING_APPROVAL)
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)


class DocumentCategoryViewSet(viewsets.ModelViewSet):
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
