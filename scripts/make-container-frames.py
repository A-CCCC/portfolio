# scripts/make-container-frames.py
#
# The Modular Car Container's assembly animation, made from the photos in
# source-photos/modular-car-container/ (kept out of the repository) into
# public/modular-car-container-anim/01..07.webp. Each photo is lined up with
# the empty container (shift, scale and turn, fitted from three stretches of
# its walls the parts never touch), cut to the container's outline with its
# thumb notch open, faded at its foot, and its holes cleared wherever they
# still show the paper under it. Run from the repository's root:
#
#     python3 scripts/make-container-frames.py
from PIL import Image, ImageOps, ImageDraw, ImageFilter
import numpy as np
from collections import deque

S='source-photos/modular-car-container/'
order=['3094','3093','3092','3091','3090','3088','3089']
def load(n): return ImageOps.exif_transpose(Image.open(S+f'IMG_{n}.jpeg')).convert('L')
def edges(im, box):
    a=np.asarray(im.crop(box).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
    gx=np.diff(a,axis=1)[:-1]; gy=np.diff(a,axis=0)[:,:-1]
    return np.hypot(gx,gy)
# regions the parts never touch: the left wall, the right wall, the top rim
BOXES=[(330,150,560,1500),(2200,150,2420,1500),(560,40,2200,300)]
def shift(ref,im):
    acc=[]
    tot=None
    for b in BOXES:
        A=edges(ref,b); B=edges(im,b); A-=A.mean(); B-=B.mean()
        F=np.fft.fft2(A)*np.conj(np.fft.fft2(B)); F/=np.abs(F)+1e-9
        c=np.fft.ifft2(F).real
        tot=c if tot is None else tot+c if c.shape==tot.shape else tot
        acc.append(c)
    # combine by summing each region's peak estimate
    res=[]
    for c in acc:
        y,x=np.unravel_index(c.argmax(),c.shape)
        def sub(v,i,n):
            a,b,d=v[(i-1)%n],v[i],v[(i+1)%n]; den=a-2*b+d
            return i+(0.5*(a-d)/den if den else 0)
        sy=sub(c[:,x],y,c.shape[0]); sx=sub(c[y,:],x,c.shape[1])
        if sy>c.shape[0]/2: sy-=c.shape[0]
        if sx>c.shape[1]/2: sx-=c.shape[1]
        res.append((sx,sy))
    return res
from PIL import Image, ImageOps, ImageDraw, ImageFilter
import numpy as np
from collections import deque
S='source-photos/modular-car-container/'
OUT='public/modular-car-container-anim/'
rgb=lambda n: ImageOps.exif_transpose(Image.open(S+f'IMG_{n}.jpeg')).convert('RGB')
ref=rgb(order[0]); refL=ref.convert('L')
centres=np.array([((b[0]+b[2])/2,(b[1]+b[3])/2) for b in BOXES])
aligned=[ref]
for n in order[1:]:
    im=rgb(n); s=-np.array(shift(refL, im.convert("L")))
    # s(p) = A p + t, exactly through the three regions
    X=np.hstack([centres, np.ones((3,1))])
    cx=np.linalg.solve(X, s[:,0]); cy=np.linalg.solve(X, s[:,1])
    coef=(1+cx[0], cx[1], cx[2], cy[0], 1+cy[1], cy[2])
    aligned.append(im.transform(im.size, Image.AFFINE, coef, resample=Image.BICUBIC))
    print(n, 'fit', np.round(cx,4), np.round(cy,4))
# check
for n,im in zip(order[1:], aligned[1:]):
    print('after', n, [(round(a,2),round(b,2)) for a,b in shift(refL, im.convert('L'))])
M=140; box=(416-M, 80-M, 2344+M, 1504+M)
crops=[a.crop(box) for a in aligned]
L=np.asarray(crops[0].convert('L')).astype(float); W,H=crops[0].size
dark=L<105
def edges(row):
    k=np.convolve(dark[row],np.ones(25),'same')>=24; xs=np.nonzero(k)[0]
    return (xs.min(),xs.max()) if len(xs) else (None,None)
le=[];re=[]
for y in range(int(H*0.15),int(H*0.9)):
    a,b=edges(y)
    if a is not None: le.append((y,a)); re.append((y,b))
le=np.array(le); re=np.array(re)
pl=np.polyfit(le[:,0],le[:,1],1); pr=np.polyfit(re[:,0],re[:,1],1)
colsel=np.nonzero(dark[:, int(W*0.3):int(W*0.7)].mean(1)>0.6)[0]; top,bot=colsel.min(),colsel.max()
xl=lambda y: np.polyval(pl,y); xr=lambda y: np.polyval(pr,y)
# The cut: the container against the paper it stands on. The paper, lit or
# in the container's shadow, is never darker than about 160, the container's
# rim never lighter than about 120, so everything at least 140 that reaches
# the edge of the picture is paper — the thumb notch with it — and the rest
# is the container: its whole rim, its own corners and its lip
bg=Image.fromarray(np.where(L>=140,255,0).astype('uint8')).copy(); bp=bg.load()
for sx,sy in [(x,0) for x in range(W)]+[(x,H-1) for x in range(W)]+[(0,y) for y in range(H)]+[(W-1,y) for y in range(H)]:
    if bp[sx,sy]==255: ImageDraw.floodfill(bg,(sx,sy),128)
solid=np.array(bg)!=128
solid=np.asarray(Image.fromarray((solid*255).astype('uint8')).filter(ImageFilter.MedianFilter(5)))>0
# and only the container: the one piece of it that holds its middle (the
# tripod and the table at the picture's edges are dark too)
pc=Image.fromarray((solid*255).astype('uint8')).copy(); ImageDraw.floodfill(pc,(W//2,H//2),128)
solid=np.array(pc)==128
alpha=Image.fromarray((solid*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))
ys_,xs_=np.nonzero(solid)
cb=(int(xs_.min())-2, int(ys_.min())-2, int(xs_.max())+3, int(ys_.max())+3)
print('cut', cb, 'size', cb[2]-cb[0], cb[3]-cb[1])
OUT_W=1400
fr=[]
for c in crops:
    im=c.copy(); im.putalpha(alpha); im=im.crop(cb); im=im.resize((OUT_W, round(OUT_W*im.height/im.width)), Image.LANCZOS)
    fr.append(np.array(im).astype(float))
# The key frame (6) made from the two either side of it: the hook frame's
# left side and the sunglasses frame's right, where the key is — so the key
# is already where it sits when the sunglasses arrive, and does not shift
# then (it was lifted out and put back between the two photos). The two
# meet at a soft seam down the gap between where the sunglasses end and the
# key begins, where the container is the same in both.
_hw=fr[0].shape[1]
SPLIT, SOFT = 0.728 * _hw, 0.01 * _hw
_m=np.clip((np.arange(_hw)-(SPLIT-SOFT))/(2*SOFT),0,1)[None,:,None]
fr[5]=fr[4]*(1-_m)+fr[6]*_m
ref=fr[0]; L0=ref[...,:3].mean(2); A0=ref[...,3]; H,W=L0.shape
inner=np.asarray(Image.fromarray((A0>250).astype('uint8')*255).filter(ImageFilter.MinFilter(41)))>0
bright=(L0>150)&inner; seen=np.zeros_like(bright); blobs=[]
for y,x in zip(*np.nonzero(bright)):
    if seen[y,x]: continue
    q=deque([(y,x)]); seen[y,x]=True; pts=[]
    while q:
        cy,cx=q.popleft(); pts.append((cy,cx))
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cx+dx
            if 0<=ny<H and 0<=nx<W and bright[ny,nx] and not seen[ny,nx]: seen[ny,nx]=True; q.append((ny,nx))
    p=np.array(pts); blobs.append((p[:,1].min(),p[:,1].max(),p[:,0].min(),p[:,0].max(),len(p)))
med=np.median([b[4] for b in blobs if b[4]>100])
holes=[((x0+x1)/2,(y0+y1)/2) for x0,x1,y0,y1,nn in blobs if 0.4*med<nn<1.8*med and 0.7<(x1-x0+1)/(y1-y0+1)<1.43 and nn/((x1-x0+1)*(y1-y0+1))>0.55]
rad=np.sqrt(med/np.pi); print('holes', len(holes), 'size', W, H)
m=Image.new('L',(W*4,H*4),0); d=ImageDraw.Draw(m)
for cx,cy in holes:
    R=(rad+1.5)*4; d.ellipse([(cx+.5)*4-R,(cy+.5)*4-R,(cx+.5)*4+R,(cy+.5)*4+R],fill=255)
holemask=np.asarray(m.resize((W,H),Image.LANCZOS)).astype(float)/255

# The key holder's ring, traced where it first appears (frame 2): over the
# dark floor its grey plastic is plainly lighter than the floor was, so it
# shows there cleanly; bridged across the holes it passes over, that is the
# rim, thin and exact, kept solid from then on (it is no paler than the
# shadowed paper beside it, so colour alone cannot tell the two apart)
f1=fr[1][...,:3].mean(2)
rim=(f1-L0>28)&(L0<100)
# (looked for on the right of the container, where the holder goes)
bx=np.zeros_like(rim); bx[int(H*0.2):int(H*0.97),int(W*0.62):int(W*0.96)]=True; rim&=bx
rim=np.asarray(Image.fromarray((rim*255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)))>0
# the rim is one smooth loop: its radius from the holder's middle, angle by
# angle, from where it shows, carried round where it does not, and drawn at
# its own thickness
ry,rx=np.nonzero(rim); ocx,ocy=rx.mean(),ry.mean()
ang=np.arctan2(ry-ocy,rx-ocx); rr=np.hypot(rx-ocx,ry-ocy)
NB=360; bins=((ang+np.pi)/(2*np.pi)*NB).astype(int)%NB
med=np.full(NB,np.nan); spread=[]
for k in range(NB):
    v=rr[bins==k]
    if len(v)>=4: med[k]=np.median(v); spread.append(np.percentile(v,85)-np.percentile(v,15))
ok=~np.isnan(med); idx=np.arange(NB)
med=np.interp(idx, np.concatenate([idx[ok]-NB,idx[ok],idx[ok]+NB]), np.tile(med[ok],3))
med=np.convolve(np.tile(med,3),np.ones(7)/7,'same')[NB:2*NB]
half=np.median(spread)/2+2.5
th=(idx+0.5)/NB*2*np.pi-np.pi
SC=4; rm=Image.new('L',(W*SC,H*SC),0); dr=ImageDraw.Draw(rm)
dr.polygon([((ocx+(r+half)*np.cos(t))*SC,(ocy+(r+half)*np.sin(t))*SC) for r,t in zip(med,th)],fill=255)
dr.polygon([((ocx+(r-half)*np.cos(t))*SC,(ocy+(r-half)*np.sin(t))*SC) for r,t in zip(med,th)],fill=0)
ring=np.asarray(rm.resize((W,H),Image.LANCZOS))>100
# and the key fob, which sits inside it: all of the holder within its rim
fm=Image.new('L',(W*SC,H*SC),0)
ImageDraw.Draw(fm).polygon([((ocx+(r-half)*np.cos(t))*SC,(ocy+(r-half)*np.sin(t))*SC) for r,t in zip(med,th)],fill=255)
fob=np.asarray(fm.resize((W,H),Image.LANCZOS))>100
print('rim: centre', round(ocx), round(ocy), 'thickness', round(2*half,1), 'bins seen', int(ok.sum()))
# The key fob is glossy black, and the white holes round it shine in it in
# the photos — a grid of pale spots that reads as the holes showing through
# the key. Each spot over the fob is painted out with the fob's own colour
# from just round the spot, softly at the edge, only ever darkening; the
# logo and the long highlights down its sides lie between the holes.
fob_in=np.asarray(Image.fromarray((fob*255).astype('uint8')).filter(ImageFilter.MinFilter(9)))>0
YY,XX=np.mgrid[0:H,0:W]
for i in (5,6):
    f=fr[i]
    for cx,cy in holes:
        if not fob_in[int(cy),int(cx)]: continue
        x0,x1,y0,y1=int(cx-rad*3),int(cx+rad*3)+1,int(cy-rad*3),int(cy+rad*3)+1
        rr=np.hypot(XX[y0:y1,x0:x1]-cx, YY[y0:y1,x0:x1]-cy)
        inside=fob_in[y0:y1,x0:x1]
        ring_=(rr>rad*1.6)&(rr<rad*2.6)&inside
        if ring_.sum()<20: continue
        patch=f[y0:y1,x0:x1,:3]
        # only made darker, never lighter: down to the gloss round the spot
        base=np.percentile(patch[ring_],60,axis=0)
        w=np.clip((rad*1.6-rr)/(rad*0.8),0,1)*inside
        f[y0:y1,x0:x1,:3]=np.minimum(patch, patch*(1-w[...,None])+base*w[...,None])
for i,f in enumerate(fr):
    c=f[...,:3]; Lf=c.mean(2); sat=c.max(2)-c.min(2)
    paper=(Lf>95)&(sat<34)
    if i>=1: paper&=~ring
    if i>=5: paper&=~fob
    pm=Image.fromarray((paper*255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out=f.copy(); out[...,3]=f[...,3]*(1-holemask*np.asarray(pm).astype(float)/255)
    Image.fromarray(out.clip(0,255).astype('uint8')).save(OUT+f'{i+1:02d}.webp', quality=85)
print('written')
