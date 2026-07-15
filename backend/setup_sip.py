import asyncio
import os
from livekit import api
from dotenv import load_dotenv

load_dotenv()

async def setup_sip():
    lk_url = os.environ.get("LIVEKIT_URL", "http://localhost:7880")
    lk_api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
    lk_api_secret = os.environ.get("LIVEKIT_API_SECRET", "secret")

    # Use HTTP/HTTPS scheme for LiveKitAPI requests (convert ws/wss to http/https)
    api_url = lk_url.replace("ws://", "http://").replace("wss://", "https://")
    lkapi = api.LiveKitAPI(api_url, lk_api_key, lk_api_secret)

    # 1. Clean up existing SIP Inbound Trunks to prevent "Conflicting inbound SIP Trunks" error
    try:
        print("Checking for existing SIP Inbound Trunks...")
        trunks = await lkapi.sip.list_inbound_trunk(api.ListSIPInboundTrunkRequest())
        for trunk in trunks.items:
            print(f"Deleting existing trunk: {trunk.sip_trunk_id} ({trunk.name})")
            await lkapi.sip.delete_trunk(api.DeleteSIPTrunkRequest(sip_trunk_id=trunk.sip_trunk_id))
    except Exception as e:
        print(f"Warning during trunk cleanup: {e}")

    # 2. Clean up existing SIP Dispatch Rules to prevent conflicts
    try:
        print("Checking for existing SIP Dispatch Rules...")
        rules = await lkapi.sip.list_dispatch_rule(api.ListSIPDispatchRuleRequest())
        for rule in rules.items:
            print(f"Deleting existing dispatch rule: {rule.sip_dispatch_rule_id} ({rule.name})")
            await lkapi.sip.delete_dispatch_rule(api.DeleteSIPDispatchRuleRequest(sip_dispatch_rule_id=rule.sip_dispatch_rule_id))
    except Exception as e:
        print(f"Warning during dispatch rule cleanup: {e}")

    print("Creating SIP Inbound Trunk...")
    trunk_info = api.SIPInboundTrunkInfo(
        name="asterisk-trunk",
        numbers=["ai", "100", "200"],
        allowed_addresses=["0.0.0.0/0"]
    )
    req = api.CreateSIPInboundTrunkRequest(trunk=trunk_info)
    trunk = await lkapi.sip.create_inbound_trunk(req)
    print(f"Created trunk: {trunk.sip_trunk_id}")

    print("Creating SIP Dispatch Rule...")
    dispatch_rule = api.SIPDispatchRule(
        dispatch_rule_individual=api.SIPDispatchRuleIndividual(
            room_prefix="sip-call-"
        )
    )
    req_rule = api.CreateSIPDispatchRuleRequest(
        name="dispatch-to-room",
        rule=dispatch_rule
    )
    rule = await lkapi.sip.create_dispatch_rule(req_rule)
    print(f"Created dispatch rule: {rule.sip_dispatch_rule_id}")

    await lkapi.aclose()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(setup_sip())
