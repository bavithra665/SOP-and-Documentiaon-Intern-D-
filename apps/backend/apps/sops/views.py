from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models as django_models
from django.db.models import Count, Q, F, Avg
from django.utils import timezone
from apps.common.permissions import IsAdmin, IsManager, IsEmployee
from .models import SOP, SOPStatus, SOPCompliance, Quiz, QuizResult
from .serializers import (
    SOPSerializer,
    SOPCreateSerializer,
    SOPUpdateSerializer,
    SOPSubmitReviewSerializer,
    SOPReviewSerializer,
    SOPApproveSerializer,
    SOPPublishSerializer,
    SOPComplianceSerializer,
    ComplianceAnalyticsSerializer,
    QuizSerializer,
    QuizCreateSerializer,
    QuizSubmitSerializer,
    QuizResultSerializer,
    QuizAnalyticsSerializer
)
from ..ai.services.groq_client import groq_client


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

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Mark SOP as read"""
        sop = self.get_object()
        compliance, created = SOPCompliance.objects.get_or_create(
            user=request.user,
            sop=sop
        )
        compliance.mark_as_read()
        serializer = SOPComplianceSerializer(compliance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge SOP"""
        sop = self.get_object()
        if sop.status != SOPStatus.PUBLISHED:
            return Response(
                {'error': 'Only published SOPs can be acknowledged'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        compliance, created = SOPCompliance.objects.get_or_create(
            user=request.user,
            sop=sop
        )
        compliance.acknowledge()
        serializer = SOPComplianceSerializer(compliance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_compliance(self, request):
        """Get user's compliance status"""
        compliances = SOPCompliance.objects.filter(user=request.user).select_related('sop', 'sop__department')
        serializer = SOPComplianceSerializer(compliances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get compliance analytics"""
        user = request.user
        
        # Get published SOPs relevant to user
        published_sops = SOP.objects.filter(status=SOPStatus.PUBLISHED)
        if user.role != 'admin':
            published_sops = published_sops.filter(
                Q(department=user.department) | Q(department__isnull=True)
            ).distinct()
        
        total_sops = published_sops.count()
        
        # Get user's compliance records
        user_compliances = SOPCompliance.objects.filter(
            user=user,
            sop__in=published_sops
        )
        
        read_sops = user_compliances.filter(read_at__isnull=False).count()
        acknowledged_sops = user_compliances.filter(acknowledged=True).count()
        pending_sops = total_sops - acknowledged_sops
        
        compliance_percentage = (acknowledged_sops / total_sops * 100) if total_sops > 0 else 0
        read_percentage = (read_sops / total_sops * 100) if total_sops > 0 else 0
        
        # Department compliance (for admins/managers)
        department_compliance = []
        if user.role in ['admin', 'manager']:
            from apps.departments.models import Department
            departments = Department.objects.all()
            
            for dept in departments:
                dept_sops = published_sops.filter(department=dept)
                dept_total = dept_sops.count()
                if dept_total > 0:
                    dept_acknowledged = SOPCompliance.objects.filter(
                        sop__in=dept_sops,
                        acknowledged=True
                    ).count()
                    dept_compliance.append({
                        'department': dept.name,
                        'total_sops': dept_total,
                        'acknowledged_sops': dept_acknowledged,
                        'compliance_percentage': round(dept_acknowledged / dept_total * 100, 1)
                    })
        
        analytics = {
            'total_sops': total_sops,
            'read_sops': read_sops,
            'acknowledged_sops': acknowledged_sops,
            'pending_sops': pending_sops,
            'compliance_percentage': round(compliance_percentage, 1),
            'read_percentage': round(read_percentage, 1),
            'department_compliance': department_compliance
        }
        
        serializer = ComplianceAnalyticsSerializer(analytics)
        return Response(serializer.data)


class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sop', 'is_active']
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Quiz.objects.select_related('sop', 'sop__department', 'created_by')
        user = self.request.user
        
        # Non-admin users can only see quizzes from their department
        if user.role != 'admin':
            queryset = queryset.filter(sop__department=user.department)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return QuizCreateSerializer
        return QuizSerializer

    def create(self, request, *args, **kwargs):
        """Generate quiz using Groq AI"""
        serializer = QuizCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sop = SOP.objects.get(id=serializer.validated_data['sop_id'])
            
            if sop.status != SOPStatus.PUBLISHED:
                return Response(
                    {'error': 'Quizzes can only be generated from published SOPs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate questions using Groq
            sop_content = f"""
            Title: {sop.title}
            Purpose: {sop.purpose}
            Scope: {sop.scope}
            Procedure Steps: {', '.join(sop.procedure_steps)}
            """
            
            num_questions = serializer.validated_data.get('num_questions', 5)
            questions = self.generate_questions(sop_content, num_questions)
            
            # Create quiz
            quiz = Quiz.objects.create(
                sop=sop,
                title=f"{sop.title} Quiz",
                questions=questions,
                created_by=request.user
            )
            
            response_serializer = QuizSerializer(quiz)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except SOP.DoesNotExist:
            return Response(
                {'error': 'SOP not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def generate_questions(self, sop_content, num_questions):
        """Generate MCQs using Groq AI"""
        if not groq_client.is_configured():
            raise Exception("Groq API is not configured")
        
        prompt = f"""Generate {num_questions} multiple choice questions based on the following SOP content:

{sop_content}

Please provide the response in JSON format with the following structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0
        }}
    ]
}}

