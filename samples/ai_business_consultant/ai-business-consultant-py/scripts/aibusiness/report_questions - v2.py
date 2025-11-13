from dotenv import load_dotenv
load_dotenv()
import os
import requests
import json
import logging
from fastapi import HTTPException

# 初始化会话存储
user_sessions = {}

# 处理用户交互的核心逻辑
def handle_user_interaction(session_id, user_response):
    questions = [
        "您的企业名称是什么？",
        "您的网站网址是什么？",
        "您提供哪些产品或服务？",
        "您的企业属于哪个行业？",
        "您的企业位于哪里，您在哪里销售您的产品/服务？",
        "您的理想客户是谁？（如果不确定，请描述您的典型买家）",
        "您在吸引客户方面面临的最大挑战是什么？",
        "您的最大竞争对手是谁？（如果不确定，请列出几个类似的企业）",
        "您的企业或产品与竞争对手有什么不同之处？",
        "您目前如何销售您的产品/服务？（在线、零售、B2B等）",
        "您估计的每月收入是多少？",
        "您估计的每月营销预算是多少？（如果没有，请填写$0）",
        "您目前如何营销您的企业？（社交媒体、广告、口碑等）",
        "您在接下来的一个年内的最大商业目标是什么？",
        "您希望AI在哪方面最能帮助您？（例如，找到客户、增加销售、改善营销等）",
        "您是否需要对新市场或产品扩张机会进行洞察？（是/否）",
    ]
    
    try:
        # 初始化会话
        if session_id not in user_sessions:
            user_sessions[session_id] = {
                'answered': {},
                'current_q_index': 0,
                'auto_filled': False,
                'context': []
            }
            
        session = user_sessions[session_id]
        session['context'].append({"role": "user", "content": user_response})

        # 自动填充逻辑
        # 修正后的自动填充条件
        if session['current_q_index'] == 2 and not session['auto_filled']:  # 严格等于2时触发
            try:
                # 添加前两题答案验证
                if not all([questions[0] in session['answered'], questions[1] in session['answered']]):
                    raise ValueError("前两题尚未完成")
                    
                company = session['answered'][questions[0]]  # 改用直接获取
                website = session['answered'][questions[1]]
                
                auto_query = {
                    "role": "system",
                    "content": f"根据企业信息填充问卷：{company} | {website}"
                }
                response = query_perplexity([
                    auto_query,
                    {"role": "user", "content": "请用JSON格式回答以下问题：" + ";".join(questions[2:])}
                ])
                
                auto_data = json.loads(response['choices'][0]['message']['content'])
                # 修正索引计算逻辑
                for idx_offset, q in enumerate(questions[2:]):  # 从问题2开始偏移量
                    original_idx = 2 + idx_offset  # 转换为原问题列表索引
                    if auto_data.get(q) and q not in session['answered']:
                        session['answered'][q] = auto_data[q]
                        session['current_q_index'] = original_idx + 1
                
                session['auto_filled'] = True
            except Exception as e:
                logging.error(f"自动填充失败: {str(e)}")
                session['auto_filled'] = True

        # 处理当前问题
        ai_reply = ""  # 新增变量初始化
        # 修改后的条件判断逻辑
        if session['current_q_index'] < len(questions):
            current_q = questions[session['current_q_index']]
            
            # 新增回答相关性验证
            # 修正后的相关性检查逻辑
            relevance_check = query_perplexity([
                {
                    "role": "system", 
                    "content": f"判断相关性：问题「{current_q}」与回答「{user_response}」是否相关？用'相关'或'不相关'回答"
                },
                {
                    "role": "user",
                    "content": "请严格按格式回答"
                }
            ])
            
            is_relevant = "相关" in relevance_check['choices'][0]['message']['content']
            
            # 处理当前问题逻辑修改
            if all([
                "不知道" not in user_response.lower(),
                "提示" not in user_response,
                "帮助" not in user_response,
                is_relevant
            ]):
                session['answered'][current_q] = user_response
                ai_reply = "已记录您的回答，请继续下一个问题"
            else:
                # 生成针对性提示
                prompt = [
                    {
                        "role": "system",
                        "content": f"当前问题：{current_q}（{session['current_q_index']+1}/{len(questions)}）"
                    },
                    {"role": "user", "content": "用户回答：'"+user_response+"'，请指出问题并引导正确回答"}
                ]
                
                explanation = query_perplexity(prompt)
                ai_reply = explanation['choices'][0]['message']['content']
                session['context'].append({"role": "assistant", "content": ai_reply})

            # 推进问题索引（移除重复递增）
            if "不知道" not in ai_reply and "?" not in ai_reply:
                session['current_q_index'] += 1  # 唯一递增点

            # 返回结果时修正索引计算
            # 返回结果时修正索引计算
            if session['current_q_index'] >= len(questions):
                return {
                    "status": "complete",
                    "data": {q: session['answered'].get(q, "未回答") for q in questions}
                }
            else:
                next_index = min(session['current_q_index'], len(questions)-1)
                return {
                    "status": "continue",
                    "question": questions[next_index],
                    "reply": ai_reply,
                    "progress": f"{next_index+1}/{len(questions)}"
                }

    except Exception as e:
        logging.error(f"交互处理失败: {str(e)}")
        return {
            "status": "error",
            "message": "系统处理异常，请稍后再试"
        }

# 修正API查询函数参数结构
def query_perplexity(messages):
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
            "messages": messages,  # 直接使用传入的消息数组
            "max_tokens": 2000,
            "temperature": 0.7,
            "stream": False
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