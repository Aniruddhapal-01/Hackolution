import httpx
import json

SUPABASE_URL = "https://cauhevaqfmqprdgfsikl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWhldmFxZm1xcHJkZ2ZzaWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDUxMzQsImV4cCI6MjA5MjA4MTEzNH0.lq5iWeZrqAv-KKF_Nu6IveEC9pQ7MrmR8vAGQSHfo7c"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

project_id = "19f08f66-3986-44f8-b524-c166a63cedd1"
url = f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}&select=*"

with httpx.Client() as client:
    r = client.get(url, headers=headers)
    print(json.dumps(r.json(), indent=2))
