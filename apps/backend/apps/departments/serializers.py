from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'user_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_count(self, obj):
        return obj.users.count()

    def validate_name(self, value):
        if Department.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Department with this name already exists.")
        return value
