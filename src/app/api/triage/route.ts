import { NextResponse } from 'next/server';

// Intelligent local triage engine (fallback when API is unavailable)
function localTriage(prompt: string) {
  const lower = prompt.toLowerCase();

  const symptomMap: Record<string, string[]> = {
    "headache": ["headache", "head pain", "migraine"],
    "fever": ["fever", "temperature", "hot", "burning up"],
    "chest pain": ["chest pain", "chest hurts", "chest tightness"],
    "breathing": ["breathing", "breathe", "shortness of breath", "suffocating"],
    "heart": ["heart", "palpitation", "heart racing", "heartbeat"],
    "stomach": ["stomach", "nausea", "vomiting", "abdominal"],
    "cough": ["cough", "sore throat", "throat"],
    "anxiety": ["anxiety", "stressed", "panic", "panicking", "worried", "scared"],
    "depression": ["depressed", "depression", "sad", "hopeless", "suicidal"],
    "skin": ["rash", "itching", "skin", "allergy"],
    "back pain": ["back pain", "back hurts", "spine"],
    "joint pain": ["joint", "knee", "arthritis"],
    "eye": ["eye", "vision", "blurry"],
    "ear": ["ear", "hearing", "earache"],
    "fatigue": ["tired", "fatigue", "exhausted", "weak"],
    "dizziness": ["dizzy", "dizziness", "vertigo", "lightheaded"],
    "numbness": ["numb", "numbness", "tingling"],
  };

  const extracted: string[] = [];
  for (const [symptom, keywords] of Object.entries(symptomMap)) {
    if (keywords.some(kw => lower.includes(kw))) extracted.push(symptom);
  }
  if (extracted.length === 0) extracted.push("general discomfort");

  const emergencyWords = ["dying", "can't breathe", "suffocating", "suicidal", "severe", "unbearable", "excruciating", "emergency", "blood", "unconscious", "seizure", "collapse"];
  const panicWords = ["panic", "panicking", "terrified", "scared", "frightened", "desperate", "worst", "terrible", "horrible", "extreme"];

  let sentiment = "calm";
  let isEmergency = false;

  if (emergencyWords.some(w => lower.includes(w))) { sentiment = "severe"; isEmergency = true; }
  else if (panicWords.some(w => lower.includes(w))) { sentiment = "panicked"; }

  const specialtyMap: Record<string, string> = {
    "chest pain": "Cardiology", "heart": "Cardiology", "headache": "Neurology",
    "dizziness": "Neurology", "numbness": "Neurology", "stomach": "Gastroenterology",
    "skin": "Dermatology", "eye": "Ophthalmology", "ear": "ENT",
    "back pain": "Orthopedics", "joint pain": "Orthopedics", "anxiety": "Psychiatry",
    "depression": "Psychiatry", "fever": "General Medicine", "cough": "Pulmonology",
    "breathing": "Pulmonology", "fatigue": "Internal Medicine",
  };

  let specialty = "General Practice";
  for (const s of extracted) { if (specialtyMap[s]) { specialty = specialtyMap[s]; break; } }

  let message = isEmergency
    ? `Your symptoms indicate a potentially serious condition requiring immediate attention. I strongly recommend visiting the nearest emergency department or calling emergency services right away.`
    : sentiment === "panicked"
    ? `I understand you're feeling distressed. Based on your symptoms, I recommend an urgent consultation with a ${specialty} specialist. Please don't hesitate to seek immediate care if symptoms worsen.`
    : `Based on your described symptoms, I recommend scheduling a consultation with a ${specialty} specialist. Your symptoms appear manageable but should be professionally evaluated.`;

  return { symptoms_extracted: extracted, sentiment, specialty_match: specialty, is_emergency: isEmergency, message_to_patient: message, engine: "local-nlp" };
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    const systemPrompt = `You are the "VitaLink Ambient Intelligence", a medical AI triage assistant.
The user will describe their symptoms. You must analyze the sentiment and symptoms.

Respond STRICTLY in the following JSON format without any markdown code fences or extra text:
{
   "symptoms_extracted": ["list", "of", "symptoms"],
   "sentiment": "calm OR panicked OR severe",
   "specialty_match": "The recommended medical specialty (e.g. Cardiology)",
   "is_emergency": true OR false,
   "message_to_patient": "A brief, empathetic 2-sentence response advising them of your recommendation."
}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 512
        })
      });

      if (response.ok) {
        const result = await response.json();
        const rawText = result?.choices?.[0]?.message?.content || "";

        try {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const data = JSON.parse(cleanJson);
          data.engine = "groq-llama-3.3-70b";
          return NextResponse.json(data);
        } catch {
          // Groq responded but JSON was malformed, fall through to local
        }
      } else {
        const errText = await response.text();
        console.error("Groq API Error:", response.status, errText);
      }
    } catch (err: any) {
      console.error("Groq fetch error:", err?.message);
    }

    // Fallback: intelligent local triage engine
    return NextResponse.json(localTriage(prompt));

  } catch (error: any) {
    console.error("Triage Route Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to generate AI response", detail: error?.message || "Unknown error" }, { status: 500 });
  }
}
