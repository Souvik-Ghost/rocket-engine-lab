from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from models import LREDesignReq, AGDesignReq, ChatCommand
from simulation import calculate_lre, calculate_ag

app = FastAPI(title="Propulsion Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulate/lre")
async def simulate_lre(req: LREDesignReq):
    return calculate_lre(req)

@app.post("/simulate/ag")
async def simulate_ag(req: AGDesignReq):
    return calculate_ag(req)

@app.post("/ai/command")
async def ai_command(req: ChatCommand):
    if not req.apiKey:
        raise HTTPException(status_code=400, detail="API Key required")
        
    genai.configure(api_key=req.apiKey)
    
    if req.command == "chat":
        system_instruction = f"Senior {req.mode} Propulsion Engineer. Current mode: {req.mode}. Be technical and helpful."
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_instruction)
        try:
            response = model.generate_content(req.message)
            return {"response": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    else:
        system_prompts = {
            "optimize": f"You are a {req.mode} propulsion optimizer. Analyze these specs: {req.context}. Suggest 3 optimizations.",
            "metallurgy": f"Suggest materials for a {req.mode} engine based on specs: {req.context}.",
            "testplan": f"Draft a safety checklist for a {req.mode} test with specs: {req.context}."
        }
        
        prompt = system_prompts.get(req.command, "Provide a technical briefing.")
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=prompt)
        try:
            response = model.generate_content(f"Run command: {req.command}")
            return {"response": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
