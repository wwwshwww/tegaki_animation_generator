import os
from flask import Flask, jsonify, request
import numpy as np
import base64

import grantor
from grantor import create_images, png2b64

app = Flask(__name__)

@app.route('/', methods=['POST'])
def index():
    if request.method == 'POST':
        response = {}
        stream = request.files['image'].stream
        img_arr = np.asarray(bytearray(stream.read()), dtype=np.uint8)

        
        vthresh = 210
        eps = 0.99
        size = 4
        movable = 1.5
        std = 0.15
        is_stride = True
        leaves = 20
        fps = 30

        imgs = None
        abort = False

        if len(img_arr) != 0:
            try:
                imgs = png2b64(create_images(img_arr, leaves, vthresh, eps, size, movable, std, is_stride))
            except:
                abort = True

        if not abort:
            for i, img in enumerate(imgs):
                response[f'image_{i}'] = img

        response['abort'] = abort
        response['vthresh'] = 
    
    return temp

if __name__ == "__main__":
    # app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
    app.run(debug=True, port=os.getenv("PORT", 5000))
