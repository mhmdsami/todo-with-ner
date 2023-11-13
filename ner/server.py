from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

app = FastAPI()
nlp = spacy.load("model/model-best")

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Task(BaseModel):
    input: str


@app.get("/")
def root():
    return {"success": True, "message": "API is running"}


@app.post("/ner")
def ner(task: Task):
    doc = nlp(task.input)
    return {
        "success": True,
        "data": list(map(lambda x: {"text": x.text, "type": x.label_}, doc.ents)),
    }
