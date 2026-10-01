import io
from typing import Tuple

try:
    import pypdf as pdf_module
except ImportError:
    try:
        import PyPDF2 as pdf_module
    except ImportError:
        pdf_module = None

try:
    import docx
except ImportError:
    docx = None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text from a PDF file using pypdf or PyPDF2."""
    if not pdf_module:
        raise RuntimeError("PDF processing library (pypdf/PyPDF2) is not installed.")

    stream = io.BytesIO(file_bytes)
    reader = pdf_module.PdfReader(stream)
    text_parts = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts raw text from a DOCX document using python-docx."""
    if not docx:
        raise RuntimeError("python-docx is not installed.")

    stream = io.BytesIO(file_bytes)
    doc = docx.Document(stream)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

    # Also extract any text from tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                cell_text = cell.text.strip()
                if cell_text and cell_text not in paragraphs:
                    paragraphs.append(cell_text)

    return "\n".join(paragraphs).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extracts raw text from a TXT file with multi-encoding fallback."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "ascii"]
    for enc in encodings:
        try:
            return file_bytes.decode(enc).strip()
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace").strip()


def extract_resume_text(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Determines file extension and extracts text safely.
    Returns (extracted_text, file_type).
    Raises ValueError on unsupported or unreadable files.
    """
    if not filename or "." not in filename:
        raise ValueError("Invalid file name. Extension is required.")

    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "pdf":
        text = extract_text_from_pdf(file_bytes)
        return text, "PDF"
    elif ext in ["docx", "doc"]:
        text = extract_text_from_docx(file_bytes)
        return text, "DOCX"
    elif ext in ["txt", "text"]:
        text = extract_text_from_txt(file_bytes)
        return text, "TXT"
    else:
        raise ValueError(f"Unsupported file format: '.{ext}'. Supported formats: PDF, DOCX, TXT.")
