import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import re

import grantor
from grantor import create_images, png2b64, create_b64_apng

app = Flask(__name__)
header_pattern = re.compile(r'.*?,')
CORS(app)

@app.route('/get_leaves', methods=['POST'])
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

@app.route('/get_animation', methods=['POST'])
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

@app.route('/test', methods=["POST"])
def test():
    import cv2
    import base64
    import numpy as np
    header = header_pattern.match(request.json['image']).group()
    # b64str = re.sub(header_pattern, '', request.json['image'])
    b64str = request.json['image'][len(header):]
    img_data = base64.b64decode(b64str.encode())
    img_np = np.fromstring(img_data, np.uint8)
    bgra = cv2.imdecode(img_np, -1)
    if len(bgra[0,0]) == 3:
        tmp_a = np.full_like(bgra[:,:,0], 255, dtype=np.uint8)
        bgra = np.insert(bgra, 3, tmp_a, axis=2)
    cv2.imwrite('test.png', bgra)
    return jsonify({'res': request.json['image']})

if __name__ == "__main__":
    # app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
    app.run(debug=True, port=os.getenv("PORT", 5000))
