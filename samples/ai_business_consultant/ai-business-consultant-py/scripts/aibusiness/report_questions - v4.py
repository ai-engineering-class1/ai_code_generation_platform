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
            "temperature": 0.3,
            "max_tokens": 2000,
            "return_related_questions": True
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
                        "content": """您是一个商业分析助手，需要通过多轮对话收集以下信息：
                        1.您的企业名称是什么？
                        2.您的网站网址是什么？
                        3.您提供哪些产品或服务？
                        4.您的企业属于哪个行业？
                        5.您的企业位于哪里，您在哪里销售您的产品/服务？
                        6.您的理想客户是谁？（如果不确定，请描述您的典型买家）
                        请每次只问一个问题，并根据用户回答动态调整后续问题"""
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
            if response_data.get('Qnacomplete', False):
                return {
                    "status": "complete",
                    "data": response_data['Questions']
                }
        except json.JSONDecodeError:
            pass
            
        return {"question": assistant_reply}
        
    except Exception as e:
        logging.error(f"对话处理异常 | SessionID: {session_id} | 错误: {str(e)}")
        return {
            "status": "error",
            "message": "对话处理失败，请重新开始会话"
        }