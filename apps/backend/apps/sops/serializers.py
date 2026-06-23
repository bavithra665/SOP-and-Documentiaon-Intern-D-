from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import SOP, SOPStatus


class SOPSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    procedure_steps_count = serializers.SerializerMethodField()

    class Meta:
        model = SOP
        fields = [
            'id', 'title', 'purpose', 'scope', 'procedure_steps', 'procedure_steps_count',
            'department', 'department_name', 'status', 'version',
            'created_by', 'created_by_name', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'review_comments', 'approved_by', 'approved_by_name',
            'approved_at', 'rejection_reason', 'published_at', 'effective_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'version', 'created_by', 'reviewed_by', 'reviewed_at',
            'approved_by', 'approved_at', 'published_at', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_procedure_steps_count(self, obj):
        return len(obj.procedure_steps) if obj.procedure_steps else 0


class SOPCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOP
        fields = ['title', 'purpose', 'scope', 'procedure_steps', 'department']

    def validate_procedure_steps(self, value):
        if not isinstance(value, list):
            raise ValidationError("Procedure steps must be a list.")
        if not value:
            raise ValidationError("At least one procedure step is required.")
        for i, step in enumerate(value):
            if not isinstance(step, str) or not step.strip():
                raise ValidationError(f"Step {i + 1} must be a non-empty string.")
        return value

    def validate(self, attrs):
        if len(attrs.get('purpose', '')) < 10:
            raise ValidationError({"purpose": "Purpose must be at least 10 characters long."})
        if len(attrs.get('scope', '')) < 10:
            raise ValidationError({"scope": "Scope must be at least 10 characters long."})
        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SOPUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOP
        fields = ['title', 'purpose', 'scope', 'procedure_steps', 'department', 'status', 'effective_date']

    def validate_procedure_steps(self, value):
        if value is not None:
            if not isinstance(value, list):
                raise ValidationError("Procedure steps must be a list.")
            if not value:
                raise ValidationError("At least one procedure step is required.")
            for i, step in enumerate(value):
                if not isinstance(step, str) or not step.strip():
                    raise ValidationError(f"Step {i + 1} must be a non-empty string.")
        return value


class SOPSubmitReviewSerializer(serializers.Serializer):
    pass


class SOPReviewSerializer(serializers.Serializer):
    approved = serializers.BooleanField()
    comments = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs['approved'] and not attrs.get('comments'):
            raise ValidationError({"comments": "Comments are required when rejecting an SOP."})
        return attrs


class SOPApproveSerializer(serializers.Serializer):
    effective_date = serializers.DateField(required=False, allow_null=True)

    def validate_effective_date(self, value):
        if value and value < timezone.now().date():
            raise ValidationError("Effective date cannot be in the past.")
        return value


class SOPPublishSerializer(serializers.Serializer):
    effective_date = serializers.DateField(required=False, allow_null=True)

    def validate_effective_date(self, value):
        if value and value < timezone.now().date():
            raise ValidationError("Effective date cannot be in the past.")
        return value
