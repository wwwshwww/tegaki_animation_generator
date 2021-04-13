import numpy as np
import cv2
from PIL import Image
import tempfile
import os

vthresh = 210
eps = 0.99
size = 7
movable = 1.5
std = 0.15
is_stride = True

IMAGES_DIR = 'images'
GIF_DIR = 'gif'

def kzs(src, thresh=210, eps=0.99, size=7, movable=1.5, std=0.15, is_stride=True):
    img = src
    img_HSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # img_HSV = cv2.GaussianBlur(img_HSV, (9, 9), 3)

    img_H, img_S, img_V = cv2.split(img_HSV)
    _thre, img_cont = cv2.threshold(img_V, vthresh, 1, cv2.THRESH_BINARY)
    img_cont = np.logical_not(img_cont)
    grid = np.array(img_cont, dtype=np.uint8)
    cont, hie = cv2.findContours(grid, mode=cv2.RETR_EXTERNAL, method=cv2.CHAIN_APPROX_NONE)
    ps = cont[0].reshape((len(cont[0]), 2))
        
    normals = np.zeros(len(ps))
    for i in range(len(ps)):
        vec = ps[i] - ps[i-1]
        ang = np.arctan2(vec[1], vec[0]) + np.pi/2
        normals[i] = ang
        
    grid3 = np.copy(img)
    pad_width = int(size + np.ceil(movable))+1
    grid_r = np.pad(grid3[:,:,0], (pad_width, pad_width), 'edge')
    grid_g = np.pad(grid3[:,:,1], (pad_width, pad_width), 'edge')
    grid_b = np.pad(grid3[:,:,2], (pad_width, pad_width), 'edge')
    grid3 = np.asarray([grid_r, grid_g, grid_b]).transpose(1,2,0)
    pimg = np.copy(grid3)

    for i, pos in enumerate(ps):
        if is_stride and (i % (size*2+1) != 0):
            continue
        cut = np.copy(pimg[pad_width+pos[1]-size:pad_width+pos[1]+size+1, pad_width+pos[0]-size:pad_width+pos[0]+size+1])
        if np.random.rand() <= eps:
            rr = np.clip(np.random.normal(0, std), -1,1) * movable
            vec = np.array([rr * np.sin(normals[i]), rr * np.cos(normals[i])])
            pp = vec + np.array([vec[0]+pos[1], vec[1]+pos[0]])
        else:
            pp = np.array([pos[1], pos[0]])
    #     pp[0] = min(max(pp[0], size+1), len(grid)-1-size)
    #     pp[1] = min(max(pp[1], size+1), len(grid[0])-1-size)
        pp = np.int16(pp+pad_width)
        grid3[pp[0]-size:pp[0]+size+1, pp[1]-size:pp[1]+size+1] = cut

    grid3 = np.copy(grid3[pad_width:len(grid3)-pad_width, pad_width:len(grid3[0])-pad_width])
        
    return grid3

## make frames into './{tmp}/images/'
def create_images(src, leaves, thresh, eps, size, movable, std, is_stride) -> tempfile.TemporaryDirectory:
    s = cv2.imdecode(src, 1)
    fp = tempfile.TemporaryDirectory(dir='./')
    os.mkdir(f'./{fp.name}/{IMAGES_DIR}')
    images = [kzs(s, thresh, eps, size, movable, std, is_stride) for _ in range(leaves)]
    for i, img in enumerate(images):
        cv2.imwrite(f'{fp.name}/{IMAGES_DIR}/{fp.name}_{i}.png', img)

    return fp

## make gif that glanted momentum into './{tmp}/gif/
def create_gif(fp, leaves, fps):
    images = [None] * leaves
    for i in range(leaves):
        img = cv2.imread(f'{fp.name}/{IMAGES_DIR}/{fp.name}_{i}.png')
        images[i] = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    os.mkdir(f'./{fp.name}/{GIF_DIR}')
    images[0].save(
        f'{fp.name}/{GIF_DIR}/{fp.name}.gif',
        save_all=True,
        append_images=images[1:],
        optimize=False,
        duration=1000//fps,
        loop=0
    )