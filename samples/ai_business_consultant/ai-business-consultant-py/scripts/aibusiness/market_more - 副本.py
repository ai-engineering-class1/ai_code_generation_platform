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

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 添加连接池健康检查
    echo=True  # 开启SQL日志用于调试
)

app = FastAPI()

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
            "model": "sonar-pro",  # Use a supported model
            #"model": "sonar-reasoning-pro",
            "messages": [
                {"role": "system", "content": "你是一个专业的市场分析师"},
                {"role": "user", "content": query}
            ],
            'max_tokens': 8000,
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

def get_content(session_id):
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
                   '市场定位与品牌策略',
                   '客户获取渠道',
                   '定价策略',
                   '促销与广告策略',
                   '销售渠道与客户留存策略',
                   'SWOT 分析（优势、劣势、机会、威胁）',
                   '短期与长期增长战略',
                   '市场扩展与多元化发展'
                ])
            )
            
            # 执行查询
            results = session.exec(stmt).all()
            
            if not results:
                logging.warning(f"未找到市场分析内容 | SessionID: {session_id}")
                raise ValueError("未找到相关市场分析数据")
            
            return '|'.join([content for content in results if content])

    except SQLAlchemyError as e:
        logging.error(f"数据库查询失败 | 错误: {str(e)}")
        raise HTTPException(status_code=500, detail="数据获取失败")

def get_query_str0(content, template):
  return f"""\
# Role: 策略建议生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "市场分析": {{
    "市场潜力": "",
    "市场特点": "",
    "市场风险": ""
  }},
  "产品服务分析": {{
    "核心产品": [
      "",
    ],
    "竞争力":[
      "",
    ],
    "优势": [
      "",
    ],
    "劣势": [
       "",
    ],
  }},
  "竞争对手分析": {{
    "主要竞争对手": [
      "",
    ],
    "对手市场策略": [
      ""
    ],
    "对手产品特点": [
      ""
    ],
     "对手优势": [
      ""
    ],
     "对手劣势": [
      ""
    ],
  }},
  "策略建议": {{
    "市场策略建议": [
      ""
    ],
    "竞争优势建议": [
      ""
    ]
  }},
  "下一步计划与实施方案": {{
    "时间规划": [
      ""
    ],
    "责任人": [
      ""
    ],
    "关键绩效指标": [
      ""
    ]
  }}
}}

## 当前分析需求
这里是文档内容：{content}。
请根据文档内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，进行深入分析和推理，最终生成一份详细的策略建议报告。
报告应包含：
市场分析：基于文档数据和互联网信息，分析目标市场的潜力、特点、风险等。
产品/服务分析：评估文档中产品/服务在目标市场的竞争力、优势和劣势。
竞争对手分析：分析主要竞争对手的市场策略、产品特点、优势和劣势。
策略建议：基于以上分析，提出具体的市场策略建议和竞争优势建议。
下一步计划与实施方案：给出可操作的下一步计划和实施步骤，包括时间规划、责任人、关键绩效指标等。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。"""

def get_query_str1(content, template):
  return f"""\
    # Role: 策略建议生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题":"",
  "内容描述":"",
  "市场策略建议": {{
    "目标市场细分与选择": "",
    "产品服务调整与本地化": "",
    "低成本营销与推广": "",
    "渠道选择与合作伙伴": "",
    "价格策略": "",
  }},
  "竞争优势建议": {{
    "性价比优势":"",
    "快速响应与灵活性":"",
    "本地化服务与支持":"",
    "合作共赢":"",
  }},
  "下一步计划与实施方案": ""
}}

## 当前分析需求
这里是文档内容：{content}。
请根据文档内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，进行深入分析和推理，最终生成一份详细的策略建议报告。
1.标题，格式是：新兴市场[目标市场名称]拓策略模板
请根据文档内容和互联网搜索情况替换[目标市场名称]为真实数据。
2.内容描述，格式是：本策略模板旨在指导企业在新兴市场[目标市场名称]的市场进入和初期发展，侧重于低成本、快速适应和建立初步优势。
请根据文档内容和互联网搜索情况替换[目标市场名称]为真实数据。
3.市场策略建议
包括目标市场细分与选择、产品服务调整与本地化、低成本营销与推广、渠道选择与合作伙伴、价格策略。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
4.竞争优势建议
包括性价比优势、快速响应与灵活性、本地化服务与支持、合作共赢。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
5.下一步计划与实施方案，格式是：初期，我们将重点进行[目标市场名称]的市场调研，明确最具潜力的细分市场和客户需求，并据此调整产品或服务。随后，我们将积极寻找当地合作伙伴，建立线上及线下的初步销售渠道，并开展低成本的营销推广活动。在执行过程中，我们将密切关注市场反馈和客户需求，及时调整策略，目标是在[时间] 内实现初步的市场份额增长。
请根据文档内容和互联网搜索情况替换[目标市场名称]和[时间]为真实数据。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。
    """

