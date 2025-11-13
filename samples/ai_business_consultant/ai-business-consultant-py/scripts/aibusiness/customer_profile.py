from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import logging
# 在文件顶部添加
from dotenv import load_dotenv
load_dotenv()  # 加载.env文件
import os
app = FastAPI()

# Define the Apollo API endpoint and API key
APOLLO_API_URL = "https://api.apollo.io/api/v1/people/match"
APOLLO_API_KEY = os.getenv('APLLO_KEY')

# Define a model for the request
class ApolloQueryRequest(BaseModel):
    company_name_or_url: str

# Function to query Apollo API for contacts
def query_apollo_api(query):
    try:
        headers = {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'X-Api-Key': APOLLO_API_KEY
        }
        params = {
            "reveal_personal_emails": "false",
            "reveal_phone_number": "false",
            "email": query
        }
        response = requests.get(APOLLO_API_URL, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            logging.error(f"Failed to retrieve data from Apollo API. Status code: {response.status_code}. Response: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve data from Apollo API. Status code: {response.status_code}")
    except Exception as e:
        logging.error(f"Error querying Apollo API: {str(e)}")
        raise HTTPException(status_code=500, detail="Error querying Apollo API")

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

def get_company_info(content):
    try:
        response = query_perplexity(f"""\
# Role: 客户画像分析专家
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
  "customer_type": "",
  "customer_name": "",
  "basic_info": {{
    "description": "",
    "industry": "",
    "founded": "",
    "headquarters": ""
  }},
  "products_and_services": {{
    "products": [
      ""
    ],
    "solutions": [
      ""
    ]
  }},
  "organization_data": {{
    "company_size": "",
    "employees": "",
    "estimated_annual_revenue": ""
  }},
  "contact_info": {{
    "phone": "",
    "email": ""
  }},
  "online_presence": {{
    "website": "",
    "linkedin": "",
    "facebook": ""
  }}
}}

## 当前分析需求
customer_type：公司
customer_name：{content}
more_info: 无

请根据客户类型、客户名称、补充信息，提取有用信息，尽最大可能找出需要的信息，请足够准确和完善，请使用联网搜索。
我需要你给我返回的内容如下：
1.返回公司的基本信息，公司提供的产品或者服务，单位是公司，学校，还是政府，非盈利组织，公司大小（大中小，公司多少人，销售有多少，预算有多少），公司所在地，公司网站，linkedin，facebook URL。

请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating industry analysis '{content}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating industry analysis: {str(e)}")


# API endpoint to retrieve contacts
@app.post("/get-person")
def get_person(json_data):
    email = json_data['email']
    contacts = query_apollo_api(email)
    return {"data": contacts}

@app.post("/get-company")
def get_company(json_data):
    info = json_data['name']
    return {"data": get_company_info(info)}