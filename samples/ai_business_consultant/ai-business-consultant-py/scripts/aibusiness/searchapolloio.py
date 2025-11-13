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
# APOLLO_API_URL = "https://api.apollo.io/v1/contacts"
APOLLO_API_URL = "https://api.apollo.io/api/v1/mixed_people/search"
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
            "q_organization_domains_list": [query]
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

# API endpoint to retrieve contacts
@app.post("/get-contacts")
def get_contacts(json_data):
    company_name_or_url = json_data['company_name_or_url']
    contacts = query_apollo_api(company_name_or_url)
    return {"contacts": contacts}

