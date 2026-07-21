import re

def add_headers_to_fetch(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace fetch('http://localhost:8001/api/...', { ... }) 
    # with adding Authorization: `Bearer ${localStorage.getItem('ventra_token')}`
    
    # Let's just find `headers: { 'Content-Type': 'application/json' }` and add Authorization to it.
    
    content = content.replace("headers: { 'Content-Type': 'application/json' }", "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` }")
    
    # For GET requests that don't have headers
    # Let's look for fetch calls that are GET without second arg.
    # Like fetch(`http://localhost:8001/api/admin/rooms?company_id=${cId}`)
    
    # Instead of complex regex, let's just do manual string replacements for the specific functions if needed, or regex.
    content = re.sub(r'fetch\(`(http://localhost:8001/api/[^`]+)`\)', r'fetch(`\1`, { headers: { "Authorization": `Bearer ${localStorage.getItem("ventra_token")}` } })', content)
    content = re.sub(r"fetch\('(http://localhost:8001/api/[^']+)'\)", r"fetch('\1', { headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` } })", content)

    # Note: Some fetches have method: 'DELETE' but no headers. Let's find those.
    content = re.sub(r"method:\s*'DELETE'\s*}", r"method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` } }", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

add_headers_to_fetch('frontend/src/components/AdminDashboard.jsx')
add_headers_to_fetch('frontend/src/components/UserDashboard.jsx')
print("Frontend fetch headers updated")
