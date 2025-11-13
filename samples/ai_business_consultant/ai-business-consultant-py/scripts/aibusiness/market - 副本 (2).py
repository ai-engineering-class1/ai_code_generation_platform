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
            "messages": [
                {"role": "system", "content": "你是一个专业的市场分析师"},
                {"role": "user", "content": query}
            ],
            'max_tokens': 2000,
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

def analysis(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "市场摘要": "",
  "关键市场指标": {{
    "全球市场规模": {{
      "年份": 2025,
      "数据": 7500,
      "单位": "亿美元"
    }},
    "预计年复合增长率": 11.5,
    "亚太地区市场份额": 30,
    "市场增长率": 12
  }},
  "市场规模与增长趋势": {{
    "2021": 5600,
    "2022": 6200,
    "2023": 6800,
    "2024": 7500,
    "2025": 8300
  }},
  "主要市场参与者": [
    {{
      "公司名称": "",
      "总部": "",
      "主要产品": "",
      "市场份额": 14
    }},
    {{
      "公司名称": "",
      "总部": "",
      "主要产品": "",
      "市场份额": 10
    }}
  ]
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX市场分析
2.市场摘要
一句话概述包括：当前该市场的发展现状、今年的市场规模、预计未来的市场规模、年复合增长率、未来市场增长动力。
3.关键市场指标
包括全球市场规模（包括年份：今年，用4位数年份、数据，单位亿美元）、预计年复合增长率（未来5年，百分比）、亚太地区市场份额（百分比）、市场增长率（百分比）
4.市场规模与增长趋势
这是一个折线图，横轴年份，纵轴市场规模，单位亿美元，给出最近10年的数据
5.主要市场参与者
包括公司名称、总部、主要产品、市场份额（百分比），给出5-10条数据
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating market analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")

def analysis1(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场定位分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "市场细分": {{
    "按企业规模细分": {{
      "": 45,
      "概述": ""
    }},
    "按应用场景细分": {{
      "": 30,
      "概述": ""
    }}
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX市场定位分析
2.市场细分
给出两种细分数据，一种是按企业规模细分，一种是按应用场景细分，分别给出细分中的百分比数据及根据数据做一句话概述。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating market analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")

def analysis2(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场定位分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "销售渠道": {{
    "线上渠道占比": {{
      "比例": 95,
      "同比增长": 10
    }},
    "线下渠道占比": {{
      "比例": 5,
      "同比减少": 10
    }},
    "最优渠道盈利率": 25,
    "渠道分布比例饼图": [
      {{
        "渠道名": "",
        "占比": 60
      }},
      {{
        "渠道名": "",
        "占比": 30
      }},
    ],
    "主要渠道分析": [
      {{
        "渠道名称": "",
        "渠道说明": "",
        "市场份额": 60,
        "盈利率": 25,
        "增长趋势": 15
      }},
      {{
        "渠道名称": "",
        "渠道说明": "",
        "市场份额": 30,
        "盈利率": 20,
        "增长趋势": 10
      }}
    ]
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX市场定位分析
2.销售渠道
包括线上渠道占比（百分比，且给出比前一年增长还是减少的百分比）、线下渠道占比（百分比，且给出比前一年增长还是减少的百分比）、最优渠道盈利率（百分比）、渠道分布比例饼图（这是一个饼图，给出各渠道的渠道名和占的百分比）、主要渠道分析（是个列表，包括渠道名称、渠道说明、市场份额（百分比）、盈利率（百分比）、增长趋势（百分比））
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating market analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")


def analysis3(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场定位分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "客户画像": {{
    "关键数据指标": {{
      "目标客户总数": {{
        "数量": 5000000,
        "同比增长": "15%"
      }},
      "平均购买力": {{
        "数量": 100000,
        "较行业平均高": "20%"
      }},
      "重复购买率": {{
        "百分比": "65%",
        "同比增长": "10%"
      }},
      "客户转化率": {{
        "百分比": "25%",
        "高于行业平均": "5%"
      }}
    }},
    "客户细分分布": {{
      "购买类型": {{
        "企业用户": "60%",
        "个人用户": "40%"
      }},
      "地区": {{
        "华南": "40%",
        "华东": "30%",
        "华北": "20%",
        "其他": "10%"
      }},
      "年龄": {{
        "25-34岁": "35%",
        "35-44岁": "40%",
        "45-54岁": "20%",
        "其他": "5%"
      }}
    }},
    "典型客户画像": [
      {{
        "一字概括":"创",
        "客户身份": "",
        "客户职业或职责": "",
        "年龄段": "",
        "购买频率": "",
        "购买动机": "",
        "客户标签": [""]
      }}
    ],
    "客户行为分析": {{
      "横轴": ["1月", "2月", "3月", "4月", "5月", "6月"],
      "购买频率": [2, 3, 2, 4, 3, 5],
      "决策周期（天）": [30, 25, 35, 20, 28, 22],
      "采购预算（万元）": [50, 80, 60, 100, 75, 120]
    }},
    "AI推荐策略": {{
      "营销建议": [
        ""
      ],
      "整体策略建议": [
        ""
      ]
    }}
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX市场定位分析
2.客户画像
包括关键数据指标（目标客户总数（给出数量和同比增长百分比）、平均购买力（给出数量和较行业平均高百分比）、重复购买率（给出百分比和同比增长百分比）、客户转化率（给出百分比和高于行业平均百分比））、客户细分分布（这是一个饼图，按购买类型、地区、年龄等维度展示客户分布，请给出饼图需要的数据）、典型客户画像（给出客户身份、单个字概括客户身份、客户职业或职责、年龄段、购买频率、购买动机、客户标签。请给出多条数据）、客户行为分析（这是一个折线图，有横轴和纵轴，展示购买频率、决策周期、采购预算等指标，请给出最近12个月需要的数据）、AI推荐策略（给出3-5条根据客户画像的营销建议（不仅要告知做什么，还需要告知怎么做，说得具体一些，给出切实可行的做法），给出3-5条整体策略建议（不仅要告知做什么，还要告知怎么做，说得具体一些，给出切实可行的做法））
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating market analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")


def analysis4(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场定位分析师
请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "价格定位": {{
    "AI价格推荐": "",
    "价格弹性分析": {{
      "价格弹性曲线": {{
        "横轴价格": [5000, 7500, 10000, 12500, 15000],
        "纵轴销量": [120, 100, 80, 60, 40]
      }},
      "价格弹性系数": -1.5,
      "降价销量增长百分比": "20%",
      "提价销量下降百分比": "25%",
      "分析结论": ""
    }},
    "竞争对手价格分析": {{
      "表格": [
        {{
          "竞争对手": "",
          "价格区间": "",
          "市场定位": ""
        }}
      ],
      "洞察": ""
    }},
    "价格敏感度分析": {{
      "产品价格调整百分比": "±10%",
      "市场竞争强度": "高",
      "价格调整影响预测": {{
        "最近12个月趋势": {{
          "购买频率": [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6],
          "决策周期": [60, 58, 55, 53, 50, 48, 45, 43, 40, 38, 35, 33],
          "采购预算": [8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 13500]
        }}
      }},
      "预计销量变化": "±15%",
      "预计利润变化": "±8%",
      "预计市场份额变化": "±5%"
    }}
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX市场定位分析
2.价格定位
包括AI价格推荐（内容为基于市场分析，建议将产品价格定位在xxx-xxx区间。这一价格区间与主要竞争对手相比怎么样，同时保持在xxx市场定位，有利于xxx。）、价格弹性分析（价格弹性曲线图横轴价格，纵轴销量，请给出需要的数据，给出价格弹性系数、降价销量增长百分比、提价销量下降百分比、分析结论）、竞争对手价格分析（这是一个表格，给出竞争对手、价格区间、市场定位。再给出洞察，即一句话总结）、价格敏感度分析（给出产品价格调整百分比、市场竞争强度、价格调整影响预测（这是客户行为趋势图，展示最近12个月购买频率、决策周期、采购预算等指标，给出图表需要的数据）、预计销量变化（百分比）、预计利润变化（百分比）、预计市场份额变化（百分比））
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating market analysis '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")

def industry_competition(session_id):
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 行业竞争分析师
你擅长分析主要竞争对手策略、供应链和市场份额数据。请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题": "",
  "市场数据": {{
    "全球市场份额": 0.1,
    "年营收": 0.14,
    "研发投入": 20,
    "概述"：""
  }},
  "SWOT分析": {{
    "优势（Strengths）": [
      ""
    ],
    "劣势（Weaknesses）": [
      ""
    ],
    "机会（Opportunities）": [
      ""
    ],
    "威胁（Threats）": [
      ""
    ]
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题
格式为XXX公司分析
2.全球市场份额（百分比）、年营收（单位亿美元）、研发投入（营收的百分比）、概述（一句话描述）
3.SWOT分析，包括优势（Strengths）、劣势（Weaknesses）、机会（Opportunities）、威胁（Threats），每个写出5条
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating industry competition '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating industry competition: {str(e)}")


def strategy_recommendations(session_id):
    more = '（查询互联网，结合能结合的所有资料信息，尽最大可能给出更细节的说明或者描述，务必500至800字，多写一点，不要只写一句话）'
    content = get_content(session_id)
    try:
        response = query_perplexity(f"""\
# Role: 市场策略建议师
你擅长提供基于AI分析的市场进入策略和竞争优势建议。请严格按以下JSON格式输出分析报告，确保不遗漏任何字段，保持键名完全一致：

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "标题1": "",
  "标题2": "",
  "策略匹配度": 90,
  "策略建议": {{
    "目标细分市场": "",
    "产品差异化策略": "",
    "价格策略": "",
    "销售渠道策略": "",
  }},
  "策略建议更多": {{
      "目标细分市场更多": "",
      "产品差异化策略更多": "",
      "价格策略更多": "",
      "销售渠道策略更多": ""
  }}
}}
## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.标题1
格式为XXX市场策略建议
2.标题2，格式为XXX市场策略摘要，请保持此处的XXX和1中的XXX一致
3.策略匹配度（百分比）
4.给出策略建议，包括目标细分市场、产品差异化策略、价格策略、销售渠道策略，都用一句话描述
5.给出策略建议更多，包括目标细分市场更多{more}、产品差异化策略更多{more}、价格策略更多{more}、销售渠道策略更多{more}
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating strategy recommendations '{session_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating strategy recommendations: {str(e)}")

def negotiation_strategy(content):
    try:
        response = query_perplexity(f"""\
# Role: 谈判策略生成师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
    "强势型策略": {{
        "价格谈判策略": "",
        "文化适应策略": "",
        "沟通要点": ""
    }},
    "平衡型策略": {{
        "价格谈判策略": "",
        "文化适应策略": "",
        "沟通要点": ""
    }},
    "妥协型策略": {{
        "价格谈判策略": "",
        "文化适应策略": "",
        "沟通要点": ""
    }}
}}

## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.强势型策略：适合买方市场或具有明显优势时。请从价格谈判策略、文化适应策略、沟通要点三方面返回AI推荐谈判策略。
2.平衡型策略：适合双方力量西相当的情况。请从价格谈判策略、文化适应策略、沟通要点三方面返回AI推荐谈判策略。
3.妥协型策略：适合买方市场或需求迫切时。请从价格谈判策略、文化适应策略、沟通要点三方面返回AI推荐谈判策略。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating negotiation strategy '{content}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating negotiation strategy: {str(e)}")

def prospecting_letter(content, prompt, language, name, company, phone, email):
    try:
        response = query_perplexity(f"""\
# Role: 开发信生成器
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
    "标题": "",
    "邮件内容": "",
    "AI风格": "专业正式",
    "落款":""
}}

## 当前分析需求
这里有一段内容：{content}
请根据内容，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.请提取出邮件风格，并生成该风格的开发信,请用中文写
2.开发信标题是关于XXX产品的商业合作建议
3.开发信的内容要体现我们是谁，我们要分享什么产品，我们的产品有什么优势，能过为目标行业带来什么价值。字数在50-200.
4.这里是特别提出的要求，请务必体现：{prompt}
5.标题和邮件内容都用{language}语言写
6.请用{name}的身份{company}的公司名，{phone}的电话，{email}的邮箱产生符合邮件风格的落款，落款的语言请用{language}.
7.请确保这封邮件通过了垃圾邮件检测，以防止这封邮件最终被归入垃圾邮件文件夹。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        logging.info(f"开发信客户的提示词: {prompt}")
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating negotiation strategy '{content}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating negotiation strategy: {str(e)}")

def ai_customer_analysis(content):
    try:
        response = query_perplexity(f"""\
# Role: AI客户分析师
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
    "客户情绪": "积极",
    "合作可能性": "73%",
    "关键点提取": [""],
    "回复建议": ""
}}

## 当前分析需求
这里有一段邮件沟通历史内容：{content}
请根据历史沟通记录，以及客户最新回复，提取有用信息，请使用联网搜索。
我需要你给我返回的内容如下：
1.客户情绪（积极或消极等）
2.合作可能性（百分比，如73%，请务必包含百分号）
3.关键点提取（分条列出，不少于5条，每条10字以内）
4.回复建议（根据前面的分析，给出回复建议，50字以内）
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating negotiation strategy '{content}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating negotiation strategy: {str(e)}")

# API endpoint to generate business report

@app.post("/generate-analysis-report")
def generate_analysis_report(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = analysis(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-positioning-report1")
def generate_positioning_report1(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = analysis1(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-positioning-report2")
def generate_positioning_report2(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = analysis2(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-positioning-report3")
def generate_positioning_report3(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = analysis3(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-positioning-report4")
def generate_positioning_report4(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = analysis4(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-industry-competition")
def generate_industry_competition(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = industry_competition(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-strategy-recommendations")
def generate_strategy_recommendations(json_data):
    session_id = json_data['session_id']
    try:
        industry_analysis_info = strategy_recommendations(session_id)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-negotiation-strategy")
def generate_negotiation_strategy(json_data):
    content = json_data['content']
    try:
        industry_analysis_info = negotiation_strategy(content)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-prospecting-letter")
def generate_prospecting_letter(json_data):
    content = json_data['content']
    prompt = json_data['prompt']
    language = json_data['language']
    name = json_data['name']
    company = json_data['company']
    phone = json_data['phone']
    email = json_data['email']
    try:
        industry_analysis_info = prospecting_letter(content, prompt, language, name, company, phone, email)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

@app.post("/generate-ai-customer-analysis")
def generate_ai_customer_analysis(json_data):
    content = json_data['content']
    try:
        industry_analysis_info = ai_customer_analysis(content)
        return {"status": "success", "data": industry_analysis_info}
    except HTTPException as e:
        return {"status": "error", "message": str(e.detail)}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