def get_query_str2(content, template):
  return f"""\
    # Role: 策略建议生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  
  "标题":"",
  "内容描述":"",
  "市场策略建议": {{
    "精细化客户管理": "",
    "产品创新与升级": "",
    "品牌建设与传播": "",
    "渠道优化与拓展": "",
    "增值服务与解决方案": "",
  }},
  "竞争优势建议": {{
    "品牌优势":"",
    "技术创新优势":"",
    "客户服务优势":"",
    "渠道网络优势":"",
  }},
  "下一步计划与实施方案": ""
}}

## 当前分析需求
这里是文档内容：{content}。
请根据文档内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，进行深入分析和推理，最终生成一份详细的策略建议报告。
1.标题，格式是：成熟市场[目标市场名称]深耕策略模板
请根据文档内容和互联网搜索情况替换[目标市场名称]为真实数据。
2.内容描述，格式是：本策略模板旨在指导企业在成熟市场[目标市场名称]中进一步提升市场份额、增强品牌影响力、提高客户忠诚度。
请根据文档内容和互联网搜索情况替换[目标市场名称]为真实数据。
3.市场策略建议
包括精细化客户管理、产品创新与升级、品牌建设与传播、渠道优化与拓展、增值服务与解决方案。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
4.竞争优势建议
包括品牌优势、技术创新优势、客户服务优势、渠道网络优势。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
5.下一步计划与实施方案，格式是：接下来，我们将对现有客户数据进行深入分析，进行客户分级管理，并制定个性化的营销方案以提高客户忠诚度。同时，我们将加大产品研发投入，推出符合市场需求的新产品或升级现有产品。此外，我们将加强品牌建设和推广力度，优化现有销售渠道并积极拓展新的渠道，最终目标是进一步巩固市场地位并实现可持续增长。
请根据文档内容和互联网搜索情况替换[目标市场名称]和[时间]为真实数据。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。"""

def get_query_str3(content, template):
  return f"""\
    # Role: 策略建议生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  
  "标题":"",
  "内容描述":"",
  "市场策略建议": {{
    "问题诊断与分析": "",
    "目标重新设定": "",
    "策略调整与创新": "",
    "资源重新分配": "",
    "风险控制与应对": "",
  }},
  "竞争优势建议": {{
    "灵活应变能力":"",
    "专业知识与经验":"",
    "合作与联盟":"",
    "创新思维":"",
  }},
  "下一步计划与实施方案": ""
}}

## 当前分析需求
这里是文档内容：{content}。
请根据文档内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，进行深入分析和推理，最终生成一份详细的策略建议报告。
1.标题，格式是：[目标市场名称][具体问题]解决策略模板
请根据文档内容和互联网搜索情况替换[目标市场名称]和[具体问题]为真实数据。
2.内容描述，格式是：本策略模板旨在解决企业在[目标市场名称]面临的[具体问题]，例如：市场份额下降、竞争对手强势、政策变化影响等。
请根据文档内容和互联网搜索情况替换[目标市场名称]和[具体问题]为真实数据。
3.市场策略建议
包括问题诊断与分析、目标重新设定、策略调整与创新、资源重新分配、风险控制与应对。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
4.竞争优势建议
包括灵活应变能力、专业知识与经验、合作与联盟、创新思维。
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，填充具体内容。
5.下一步计划与实施方案，格式是：针对[目标市场名称]的[具体问题]，我们将首先进行全面的诊断分析，明确问题的根源和影响。然后，我们将重新审视市场目标，并制定相应的策略调整和创新方案。在资源分配上，我们将优先支持解决问题的关键环节，并密切监控策略执行效果，及时进行调整，最终目标是克服当前挑战，恢复并提升市场竞争力。
请根据文档内容和互联网搜索情况替换[目标市场名称]和[具体问题]为真实数据。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。"""


def get_query_str4(content, template):
  return f"""\
    # Role: 策略建议生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明
5. 所有的json的key请务必使用有意义的中文

## 当前分析需求
这里是文档内容：{content}。
请根据文档内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
请根据文档内容，结合互联网上相关的市场信息、行业趋势、竞争对手情况等，进行深入分析和推理，最终生成一份详细的策略建议报告。
用户给的模板如下：
{template}
请根据上述要求，结合用户给的模板，返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。"""


def get_query_str(template, content):
    template_handler = {
        "不使用模板": get_query_str0,
        "模板一": get_query_str1,
        "模板二": get_query_str2,
        "模板三": get_query_str3,
        "用户自定义模板": get_query_str4,
    }.get(template, get_query_str4)
    
    return template_handler(content, template)

def strategy_recommendations(session_id, template):
    content = get_content(session_id)
    try:
        response = query_perplexity(get_query_str(template, content))
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating strategy recommendations '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating strategy recommendations: {str(e)}")

# API endpoint to generate business report

@app.post("/generate-strategy-recommendations")
def generate_strategy_recommendations(json_data):
    session_id = json_data['session_id']
    template = json_data['template']
    try:
        info = strategy_recommendations(session_id, template)
        return {"status": "success", "data": info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}
