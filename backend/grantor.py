from typing import Counter, List
import numpy as np
import cv2
from apng import APNG, PNG
import base64
import json

from multiprocessing import shared_memory, Pool
from contextlib import closing

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

def gen_granted_img(canvas_base, showpiece, contours, eps, mask, movable, std, is_stride) -> np.array:
    np.random.seed()
    canvas = np.copy(canvas_base)
    for contour in contours:
        grant(canvas, showpiece, contour, eps, mask, movable, std, is_stride)
    
    return canvas

def manage_gen_granted_img(args):
    return gen_granted_img(*args)

def get_contours(src, thresh=210, only_external=False):
    ## mode:
    # - all: cv2.RETR_LIST
    # - only external: cv2.RETR_EXTERNAL
    if only_external:
        retr_mode = cv2.RETR_EXTERNAL
    else:
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
    return [c.reshape((len(c), 2))[:, ::-1] for c in cont]

def kzs(src, contours, leaves, eps=0.99, size=7, movable=1.5, std=0.15, is_stride=True):  
    grid3 = np.copy(src)
    mask = create_mask(size, MASK_TYPE_CIRCLE)

    pad_width = int(size + np.ceil(movable))+1
    grid_rgba = [np.pad(grid3[:,:,i], (pad_width, pad_width), 'edge') for i in range(len(grid3[0,0]))]
    grid3 = np.asarray(grid_rgba).transpose(1,2,0)
    pimg = np.copy(grid3)

    contours_fixed = [contour + pad_width for contour in contours]

    # canvases = [None] * leaves
    # for i in range(leaves):
    #     canvases[i] = gen_granted_img(grid3, pimg, contours_fixed, eps, mask, movable, std, is_stride)

    map_args = [[grid3, pimg, contours_fixed, eps, mask, movable, std, is_stride] for _ in range(leaves)]
    with closing(Pool()) as pool:
        canvases = pool.map(manage_gen_granted_img, map_args)
        
    return np.array(canvases)[:, pad_width:len(grid3)-pad_width, pad_width:len(grid3[0])-pad_width]

## make frames into './{tmp}/images/'
def create_images(b64_data: str, leaves: int, thresh: float, eps: float, size: int, movable: float, std: float, is_stride: bool, only_external: bool) -> List[np.array]:
    img_data = base64.b64decode(b64_data.encode())
    img_np = np.fromstring(img_data, np.uint8)
    bgra = cv2.imdecode(img_np, -1)
    if len(bgra[0,0]) == 3:
        tmp_a = np.full_like(bgra[:,:,0], 255, dtype=np.uint8)
        bgra = np.insert(bgra, 3, tmp_a, axis=2)

    contours = get_contours(bgra, thresh, only_external)
    generated_images = kzs(bgra, contours, leaves, eps, size, movable, std, is_stride)

    return list(generated_images)
    
def png2b64(images) -> List[str]:
    return [base64.b64encode(cv2.imencode('.png', img)[1]).decode('utf-8') for img in images]

def create_b64_apng(frames, fps):
    pngs = [PNG.from_bytes(cv2.imencode('.png', img)[1].tobytes()) for img in frames]
    apng = APNG()
    for i in pngs:
        apng.append(i, delay=1000//fps)

    return base64.b64encode(apng.to_bytes()).decode('utf-8')