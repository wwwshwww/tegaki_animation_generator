FROM python:3.8

WORKDIR /app
ADD ./frontend/react-sample/build frontend/
ADD ./backend .

RUN apt-get update -y && apt-get install -y libopencv-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip --no-cache-dir; pip3 install -r requirements.txt --no-cache-dir

CMD gunicorn --bind 0.0.0.0:$PORT wsgi