Note: correct_answer should be the index (0-3) of the correct option in the options array."""
        
        try:
            response = groq_client.client.chat.completions.create(
                model=groq_client.model,
                messages=[
                    {"role": "system", "content": "You are an expert at creating multiple choice questions for training purposes. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return result.get('questions', [])
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit quiz answers"""
        quiz = self.get_object()
        
        serializer = QuizSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            answers = serializer.validated_data['answers']
            questions = quiz.questions
            
            if len(answers) != len(questions):
                return Response(
                    {'error': 'Number of answers does not match number of questions'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate score
            correct_count = 0
            for i, answer in enumerate(answers):
                if answer == questions[i].get('correct_answer'):
                    correct_count += 1
            
            score = correct_count
            total_questions = len(questions)
            percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
            
            # Save result
            result = QuizResult.objects.create(
                quiz=quiz,
                user=request.user,
                score=score,
                total_questions=total_questions,
                percentage=percentage,
                answers=answers
            )
            
            response_serializer = QuizResultSerializer(result)
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_results(self, request):
        """Get user's quiz results"""
        results = QuizResult.objects.filter(user=request.user).select_related('quiz', 'quiz__sop')
        serializer = QuizResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get quiz analytics (Manager/Admin only)"""
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = request.user
        
        # Get quizzes based on user permissions
        quizzes = Quiz.objects.all()
        if user.role != 'admin':
            quizzes = quizzes.filter(sop__department=user.department)
        
        total_quizzes = quizzes.count()
        total_attempts = QuizResult.objects.filter(quiz__in=quizzes).count()
        
        # Calculate averages
        avg_result = QuizResult.objects.filter(quiz__in=quizzes).aggregate(
            avg_score=Avg('score'),
            avg_percentage=Avg('percentage')
        )
        
        average_score = avg_result['avg_score'] or 0
        average_percentage = avg_result['avg_percentage'] or 0
        
        # Pass rate (percentage >= 70)
        pass_count = QuizResult.objects.filter(quiz__in=quizzes, percentage__gte=70).count()
        pass_rate = (pass_count / total_attempts * 100) if total_attempts > 0 else 0
        
        # Department performance
        department_performance = []
        if user.role == 'admin':
            from apps.departments.models import Department
            departments = Department.objects.all()
            
            for dept in departments:
                dept_quizzes = quizzes.filter(sop__department=dept)
                dept_results = QuizResult.objects.filter(quiz__in=dept_quizzes)
                dept_total = dept_results.count()
                
                if dept_total > 0:
                    dept_avg = dept_results.aggregate(avg_percentage=Avg('percentage'))
                    department_performance.append({
                        'department': dept.name,
                        'total_attempts': dept_total,
                        'average_percentage': round(dept_avg['avg_percentage'] or 0, 1)
                    })
        
        # Recent results
        recent_results = QuizResult.objects.filter(quiz__in=quizzes).select_related('user', 'quiz')[:10]
        recent_data = []
        for result in recent_results:
            recent_data.append({
                'user': result.user.get_full_name() or result.user.username,
                'quiz': result.quiz.title,
                'score': result.score,
                'percentage': result.percentage,
                'completed_at': result.completed_at.isoformat()
            })
        
        analytics = {
            'total_quizzes': total_quizzes,
            'total_attempts': total_attempts,
            'average_score': round(average_score, 1),
            'average_percentage': round(average_percentage, 1),
            'pass_rate': round(pass_rate, 1),
            'department_performance': department_performance,
            'recent_results': recent_data
        }
        
        serializer = QuizAnalyticsSerializer(analytics)
        return Response(serializer.data)
