FROM python:3.8

WORKDIR /code
ADD requirements.txt /code/

RUN apt-get update -y && apt-get install -y libopencv-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip --no-cache-dir
RUN pip3 install -r requirements.txt --no-cache-dir

EXPOSE 5000
ENV PYTHONPATH "${PYTHONPATH}:/code/"
ENV FLASK_APP "/code/api.py"