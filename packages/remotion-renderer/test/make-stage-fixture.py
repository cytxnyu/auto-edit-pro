"""Deterministic, explicitly synthetic alpha-matte test. Does not matte a user's video."""
import json, math, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
E=Path(sys.argv[1]);public=E/'public';subject=public/'subject';source=E/'source-frames'
subject.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
fontpath='C:/Windows/Fonts/Noto Sans SC Bold (TrueType).otf'
font=ImageFont.truetype(fontpath,25);small=ImageFont.truetype(fontpath,18)
W,H=960,540  # Logical design units; draw at 2x in the source/alpha files.
class Draw2x:
    def __init__(self,image): self.draw=ImageDraw.Draw(image)
    def __getattr__(self,name):
        def call(coords,*args,**kwargs):
            scaled=tuple(value*2 for value in coords)
            for key in ('width','radius'):
                if key in kwargs: kwargs[key]*=2
            if 'font' in kwargs: kwargs['font']=kwargs['font'].font_variant(size=kwargs['font'].size*2)
            result=getattr(self.draw,name)(scaled,*args,**kwargs)
            return tuple(value/2 for value in result) if name=='textbbox' else result
        return call
for frame in range(180):
    t=frame-60
    if 0<=t<=12: dx=160*t/12
    elif 12<t<=24: dx=160
    elif 24<t<=45: dx=160*(45-t)/21
    else: dx=0
    bg=Image.new('RGB',(W*2,H*2),'#ddd9d0');d=Draw2x(bg)
    d.rectangle((0,360,W,H),fill='#ada79d')
    for x in range(0,W,120):d.line((x,65,x,355),fill='#c3bdb2',width=2)
    d.rectangle((100,200,280,320),fill='#283b4b');d.rectangle((112,212,268,308),fill='#63879c')
    d.rounded_rectangle((80,340,860,372),radius=8,fill='#766c63')
    d.text((20,12),'SYNTHETIC FIGURE / 合成人物 · 非用户视频',font=small,fill='#313238')
    cut=Image.new('RGBA',(W*2,H*2),(0,0,0,0));a=Draw2x(cut)
    # Same geometry generates the source and alpha sequence, including the moving hand.
    a.rounded_rectangle((422,215,540,484),radius=35,fill='#e98b53',outline='#713f2a',width=3)
    a.line((435,260,395,352,420,404),fill='#e98b53',width=39)
    a.ellipse((402,387,434,423),fill='#f3c3a7',outline='#713f2a',width=2)
    a.line((526,264,566+dx*.5,289,640+dx,264),fill='#e98b53',width=35)
    a.ellipse((625+dx,248,658+dx,280),fill='#f3c3a7',outline='#713f2a',width=2)
    a.ellipse((441,122,526,218),fill='#f3c3a7',outline='#713f2a',width=3)
    a.pieslice((439,113,527,178),180,360,fill='#3a3431')
    a.ellipse((461,160,467,167),fill='#352c25');a.ellipse((498,160,504,167),fill='#352c25')
    a.arc((469,176,501,197),0,180,fill='#713f2a',width=3)
    a.text((441,303),'ALPHA',font=small,fill='#fff0dc')
    cut.save(subject/f'frame-{frame:06d}.png')
    bg.paste(cut,(0,0),cut)
    texts=['这张卡片可以跨过人物中间','跟随右手向右移动，再到人物后面','关键词接力后，原字幕立即恢复']
    text=texts[frame//60];box=d.textbbox((0,0),text,font=font);tw=box[2]-box[0]
    d.rounded_rectangle(((W-tw)/2-15,479,(W+tw)/2+15,526),radius=8,fill='#101923')
    d.text(((W-tw)/2,482),text,font=font,fill='white')
    bg.save(source/f'{frame:06d}.png')
subprocess.run(['ffmpeg','-v','error','-y','-framerate','30','-i',str(source/'%06d.png'),'-frames:v','180','-c:v','libx264','-crf','14','-pix_fmt','yuv420p',str(public/'input.mp4')],check=True)
base={'version':'2.0','presentation':'whole-screen-stage','id':'stage-synthetic-proof','title':'合成人物舞台扩展测试','duration':6,'fps':30,'width':1920,'height':1080,'captionsMode':'burned-in','source':{'video':'input.mp4','subject':{'type':'png-sequence','pattern':'subject/frame-{frame}.png','frameCount':180}},'theme':{'background':'#07101f','foreground':'#f8fafc','accent':'#5eead4'}}
b1={'id':'large-front','start':0,'end':2,'text':'这张卡片可以跨过人物中间','structure':'thesis-and-proof','content':{'structure':'thesis-and-proof','thesis':'大组件，跨过中间','reason':'原有配色、字体与结构'},'motions':['hit'],'placement':'full','palette':'deep-ocean','directorRole':'hook','stage':{'x':.06,'y':.16,'width':.88,'height':.63,'opacity':.9,'surfaceOpacity':.58,'depth':'front','surface':'template','interaction':'speech','keyframes':[{'frame':0,'scale':.92,'opacity':.3},{'frame':9,'scale':1,'opacity':.9}]}}
b2={'id':'gesture-depth','start':2,'end':4,'text':'跟随右手向右移动，再到人物后面','structure':'command-palette','content':{'structure':'command-palette','commandTitle':'跟随右手移动','actions':['向右移动','切到人物后面'],'resultState':'真实透明层'},'motions':['slide'],'placement':'left','palette':'teal-signal','directorRole':'mechanism','stage':{'x':.12,'y':.18,'width':.68,'height':.6,'opacity':.95,'surfaceOpacity':.88,'depth':'front','surface':'template','interaction':'gesture','gesture':{'observedFrames':[60,72,84,105,114],'description':'明确标注的合成人物：右手源帧60→72向右320源像素，72→84停住，84→105回收；包装使用相同帧点跟随。'},'keyframes':[{'frame':0,'x':.12},{'frame':12,'x':.286667},{'frame':24,'x':.286667,'depth':'behind-subject'},{'frame':45,'x':.12},{'frame':54,'depth':'front'}]}}
b3={'id':'keyword-handoff','start':4,'end':6,'text':'关键词接力后，原字幕立即恢复','structure':'four-stage-pipeline','content':{'structure':'four-stage-pipeline','title':'关键词接力，字幕恢复','stages':['原字幕','关键词','归还字幕'],'output':'只在明确窗口接力'},'motions':['relay'],'placement':'full','palette':'deep-ocean','directorRole':'steps','stage':{'x':0,'y':0,'width':1,'height':.8,'opacity':1,'surfaceOpacity':1,'depth':'front','surface':'opaque','coverSubtitles':True,'captionHandoffs':[{'startFrame':18,'endFrame':36,'keyword':'关键词接力','x':.5,'y':.9}],'keyframes':[{'frame':0,'height':.8},{'frame':17,'height':.8},{'frame':18,'height':1},{'frame':35,'height':1},{'frame':36,'height':.8}]}}
base['beats']=[b1,b2,b3]
(E/'props.json').write_text(json.dumps({'storyboard':base,'overlayOnly':False,'cues':[]},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'public':str(public),'props':str(E/'props.json'),'frames':180,'fps':30},ensure_ascii=False))
