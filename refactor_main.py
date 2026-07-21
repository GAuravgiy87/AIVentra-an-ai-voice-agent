import re

def refactor_main(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("from fastapi import FastAPI, HTTPException", "from fastapi import FastAPI, HTTPException, Depends\nfrom auth import create_access_token, verify_super_admin, verify_company_admin, verify_token")

    # Unified Login
    login_orig = """@app.post("/api/login")
def unified_login(request: LoginRequest):
    user = agent.check_user_login(request.username, request.password)
    if user:
        return {"success": True, "role": user["role"], "name": user["name"], "id": user["id"]}
    raise HTTPException(status_code=401, detail="Invalid username or password")"""
    
    login_new = """@app.post("/api/login")
def unified_login(request: LoginRequest):
    user = agent.check_user_login(request.username, request.password)
    if user:
        token = create_access_token(data={"sub": user["id"], "role": user["role"], "company_id": user.get("company_id")})
        return {"success": True, "token": token, "role": user["role"], "name": user["name"], "id": user["id"], "company_id": user.get("company_id")}
    raise HTTPException(status_code=401, detail="Invalid username or password")"""
    content = content.replace(login_orig, login_new)

    # Admin login (Super Admin)
    admin_login_orig = """@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    if request.password == "admin":
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")"""
    
    admin_login_new = """@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    if request.password == "admin":
        token = create_access_token(data={"sub": "admin", "role": "super_admin"})
        return {"success": True, "token": token}
    raise HTTPException(status_code=401, detail="Invalid password")"""
    content = content.replace(admin_login_orig, admin_login_new)

    # Protect routes
    content = content.replace('def get_admin_rooms(company_id: Optional[int] = None):', 'def get_admin_rooms(company_id: Optional[int] = None, payload: dict = Depends(verify_token)):\n    if payload.get("role") != "super_admin" and str(payload.get("company_id")) != str(company_id):\n        raise HTTPException(status_code=403, detail="Forbidden")')
    
    content = content.replace('def api_list_companies():', 'def api_list_companies(payload: dict = Depends(verify_super_admin)):')
    content = content.replace('def api_create_company(request: CreateCompanyRequest):', 'def api_create_company(request: CreateCompanyRequest, payload: dict = Depends(verify_super_admin)):')
    content = content.replace('def api_delete_company(company_id: int):', 'def api_delete_company(company_id: int, payload: dict = Depends(verify_super_admin)):')
    
    # Update company can be done by super_admin OR company_admin for their own company
    content = content.replace('def api_update_company(company_id: int, request: UpdateCompanyRequest):', 'def api_update_company(company_id: int, request: UpdateCompanyRequest, payload: dict = Depends(verify_token)):\n    verify_company_admin(company_id, payload)')

    # Add agent_prompt and agent_voice to models
    content = content.replace('agent_name: Optional[str] = "Ventra"\n    admin_id', 'agent_name: Optional[str] = "Ventra"\n    agent_prompt: Optional[str] = None\n    agent_voice: Optional[str] = None\n    admin_id')
    content = content.replace('agent_name: str\n\n@app.put', 'agent_name: str\n    agent_prompt: str = ""\n    agent_voice: str = "alloy"\n\n@app.put')
    
    # Pass them to agent functions
    content = content.replace('agent_name=request.agent_name.strip() if request.agent_name else "Ventra",\n        admin_id', 'agent_name=request.agent_name.strip() if request.agent_name else "Ventra",\n        agent_prompt=request.agent_prompt,\n        agent_voice=request.agent_voice,\n        admin_id')
    content = content.replace('agent_name=request.agent_name.strip() if request.agent_name else "Ventra"\n    )', 'agent_name=request.agent_name.strip() if request.agent_name else "Ventra",\n        agent_prompt=request.agent_prompt,\n        agent_voice=request.agent_voice\n    )')

    # Other API routes
    content = content.replace('def api_create_user(request: CreateUserRequest):', 'def api_create_user(request: CreateUserRequest, payload: dict = Depends(verify_super_admin)):')
    content = content.replace('def api_list_users(company_id: Optional[int] = None):', 'def api_list_users(company_id: Optional[int] = None, payload: dict = Depends(verify_super_admin)):')
    content = content.replace('def api_delete_user(user_id: str):', 'def api_delete_user(user_id: str, payload: dict = Depends(verify_super_admin)):')
    
    content = content.replace('def api_list_all_devices(company_id: Optional[int] = None):', 'def api_list_all_devices(company_id: Optional[int] = None, payload: dict = Depends(verify_token)):\n    if payload.get("role") != "super_admin" and str(payload.get("company_id")) != str(company_id):\n        raise HTTPException(status_code=403, detail="Forbidden")')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

refactor_main('backend/main.py')
print("main.py refactored")
