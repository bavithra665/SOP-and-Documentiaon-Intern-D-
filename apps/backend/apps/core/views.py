from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from datetime import datetime, timedelta
from apps.users.models import User
from apps.departments.models import Department
from apps.documents.models import Document
from apps.sops.models import SOP, SOPStatus, SOPCompliance, Quiz, QuizResult
from .serializers import (
    AdminDashboardSerializer,
    ManagerDashboardSerializer,
    EmployeeDashboardSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Admin dashboard statistics"""
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=403)
    
    # Basic counts
    total_users = User.objects.count()
    total_departments = Department.objects.count()
    total_documents = Document.objects.count()
    total_sops = SOP.objects.count()
    pending_approvals = SOP.objects.filter(status=SOPStatus.UNDER_REVIEW).count()
    
    # Compliance rate
    published_sops = SOP.objects.filter(status=SOPStatus.PUBLISHED).count()
    total_compliance_records = SOPCompliance.objects.filter(
        sop__status=SOPStatus.PUBLISHED
    ).count()
    acknowledged_count = SOPCompliance.objects.filter(
        sop__status=SOPStatus.PUBLISHED,
        acknowledged=True
    ).count()
    compliance_rate = (acknowledged_count / total_compliance_records * 100) if total_compliance_records > 0 else 0
    
    # User growth (last 6 months)
    six_months_ago = timezone.now() - timedelta(days=180)
    user_growth = User.objects.filter(
        created_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    user_growth_data = []
    for item in user_growth:
        user_growth_data.append({
            'month': item['month'].strftime('%b %Y'),
            'count': item['count']
        })
    
    # Document growth (last 6 months)
    document_growth = Document.objects.filter(
        created_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    document_growth_data = []
    for item in document_growth:
        document_growth_data.append({
            'month': item['month'].strftime('%b %Y'),
            'count': item['count']
        })
    
    # SOP growth (last 6 months)
    sop_growth = SOP.objects.filter(
        created_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    sop_growth_data = []
    for item in sop_growth:
        sop_growth_data.append({
            'month': item['month'].strftime('%b %Y'),
            'count': item['count']
        })
    
    # Department compliance
    department_compliance = []
    for dept in Department.objects.all():
        dept_sops = SOP.objects.filter(department=dept, status=SOPStatus.PUBLISHED)
        dept_total = dept_sops.count()
        if dept_total > 0:
            dept_compliances = SOPCompliance.objects.filter(
                sop__in=dept_sops,
                acknowledged=True
            ).count()
            dept_total_compliances = SOPCompliance.objects.filter(
                sop__in=dept_sops
            ).count()
            dept_rate = (dept_compliances / dept_total_compliances * 100) if dept_total_compliances > 0 else 0
            department_compliance.append({
                'department': dept.name,
                'compliance_rate': round(dept_rate, 1),
                'total_sops': dept_total
            })
    
    data = {
        'total_users': total_users,
        'total_departments': total_departments,
        'total_documents': total_documents,
        'total_sops': total_sops,
        'pending_approvals': pending_approvals,
        'compliance_rate': round(compliance_rate, 1),
        'user_growth': user_growth_data,
        'document_growth': document_growth_data,
        'sop_growth': sop_growth_data,
        'department_compliance': department_compliance
    }
    
    serializer = AdminDashboardSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def manager_dashboard(request):
    """Manager dashboard statistics"""
    if request.user.role not in ['admin', 'manager']:
        return Response({'error': 'Permission denied'}, status=403)
    
    user = request.user
    department = user.department
    
    if not department:
        return Response({'error': 'No department assigned'}, status=400)
    
    # Basic counts
    total_employees = User.objects.filter(department=department, role='employee').count()
    department_sops = SOP.objects.filter(department=department).count()
    published_sops = SOP.objects.filter(department=department, status=SOPStatus.PUBLISHED)
    
    # Employee compliance rate
    dept_compliances = SOPCompliance.objects.filter(
        sop__in=published_sops,
        acknowledged=True
    ).count()
    dept_total_compliances = SOPCompliance.objects.filter(
        sop__in=published_sops
    ).count()
    employee_compliance_rate = (dept_compliances / dept_total_compliances * 100) if dept_total_compliances > 0 else 0
    
    # Quiz performance
    dept_quizzes = Quiz.objects.filter(sop__department=department)
    dept_results = QuizResult.objects.filter(quiz__in=dept_quizzes)
    quiz_avg = dept_results.aggregate(avg_score=Avg('score'), avg_percentage=Avg('percentage'))
    quiz_average_score = quiz_avg['avg_score'] or 0
    quiz_average_percentage = quiz_avg['avg_percentage'] or 0
    
    pass_count = dept_results.filter(percentage__gte=70).count()
    quiz_pass_rate = (pass_count / dept_results.count() * 100) if dept_results.count() > 0 else 0
    
    # Pending reviews
    pending_reviews = SOP.objects.filter(department=department, status=SOPStatus.UNDER_REVIEW).count()
    
    # Compliance trend (last 6 months)
    six_months_ago = timezone.now() - timedelta(days=180)
    compliance_trend = SOPCompliance.objects.filter(
        sop__department=department,
        acknowledged_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('acknowledged_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    compliance_trend_data = []
    for item in compliance_trend:
        compliance_trend_data.append({
            'month': item['month'].strftime('%b %Y'),
            'count': item['count']
        })
    
    # Quiz performance by employee
    quiz_performance = []
    employees = User.objects.filter(department=department, role='employee')
    for emp in employees:
        emp_results = QuizResult.objects.filter(
            quiz__in=dept_quizzes,
            user=emp
        )
        if emp_results.exists():
            emp_avg = emp_results.aggregate(avg_percentage=Avg('percentage'))
            quiz_performance.append({
                'employee': emp.get_full_name() or emp.username,
                'average_score': round(emp_avg['avg_percentage'] or 0, 1),
                'quizzes_taken': emp_results.count()
            })
    
    # Top performers
    top_performers = sorted(quiz_performance, key=lambda x: x['average_score'], reverse=True)[:5]
    
    data = {
        'department_name': department.name,
        'total_employees': total_employees,
        'department_sops': department_sops,
        'employee_compliance_rate': round(employee_compliance_rate, 1),
        'quiz_average_score': round(quiz_average_score, 1),
        'quiz_pass_rate': round(quiz_pass_rate, 1),
        'pending_reviews': pending_reviews,
        'compliance_trend': compliance_trend_data,
        'quiz_performance': quiz_performance,
        'top_performers': top_performers
    }
    
    serializer = ManagerDashboardSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_dashboard(request):
    """Employee dashboard statistics"""
    user = request.user
    
    # SOP counts
    published_sops = SOP.objects.filter(status=SOPStatus.PUBLISHED)
    if user.department:
        published_sops = published_sops.filter(
            Q(department=user.department) | Q(department__isnull=True)
        ).distinct()
    
    user_compliances = SOPCompliance.objects.filter(user=user, sop__in=published_sops)
    assigned_sops = published_sops.count()
    completed_sops = user_compliances.filter(acknowledged=True).count()
    pending_sops = assigned_sops - completed_sops
    
    # Quiz performance
    user_results = QuizResult.objects.filter(user=user)
    quiz_avg = user_results.aggregate(avg_score=Avg('score'), avg_percentage=Avg('percentage'))
    quiz_average_score = quiz_avg['avg_score'] or 0
    quiz_average_percentage = quiz_avg['avg_percentage'] or 0
    quiz_total_taken = user_results.count()
    
    pass_count = user_results.filter(percentage__gte=70).count()
    quiz_pass_rate = (pass_count / quiz_total_taken * 100) if quiz_total_taken > 0 else 0
    
    # Recent documents
    recent_documents = Document.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).select_related('uploaded_by', 'department')[:5]
    
    recent_documents_data = []
    for doc in recent_documents:
        recent_documents_data.append({
            'id': doc.id,
            'title': doc.title,
            'file_type': doc.file_type,
            'uploaded_by': doc.uploaded_by.get_full_name() if doc.uploaded_by else 'Unknown',
            'uploaded_at': doc.uploaded_at.isoformat(),
            'department': doc.department.name if doc.department else 'General'
        })
    
    # Upcoming quizzes
    available_quizzes = Quiz.objects.filter(is_active=True)
    if user.department:
        available_quizzes = available_quizzes.filter(sop__department=user.department)
    
    taken_quiz_ids = user_results.values_list('quiz_id', flat=True)
    upcoming_quizzes = available_quizzes.exclude(id__in=taken_quiz_ids)[:5]
    
    upcoming_quizzes_data = []
    for quiz in upcoming_quizzes:
        upcoming_quizzes_data.append({
            'id': quiz.id,
            'title': quiz.title,
            'sop_title': quiz.sop.title,
            'question_count': len(quiz.questions) if quiz.questions else 0
        })
    
    # Compliance progress
    compliance_progress = []
    for i in range(6):
        month_start = timezone.now() - timedelta(days=30 * (5 - i))
        month_end = month_start + timedelta(days=30)
        month_compliance = user_compliances.filter(
            acknowledged_at__gte=month_start,
            acknowledged_at__lt=month_end
        ).count()
        compliance_progress.append({
            'month': month_start.strftime('%b'),
            'count': month_compliance
        })
    
    data = {
        'assigned_sops': assigned_sops,
        'pending_sops': pending_sops,
        'completed_sops': completed_sops,
        'quiz_average_score': round(quiz_average_score, 1),
        'quiz_total_taken': quiz_total_taken,
        'quiz_pass_rate': round(quiz_pass_rate, 1),
        'recent_documents': recent_documents_data,
        'upcoming_quizzes': upcoming_quizzes_data,
        'compliance_progress': compliance_progress
    }
    
    serializer = EmployeeDashboardSerializer(data)
    return Response(serializer.data)
