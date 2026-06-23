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

print("Supabase URL:", url)

def invoke_edge_function(name, body):
    # Edge functions URL is typically: https://<project_ref>.supabase.co/functions/v1/<name>
    # or can be invoked via /functions/v1/ prefix
    req_url = f"{url}/functions/v1/{name}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    req_data = json.dumps(body).encode('utf-8')
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

# Fetch an event ID to use
def get_event_id():
    req_url = f"{url}/rest/v1/events?limit=1"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}"
    }
    req = urllib.request.Request(req_url, headers=headers)
    with urllib.request.urlopen(req) as r:
        events = json.loads(r.read().decode('utf-8'))
        return events[0]['id'] if events else None

event_id = get_event_id()
if not event_id:
    print("No events found to test.")
    exit(1)

print("Testing with event_id:", event_id)

# Test 1: Registered user email (existing user)
print("\n--- Testing with registered user email ---")
payload_registered = {
    "type": "team_member",
    "email": "dominicchizzy95@gmail.com",  # From our profiles sample
    "event_id": event_id,
    "invited_by_name": "Test Planner",
    "invited_by": "c6ef456e-3617-41ab-8cc0-41905e0f12dc",
    "role": "team_member"
}
status, res = invoke_edge_function("send-invite", payload_registered)
print("Status:", status)
print("Response:", json.dumps(res, indent=2))

# Test 2: Non-registered user email (new user)
print("\n--- Testing with non-registered user email ---")
import time
unique_email = f"new-team-member-{int(time.time())}@example.com"
payload_new = {
    "type": "team_member",
    "email": unique_email,
    "event_id": event_id,
    "invited_by_name": "Test Planner",
    "invited_by": "c6ef456e-3617-41ab-8cc0-41905e0f12dc",
    "role": "team_member"
}
status, res = invoke_edge_function("send-invite", payload_new)
print("Status:", status)
print("Response:", json.dumps(res, indent=2))
