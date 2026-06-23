from django.db import models
from django.core.validators import FileExtensionValidator
from apps.users.models import User


class DocumentStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING_APPROVAL = "pending_approval", "Pending Approval"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class DocumentCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Document Category'
        verbose_name_plural = 'Document Categories'

    def __str__(self):
        return self.name


class Document(models.Model):
    ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx']
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents'
    )
    document_file = models.FileField(
        upload_to='documents/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'pptx', 'xlsx'])]
    )
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=10)
    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.DRAFT
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_documents'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'

    def __str__(self):
        return self.title

    def get_file_extension(self):
        return self.file_name.split('.')[-1].lower() if '.' in self.file_name else ''
