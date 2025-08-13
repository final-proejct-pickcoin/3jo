FROM python:3.11-slim
WORKDIR /app
COPY . /app
EXPOSE 8000
RUN pip install --no-cache-dir -r requirements.txt
# RUN pip install fastapi==0.110.2 uvicorn[standard]==0.29.0 jinja2 PyJWT passlib[bcrypt] python-multipart pymysql cryptography python-dotenv redis pybithumb websocket-client selenium bs4 webdriver_manager lxml python-logstash

# # 크롬/크로미움 및 관련 라이브러리 설치
# RUN apt-get update && \
#     apt-get install -y wget gnupg2 && \
#     wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
#     echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
#     apt-get update && \
#     apt-get install -y google-chrome-stable && \
#     rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    apt-get update && apt-get install -y wget gnupg ca-certificates && \
    wget -qO- https://dl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*



CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
