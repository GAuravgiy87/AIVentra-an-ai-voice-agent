import redis
import json
import time

def main():
    print("======================================================")
    print("             VANTARA LIVE CALL MONITOR                ")
    print("======================================================")
    print("Waiting for incoming calls...")
    
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    p = r.pubsub()
    p.subscribe('ventra_call_events')
    
    for message in p.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            
            event = data.get('event')
            caller = data.get('caller', 'Unknown')
            dialed = data.get('dialed', 'Unknown')
            room = data.get('room', 'Unknown')
            
            timestamp = time.strftime('%H:%M:%S')
            
            if event == 'incoming_call':
                print(f"[{timestamp}] 📞 RINGING: Call received from extension {caller} -> dialing {dialed} (Room: {room})")
            elif event == 'agent_pickup':
                print(f"[{timestamp}] 🤖 PICKUP : Agent answered call from extension {caller}")
            elif event == 'call_rejected':
                reason = data.get('reason', '')
                print(f"[{timestamp}] ❌ REJECT : Call from {caller} rejected. Reason: {reason}")
            elif event == 'call_ended':
                print(f"[{timestamp}] 🔚 HANGUP : Call ended with extension {caller}")
            elif event == 'user_speaking':
                print(f"[{timestamp}] 🗣️  User is speaking...")
            elif event == 'agent_speaking':
                print(f"[{timestamp}] 🤖 Agent is speaking...")
            elif event == 'call_transferred':
                target = data.get('target', 'Unknown')
                print(f"[{timestamp}] 🔀 TRANSFER: Agent transferred {caller} to extension {target}")
            else:
                print(f"[{timestamp}] ℹ️  EVENT  : {event} - {data}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nMonitor closed.")
