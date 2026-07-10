import os
import re
import sys
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def set_font(run, font_name='楷体_GB2312', size=12, bold=False, color='000000'):
    """Set font styles for a TextRun."""
    run.font.name = 'Times New Roman'
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.rFonts
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:eastAsia'), font_name)
    if size is not None:
        try:
            run.font.size = Pt(float(size))
        except (TypeError, ValueError):
            pass
    run.font.bold = bold
    if isinstance(color, str) and re.fullmatch(r'[0-9A-Fa-f]{6}', color):
        run.font.color.rgb = RGBColor.from_string(color)

def is_horizontal_rule(raw_line):
    """Return True for Markdown or template separator lines."""
    return bool(re.fullmatch(r'(?:-{3,}|\*{3,}|_{3,}|━+)', raw_line))

def parse_list_item(raw_line):
    """Parse simple Markdown list items and return display prefix plus text."""
    unordered = re.match(r'^[-*+]\s+(.+)$', raw_line)
    if unordered:
        return '• ', unordered.group(1)

    ordered = re.match(r'^(\d+[.、])\s*(.+)$', raw_line)
    if ordered:
        return f"{ordered.group(1)} ", ordered.group(2)

    return None

def add_formatted_runs(paragraph, text, size=12):
    """Add runs with simple **bold** support."""
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            set_font(run, size=size, bold=True)
        else:
            run = paragraph.add_run(part)
            set_font(run, size=size)

def add_page_number(doc):
    """Add 'Page X of Y' to the footer."""
    footer = doc.sections[0].footer
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = p.add_run()
    set_font(run, size=10)
    run.text = "第 "
    
    # Current Page
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    p.add_run()._element.append(fldChar1)
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = "PAGE"
    p.add_run()._element.append(instrText)
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')
    p.add_run()._element.append(fldChar2)
    
    run = p.add_run()
    set_font(run, size=10)
    run.text = " 页 共 "
    
    # Total Pages
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'begin')
    p.add_run()._element.append(fldChar3)
    instrText2 = OxmlElement('w:instrText')
    instrText2.set(qn('xml:space'), 'preserve')
    instrText2.text = "NUMPAGES"
    p.add_run()._element.append(instrText2)
    fldChar4 = OxmlElement('w:fldChar')
    fldChar4.set(qn('w:fldCharType'), 'end')
    p.add_run()._element.append(fldChar4)
    
    run = p.add_run()
    set_font(run, size=10)
    run.text = " 页"

def generate_docx(markdown_text, output_path):
    doc = Document()
    
    # Set Margins
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    
    # Set default line spacing
    style = doc.styles['Normal']
    style.paragraph_format.line_spacing = 1.5
    
    lines = markdown_text.split('\n')
    is_title = True
    is_instruction = False

    for line in lines:
        raw_line = line.strip()
        if not raw_line or is_horizontal_rule(raw_line):
            continue
            
        # Title (First Heading or '一种')
        if is_title and (raw_line.startswith('# ') or raw_line.startswith('一种')):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(12)
            text = raw_line.replace('# ', '')
            run = p.add_run(text)
            set_font(run, size=14, bold=True)
            is_title = False
            continue

        # Main Section Headings (1, 2, 3...)
        if re.match(r'^[1-5]\s+', raw_line) and not '.' in raw_line.split()[0]:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(raw_line)
            set_font(run, size=12, bold=True)
            continue

        # Subheadings (2.1, 3.1...)
        if re.match(r'^[1-5]\.[0-9]', raw_line):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(raw_line)
            set_font(run, size=12, bold=True)
            continue

        # Info lines
        if any(x in raw_line for x in ['日期：', '撰写人', '电话', '邮箱']):
            p = doc.add_paragraph()
            run = p.add_run(raw_line)
            set_font(run, size=12)
            continue

        # Mermaid Code Block (Placeholder only, skip source code)
        if raw_line.startswith('```mermaid'):
            is_instruction = True
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run("[请在此处手动插入对应的流程图/原理图图片]")
            set_font(run, size=12, bold=True, color='0000FF')
            continue

        if is_instruction:
            if raw_line.startswith('```'):
                is_instruction = False
            continue

        list_item = parse_list_item(raw_line)
        if list_item:
            prefix, text = list_item
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Pt(24)
            p.paragraph_format.first_line_indent = Pt(-12)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(prefix)
            set_font(run, size=12)
            add_formatted_runs(p, text)
            continue

        # Normal paragraph with First Line Indent
        p = doc.add_paragraph()
        # 24 Pt is roughly 2 characters for 12pt font
        p.paragraph_format.first_line_indent = Pt(24)
        
        # Handle simple bold text **text**
        add_formatted_runs(p, raw_line)

    add_page_number(doc)
    doc.save(output_path)
    print(f"Success! Pure Python Word document saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        markdown_file = sys.argv[1]
        output_file = sys.argv[2]
        if os.path.exists(markdown_file):
            with open(markdown_file, 'r', encoding='utf-8') as f:
                generate_docx(f.read(), output_file)
        else:
            print(f"Error: File {markdown_file} not found.")
    else:
        print("Usage: python generate_docx.py <input.md> <output.docx>")
