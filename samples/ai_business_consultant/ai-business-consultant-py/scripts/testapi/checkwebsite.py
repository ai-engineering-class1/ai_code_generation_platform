import requests

def check_websites_status(websites: list):
    """
    Checks if the given list of websites are up or down.
    Returns a dictionary with website URLs and their status ("ok" or "down").
    """
    results = {}
    for website in websites:
        try:
            response = requests.get(website, timeout=5)
            if response.status_code == 200:
                results[website] = "ok"
            else:
                results[website] = "down"
        except requests.RequestException:
            results[website] = "down"
    
    return results

# Example usage
if __name__ == "__main__":
    test_websites = ["https://www.easiio.com", "https://www.sflow.io", "https://www.neuvition.com"]
    print(check_websites_status(test_websites))
