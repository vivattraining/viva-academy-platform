FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY main.py ./main.py
COPY pyproject.toml ./pyproject.toml
COPY .env.example ./.env.example

ENV PORT=8000

CMD ["python", "main.py"]
