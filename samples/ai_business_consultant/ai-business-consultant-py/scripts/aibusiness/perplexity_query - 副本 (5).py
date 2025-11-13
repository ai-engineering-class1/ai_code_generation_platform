from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import logging
import re
import demjson3
# 在文件顶部添加
from dotenv import load_dotenv
load_dotenv()  # 加载.env文件
import os
from models.report import Report
from sqlmodel import create_engine,select, Session
from sqlalchemy.exc import SQLAlchemyError
import redis

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 添加连接池健康检查
    echo=True  # 开启SQL日志用于调试
)

# Redis配置
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

# 创建Redis客户端
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    password=REDIS_PASSWORD,
    decode_responses=True
)

app = FastAPI()

# Define the categories for the business report
template_sections = [
    "执行摘要",
    "公司概述",
    "行业与市场分析",
    "业务运营",
    "营销与销售策略",
    "财务概述",
    "商业风险与挑战",
    "业务增长与扩展计划",
]

# Define a model for the request
class CompanyRequest(BaseModel):
    url_or_name: str

# Function to query Perplexity API for company information


# Function to query Perplexity API for company information
def query_perplexity(query):
    try:
        # Replace 'YOUR_API_KEY' with your actual Perplexity API key
        api_key = os.getenv('PERPLEXITY_KEY')
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "accept": "application/json",
            "content-type": "application/json"
        }
        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": "你是一个专业的行业分析师"},
                {"role": "user", "content": query}
            ],
            'max_tokens': 10000,
            'temperature': 0.7
        }
        response = requests.post(url, json=payload, headers=headers)
        logging.info(f"Used tokens: {response.json().get('usage', {}).get('total_tokens', 0)}")
        if response.status_code == 200:
            return response.json()
        else:
            logging.error(f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}. Response: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}")
    except Exception as e:
        logging.error(f"Error querying Perplexity API: {str(e)}")
        raise HTTPException(status_code=500, detail="Error querying Perplexity API")


def query_perplexity_sonar(query):
    try:
        # Replace 'YOUR_API_KEY' with your actual Perplexity API key
        api_key = os.getenv('PERPLEXITY_KEY')
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "accept": "application/json",
            "content-type": "application/json"
        }
        payload = {
            "model": "sonar",  # Use a supported model
            "messages": [
                {"role": "system", "content": "Provide detailed information about the company."},
                {"role": "user", "content": query}
            ],
            'temperature': 0.7
        }
        response = requests.post(url, json=payload, headers=headers)
        logging.info(f"Used tokens: {response.json().get('usage', {}).get('total_tokens', 0)}")
        if response.status_code == 200:
            return response.json()
        else:
            logging.error(f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}. Response: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}")
    except Exception as e:
        logging.error(f"Error querying Perplexity API: {str(e)}")
        raise HTTPException(status_code=500, detail="Error querying Perplexity API")


# Function to generate report sections using Perplexity API
def generate_report_section(section_name, query):
    try:
        response = query_perplexity(f"Generate a paragraph for the '{section_name}' section of a business report about {query}")
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating report section '{section_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating report section: {str(e)}")

def get_redis(session_id):
    try:
        # 根据session_id获取报告类型
        type_key = f"report:type:{session_id}"
        report_type = redis_client.get(type_key) or "normal"
        return report_type
    except Exception as e:
        logging.error(f"Redis查询失败 | SessionID: {session_id} | 错误: {str(e)}")
        return "normal"

def get_redis_qa(session_id):
    try:
        # 根据session_id获取报告类型
        type_key = f"report:qa:{session_id}"
        report = redis_client.get(type_key) or ""
        return report
    except Exception as e:
        logging.error(f"Redis查询失败 | SessionID: {session_id} | 错误: {str(e)}")
        return ""

def get_industry_content(session_id):
     report_type=get_redis(session_id)
     if report_type == "haifeng":
        logging.info(f"使用Redis缓存 | SessionID: {session_id}")
        return get_redis_qa(session_id)
     else:  
        try:
            # 使用Session上下文管理器
            with Session(engine) as session:
                # 构建查询语句
                stmt = select(Report.content).where(
                    Report.session_id == session_id,
                    Report.subtitle.in_([
                        '行业概述与趋势',
                        '市场规模与增长潜力',
                        '目标市场与客户细分',
                        '竞争格局与主要竞争对手',
                        '影响企业的法规与经济因素',
                        '技术与基础设施',
                        'SWOT 分析（优势、劣势、机会、威胁）'
                    ])
                )
                
                # 执行查询
                results = session.exec(stmt).all()
                
                if not results:
                    logging.warning(f"未找到行业分析内容 | SessionID: {session_id}")
                    raise ValueError("未找到相关行业分析数据")
                
                return '|'.join([content for content in results if content])

        except SQLAlchemyError as e:
            logging.error(f"数据库查询失败 | 错误: {str(e)}")
            raise HTTPException(status_code=500, detail="数据获取失败")

