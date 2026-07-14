import subprocess
import sys

def run(cmd: str):
    subprocess.check_call(cmd, shell=True)

import os, shutil

# Vosk English model (small, ~50 MB)
print("Downloading Vosk English model…")
run("curl -L -o vosk.zip https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip")
# If a previous extraction exists, remove it to avoid conflicts
if os.path.isdir('vosk-model-small-en-us-0.15'):
    print('Existing Vosk model folder found – removing it for a clean extract.')
    shutil.rmtree('vosk-model-small-en-us-0.15')
# Use -Force to overwrite any existing files just in case
run('powershell -Command "Expand-Archive -Path vosk.zip -DestinationPath . -Force"')
run('del vosk.zip')

# Piper TTS voice (en-us, lessac)
print("Downloading Piper TTS voice (en-us, lessac)…")
# The piper-tts CLI is not always on PATH. If it fails, you can download a voice model manually.
try:
    run("piper-tts download-model --language en-us --voice lessac")
except Exception:
    print('⚠️ piper-tts CLI not found or failed.\nPlease download a voice model manually from https://github.com/rhasspy/piper/releases and place the .onnx file somewhere accessible.\nExample: download "lessac" for en-us and extract the .onnx file.')

print("All models downloaded (or manually obtained). Update the `model_path` in livekit_agent.py to point to the .onnx file.")
