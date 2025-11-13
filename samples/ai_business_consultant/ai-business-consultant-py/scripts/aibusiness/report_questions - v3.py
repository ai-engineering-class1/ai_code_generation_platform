from dotenv import load_dotenv
load_dotenv()
import os
import requests
import json
import logging
from fastapi import HTTPException

# 初始化会话存储
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
                {"role": "system", "content": f"""\
    You are an agent to help doing customer survey for generating business analysis for a business. You will interact with the user by asking questions and keep the answer in memory until you get all the answers or if user insist, the answer could be empty. Once you collect all the questions, you should return the results in JSON format with the following format '
    {{
    "Qnacomplete": true,
    "Questions": [ {{"question":"您的企业名称是什么？","answer":"岭纬科技"}},......]
  }}'. You should ask for business name and website url, and then try to use the website URL and business name to search Internet to collect the rest of the answer to the questions. If some of the questions can not be answer, you will then ask user to fill in the answer. If company don't have website, you can also search the information about the company using the name of the company. The purpose is to best create a business strategy analysis as the following section. You can also create more questions in order for the analytics to be more accurate.请务必每次只问一个问题. Here are the suggested questions. 
'
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
'. Here are the prior answers from users for your reference. If it is finished, you should return the next question or comment to user using the format
        """},
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

# 处理用户交互的核心逻辑
def handle_user_interaction(session_id, user_response):
    global user_sessions
    
    try:
        # 初始化会话存储（保留20轮历史）
        if session_id not in user_sessions:
            user_sessions[session_id] = {
                'context': [],
                'qa_history': [],
                'max_history': 20  # 控制最大历史轮数
            }
            
        session = user_sessions[session_id]
        
        # 维护上下文队列
        session['context'].append(user_response)
        if len(session['context']) > session['max_history']:
            session['context'].pop(0)
            
        # 构建带上下文的查询
        context_str = "\n".join([f"历史对话{idx+1}: {msg}" for idx, msg in enumerate(session['context'][-session['max_history']:])])
        augmented_query = f"""已知上下文：{context_str}\n最新提问：{user_response}"""
        
        # 调用API并记录问答对
        response = query_perplexity(augmented_query)
        session['qa_history'].append((user_response, response))
        
        # 维护历史记录不超过20轮
        if len(session['qa_history']) > session['max_history']:
            session['qa_history'] = session['qa_history'][-session['max_history']:]
        question = response['choices'][0]['message']['content'].strip().split('\n')[-1].replace('\\"', '')
        logging.info(f"生成的问题: {response['choices'][0]['message']['content'].strip()}")
        logging.info(f"生成的问题2: {question}")
        return {"question": question}
        
    except Exception as e:
        logging.error(f"交互处理失败: {str(e)}")
        raise HTTPException(status_code=500, detail="对话处理异常，请重试")