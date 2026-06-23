import json
import urllib.request
import urllib.error

# Load env variables from .env.local
env = {}
with open('c:/Users/USER/Downloads/app-eventgrid/.env.local', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            parts = line.split('=', 1)
            if len(parts) == 2:
                env[parts[0].strip()] = parts[1].strip()

url = env.get('VITE_SUPABASE_URL')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

def make_request(path, data=None):
    req_url = f"{url}/rest/v1/{path}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    req_data = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(req_url, data=req_data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_body)
        except:
            err_json = err_body
        return e.code, err_json
    except Exception as e:
        return 500, str(e)

print("--- 1. Profiles DUMP ---")
status, profiles = make_request("profiles?order=created_at.desc&limit=10")
print(f"Profiles ({status}):", json.dumps(profiles, indent=2))

print("\n--- 2. Event Access DUMP ---")
status, event_access = make_request("event_access?order=created_at.desc&limit=10")
print(f"Event Access ({status}):", json.dumps(event_access, indent=2))

print("\n--- 3. Events DUMP ---")
status, events = make_request("events?order=created_at.desc&limit=10")
print(f"Events ({status}):", json.dumps(events, indent=2))

print("\n--- 4. Tasks DUMP ---")
status, tasks = make_request("tasks?order=created_at.desc&limit=10")
print(f"Tasks ({status}):", json.dumps(tasks, indent=2))
