from groq import Groq
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class GroqClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY not configured. AI features will be disabled.")
        
        self.client = Groq(api_key=self.api_key) if self.api_key else None
    
    def is_configured(self):
        return self.client is not None
    
    def generate_sop(self, process_name):
        """Generate SOP content from process name"""
        if not self.is_configured():
            raise Exception("Groq API is not configured")
        
        prompt = f"""Generate a comprehensive Standard Operating Procedure (SOP) for the following process: {process_name}

Please provide the response in JSON format with the following structure:
{{
    "purpose": "Clear statement of why this SOP exists",
    "scope": "What this SOP covers and what it doesn't",
    "responsibilities": "Who is responsible for what",
    "procedure_steps": ["Step 1", "Step 2", "Step 3", ...]
}}

Make the SOP professional, detailed, and actionable."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in creating Standard Operating Procedures. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating SOP: {str(e)}")
            raise Exception(f"Failed to generate SOP: {str(e)}")
    
    def summarize_document(self, document_text):
        """Summarize document content"""
        if not self.is_configured():
            raise Exception("Groq API is not configured")
        
        # Truncate if too long
        max_length = 8000
        if len(document_text) > max_length:
            document_text = document_text[:max_length] + "..."
        
        prompt = f"""Analyze the following document and provide a comprehensive summary:

Document Content:
{document_text}

Please provide the response in JSON format with the following structure:
{{
    "summary": "A concise summary of the document (2-3 sentences)",
    "key_points": ["Key point 1", "Key point 2", ...],
    "important_actions": ["Action 1", "Action 2", ...]
}}

Focus on the most important information and actionable items."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert document analyzer. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error summarizing document: {str(e)}")
            raise Exception(f"Failed to summarize document: {str(e)}")
    
    def simplify_sop(self, sop_content):
        """Simplify complex SOP content"""
        if not self.is_configured():
            raise Exception("Groq API is not configured")
        
        prompt = f"""Simplify the following Standard Operating Procedure to make it more accessible and easier to understand:

Original SOP:
{sop_content}

Please provide the response in JSON format with the following structure:
{{
    "simplified_purpose": "Simplified purpose statement",
    "simplified_scope": "Simplified scope",
    "simplified_steps": ["Simplified step 1", "Simplified step 2", ...]
}}

Use plain language, avoid jargon, and make it easy for anyone to follow."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at simplifying complex procedures. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error simplifying SOP: {str(e)}")
            raise Exception(f"Failed to simplify SOP: {str(e)}")
    
    def chat_with_documents(self, question, document_context):
        """Chat with documents"""
        if not self.is_configured():
            raise Exception("Groq API is not configured")
        
        prompt = f"""Answer the following question based on the provided document context:

Question: {question}

Document Context:
{document_context}

Provide a helpful and accurate answer based only on the document context. If the answer is not in the context, say so."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on provided document context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error in document chat: {str(e)}")
            raise Exception(f"Failed to process chat: {str(e)}")
    
    def smart_search(self, query, search_context):
        """Natural language search across documents and SOPs"""
        if not self.is_configured():
            raise Exception("Groq API is not configured")
        
        prompt = f"""Analyze the following search query and provide relevant results from the context:

Search Query: {query}

Search Context (documents and SOPs):
{search_context}

Please provide the response in JSON format with the following structure:
{{
    "understanding": "Brief understanding of what the user is looking for",
    "relevant_results": [
        {{
            "type": "document" or "sop",
            "title": "Title",
            "relevance_score": 0.95,
            "reason": "Why this is relevant"
        }}
    ],
    "suggested_queries": ["Suggested query 1", "Suggested query 2"]
}}

Rank results by relevance and explain why each result matches the query."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an intelligent search assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error in smart search: {str(e)}")
            raise Exception(f"Failed to perform smart search: {str(e)}")


# Singleton instance
groq_client = GroqClient()
