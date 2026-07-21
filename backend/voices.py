VOICE_LIBRARY = [
    {
        "id": "en-US-AriaNeural",
        "name": "Aria",
        "type": "Neural",
        "gender": "Female",
        "accent": "American",
        "language": "English (US)",
        "category": "Friendly",
        "description": "A warm, natural, and friendly American female voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-GuyNeural",
        "name": "Guy",
        "type": "Neural",
        "gender": "Male",
        "accent": "American",
        "language": "English (US)",
        "category": "Professional",
        "description": "A clear and professional American male voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-JennyNeural",
        "name": "Jenny",
        "type": "Neural",
        "gender": "Female",
        "accent": "American",
        "language": "English (US)",
        "category": "Conversational",
        "description": "A highly natural and conversational female voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-ChristopherNeural",
        "name": "Christopher",
        "type": "Neural",
        "gender": "Male",
        "accent": "American",
        "language": "English (US)",
        "category": "Corporate",
        "description": "A deep and authoritative corporate male voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-EricNeural",
        "name": "Eric",
        "type": "Neural",
        "gender": "Male",
        "accent": "American",
        "language": "English (US)",
        "category": "Energetic",
        "description": "An energetic and upbeat male voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-MichelleNeural",
        "name": "Michelle",
        "type": "Neural",
        "gender": "Female",
        "accent": "American",
        "language": "English (US)",
        "category": "Soft",
        "description": "A soft, expressive, and gentle female voice.",
        "provider": "azure"
    },
    {
        "id": "en-GB-SoniaNeural",
        "name": "Sonia",
        "type": "Neural",
        "gender": "Female",
        "accent": "British",
        "language": "English (UK)",
        "category": "Friendly",
        "description": "A friendly and cheerful British female voice.",
        "provider": "azure"
    },
    {
        "id": "en-GB-RyanNeural",
        "name": "Ryan",
        "type": "Neural",
        "gender": "Male",
        "accent": "British",
        "language": "English (UK)",
        "category": "Professional",
        "description": "A sharp and professional British male voice.",
        "provider": "azure"
    },
    {
        "id": "en-AU-NatashaNeural",
        "name": "Natasha",
        "type": "Neural",
        "gender": "Female",
        "accent": "Australian",
        "language": "English (AU)",
        "category": "Energetic",
        "description": "An upbeat and bright Australian female voice.",
        "provider": "azure"
    },
    {
        "id": "en-AU-WilliamNeural",
        "name": "William",
        "type": "Neural",
        "gender": "Male",
        "accent": "Australian",
        "language": "English (AU)",
        "category": "Calm",
        "description": "A calm and mature Australian male voice.",
        "provider": "azure"
    },
    {
        "id": "en-CA-ClaraNeural",
        "name": "Clara",
        "type": "Neural",
        "gender": "Female",
        "accent": "Canadian",
        "language": "English (CA)",
        "category": "Warm",
        "description": "A warm and inviting Canadian female voice.",
        "provider": "azure"
    },
    {
        "id": "en-CA-LiamNeural",
        "name": "Liam",
        "type": "Neural",
        "gender": "Male",
        "accent": "Canadian",
        "language": "English (CA)",
        "category": "Conversational",
        "description": "A relaxed and conversational Canadian male voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-AnaNeural",
        "name": "Ana",
        "type": "Neural",
        "gender": "Female",
        "accent": "American (Child)",
        "language": "English (US)",
        "category": "Child-like",
        "description": "A playful and expressive child-like voice.",
        "provider": "azure"
    },
    {
        "id": "en-US-SteffanNeural",
        "name": "Steffan",
        "type": "Neural",
        "gender": "Male",
        "accent": "American",
        "language": "English (US)",
        "category": "Deep",
        "description": "A deep and resonant American male voice.",
        "provider": "azure"
    },
    {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara",
        "type": "Neural",
        "gender": "Female",
        "accent": "Indian",
        "language": "Hindi (India)",
        "category": "Natural",
        "description": "A natural and expressive Indian female voice.",
        "provider": "azure"
    },
    {
        "id": "hi-IN-MadhurNeural",
        "name": "Madhur",
        "type": "Neural",
        "gender": "Male",
        "accent": "Indian",
        "language": "Hindi (India)",
        "category": "Professional",
        "description": "A professional Indian male voice.",
        "provider": "azure"
    },
    {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja",
        "type": "Neural",
        "gender": "Female",
        "accent": "Indian",
        "language": "English (India)",
        "category": "Conversational",
        "description": "A conversational English voice with an Indian accent.",
        "provider": "azure"
    },
    {
        "id": "en-IN-PrabhatNeural",
        "name": "Prabhat",
        "type": "Neural",
        "gender": "Male",
        "accent": "Indian",
        "language": "English (India)",
        "category": "Warm",
        "description": "A warm and inviting Indian male speaking English.",
        "provider": "azure"
    },
    {
        "id": "en-ZA-LeahNeural",
        "name": "Leah",
        "type": "Neural",
        "gender": "Female",
        "accent": "South African",
        "language": "English (ZA)",
        "category": "Expressive",
        "description": "An expressive South African female voice.",
        "provider": "azure"
    },
    {
        "id": "en-ZA-LukeNeural",
        "name": "Luke",
        "type": "Neural",
        "gender": "Male",
        "accent": "South African",
        "language": "English (ZA)",
        "category": "Deep",
        "description": "A deep South African male voice.",
        "provider": "azure"
    }
]

def get_voice_by_id(voice_id: str):
    for v in VOICE_LIBRARY:
        if v["id"] == voice_id:
            return v
    return None
