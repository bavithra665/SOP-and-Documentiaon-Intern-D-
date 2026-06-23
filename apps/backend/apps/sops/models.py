from django.db import models
from django.core.validators import MinLengthValidator
from django.utils import timezone
from apps.users.models import User


class SOPStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    UNDER_REVIEW = "under_review", "Under Review"
    APPROVED = "approved", "Approved"
    PUBLISHED = "published", "Published"
    REJECTED = "rejected", "Rejected"


class SOP(models.Model):
    title = models.CharField(max_length=255, validators=[MinLengthValidator(3)])
    purpose = models.TextField(validators=[MinLengthValidator(10)])
    scope = models.TextField(validators=[MinLengthValidator(10)])
    procedure_steps = models.JSONField(default=list)
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sops'
    )
    status = models.CharField(
        max_length=20,
        choices=SOPStatus.choices,
        default=SOPStatus.DRAFT
    )
    version = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sops'
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_sops'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comments = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_sops'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'SOP'
        verbose_name_plural = 'SOPs'

    def __str__(self):
        return f"{self.title} (v{self.version})"

    def submit_for_review(self):
        if self.status == SOPStatus.DRAFT:
            self.status = SOPStatus.UNDER_REVIEW
            self.save()

    def review(self, reviewed_by, approved, comments=None):
        if self.status == SOPStatus.UNDER_REVIEW:
            self.reviewed_by = reviewed_by
            self.reviewed_at = timezone.now()
            self.review_comments = comments or ''
            
            if approved:
                self.status = SOPStatus.APPROVED
            else:
                self.status = SOPStatus.REJECTED
                self.rejection_reason = comments or ''
            
            self.save()

    def approve(self, approved_by):
        if self.status == SOPStatus.APPROVED:
            self.approved_by = approved_by
            self.approved_at = timezone.now()
            self.status = SOPStatus.PUBLISHED
            self.published_at = timezone.now()
            self.version += 1
            self.save()

    def publish(self):
        if self.status == SOPStatus.APPROVED:
            self.status = SOPStatus.PUBLISHED
            self.published_at = timezone.now()
            self.save()
