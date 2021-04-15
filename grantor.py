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

MASK_TYPE_CIRCLE = 'circle'
MASK_TYPE_SQUARE = 'square'

def create_mask(size, mode=MASK_TYPE_CIRCLE) -> np.array:
    ch = None
    if mode == MASK_TYPE_SQUARE:
        ch = np.zeros_like([size*2+1, size*2+1])
    elif mode == MASK_TYPE_CIRCLE:
        y, x = np.meshgrid(np.arange(-size, size+1), np.arange(-size, size+1))
        ch = np.linalg.norm([x,y], axis=0, ord=2)
    
    return ch <= size

def grant(canvas, showpiece, contour, eps, mask, movable, std, is_stride):
    size = len(mask)//2
    normals = np.zeros(len(contour))
    for i in range(len(contour)):
        vec = contour[i] - contour[i-1]
        ang = np.arctan2(vec[1], vec[0]) + np.pi/2
        normals[i] = ang

    for i, pos in enumerate(contour):
        if is_stride and (i % (size*2) != 0):
            continue
        cut = np.copy(showpiece[pos[0]-size:pos[0]+size+1, pos[1]-size:pos[1]+size+1])
        if np.random.rand() <= eps:
            rr = np.clip(np.random.normal(0, std), -1,1) * movable
            vec = np.array([rr * np.cos(normals[i]), rr * np.sin(normals[i])])
            pp = np.uint16(vec+pos)
            canvas_t = canvas[pp[0]-size:pp[0]+size+1, pp[1]-size:pp[1]+size+1]
            canvas_t[mask] = cut[mask]

def kzs(src, thresh=210, eps=0.99, size=7, movable=1.5, std=0.15, is_stride=True):
    ## mode:
    # - all: cv2.RETR_LIST
    # - only external: cv2.RETR_EXTERNAL
    retr_mode = cv2.RETR_LIST

    img = src
    img_BGR = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    img_HSV = cv2.cvtColor(img_BGR, cv2.COLOR_BGR2HSV)
    # img_HSV = cv2.GaussianBlur(img_HSV, (9, 9), 3)

    img_H, img_S, img_V = cv2.split(img_HSV)
    _thre, img_cont = cv2.threshold(img_V, thresh, 1, cv2.THRESH_BINARY)
    img_cont = np.logical_not(img_cont)
    grid = np.array(img_cont, dtype=np.uint8)
    cont, hie = cv2.findContours(grid, mode=retr_mode, method=cv2.CHAIN_APPROX_NONE)
    contours = [c.reshape((len(c), 2))[:, ::-1] for c in cont]
        
    grid3 = np.copy(img)
    mask = create_mask(size, MASK_TYPE_CIRCLE)

    pad_width = int(size + np.ceil(movable))+1
    grid_rgba = [np.pad(grid3[:,:,i], (pad_width, pad_width), 'edge') for i in range(len(grid3[0,0]))]
    grid3 = np.asarray(grid_rgba).transpose(1,2,0)
    pimg = np.copy(grid3)

    for c in contours:
        grant(grid3, pimg, c+pad_width, eps, mask, movable, std, is_stride)

    grid3 = np.copy(grid3[pad_width:len(grid3)-pad_width, pad_width:len(grid3[0])-pad_width])
        
    return grid3

## make frames into './{tmp}/images/'
def create_images(src, leaves, thresh, eps, size, movable, std, is_stride) -> tempfile.TemporaryDirectory:
    bgra = cv2.imdecode(src, -1)
    if len(bgra[0,0]) == 3:
        tmp_a = np.full_like(bgra[:,:,0], 255, dtype=np.uint8)
        bgra = np.insert(bgra, 3, tmp_a, axis=2)

    fp = tempfile.TemporaryDirectory(dir='./')
    os.mkdir(f'./{fp.name}/{IMAGES_DIR}')
    images = [kzs(bgra, thresh, eps, size, movable, std, is_stride) for _ in range(leaves)]
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