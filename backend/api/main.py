import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request

latest_value = None

from core.source import CSVReplaySource, SerialSource
from core.pipeline import FocusPipeline
from config import SERIAL_PORT
from core.multi_manager import MultiUserManager
from core.source import ESP32Source

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_FILES = {
    "highfocus": "recorder/eeg_data_highfocus_beta.csv",
    "relaxed":   "recorder/eeg_data_relaxed_lowfocus.csv",
}

def get_source(mode: str, file: str = "highfocus"):
    if mode == "serial":
        return SerialSource(port=SERIAL_PORT)
    elif mode == "esp32":
        return ESP32Source()
    filepath = CSV_FILES.get(file, CSV_FILES["highfocus"])
    return CSVReplaySource(filepath=filepath, realtime=True)


@app.websocket("/ws/eeg")
async def eeg_stream(
    websocket: WebSocket,
    mode: str = "csv",
    file: str = "highfocus"
):
    await websocket.accept()
    source   = get_source(mode, file)
    pipeline = FocusPipeline(source, ema_alpha=0.3)
    loop     = asyncio.get_event_loop()

    try:
        await loop.run_in_executor(
            None,
            lambda: _stream_sync(pipeline, websocket, loop)
        )
    except WebSocketDisconnect:
        print(f"[ws] Client disconnected [{mode}:{file}]")
    except Exception as e:
        print(f"[ws] Unexpected error [{mode}:{file}]: {e}")

@app.websocket("/ws/class")
async def class_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            results = manager.run_all()
            print("CLASS RESULTS:", results)  # 👈 ADD THIS

            await websocket.send_json({
                "type": "class_update",
                "students": results,
                "insight": get_class_insights(results)
            })

            await asyncio.sleep(0.25)

    except Exception as e:
        print("WS CLASS ERROR:", e)
        await websocket.close()

def get_class_insights(results):
    if not results:
        return "No active data"

    scores = [r["focus_score"] for r in results.values()]
    avg = sum(scores) / len(scores)

    if avg < 0.3:
        return "Class attention is low. Consider a break."
    elif avg > 0.6:
        return "Class is highly focused."
    else:
        return "Moderate engagement."

def generate_ai_insight(results):
    summary = []

    for uid, r in results.items():
        summary.append(f"{uid}: {r['ml_state']} ({r['ml_confidence']})")

    text = "\n".join(summary)

    prompt = f"""
            You are an AI classroom assistant.

            Student states:
            {text}

            Give 1 short actionable suggestion for teacher.
            Sugegst which studentd need attention.
        """

    return call_llm(prompt)

@app.post("/eeg")
async def receive_eeg(req: Request):
    global latest_value
    data = await req.json()
    latest_value = data["value"]
    return {"status": "ok"}

def _stream_sync(pipeline: FocusPipeline, websocket: WebSocket, loop):
    for result in pipeline.run():
        try:
            future = asyncio.run_coroutine_threadsafe(
                websocket.send_text(json.dumps(result)),
                loop
            )
            future.result(timeout=5)
        except Exception:
            # Client disconnected or send failed — stop streaming
            break

FILES = [
    "recorder/eeg_data_highfocus_beta.csv",
    "recorder/eeg_data_relaxed_lowfocus.csv",
]

manager = MultiUserManager(FILES)