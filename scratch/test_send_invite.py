import os
import re
import sys
import json
import urllib.request
import urllib.error

def load_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.abspath(os.path.join(script_dir, "../../../Downloads/app-eventgrid/.env.local"))
    
    if not os.path.exists(env_path):
        print(f"Error: env file not found at {env_path}")
        sys.exit(1)
        
    env = {}
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            match = re.match(r"^\s*([^#=]+)\s*=\s*(.*)\s*$", line)
            if match:
                key = match.group(1).strip()
                val = match.group(2).strip()
                if val.startswith('"') and val.endswith('"'):
                    val = val[1:-1]
                env[key] = val
    return env

def test_send_invite():
    env = load_env()
    supabase_url = env.get("VITE_SUPABASE_URL")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_key:
        print("Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local")
        sys.exit(1)
        
    func_url = f"{supabase_url}/functions/v1/send-invite"
    print(f"[TEST] Triggering send-invite Edge Function at: {func_url}")
    
    # Test Payload - we will invite a dummy email as a team member on a valid event or admin_monitor
    payload = {
        "type": "admin_monitor",
        "email": f"test_invite_{os.urandom(4).hex()}@example.com",
        "role": "super_admin",
        "invited_by_name": "Test Runner",
        "invited_by": "00000000-0000-0000-0000-000000000000"
    }
    
    req = urllib.request.Request(
        func_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {service_key}"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print("[SUCCESS] Response received:")
            print(json.dumps(json.loads(res_body), indent=2))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[FAIL] HTTP Error {e.code}: {e.reason}")
        print("Response:", err_body)
    except Exception as e:
        print("[FAIL] Request exception:", e)

if __name__ == "__main__":
    test_send_invite()
