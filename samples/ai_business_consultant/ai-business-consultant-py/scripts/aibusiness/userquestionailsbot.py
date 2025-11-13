# 在文件顶部添加
from dotenv import load_dotenv
load_dotenv()  # 加载.env文件
import os
import json
import requests
from fastapi import HTTPException
import logging

# Survey questions
survey_questions = [
    "您的企业名称是什么？",
    "您的网站网址是什么？"
]
# Store user sessions
user_sessions = {}

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
                {"role": "system", "content": "你是一个问卷信息收集器"},
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


def get_report(company_name, website_url):
    try:
        response = query_perplexity(f"""\
# Role: 问卷信息收集器
请严格按JSON格式输出分析报告

## 格式要求
1. 必须使用双引号包裹所有键和字符串值
2. 空值字段用null表示，数值保持整数类型
3. 嵌套结构必须完整保留层级关系
4. 禁止添加注释或额外说明

## 模板示例
{{
    "您的企业名称是什么？": "",
    "您的网站网址是什么？": "",
    "您提供哪些产品或服务？": "",
    "您的企业属于哪个行业？": "",
    "您的企业位于哪里，您在哪里销售您的产品/服务？": "",
    "您的理想客户是谁？（如果不确定，请描述您的典型买家）": "",
    "您在吸引客户方面面临的最大挑战是什么？": "",
    "您的最大竞争对手是谁？（如果不确定，请列出几个类似的企业）": "",
    "您的企业或产品与竞争对手有什么不同之处？": "",
    "您目前如何销售您的产品/服务？（在线、零售、B2B等）": "",
    "您估计的每月收入是多少？": "",
    "您估计的每月营销预算是多少？（如果没有，请填写$0）": "",
    "您目前如何营销您的企业？（社交媒体、广告、口碑等）": "",
    "您在接下来的一个年内的最大商业目标是什么？": "",
    "您希望AI在哪方面最能帮助您？（例如，找到客户、增加销售、改善营销等）": "",
    "您是否需要对新市场或产品扩张机会进行洞察？（是/否）": ""
}}

## 当前分析需求
用户提供的信息是：企业名称：{company_name}，网站网址：{website_url}
请根据用户提供的信息，请使用联网搜索，提取有用信息，填充模板示例的值，如果找不到值，请保持空字符串。
请根据上述要求返回我需要的数据，不选加数字引用，请只返回标准的json格式数据，不要有其他无关内容。""")
         # 新增多级内容清洗
        logging.info(f"生成的客户: {company_name}, {website_url}")
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error generating '{company_name}, {website_url}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating : {str(e)}")

# Function to query Perplexity API for company information
def verify_relevance_with_perplexity(question, user_response):
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
                {"role": "system", "content": "You are an intelligent assistant that checks user responses for relevance."},
                {"role": "user", "content": f'The user was asked: "{question}"\nThe user responded: "{user_response}".\n\nDetermine if the response is relevant. 对于网站名称只要是字符串名称就行，不要管是不是有名的或胡诌的，也不要管是否为用户所有。对于网站网址，只要是格式正确即可，不要管是否问搜素引擎还是个人网站.If not, provide a JSON output with:\n- "relevant": true/false\n- "message": Explanation of relevance\n- "follow_up_questions": Suggested follow-ups (if irrelevant).'}
            ],
            'temperature': 0.7
        }
        response = requests.post(url, json=payload, headers=headers)
        logging.info(f"Used tokens: {response.json().get('usage', {}).get('total_tokens', 0)}")
        if response.status_code == 200:
           response_data = response.json()
            # 提取JSON内容
           content = response_data.get('choices', [{}])[0].get('message', {}).get('content', '{}')
            
           # 使用正则表达式提取JSON代码块
           # 修改后的正则表达式，兼容两种格式
           import re
           json_match = re.search(r'```json\n?(.*?)\n?```', content, re.DOTALL)  # 允许无换行
           if not json_match:
               # 尝试直接解析整个内容
               json_str = content
           else:
               json_str = json_match.group(1)
               
           try:
               # 清除可能的额外空格和换行
               json_str = json_str.strip()  
               return json.loads(json_str)
           except json.JSONDecodeError as e:
               logging.error(f"JSON解析失败，内容: {json_str}，错误: {str(e)}")
               raise HTTPException(status_code=500, detail="API响应格式异常")

        else:
            logging.error(f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}. Response: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve data from Perplexity API. Status code: {response.status_code}")
    except Exception as e:
        logging.error(f"Error querying Perplexity API: {str(e)}")
        raise HTTPException(status_code=500, detail="Error querying Perplexity API")

def handle_user_interaction(session_id, user_response):
    global user_sessions
    
    global is_first_interaction;
    if session_id not in user_sessions:
        is_first_interaction = True;
    else:
        is_first_interaction = False;
    
    # Check if session exists; if not, create it
    if session_id not in user_sessions:
        user_sessions[session_id] = {
            "responses": {},
            "current_question_index": 0
        }
    
    # Handle first interaction
    if is_first_interaction:
        # Treat the first interaction as a greeting
        user_sessions[session_id]["responses"]["greeting"] = user_response
        
        # Reset survey state
        user_sessions[session_id]["current_question_index"] = 0
        
        # Get the first question
        first_question = survey_questions[user_sessions[session_id]["current_question_index"]]
        
        return {"question": first_question}
    
    # Get current question and store user's response
    current_question_index = user_sessions[session_id]["current_question_index"]
    question = survey_questions[current_question_index]
    
    # Verify relevance of user's response
    relevance_check = verify_relevance_with_perplexity(question, user_response)
    
    if not relevance_check["relevant"]:
        # If not relevant, return suggestions and follow-up questions
        return {
            "question": question,
            "message": relevance_check["message"],
            "follow_up_questions": relevance_check.get("follow_up_questions", [])
        }
    
    # Store user's response if relevant
    user_sessions[session_id]["responses"][question] = user_response
    
    # Check if all questions have been answered
    if current_question_index == len(survey_questions) - 1:
        # Generate JSON report
        company_name = user_sessions[session_id]["responses"].get("您的企业名称是什么？", "Unknown")
        website_url = user_sessions[session_id]["responses"].get("您的网站网址是什么？", "Unknown")
        report = get_report(company_name, website_url)
        logging.info(f"Perplexity Report Response: {company_name}, {website_url}")
        return {"report": report}
    
    # Move to the next question
    user_sessions[session_id]["current_question_index"] += 1
    
    # Get next question
    next_question = survey_questions[user_sessions[session_id]["current_question_index"]]
    
    return {"question": next_question}

def start_survey():
    global current_question_index
    global user_responses
    
    # Reset survey state if needed
    current_question_index = 0
    user_responses = {}
    
    # Get the first question
    first_question = survey_questions[current_question_index]
    
    return {"question": first_question}

# Example usage
if __name__ == "__main__":
    print(start_survey())
