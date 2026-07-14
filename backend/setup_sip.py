import asyncio
import os
from livekit import api
from dotenv import load_dotenv

load_dotenv()

async def setup_sip():
    lk_url = os.environ.get("LIVEKIT_URL", "http://localhost:7880")
    lk_api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
    lk_api_secret = os.environ.get("LIVEKIT_API_SECRET", "secret")

    lkapi = api.LiveKitAPI(lk_url, lk_api_key, lk_api_secret)
    
    # print("Creating SIP Inbound Trunk...")
    # trunk_info = api.SIPInboundTrunkInfo(
    #     name="asterisk-trunk",
    #     numbers=["ai", "100", "200"],
    #     allowed_addresses=["0.0.0.0/0"]
    # )
    # req = api.CreateSIPInboundTrunkRequest(trunk=trunk_info)
    # trunk = await lkapi.sip.create_sip_inbound_trunk(req)
    # print(f"Created trunk: {trunk.sip_trunk_id}")

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
    rule = await lkapi.sip.create_sip_dispatch_rule(req_rule)
    print(f"Created dispatch rule: {rule.sip_dispatch_rule_id}")

    await lkapi.aclose()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(setup_sip())
