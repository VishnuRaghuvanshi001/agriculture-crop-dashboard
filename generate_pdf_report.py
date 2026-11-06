"""
generate_pdf_report.py
======================
Generates a formal, publication-grade academic project report PDF
from PROJECT_REPORT.md following the exact formatting specification:
- Font: Times-Roman (Times New Roman equivalent)
- Body Size: 12 pt
- Line Spacing: 1.5 (leading = 18 pt)
- Standard Academic Margins: 0.75 in (54 pt)
- Numbered pages with Running Header and Footer (Page X of Y)
- Professional Cover Page & Table of Contents
- Formal Chapter Page Breaks, Structured Tables, and Code Panels
"""

import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# ==============================================================================
# NUMBERED CANVAS FOR DYNAMIC "PAGE X OF Y" AND RUNNING HEADERS
# ==============================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header and footer on the cover page
            return

        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        header_text = "AGRI-INTELLIGENCE // National Agricultural Command Center Report"
        self.drawString(54, A4[1] - 40, header_text)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, A4[1] - 45, A4[0] - 54, A4[1] - 45)

        # Running Footer
        footer_left = "Department of Computer Science & Engineering"
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 38, footer_left)
        self.drawRightString(A4[0] - 54, 38, page_str)
        self.line(54, 50, A4[0] - 54, 50)

        self.restoreState()

