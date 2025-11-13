from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import os
from pathlib import Path

app = FastAPI()

# Load the dataset into a DataFrame
def load_dataset(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        return None

# Load dataset once when the app starts
current_dir = Path(__file__).parent
file_path = os.path.join(current_dir.parent.parent, 'data', 'harmonized-system.csv')
df = load_dataset(file_path)

# Define a request model
class ProductRequest(BaseModel):
    product_name: str

# Create a lookup function
def lookup_hs_code(df, product_name):
    try:
        # Assuming 'description' and 'hscode' are columns in your DataFrame
        result = df[df['description'].str.contains(product_name, case=False)]
        if not result.empty:
            # Return both HS code and description
            return result[['hscode', 'description']].values.tolist()
        else:
            return []
    except Exception as e:
        print(f"Failed to lookup HS code: {e}")
        return []

# API endpoint to retrieve HS codes
@app.post("/get-hs-codes")
def get_hs_codes(json_data):
    product_name = json_data['product_name']
    if df is not None:
        results = lookup_hs_code(df, product_name)
        if results:
            # Sort results by best match (e.g., based on description length)
            results.sort(key=lambda x: len(x[1]))
            return {"results": results}
        else:
            raise HTTPException(status_code=404, detail="No HS codes found for the product")
    else:
        raise HTTPException(status_code=500, detail="Failed to load dataset")

