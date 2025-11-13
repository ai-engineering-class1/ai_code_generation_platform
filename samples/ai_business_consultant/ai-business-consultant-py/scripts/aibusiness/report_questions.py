from dotenv import load_dotenv
load_dotenv()
import os
import requests
import json
import logging
from fastapi import HTTPException

# 初始化会话存储（支持多轮对话）
user_sessions = {}

def query_perplexity(messages):
    """Perplexity API查询函数（支持多轮上下文）"""
    try:
        api_key = os.getenv('PERPLEXITY_KEY')
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "accept": "application/json",
            "content-type": "application/json"
        }
        
        payload = {
            "model": "sonar-pro",
            "messages": messages,
            "temperature": 0.5,
            "max_tokens": 2000,
            "return_related_questions": False
        }
        
        response = requests.post(url, json=payload, headers=headers)
        logging.info(f"API调用消耗token数: {response.json().get('usage', {}).get('total_tokens', 0)}")
        
        if response.status_code == 200:
            return response.json()
        else:
            logging.error(f"API请求失败 | 状态码: {response.status_code} | 响应: {response.text}")
            raise HTTPException(status_code=500, detail=f"API请求异常，状态码: {response.status_code}")
            
    except Exception as e:
        logging.error(f"API查询错误: {str(e)}")
        raise HTTPException(status_code=500, detail="Perplexity服务暂时不可用")

def handle_user_interaction(session_id, user_response):
    """处理多轮对话的核心逻辑"""
    global user_sessions
    
    try:
        # 初始化会话
        if session_id not in user_sessions:
            user_sessions[session_id] = {
                'messages': [
                    {
                        "role": "system",
                        "content": f"""\
                           你是一个帮助进行客户调研以生成业务分析的代理。你需要通过提问与用户互动，并将用户的回答存储在内存中，直到收集完所有问题的答案，或者如果用户坚持，答案也可以为空。一旦收集完所有问题的答案，你需要以JSON格式返回结果，格式如下。 '{{
    "Qnacomplete": false,
    "NextQuestion": "下一个问题或对用户回答的评论"
    "Questions": [ {{"question":"您的企业名称是什么？","answer":"岭纬科技"}},......]
  }}'. 你应该询问公司名称和网站网址，然后尝试使用公司名称和网站网址在互联网上搜索以收集其余问题的答案。如果有些问题无法通过搜索回答，那么你应该让用户填写答案。如果公司没有网站，你也可以通过公司名称搜索该公司的信息。目的是尽可能地创建一份业务战略分析，如下文所述的部分。你也可以提出更多问题，以便使分析更加准确。 请务必每次只问一个问题,只返回标准json. 以下是建议的问题。 
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
'. 以下是用户之前提供的答案供您参考。如果已完成，您应按照以下格式向用户返回下一个问题或评论。用户如果是打招呼，请不要对招呼的词进行解释，请回应打招呼并开始问答。
用户如果没要求解释的，请不要解释。回答过的问题不要重复问。不要出现json格式以外的文字。
                        """
                    }
                ],
                'collected_data': {}
            }
            
        session = user_sessions[session_id]
        
        # 添加用户输入到上下文
        session['messages'].append({"role": "user", "content": user_response})
        
        # 调用API获取响应
        api_response = query_perplexity(session['messages'])
        assistant_reply = api_response['choices'][0]['message']['content']
        
        # 添加AI回复到上下文
        session['messages'].append({"role": "assistant", "content": assistant_reply})
        
        # 自动清理上下文（保持token用量安全）
        if api_response['usage']['total_tokens'] > 28000:
            session['messages'] = [session['messages'][0]] + session['messages'][-6:]
            
        # 解析结构化数据
        try:
            response_data = json.loads(assistant_reply)
            logging.info(f"对话处理完成 | SessionID: {session_id} | 回复: {response_data.get('NextQuestion', '')}") 
            next_question = response_data.get('NextQuestion', assistant_reply)
            if response_data.get('Qnacomplete', False):
                # 生成report对象
                report = {}
                for item in response_data['Questions']:
                    report[item['question']] = item.get('answer', '')
                
                return {
                    "status": "complete",
                    "report": report,
                    "data": response_data['Questions']
                }
        except json.JSONDecodeError:
            next_question = assistant_reply   
        return {"question": next_question}
        
    except Exception as e:
        logging.error(f"对话处理异常 | SessionID: {session_id} | 错误: {str(e)}")
        return {
            "status": "error",
            "message": "对话处理失败，请重新开始会话"
        }