import httpx
import time

def test_full_flow():
    base_url = "http://127.0.0.1:8000/api"

    print("\n--- 1. Testing System Health ---")
    r = httpx.get(f"{base_url}/status/system-health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("Health Status:", r.json())

    print("\n--- 2. Testing Vision Processing ---")
    vis_res = httpx.post(f"{base_url}/vision/process-frame", json={
        "target_object_query": "Find my water bottle",
        "is_demo_mode": True,
        "demo_scenario": "default"
    })
    assert vis_res.status_code == 200
    vis_data = vis_res.json()
    print("Detected objects:", len(vis_data["objects"]))
    print("Target Result:", vis_data["target_result"])
    print("Path Guidance:", vis_data["path_guidance"])
    print("Observation Coverage:", vis_data["observation_coverage"]["overall_percentage"], "%")

    print("\n--- 3. Testing Sound Classification ---")
    sound_res = httpx.post(f"{base_url}/audio/classify", json={
        "is_demo_mode": True,
        "simulated_event": "smoke_alarm"
    })
    assert sound_res.status_code == 200
    alert = sound_res.json()["active_alert"]
    print("Sound Alert:", alert["label"], "Direction:", alert["direction"], "Priority:", alert["priority"])

    print("\n--- 4. Testing ISL & Speech to Avatar ---")
    isl_res = httpx.post(f"{base_url}/isl/speech-to-avatar", json={
        "spoken_text": "I will bring you water"
    })
    assert isl_res.status_code == 200
    avatar_data = isl_res.json()
    print("Avatar Gloss Sequence:", avatar_data["isl_gloss_sequence"])
    print("Keyframes Generated:", len(avatar_data["animation_keyframes"]))

    print("\n--- 5. Testing Emergency SOS Lifecycle ---")
    em_res = httpx.post(f"{base_url}/emergency", json={
        "type": "CANNOT SPEAK",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert em_res.status_code == 200
    em = em_res.json()
    em_id = em["id"]
    print(f"SOS Created [ID: {em_id}]: Status = {em['status']}, Contact = {em['current_notified_contact']}")

    # Acknowledge by receiver
    ack_res = httpx.post(f"{base_url}/emergency/{em_id}/acknowledge", json={
        "responder_name": "Aisha Mohamed (Sister)"
    })
    assert ack_res.status_code == 200
    ack = ack_res.json()
    print(f"SOS Acknowledged: Status = {ack['status']}, Responder = {ack['acknowledged_by']}, Latency = {ack['response_time_seconds']}s")

    # Resolve
    res_res = httpx.post(f"{base_url}/emergency/{em_id}/resolve")
    assert res_res.status_code == 200
    print(f"SOS Resolved: Status = {res_res.json()['status']}")

    print("\n[SUCCESS] ALL INTEGRATION FLOWS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_full_flow()
