# resume_parser.py
import PyPDF2
import docx
from io import BytesIO

class ResumeParser:
    @staticmethod
    def parse_resume(file_bytes: bytes, filename: str) -> str:
        try:
            filename = filename.lower()
            text = ""
            
            # PDF Handler
            if filename.endswith('.pdf'):
                try:
                    pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
                    for page in pdf_reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
                except Exception as e:
                    return "" # Return empty string on error
            
            # DOCX Handler
            elif filename.endswith('.docx'):
                try:
                    doc = docx.Document(BytesIO(file_bytes))
                    for para in doc.paragraphs:
                        text += para.text + "\n"
                except Exception as e:
                    return ""
            
            return text.strip()

        except Exception as e:
            return ""