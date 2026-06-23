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


class SOPCompliance(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sop_compliances'
    )
    sop = models.ForeignKey(
        SOP,
        on_delete=models.CASCADE,
        related_name='compliances'
    )
    read_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'sop']
        ordering = ['-created_at']
        verbose_name = 'SOP Compliance'
        verbose_name_plural = 'SOP Compliances'

    def __str__(self):
        return f"{self.user.username} - {self.sop.title}"

    def mark_as_read(self):
        if not self.read_at:
            self.read_at = timezone.now()
            self.save()

    def acknowledge(self):
        self.acknowledged = True
        self.acknowledged_at = timezone.now()
        if not self.read_at:
            self.read_at = timezone.now()
        self.save()


class Quiz(models.Model):
    sop = models.ForeignKey(
        SOP,
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    title = models.CharField(max_length=255)
    questions = models.JSONField(default=list)  # List of {question, options, correct_answer}
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_quizzes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return f"{self.title} - {self.sop.title}"


class QuizResult(models.Model):
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='results'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quiz_results'
    )
    score = models.IntegerField()
    total_questions = models.IntegerField()
    percentage = models.FloatField()
    answers = models.JSONField(default=list)  # User's answers
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']
        verbose_name = 'Quiz Result'
        verbose_name_plural = 'Quiz Results'

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} ({self.percentage}%)"