# ==============================================================================
# MAIN REPORT BUILDER
# ==============================================================================
def build_pdf_report():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, "PROJECT_REPORT.md")
    pdf_path = os.path.join(base_dir, "PROJECT_REPORT.pdf")

    print(f"Reading content from {md_path}...")
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Document Setup (A4 with 0.75 in / 54 pt margins)
    margin = 54
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin + 10,
        bottomMargin=margin + 10
    )

    printable_width = A4[0] - (2 * margin)

    # Typography Styles conforming strictly to the rubric
    styles = getSampleStyleSheet()

    # Body: Times-Roman, 12 pt, 1.5 line spacing (18 pt leading)
    body_style = ParagraphStyle(
        'AcademicBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
        alignment=4  # Justified
    )

    body_bold = ParagraphStyle(
        'AcademicBodyBold',
        parent=body_style,
        fontName='Times-Bold'
    )

    bullet_style = ParagraphStyle(
        'AcademicBullet',
        parent=body_style,
        leftIndent=20,
        firstLineIndent=-12,
        spaceAfter=6
    )

    # Chapter Title (H1): Times-Bold, 18 pt, leading 24
    h1_style = ParagraphStyle(
        'ChapterHeading',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=18,
        leading=24,
        textColor=colors.HexColor("#0A2540"),
        spaceBefore=14,
        spaceAfter=14,
        keepWithNext=True
    )

    # Section (H2): Times-Bold, 14 pt, leading 20
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=14,
        leading=20,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )

    # Subsection (H3): Times-Bold, 12 pt, leading 17
    h3_style = ParagraphStyle(
        'SubsectionHeading',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=12,
        leading=17,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    # Code Snippet block
    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#0F172A")
    )

    # Table cell styles
    th_style = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.white,
        alignment=1  # Center
    )

    td_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # ==========================================================================
    # 1. FORMAL COVER / TITLE PAGE
    # ==========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("A PROJECT REPORT ON", ParagraphStyle('CoverPre', fontName='Times-Roman', fontSize=13, leading=18, alignment=1, textColor=colors.HexColor("#475569"))))
    story.append(Spacer(1, 15))
    story.append(Paragraph("AGRI-INTELLIGENCE: NATIONAL AGRICULTURAL & CROP PRODUCTION INTELLIGENCE COMMAND CENTER FOR INDIA (1997–2020)", ParagraphStyle('CoverTitle', fontName='Times-Bold', fontSize=22, leading=28, alignment=1, textColor=colors.HexColor("#0A2540"))))
    story.append(Spacer(1, 15))
    story.append(Paragraph("A Comprehensive Visual Analytics & Agronomic Decision-Support System Integrating Historical Production Big-Data, ICAR-NBSS&LUP Soil Taxonomies, and Real-Time Satellite Telemetry", ParagraphStyle('CoverSub', fontName='Times-Italic', fontSize=12, leading=17, alignment=1, textColor=colors.HexColor("#334155"))))
    
    story.append(Spacer(1, 60))
    story.append(HRFlowable(width="80%", thickness=1.5, color=colors.HexColor("#0A2540"), spaceBefore=10, spaceAfter=25))
    
    cover_meta_text = """
    <b>Submitted in partial fulfillment of the requirements for the degree of</b><br/>
    <b>BACHELOR OF TECHNOLOGY / MASTER OF SCIENCE</b><br/>
    in<br/>
    <b>COMPUTER SCIENCE AND ENGINEERING / INFORMATION TECHNOLOGY</b>
    """
    story.append(Paragraph(cover_meta_text, ParagraphStyle('CoverDegree', fontName='Times-Roman', fontSize=11, leading=16, alignment=1, textColor=colors.HexColor("#1E293B"))))

    story.append(Spacer(1, 80))
    
    info_table_data = [
        [
            Paragraph("<b>Submitted By:</b><br/>Student Project Team<br/>Roll No / Reg: 2026-CS-AGRI<br/>GitHub: VishnuRaghuvanshi001", ParagraphStyle('InfoL', fontName='Times-Roman', fontSize=10.5, leading=15)),
            Paragraph("<b>Faculty Supervisor / Guide:</b><br/>Department Project Evaluation Board<br/>Academic Session: 2026<br/>Status: Verified Submission", ParagraphStyle('InfoR', fontName='Times-Roman', fontSize=10.5, leading=15))
        ]
    ]
    t_info = Table(info_table_data, colWidths=[printable_width*0.5, printable_width*0.5])
    t_info.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_info)

    story.append(PageBreak())

    # ==========================================================================
    # 2. TABLE OF CONTENTS
    # ==========================================================================
    story.append(Paragraph("TABLE OF CONTENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A2540"), spaceBefore=4, spaceAfter=14))

    toc_items = [
        ("Executive Summary", "3"),
        ("Chapter 1: Introduction", "4"),
        ("    1.1 The Role of Dashboards in Visual Analytics and Data Science", "4"),
        ("    1.2 Significance of Dashboards in Agricultural Decision-Making", "4"),
        ("    1.3 Project Context, Background, and Problem Scope", "5"),
        ("Chapter 2: Objectives", "6"),
        ("    2.1 Primary Engineering & Technological Objectives", "6"),
        ("    2.2 Analytical & Agronomic Domain Objectives", "6"),
        ("Chapter 3: Tools and Technologies", "7"),
        ("    3.1 Technology Stack Matrix", "7"),
        ("    3.2 Tool Choice Justification vs. Alternatives", "8"),
        ("Chapter 4: Data Selection and Dataset Understanding", "9"),
        ("    4.1 Dataset Profile & Provenance", "9"),
        ("    4.2 Data Schema and Field Attributes", "9"),
        ("    4.3 Data Pre-Processing & Engineering Pipeline", "10"),
        ("Chapter 5: Project Proposal and Methodology", "11"),
        ("    5.1 Problem Statement and Operational Scenario", "11"),
        ("    5.2 System Architecture Overview", "11"),
        ("    5.3 User Experience & Design Philosophy", "12"),
        ("Chapter 6: Dashboard Development Process", "13"),
        ("    6.1 Step 1: Data Ingestion and Pipeline Implementation", "13"),
        ("    6.2 Step 2: D3-Geo Spatial Mapping & Timeline Implementation", "14"),
        ("    6.3 Step 3: Algorithmic Feasibility Engine Implementation", "14"),
        ("    6.4 Step 4: Verification and Automated Testing", "15"),
        ("Chapter 7: Design and Features of the Dashboard", "16"),
        ("    7.1 Visual Layout and Architectural Components", "16"),
        ("    7.2 Instructions for Report Screenshots & Annotations", "17"),
        ("Chapter 8: Results and Discussion", "18"),
        ("    8.1 Agronomic Insights & Findings", "18"),
        ("    8.2 Technical Evaluation & Performance", "18"),
        ("    8.3 Engineering Challenges & Solutions", "19"),
        ("Conclusion and Future Enhancements", "20"),
        ("References", "21"),
        ("Appendices (Appendix A & B)", "22")
    ]

    toc_table_data = []
    for title, pg in toc_items:
        is_ch = title.startswith("Chapter") or title in ["Executive Summary", "Conclusion and Future Enhancements", "References", "Appendices (Appendix A & B)"]
        t_style = ParagraphStyle(
            'TOCTitle',
            fontName='Times-Bold' if is_ch else 'Times-Roman',
            fontSize=10.5,
            leading=14.5,
            textColor=colors.HexColor("#0A2540") if is_ch else colors.HexColor("#1E293B")
        )
        p_style = ParagraphStyle('TOCPage', fontName='Times-Bold' if is_ch else 'Times-Roman', fontSize=10.5, leading=14.5, alignment=2)
        toc_table_data.append([Paragraph(title, t_style), Paragraph(pg, p_style)])

    t_toc = Table(toc_table_data, colWidths=[printable_width * 0.88, printable_width * 0.12])
    t_toc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # ==========================================================================
    # 3. PARSING CHAPTER CONTENT FROM PROJECT_REPORT.MD
    # ==========================================================================
    # Split text into sections by headers
    raw_lines = md_text.splitlines()

    i = 0
    in_code_block = False
    code_buffer = []

    in_table = False
    table_buffer = []

    def clean_text(t):
        t = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', t)
        t = re.sub(r'\*(.*?)\*', r'<i>\1</i>', t)
        t = re.sub(r'\$(.*?)\$', r'<i>\1</i>', t)
        t = t.replace('`', '')
        return t

    while i < len(raw_lines):
        line = raw_lines[i]
        trimmed = line.strip()

        # Handle Code Blocks
        if trimmed.startswith("```"):
            if in_code_block:
                in_code_block = False
                code_content = "<br/>".join(code_buffer)
                code_table = Table([[Paragraph(code_content, code_style)]], colWidths=[printable_width])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
                    ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#CBD5E1")),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ]))
                story.append(Spacer(1, 4))
                story.append(code_table)
                story.append(Spacer(1, 6))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            # Escape HTML characters in code
            safe_code = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(' ', '&nbsp;')
            code_buffer.append(safe_code)
            i += 1
            continue

        # Handle Tables
        if trimmed.startswith("|") and trimmed.endswith("|"):
            if not in_table:
                in_table = True
                table_buffer = []
            table_buffer.append(trimmed)
            i += 1
            continue
        elif in_table:
            # Render accumulated table
            in_table = False
            # Parse table rows
            parsed_rows = []
            for tr_idx, tr_str in enumerate(table_buffer):
                if tr_idx == 1 and "---" in tr_str:
                    continue # Skip separator
                cols = [c.strip() for c in tr_str.split("|")[1:-1]]
                row_cells = []
                for c in cols:
                    c_clean = clean_text(c)
                    if tr_idx == 0:
                        row_cells.append(Paragraph(f"<b>{c_clean}</b>", th_style))
                    else:
                        row_cells.append(Paragraph(c_clean, td_style))
                parsed_rows.append(row_cells)

            if parsed_rows:
                num_cols = len(parsed_rows[0])
                col_w = printable_width / max(num_cols, 1)
                
                # Custom column widths for specific tables
                if num_cols == 4:
                    col_widths = [printable_width * 0.22, printable_width * 0.22, printable_width * 0.16, printable_width * 0.40]
                elif num_cols == 3:
                    col_widths = [printable_width * 0.28, printable_width * 0.32, printable_width * 0.40]
                else:
                    col_widths = [col_w] * num_cols

                t_elem = Table(parsed_rows, colWidths=col_widths)
                t_elem.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A2540")),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ]))
                story.append(Spacer(1, 4))
                story.append(t_elem)
                story.append(Spacer(1, 8))
            table_buffer = []

        # Skip metadata header in markdown since we made a cover page
        if trimmed.startswith("# PROJECT REPORT") or trimmed.startswith("**Title:**") or trimmed.startswith("**Document Standard:**") or trimmed.startswith("**Authors:**") or trimmed.startswith("**Institution:**"):
            i += 1
            continue

        if trimmed == "---":
            i += 1
            continue

        # Major Chapter Headings (Page Breaks before chapters)
        if trimmed.startswith("# Chapter") or trimmed.startswith("# Conclusion") or trimmed.startswith("# References") or trimmed.startswith("# Appendices") or trimmed.startswith("## Executive Summary"):
            ch_title = trimmed.lstrip("#").strip()
            story.append(PageBreak())
            story.append(Paragraph(ch_title.upper(), h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0A2540"), spaceBefore=2, spaceAfter=12))
            i += 1
            continue

        # Section Headings (H2)
        if trimmed.startswith("### "):
            sec_title = clean_text(trimmed.lstrip("#").strip())
            story.append(Paragraph(sec_title, h2_style))
            i += 1
            continue

        # Subsection Headings (H3)
        if trimmed.startswith("#### "):
            subsec_title = clean_text(trimmed.lstrip("#").strip())
            story.append(Paragraph(subsec_title, h3_style))
            i += 1
            continue

        # Bullet points
        if trimmed.startswith("* ") or trimmed.startswith("- "):
            b_text = clean_text(trimmed[2:].strip())
            story.append(Paragraph(f"•&nbsp;&nbsp;{b_text}", bullet_style))
            i += 1
            continue

        # Numbered lists (e.g. "1. ")
        match_num = re.match(r'^(\d+)\.\s+(.*)$', trimmed)
        if match_num:
            n_num = match_num.group(1)
            n_text = clean_text(match_num.group(2).strip())
            story.append(Paragraph(f"<b>{n_num}.</b>&nbsp;&nbsp;{n_text}", bullet_style))
            i += 1
            continue

        # Standard Body Paragraph
        if trimmed:
            p_text = clean_text(trimmed)
            story.append(Paragraph(p_text, body_style))

        i += 1

    # Flush any remaining table
    if in_table and table_buffer:
        # Same table builder
        parsed_rows = []
        for tr_idx, tr_str in enumerate(table_buffer):
            if tr_idx == 1 and "---" in tr_str:
                continue
            cols = [c.strip() for c in tr_str.split("|")[1:-1]]
            row_cells = []
            for c in cols:
                c_clean = clean_text(c)
                if tr_idx == 0:
                    row_cells.append(Paragraph(f"<b>{c_clean}</b>", th_style))
                else:
                    row_cells.append(Paragraph(c_clean, td_style))
            parsed_rows.append(row_cells)

        if parsed_rows:
            num_cols = len(parsed_rows[0])
            col_w = printable_width / max(num_cols, 1)
            t_elem = Table(parsed_rows, colWidths=[col_w] * num_cols)
            t_elem.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A2540")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t_elem)

    print("Compiling PDF with NumberedCanvas...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {pdf_path} ({os.path.getsize(pdf_path) / 1024:.1f} KB)")

if __name__ == "__main__":
    build_pdf_report()
