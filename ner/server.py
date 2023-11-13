from fastapi import FastAPI
from pydantic import BaseModel
import spacy

app = FastAPI()
nlp = spacy.load("model/model-best")


class Task(BaseModel):
    input: str


@app.get("/")
def root():
    return {"success": True, "message": "API is running"}


@app.post("/ner")
def ner(task: Task):
    doc = nlp(task.input)
    return {"success": True, "data": list(map(lambda x: {"text": x.text, "type": x.label_}, doc.ents))}
