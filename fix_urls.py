import os
import glob
import re

files = glob.glob(r'd:\voiceagent\frontend\src\**\*.jsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace single quotes
    content = re.sub(r"'http://localhost:8001(/api.*?)'", r"`http://${window.location.hostname}:8001\1`", content)
    # Replace double quotes
    content = re.sub(r'"http://localhost:8001(/api.*?)"', r"`http://${window.location.hostname}:8001\1`", content)
    # Replace backticks
    content = re.sub(r"`http://localhost:8001(/api.*?)`", r"`http://${window.location.hostname}:8001\1`", content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Replaced successfully.')
