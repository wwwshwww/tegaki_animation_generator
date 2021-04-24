import os
from flask import Flask, jsonify, request
from flask.helpers import send_from_directory
from flask_cors import CORS
import re

import grantor
from grantor import create_images, png2b64, create_b64_apng

app = Flask(__name__, static_url_path='', static_folder='frontend')
header_pattern = re.compile(r'.*?,')
# CORS(app)

@app.route('/', defaults={'path': ''})
def index(path):
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/get_leaves', methods=['POST'])
def get_leaves():
    response = {'num': 0}

    header = header_pattern.match(request.json['image']).group()
    b64str = request.json['image'][len(header):]
    param = request.json['parameter']

    imgs = png2b64(create_images(
        b64str, 
        param['leaves'], 
        param['threshold'], 
        param['eps'], 
        param['size'], 
        param['movable'], 
        param['std'], 
        param['is_stride'], 
        param['only_external']
    ))

    response['num'] = len(imgs)
    response['images'] = imgs
    
    # except Exception as e:
    #     app.logger.info(e)
    #     response['num'] = 0
    #     response['error'] = str(e)
    #     abort = True
    
    return jsonify(response)

@app.route('/api/get_animation', methods=['POST'])
def get_animation():
    response = {}

    header = header_pattern.match(request.json['image']).group()
    b64str = request.json['image'][len(header):]
    param = request.json['parameter']

    imgs = create_images(
        b64str, 
        param['leaves'], 
        param['threshold'], 
        param['eps'], 
        param['size'], 
        param['movable'], 
        param['std'], 
        param['is_stride'], 
        param['only_external']
    )

    response['apng'] = create_b64_apng(imgs, param['fps'])
    return jsonify(response)

if __name__ == "__main__":
    # app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '5000'))
    app.run(host=host, port=os.getenv("PORT", 5000))
