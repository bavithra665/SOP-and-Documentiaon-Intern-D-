from rest_framework import serializers


class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    total_documents = serializers.IntegerField()
    total_sops = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    compliance_rate = serializers.FloatField()
    user_growth = serializers.ListField(child=serializers.DictField())
    document_growth = serializers.ListField(child=serializers.DictField())
    sop_growth = serializers.ListField(child=serializers.DictField())
    department_compliance = serializers.ListField(child=serializers.DictField())


class ManagerDashboardSerializer(serializers.Serializer):
    department_name = serializers.CharField()
    total_employees = serializers.IntegerField()
    department_sops = serializers.IntegerField()
    employee_compliance_rate = serializers.FloatField()
    quiz_average_score = serializers.FloatField()
    quiz_pass_rate = serializers.FloatField()
    pending_reviews = serializers.IntegerField()
    compliance_trend = serializers.ListField(child=serializers.DictField())
    quiz_performance = serializers.ListField(child=serializers.DictField())
    top_performers = serializers.ListField(child=serializers.DictField())


class EmployeeDashboardSerializer(serializers.Serializer):
    assigned_sops = serializers.IntegerField()
    pending_sops = serializers.IntegerField()
    completed_sops = serializers.IntegerField()
    quiz_average_score = serializers.FloatField()
    quiz_total_taken = serializers.IntegerField()
    quiz_pass_rate = serializers.FloatField()
    recent_documents = serializers.ListField(child=serializers.DictField())
    upcoming_quizzes = serializers.ListField(child=serializers.DictField())
    compliance_progress = serializers.ListField(child=serializers.DictField())
