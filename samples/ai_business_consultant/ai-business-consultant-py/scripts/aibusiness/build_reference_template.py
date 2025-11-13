from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.shared import Pt
from docx.oxml.shared import qn

def create_template():
    doc = Document()
    
    # 配置基础字体
    styles = doc.styles
    normal_style = styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'SimSun'
    normal_font._element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
    normal_font.size = Pt(12)

    # 清除所有列表层级编号（新增二级三级列表处理）
    list_styles = [
        'List Paragraph', 
        'List Bullet',  # 一级列表
        'List Bullet 2',  # 二级列表
        'List Bullet 3'   # 三级列表
    ]
    
    for style_name in list_styles:
        if style_name in styles:
            style = styles[style_name]
            # 移除自动编号
            if style.element.pPr.numPr is not None:
                style.element.pPr.remove(style.element.pPr.numPr)
            # 设置列表中文字体
            style.font.name = 'SimSun'
            style.font._element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')

    doc.save('custom_reference.docx')

if __name__ == '__main__':
    create_template()