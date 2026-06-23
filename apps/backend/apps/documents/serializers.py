from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Document, DocumentCategory, DocumentStatus


class DocumentCategorySerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'description', 'document_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_document_count(self, obj):
        return obj.documents.count()


class DocumentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'category', 'category_name',
            'department', 'department_name', 'document_file', 'file_name',
            'file_size', 'file_size_display', 'file_type', 'status',
            'created_by', 'created_by_name', 'approved_by', 'approved_by_name',
            'approved_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_type', 'created_by', 'approved_by',
            'approved_at', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_file_size_display(self, obj):
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.2f} {unit}"
            size /= 1024
        return f"{size:.2f} TB"

    def validate_document_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise ValidationError(f"File size cannot exceed 10MB. Current size: {value.size / (1024*1024):.2f}MB")
        return value


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['title', 'description', 'category', 'department', 'document_file']

    def validate_document_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise ValidationError(f"File size cannot exceed 10MB. Current size: {value.size / (1024*1024):.2f}MB")
        return value

    def create(self, validated_data):
        file = validated_data['document_file']
        validated_data['file_name'] = file.name
        validated_data['file_size'] = file.size
        validated_data['file_type'] = file.name.split('.')[-1].lower()
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['title', 'description', 'category', 'department', 'status', 'rejection_reason']

    def validate(self, attrs):
        status = attrs.get('status', self.instance.status)
        rejection_reason = attrs.get('rejection_reason', self.instance.rejection_reason)
        
        if status == DocumentStatus.REJECTED and not rejection_reason:
            raise ValidationError({"rejection_reason": "Rejection reason is required when rejecting a document."})
        
        if status == DocumentStatus.APPROVED:
            attrs['approved_by'] = self.context['request'].user
            attrs['approved_at'] = timezone.now()
        
        return attrs


class DocumentApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[DocumentStatus.APPROVED, DocumentStatus.REJECTED])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['status'] == DocumentStatus.REJECTED and not attrs.get('rejection_reason'):
            raise ValidationError({"rejection_reason": "Rejection reason is required when rejecting a document."})
        return attrs
