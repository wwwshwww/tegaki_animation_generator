import os
from flask import Flask, render_template, request, redirect, url_for
import numpy as np
import shutil

import grantor
from grantor import create_images, create_gif

SAVE_DIR = "./generated"

if not os.path.isdir(SAVE_DIR):
    os.mkdir(SAVE_DIR)

app = Flask(__name__, static_url_path="", static_folder="generated")

@app.route('/', methods=['GET', 'POST'])
def index():
    address = None
    fp = None

    if request.method == 'POST':
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

        if len(img_arr) != 0:
            fp = create_images(img_arr, leaves, vthresh, eps, size, movable, std, is_stride)
            create_gif(fp, leaves, fps)
            tmp_address = f'./{fp.name}/{grantor.GIF_DIR}/{fp.name}.gif'
            shutil.copyfile(tmp_address, f'{SAVE_DIR}/{fp.name}.gif')
            # address = os.path.join(f'{fp.name}.gif')
            address = f'{fp.name}.gif'
        
    temp = render_template('index.html', gif=address)
    
    # fp.cleanup()
    return temp

if __name__ == "__main__":
    # app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
    app.run(debug=True, port=os.getenv("PORT", 5000))
