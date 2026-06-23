from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import json
from .services.groq_client import groq_client
from .services.document_processor import document_processor
from apps.documents.models import Document
from apps.sops.models import SOP
from .serializers import (
    SOPGeneratorSerializer,
    DocumentSummarySerializer,
    SOPSimplifierSerializer,
    DocumentChatSerializer,
    SmartSearchSerializer
)


class AIViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def check_groq_configured(self):
        if not groq_client.is_configured():
            return Response(
                {'error': 'Groq API is not configured. Please set GROQ_API_KEY in environment variables.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return None
    
    @action(detail=False, methods=['post'])
    def generate_sop(self, request):
        """Generate SOP content from process name"""
        error_response = self.check_groq_configured()
        if error_response:
            return error_response
        
        serializer = SOPGeneratorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = groq_client.generate_sop(serializer.validated_data['process_name'])
            return Response({'result': json.loads(result)})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def summarize_document(self, request):
        """Summarize document content"""
        error_response = self.check_groq_configured()
        if error_response:
            return error_response
        
        serializer = DocumentSummarySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = Document.objects.get(id=serializer.validated_data['document_id'])
            file_path = document.document_file.path
            file_type = document.file_type
            
            # Extract text from document
            document_text = document_processor.extract_text(file_path, file_type)
            
            # Generate summary
            result = groq_client.summarize_document(document_text)
            return Response({'result': json.loads(result)})
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def simplify_sop(self, request):
        """Simplify complex SOP content"""
        error_response = self.check_groq_configured()
        if error_response:
            return error_response
        
        serializer = SOPSimplifierSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sop = SOP.objects.get(id=serializer.validated_data['sop_id'])
            
            # Build SOP content
            sop_content = f"""
            Title: {sop.title}
            Purpose: {sop.purpose}
            Scope: {sop.scope}
            Procedure Steps: {', '.join(sop.procedure_steps)}
            """
            
            # Simplify SOP
            result = groq_client.simplify_sop(sop_content)
            return Response({'result': json.loads(result)})
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
    
    @action(detail=False, methods=['post'])
    def document_chat(self, request):
        """Chat with documents"""
        error_response = self.check_groq_configured()
        if error_response:
            return error_response
        
        serializer = DocumentChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = Document.objects.get(id=serializer.validated_data['document_id'])
            file_path = document.document_file.path
            file_type = document.file_type
            
            # Extract text from document
            document_text = document_processor.extract_text(file_path, file_type)
            
            # Chat with document
            result = groq_client.chat_with_documents(
                serializer.validated_data['question'],
                document_text
            )
            return Response({'answer': result})
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def smart_search(self, request):
        """Natural language search across documents and SOPs"""
        error_response = self.check_groq_configured()
        if error_response:
            return error_response
        
        serializer = SmartSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = request.user
            
            # Get documents and SOPs based on user permissions
            documents = Document.objects.all()
            sops = SOP.objects.all()
            
            if user.role != 'admin':
                from django.db import models as django_models
                documents = documents.filter(
                    django_models.Q(department=user.department) | django_models.Q(created_by=user)
                ).distinct()
                sops = sops.filter(
                    django_models.Q(department=user.department) | django_models.Q(created_by=user)
                ).distinct()
            
            # Build search context
            search_context = "DOCUMENTS:\n"
            for doc in documents[:10]:  # Limit to 10 documents
                search_context += f"- {doc.title}: {doc.description}\n"
            
            search_context += "\nSOPs:\n"
            for sop in sops[:10]:  # Limit to 10 SOPs
                search_context += f"- {sop.title}: {sop.purpose}\n"
            
            # Perform smart search
            result = groq_client.smart_search(
                serializer.validated_data['query'],
                search_context
            )
            return Response({'result': json.loads(result)})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