def industry_analysis(session_id):
    content = get_industry_content(session_id)
    more = '更多（查询互联网，结合能结合的所有资料信息，尽最大可能给出更细节的说明或者描述，务必500至800字，多写一点，不要只写一句话））'
    try:
        response = query_perplexity(f"""\
# Role: 行业分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明
6. 行业必须从给的文档里提取
7. 有双引号的地方，需要用单引号包裹，比如："abc" -> 'abc'
8. 这个json出现数字数据(年份除外)的地方，包括单位和百分号请加高亮处理，并包裹在span标签里，加上class abc-highlight，最后仍然返回json
9. 直接开始输出JSON，不要任何前导文字
## 模板示例
{{
  "报告概览": {{
    "行业": "",
    "生成日期": ""
  }},
  "行业趋势分析": {{
    "产业热点 & 新兴技术": {{
      "当前市场规模": "",
      "年复合增长率": "",
      "技术热点": "",
      "产业热点 & 新兴技术更多": ""
    }},
    "政策影响分析": {{
      "关键政策": "",
      "趋势": "",
      "政策影响分析更多": ""
    }},
    "竞争格局分析": {{
      "市场集中度": "",
      "主要参与者": "",
      "竞争格局分析更多": ""
    }}
  }},
  "市场机会评估": {{
    "赛道推荐": {{
      "赛道推荐": "",
      "赛道推荐更多": ""
    }},
    "传统行业结合新赛道的可行性评估": {{
      "传统行业结合新赛道的可行性评估": "",
      "传统行业结合新赛道的可行性评估更多": ""
    }},
    "SWOT 分析": {{
      "优势（Strengths）": [""],
      "劣势（Weaknesses）": [""],
      "机会（Opportunities）": [""],
      "威胁（Threats）": [""]
    }}
  }},
  "数据支持": {{
    "过去数据 vs. 未来发展预测": {{
      "市场规模": "",
      "增长率": "",
      "企业数量": "",
      "融资金额": "",
      "总结来说": "",
      "过去数据 vs. 未来发展预测更多": ""
    }},
    "产业链上下游数据": {{
      "上游基础设施层": "",
      "中游核心技术层": "",
      "下游应用层": "",
      "产业链上下游数据更多": ""
    }}
  }},
  "投资建议与战略": {{
    "短期投资建议 (1-2年)": "",
    "投资建议与战略更多": ""
  }},
  "风险提示": {{
    "风险提示",
    "风险提示更多": ""
  }},
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.报告概览
包括行业、生成日期（当前日期）
2.行业趋势分析
包括产业热点 & 新兴技术（包括当前市场规模、年复合增长率、技术热点、{more}）、政策影响分析（包括关键政策、趋势、{more}）、竞争格局分析（包括市场集中度、主要参与者、{more}）
3.市场机会评估
包括赛道推荐（推荐高增长赛道、{more}）、传统行业结合新赛道的可行性评估（以及{more}）、SWOT 分析（包括优势（Strengths）、劣势（Weaknesses）、机会（Opportunities）、威胁（Threats），每个写出5条）
4.数据支持
包括过去数据 vs. 未来发展预测（包括最近5年市场规模、增长率、企业数量、融资金额、总结来说、{more}）、产业链上下游数据（包括上游 - 基础设施层、中游 - 核心技术层、下游 - 应用层、{more}）
5.投资建议与战略
给出短期投资建议 (1-2年)，以及{more}
6.风险提示
给出风险提示，以及{more}
请根据上述要求返回我需要的数据，不需要加数字引用，json格式。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating industry analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating industry analysis: {str(e)}")


def generate_email_template_section():
    query = "我想要给客户发邮件，请帮我生成80-150字的邮件模板，要求包含客户名称{customer_name}, 行业{industry}，提及客户行业，表达合作意愿，不需要写己方姓名职位联系方式等，只需要正文，不需要主题和过多解释"
    try:
        response = query_perplexity_sonar(f"{query}")
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating email template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating email template: {str(e)}")

def generate_3_email_template_section(content):
    try:
        response = query_perplexity(f"""\
你是一个专业的邮件优化助手，请按以下规则润色文本：
1. 保持原意不变，仅优化表达
2. 调整语气为：[商务正式/礼貌中性/简洁口语化] 
3. 优化结构：分点说明复杂内容，确保逻辑连贯
4. 替换不当用词，修正语法错误
5. 添加标准邮件要素：适当问候语、结束语
6. 控制字数在[原文字数±15%]范围内

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
    "专业正式版": "",
    "精简高效版": "",
    "友好温和版": ""
}}

