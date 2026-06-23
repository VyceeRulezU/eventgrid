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

# 1. Fetch an event ID
print("Fetching events...")
status, events = make_request("events?limit=1")
print("Events status:", status)
print("Event sample:", json.dumps(events, indent=2))

# 2. Fetch a profile ID
print("Fetching profiles...")
status, profiles = make_request("profiles?limit=1")
print("Profiles status:", status)
print("Profile sample:", json.dumps(profiles, indent=2))

if not events or not profiles:
    print("Could not find events or profiles to test.")
    exit(1)

event_id = events[0]['id']
user_id = profiles[0]['id']

print(f"Testing add_event_member with event_id={event_id}, user_id={user_id}")

# 3. Call add_event_member
payload = {
    "p_event_id": event_id,
    "p_user_id": user_id,
    "p_role": "team_member"
}
status, rpc_res = make_request("rpc/add_event_member", payload)
print("RPC Status:", status)
print("RPC Response:", json.dumps(rpc_res, indent=2))
