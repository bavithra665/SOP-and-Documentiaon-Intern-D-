from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models as django_models
from django.utils import timezone
from apps.common.permissions import IsAdmin, IsManager, IsEmployee
from .models import SOP, SOPStatus
from .serializers import (
    SOPSerializer,
    SOPCreateSerializer,
    SOPUpdateSerializer,
    SOPSubmitReviewSerializer,
    SOPReviewSerializer,
    SOPApproveSerializer,
    SOPPublishSerializer
)


class SOPViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'created_by']
    search_fields = ['title', 'purpose', 'scope']
    ordering_fields = ['created_at', 'title', 'status', 'version']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = SOP.objects.select_related('department', 'created_by', 'reviewed_by', 'approved_by')
        user = self.request.user
        
        # Non-admin users can only see SOPs from their department or their own
        if user.role != 'admin':
            queryset = queryset.filter(
                django_models.Q(department=user.department) | django_models.Q(created_by=user)
            ).distinct()
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return SOPCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SOPUpdateSerializer
        return SOPSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEmployee])
    def submit_for_review(self, request, pk=None):
        sop = self.get_object()
        
        if sop.status != SOPStatus.DRAFT:
            return Response(
                {'error': 'Only draft SOPs can be submitted for review'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if sop.created_by != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'You can only submit your own SOPs for review'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sop.submit_for_review()
        serializer = SOPSerializer(sop)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManager])
    def review(self, request, pk=None):
        sop = self.get_object()
        
        if sop.status != SOPStatus.UNDER_REVIEW:
            return Response(
                {'error': 'Only SOPs under review can be reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SOPReviewSerializer(data=request.data)
        if serializer.is_valid():
            sop.review(
                reviewed_by=request.user,
                approved=serializer.validated_data['approved'],
                comments=serializer.validated_data.get('comments')
            )
            response_serializer = SOPSerializer(sop)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        sop = self.get_object()
        
        if sop.status != SOPStatus.APPROVED:
            return Response(
                {'error': 'Only approved SOPs can be published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SOPApproveSerializer(data=request.data)
        if serializer.is_valid():
            sop.approve(approved_by=request.user)
            
            if serializer.validated_data.get('effective_date'):
                sop.effective_date = serializer.validated_data['effective_date']
                sop.save()
            
            response_serializer = SOPSerializer(sop)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def publish(self, request, pk=None):
        sop = self.get_object()
        
        if sop.status != SOPStatus.APPROVED:
            return Response(
                {'error': 'Only approved SOPs can be published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SOPPublishSerializer(data=request.data)
        if serializer.is_valid():
            sop.publish()
            
            if serializer.validated_data.get('effective_date'):
                sop.effective_date = serializer.validated_data['effective_date']
                sop.save()
            
            response_serializer = SOPSerializer(sop)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        sop = self.get_object()
        
        if sop.status not in [SOPStatus.UNDER_REVIEW, SOPStatus.APPROVED]:
            return Response(
                {'error': 'Only SOPs under review or approved can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason')
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if sop.status == SOPStatus.UNDER_REVIEW:
            sop.review(reviewed_by=request.user, approved=False, comments=rejection_reason)
        else:
            sop.status = SOPStatus.REJECTED
            sop.rejection_reason = rejection_reason
            sop.save()
        
        response_serializer = SOPSerializer(sop)
        return Response(response_serializer.data)

    @action(detail=False, methods=['get'])
    def my_sops(self, request):
        sops = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(sops)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(sops, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsManager])
    def pending_review(self, request):
        sops = self.get_queryset().filter(status=SOPStatus.UNDER_REVIEW)
        page = self.paginate_queryset(sops)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(sops, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def pending_approval(self, request):
        sops = self.get_queryset().filter(status=SOPStatus.APPROVED)
        page = self.paginate_queryset(sops)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(sops, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def published(self, request):
        sops = self.get_queryset().filter(status=SOPStatus.PUBLISHED)
        page = self.paginate_queryset(sops)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(sops, many=True)
        return Response(serializer.data)