原始邮件内容：
{content}

优化后的版本：
```

📝 润色规则体系：

1. 语气适配规则
   ✅ 专业正式：使用"敬请查收"、"顺祝商祺"等专业用语
   ✅ 精简高效：转换为"方便的话请回复"、"有问题随时联系"等日常用语
   ✅ 友好温和：采用"请核对附件"、"感谢理解"等通用表达

2. 结构优化标准
   • 三段式结构：问候(1行)→正文(3-5行)→结束语(1行)
   • 复杂内容分点：
     - 超过3个需求时自动编号
     - 技术参数用表格呈现建议格式
   • 重点前置：核心需求放在段落开头

3. 用词替换库示例
   | 原始词 | 优化建议 |
   |---|---|
   | "快点回复" → "烦请尽快回复" |
   | "搞错了" → "存在数据偏差" |
   | "不行" → "目前暂无法满足" |

4. 智能优化功能
   • 自动追加标准结尾：如"此致敬礼"+"姓名+职位+联系方式"
   • 附件提醒：检测到"附件"关键词时，自动添加"请查收附件中的[文件类型]"
   • 敏感信息检测：自动模糊处理疑似电话号码/身份证号

5. 多版本输出建议
   每次生成3个优化方案：
   A. 专业正式版 
   B. 精简高效版
   C. 友好温和版
请分别输出专业正式版、精简高效版、友好温和版，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating industry analysis '{content}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating industry analysis: {str(e)}")


def generate_email_section(json_data):
    prior_email=json_data['prior_email']
    user_prompt=json_data['user_prompt']
    customer_business_info=json_data['customer_business_info']
    customer_personal_info=json_data['customer_personal_info']
    sender_name=json_data['sender_name']
    sender_company_info=json_data['sender_company_info']
    try:
        response = query_perplexity(f"""\
            help me write an email to response to customer email or the customer form submission as in the following 
"1. prior email text or form in email attached here.{prior_email}", the main point to convey to the customer should include the following points 
"2. Customer enter prompt go here. {user_prompt}", here are some general information about customer 
"3. customer business info go here. {customer_business_info}, here is something about the email recipient here 
"4. 如果有，个人信息这里. {customer_personal_info}"，the email should be as a sale profession and formal as possible. Try to address customer email's or form's query as clearly as possible. If the customer need is unclear, you should ask questions to clearify, also include the sender information at the end of the email 
"5. sender name etc. go here. {sender_name}". My company information is here 
"6. company info such as company name, website url, relavent products. {sender_company_info}", the email should be in the language of the original email or form query, if the language is not English, please also return a copy of English translation of the response email, please also include a translate of the email in Chinese. 请务必包含原来的语言（单独一个字段，language值是origin），英文，中文，只要最后的json, 不要多余解释。Here should be the email return JSON format. 
{{"reponseEmail":[{{"language":"en","emailcontent":"email go here", "subject":"", "to":"", "cc":""}}, ... other languages}} , the first response should be the original language.
"7.the original language的识别，请根据prior_email的语言来，如果prior_email为空，则用user_prompt的语言，禁止根据其他字段的语言来识别
"8.请仔细阅读分析，给出subject，to，cc，如果没有cc则为空字符串，不要用null，subject不要放到emailcontent里, cc里的数据要全，不要有遗漏
"9.请确保务必包含原来的语言（单独一个字段，language值是origin），英文，中文，只要最后的json, 不要多余解释。
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：
## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明
5. 直接开始输出JSON，不要任何前导文字
6. 任何情况下都禁止额外的说明，比如根据您的需求或根据您提供的信息之类的说明，只需要返回json，不要有```json和```结尾
""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating industry analysis '{sender_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating industry analysis: {str(e)}")


# API endpoint to generate business report
@app.post("/generate-business-report")
def generate_business_report(json_data):
    company_info = {}
    website = json_data['url_or_name']
    for section in template_sections:
        company_info[section] = generate_report_section(section, website)
    return {"company_info": company_info}

@app.post("/generate-email-template")
def generate_email_template():
    return {"email_template": generate_email_template_section()}


@app.post("/generate-email")
def generate_email(json_data):
    data = generate_email_section(json_data)
    # reconstructed_data = json.loads(data)
    return {"data": data}

@app.post("/generate-3-email-template")
def generate_3_email_template(json_data):
    email_template_info = json_data['content']
    return {"email_template": generate_3_email_template_section(email_template_info)}

@app.post("/generate-industry-analysis")
def generate_industry_analysis(json_data):
    company_info = {}
    session_id = json_data['session_id']
    industry_analysis_info = industry_analysis(session_id)
    try:
        industry_analysis_info = industry_analysis(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
