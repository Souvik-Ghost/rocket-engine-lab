"""
Propulsion Simulation API — FastAPI Backend
Handles LRE and Antigravity simulation endpoints + Gemini AI integration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from models import LREDesignReq, AGDesignReq, ChatCommand
from simulation import calculate_lre, calculate_ag

app = FastAPI(
    title="Propulsion Simulation API",
    description="Backend for the Rocket Engine Simulation Lab",
    version="1.0.0",
)

# CORS — restrict to known frontend origin in production
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for connection status indicators."""
    return {"status": "ok"}


@app.post("/simulate/lre")
async def simulate_lre(req: LREDesignReq):
    """Run traditional liquid rocket engine simulation."""
    try:
        return calculate_lre(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/simulate/ag")
async def simulate_ag(req: AGDesignReq):
    """Run theoretical antigravity simulation."""
    try:
        return calculate_ag(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/ai/command")
async def ai_command(req: ChatCommand):
    """Send a command or chat message to the Gemini AI assistant."""
    if not req.apiKey:
        raise HTTPException(status_code=400, detail="API Key required")

    genai.configure(api_key=req.apiKey)

    if req.command == "chat":
        system_instruction = (
            f"Senior {req.mode} Propulsion Engineer. "
            f"Current mode: {req.mode}. Be technical and helpful."
        )
        model = genai.GenerativeModel(
            "gemini-2.5-flash", system_instruction=system_instruction
        )
        try:
            response = model.generate_content(req.message)
            return {"response": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    else:
        system_prompts = {
            "optimize": (
                f"You are a {req.mode} propulsion optimizer. "
                f"Analyze these specs: {req.context}. Suggest 3 optimizations."
            ),
            "metallurgy": (
                f"Suggest materials for a {req.mode} engine "
                f"based on specs: {req.context}."
            ),
            "testplan": (
                f"Draft a safety checklist for a {req.mode} test "
                f"with specs: {req.context}."
            ),
        }

        prompt = system_prompts.get(req.command, "Provide a technical briefing.")
        model = genai.GenerativeModel(
            "gemini-2.5-flash", system_instruction=prompt
        )
        try:
            response = model.generate_content(f"Run command: {req.command}")
            return {"response": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
