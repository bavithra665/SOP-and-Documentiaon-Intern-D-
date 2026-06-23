import PyPDF2
from docx import Document
import logging

logger = logging.getLogger(__name__)


class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(file_path):
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_docx(file_path):
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")
    
    @staticmethod
    def extract_text(file_path, file_type):
        """Extract text based on file type"""
        if file_type == 'pdf':
            return DocumentProcessor.extract_text_from_pdf(file_path)
        elif file_type == 'docx':
            return DocumentProcessor.extract_text_from_docx(file_path)
        else:
            raise Exception(f"Unsupported file type: {file_type}")


# Singleton instance
document_processor = DocumentProcessor()
