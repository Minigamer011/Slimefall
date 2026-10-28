/* Slimefall: Crownfall v0.4 — an original mobile-first pixel-art boss encounter.
   Hand-coded art and mechanics informed by genre research; no Terraria assets used.
   Runs as a static Phaser 3 site. */
(() => {
  'use strict';
  if (!window.Phaser) return;
  const W = 960, H = 540, GROUND = 465;
  const el = id => document.getElementById(id);
  const down = { left:false, right:false, jump:false, attack:false };
  const pulse = {jump:false, switch:false, pause:false, dash:false};
  let currentScene, audioContext, muted = false;
  const PALETTE = {ink:0x182d3f, sky:0x7bbfe3, leaf:0x3c925c, blue:0x4ca8e6};
  function rand(seed) { let s = seed; return () => ((s=(s*16807)%2147483647)/2147483647); }
  const $audio = (freq,duration=.07,type='square',vol=.024) => {
    if(muted) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if(audioContext.state==='suspended')audioContext.resume();
      const osc=audioContext.createOscillator(), gain=audioContext.createGain();
      osc.type=type; osc.frequency.setValueAtTime(freq,audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(65,freq*.66),audioContext.currentTime+duration);
      gain.gain.setValueAtTime(vol,audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
      osc.connect(gain).connect(audioContext.destination); osc.start();osc.stop(audioContext.currentTime+duration);
    }catch(e){/* Audio may be unavailable without a gesture. */}
  };
  for (const [id,key] of [['move-left','left'],['move-right','right'],['jump','jump'],['attack','attack']]) {
    const button=el(id),pointers=new Set();
    button.addEventListener('pointerdown',ev=>{ev.preventDefault();pointers.add(ev.pointerId);try{button.setPointerCapture(ev.pointerId);}catch(e){}down[key]=true;button.classList.add('pressed');if(key==='jump')pulse.jump=true;});
    for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,ev=>{pointers.delete(ev.pointerId);if(!pointers.size){down[key]=false;button.classList.remove('pressed');}});
  }
  el('switch').addEventListener('pointerdown',ev=>{ev.preventDefault();pulse.switch=true;});
  el('dash').addEventListener('pointerdown',ev=>{ev.preventDefault();pulse.dash=true;});
  el('pause').addEventListener('click',()=>{pulse.pause=true;});
  el('sound').addEventListener('click',()=>{muted=!muted;el('sound').textContent=muted?'♫̸':'♫';el('sound').setAttribute('aria-label',muted?'Unmute sounds':'Mute sounds');$audio(640,.09,'triangle');});
  window.addEventListener('blur',()=>{for(const k of Object.keys(down))down[k]=false;});
  document.addEventListener('contextmenu',ev=>ev.preventDefault());

  function texture(scene,key,w,h,paint){const g=scene.make.graphics({x:0,y:0},false);paint(g);g.generateTexture(key,w,h);g.destroy();}
  function rect(g,c,x,y,w,h,a=1){g.fillStyle(c,a).fillRect(x,y,w,h);}
  // Sprite palette and silhouette are original. Pixel clusters are intentionally shaped,
  // unlike the earlier flat rectangle characters.
  const px=(g,c,x,y,w=1,h=1,z=2)=>rect(g,c,Math.round(x*z),Math.round(y*z),Math.round(w*z),Math.round(h*z));
  function heroArt(g,frame=0){
    const walk=frame===1?1:frame===2?-1:0;
    const airborne=frame===3, slash=frame===4, hurt=frame===5;
    const skin=0xe7b989,bright=0xf6d3a5,shirt=0x57bfc0,shade=0x277886,edge=0x193951;
    // Boots, knees and swinging legs: a readable silhouette on the forest backdrop.
    const ly=airborne?21:22+Math.max(0,walk),ry=airborne?22:22+Math.max(0,-walk);
    px(g,edge,5+walk,ly,5,2);px(g,edge,11-walk,ry,5,2);
    px(g,0x284d6a,6+walk,17,4,ly-16);px(g,0x284d6a,12-walk,17,4,ry-16);
    px(g,0x6d4860,5+walk,ly-1,6,2);px(g,0x6d4860,11-walk,ry-1,6,2);
    px(g,0xd6ebbd,5+walk,ly,5,1);px(g,0xd6ebbd,12-walk,ry,4,1);
    // Scarf with lively, offset tail.
    px(g,0x1d5267,2+(frame%3),13,7,3);px(g,0x4fa6ac,2+(frame%3),13,6,2);
    // Torso and arms.
    px(g,edge,5,12,12,7);px(g,shade,6,13,10,5);px(g,shirt,7,13,7,3);
    px(g,0x9ce1cf,7,13,6,1);px(g,0x29566b,10,17,5,2);
    const armY=slash?10:(airborne?12:15);
    px(g,edge,15,armY,4,5);px(g,skin,16,armY+2,3,3);px(g,bright,17,armY+2,2,1);
    // Face, side-swept hair and a bandanna.
    px(g,edge,5,3,13,10);px(g,skin,6,6,11,7);px(g,bright,7,7,7,4);
    px(g,edge,5,2,13,5);px(g,0x765f62,6,2,11,3);px(g,0xb08067,7,3,7,1);
    px(g,0x356d77,4,5,14,2);px(g,0x83d8bd,4,5,10,1);
    px(g,edge,14,9,2,2);px(g,0xffffff,14,9,1,1);
    px(g,0xb77767,10,12,3,1);
    // Trail and shoulder pin give the character a bright color signature.
    px(g,0xdce6b6,5,13,2,2);px(g,0xb7efca,6,13,1,1);
    if(hurt)px(g,0xfff4d9,6,7,10,5);
    if(slash){px(g,0xbfcf9a,18,5,2,7);px(g,0xf8efd1,18,3,2,5);px(g,0x284956,18,12,3,2);}
  }
  function slimeArt(g,state='idle'){
    // 2px jagged pixel contour with three-dimensional top-light and translucent rim.
    // Independent drawn frames support anticipation, flying and impact instead of stretching one image.
    const phase={idle:0,alert:1,air:2,land:3}[state]||0;
    for(let y=12;y<53;y++){
      const t=(y-12)/41;
      const width= t<.31 ? 12+15*Math.sqrt(Math.max(0,1-(1-t/.31)**2))
          : t<.83 ? 27+Math.sin(t*9)*.65 : 27-10*((t-.83)/.17);
      const cy= phase===2?-1:phase===3?2:0;
      const horizontalShift=phase===1?Math.sin(y*.36)*1.3:0;
      const minX=Math.max(0,Math.ceil(32-width+horizontalShift)),maxX=Math.min(63,Math.floor(32+width+horizontalShift));
      for(let x=minX;x<=maxX;x++){
        const edgeDist=Math.min(x-minX,maxX-x);
        const dither=(x*17+y*23)%17;
        let color=edgeDist<2?0x27668d: y>46?0x2c679c:x<25&&y<31?0xa5e7f2:x<37&&y<40?0x64c7e7:0x419bd0;
        if(edgeDist>5&&y>26&&y<45&&dither===1)color=0x87d3eb;
        if(y>49&&dither<3)color=0x78d2e7;
        px(g,color,x,y+cy);
      }
    }
    // Reflections give the slime a glasslike surface, not a square blob.
    px(g,0xd5f5f8,17,21,10,3);px(g,0xf7fcf0,19,21,4,1);
    px(g,0x9ee8f0,16,24,5,2);px(g,0x9de0f0,42,38,5,2);
    // Face changes to the angry expression during an incoming attack.
    px(g,0x153f69,22,31,5,6);px(g,0x153f69,41,31,5,6);
    px(g,0xfff5d7,23,32,2,2);px(g,0xfff5d7,42,32,2,2);
    px(g,0x254b70,30,42,9,2);px(g,0x3f769b,32,43,5,2);
    if(phase===1){px(g,0x1a496a,21,29,7,2);px(g,0x1a496a,40,29,7,2);}
    // Crown has perspective, jewels and a dark underside to stay legible.
    px(g,0x67542e,22,13,25,6);px(g,0xbb8436,23,8,23,8);
    for(const [x,h] of [[23,8],[31,13],[41,9]]){
      px(g,0xf7c95d,x,15-h,5,h+1);px(g,0xffefa1,x+1,15-h,2,h-2);
    }
    px(g,0xf6e4a0,25,9,19,3);px(g,0x4ea7a7,33,10,5,4);px(g,0xc8f7ed,34,10,2,2);
    px(g,0xffdc88,24,16,20,2);px(g,0x785a30,24,18,20,2);
  }
  function babyArt(g,color=0){
    const base=color===0?0x4598d2:0x55b68c;
    const rim=color===0?0x275c8c:0x276956;
    const light=color===0?0xb3e8ff:0xb8efbc;
    for(let y=4;y<26;y++){
      const w=y<11?8+Math.round(7*Math.sin((y-4)/7*Math.PI/2)):y<21?16:16-(y-21)*2;
      rect(g,rim,17-w,y,w*2,1);
      if(w>3)rect(g,base,18-w,y,w*2-2,1);
    }
    rect(g,light,9,8,12,3);rect(g,0xf7fff4,11,8,5,2);
    rect(g,0x24475e,11,16,3,4);rect(g,0x24475e,23,16,3,4);
    rect(g,0xffffff,12,17,1,1);rect(g,0xffffff,24,17,1,1);
    rect(g,0x2c668c,16,22,6,2);
  }
  function makeArt(scene) {
    for(let i=0;i<6;i++)texture(scene,'runner'+i,44,52,g=>heroArt(g,i));
    for(const state of ['idle','alert','air','land'])texture(scene,'sovereign_'+state,128,110,g=>slimeArt(g,state));
    texture(scene,'minislime',35,28,g=>babyArt(g,0));texture(scene,'minislime_green',35,28,g=>babyArt(g,1));
    texture(scene,'starbolt',20,18,g=>{rect(g,0x395a91,2,7,17,5);rect(g,0x8e7ada,5,4,13,11);rect(g,0xf3d7ff,10,7,7,5);rect(g,0xfdf7d4,13,8,3,2);});
    texture(scene,'shockwave',26,24,g=>{rect(g,0x5c6baa,2,12,22,12);rect(g,0x87adf0,8,5,12,17);rect(g,0xcbd5ff,12,0,5,17);});
    texture(scene,'heartdrop',18,18,g=>{rect(g,0x512943,3,2,5,5);rect(g,0x512943,11,2,5,5);rect(g,0xf47b8e,4,3,10,9);rect(g,0xf47b8e,6,11,6,4);rect(g,0xffcfcc,5,4,4,3);});
  }
  function drawCloud(g,x,y,w) {
    const px=8;
    rect(g,0xb3d8eb,x+24,y+16,w-40,24,.75);
    rect(g,0xd9f1f7,x+16,y+10,w-24,19);rect(g,0xf4fbfa,x+40,y,w-65,23);
    rect(g,0xe4f5f9,x+8,y+19,w-16,11);rect(g,0xffffff,x+45,y+2,Math.max(24,w/3),7,.72);
  }
  function tree(g,x,y,scale,tint=0x34794f){
    const k=scale; const b=(c,a,d,w,h)=>rect(g,c,Math.round(x+a*k),Math.round(y+d*k),Math.round(w*k),Math.round(h*k));
    // Pixel canopy made from overlapping rounded clusters, thin branches and dithered leaves.
    b(0x4e3d36,-7,-102,17,105);b(0x8d6750,-5,-105,5,105);b(0xc19666,0,-83,2,53);
    for(const [dx,dy] of [[-20,-65],[18,-85],[-29,-102],[36,-107]]){
      b(0x715443,Math.min(0,dx),dy,Math.abs(dx)+3,6);b(0xb08560,Math.min(0,dx),dy,Math.abs(dx)+3,2);
    }
    const layer=[[0,-150,47,28,0x2b5f50],[-30,-135,39,29,0x337e5a],[30,-130,43,31,0x3b8a5b],
                 [-20,-167,34,23,tint],[19,-170,37,24,0x4da769],[0,-184,35,22,0x55b26f]];
    for(const [dx,dy,rw,rh,color] of layer){
      for(let row=-rh;row<=rh;row+=7){
        const width=Math.max(4,Math.round(rw*Math.sqrt(Math.max(0,1-row*row/(rh*rh)))));
        b(color,dx-width,dy+row,width*2,7);
        if((row+rh)%14===0)b(0x6bc279,dx-width+8,dy+row,Math.max(8,width/2),3);
      }
    }
    for(let i=0;i<26;i++){
      const dx=Math.sin(i*2.4)*37,dy=-143+Math.sin(i*4.3)*30;
      b(i%4?0x74c980:0xb8dd8e,dx,dy,3+i%3,2+i%2);
    }
  }
  class VerdantCourt extends Phaser.Scene {
    constructor(){super({key:'VerdantCourt'});}
    create(){
      currentScene=this;this.clock=0;this.seconds=0;this.playing=false;this.done=false;this.paused=false;
      this.hp=8;this.maxHP=8;this.bossHP=1050;this.bossMax=1050;this.mana=100;
      this.mode='blade';this.face=1;this.lastAttack=-2000;this.hitUntil=-2000;this.lastGround=-2000;this.lastPressed=-2000;
      this.airJumps=1;this.lastDash=-10000;this.dashUntil=-10000;this.attackPoseUntil=-9999;this.lastTrail=0;this.lastStep=0;
      this.wasJump=false;this.recentJump=-999;this.bossState='idle';this.nextBoss=1900;
      this.bossJump=0;this.bossBorn=0;this.bossPhase=0;this.bossMove='normal';this.bossWarningAt=0;
      this.shots=[];this.waves=[];this.minis=[];this.pickups=[];this.tasks=[];this.lastDusted=0;
      this.combo=0;this.hitsTaken=0;this.rng=rand(20261027);this.maxParticles=0;
      this.physics.world.setBounds(18,-110,W-36,690);this.cameras.main.setBackgroundColor('#7bbfe3');
      makeArt(this);this.backdrop();this.land();this.actors();this.interface();
      this.keys=this.input.keyboard.addKeys('A,D,LEFT,RIGHT,SPACE,UP,W,J,K,P,ESC,ENTER,SHIFT');
      this.input.keyboard.addCapture(['SPACE','UP','LEFT','RIGHT','SHIFT']);
      this.overlay('SLIMEFALL','THE VERDANT CROWN  •  v0.4','Double-jump. Dash through danger. Switch weapons and take the crown.','BEGIN BATTLE');
      window.slimefall={version:'0.4.0',game:this.game,play:()=>this.closeOverlay(),state:()=>({playing:this.playing,hp:this.hp,bossHP:this.bossHP,bossState:this.bossState,weapon:this.mode,minis:this.minis.length,time:Math.floor(this.seconds)}),reset:()=>this.scene.restart()};
    }
    backdrop(){
      const rng=rand(39071),sky=this.add.graphics().setDepth(-60);
      sky.fillGradientStyle(0x68b6e6,0x68b6e6,0xc0e7ed,0xc0e7ed).fillRect(0,0,W,H);
      rect(sky,0xfce2a0,775,56,61,61);rect(sky,0xffefb8,785,66,42,42);
      for(const c of [[75,50,130],[343,81,118],[575,39,148],[815,135,133],[175,159,87]])drawCloud(sky,...c);
      const mountains=this.add.graphics().setDepth(-51);
      mountains.fillStyle(0x91bbcd).fillPoints([{x:0,y:335},{x:0,y:280},{x:110,y:338},{x:232,y:181},{x:355,y:336},{x:494,y:230},{x:600,y:339},{x:761,y:204},{x:890,y:331},{x:960,y:254},{x:960,y:470}],true);
      mountains.fillStyle(0xa8d2d5).fillPoints([{x:0,y:395},{x:0,y:332},{x:138,y:286},{x:267,y:383},{x:445,y:290},{x:594,y:397},{x:751,y:304},{x:960,y:377},{x:960,y:470}],true);
      mountains.fillStyle(0xd6e7e4).fillPoints([{x:197,y:220},{x:232,y:181},{x:267,y:220},{x:247,y:215},{x:235,y:230},{x:218,y:213}],true);
      const rear=this.add.graphics().setDepth(-42);
      rear.fillStyle(0x649b8d).fillPoints([{x:0,y:444},{x:0,y:365},{x:120,y:410},{x:230,y:360},{x:360,y:428},{x:520,y:367},{x:670,y:427},{x:840,y:369},{x:960,y:415},{x:960,y:468}],true);
      for(let i=0;i<22;i++){
        const x=i*51-25,h=35+Math.floor(rng()*63);
        rect(rear,0x46827a,x,455-h,6,h);
        for(let r=0;r<4;r++)rect(rear,r%2?0x4b8c82:0x397777,x-12+r*2,449-h+r*13,30-r*4,13);
      }
      const middle=this.add.graphics().setDepth(-28);
      tree(middle,61,466,.87,0x43885a);tree(middle,903,466,.94,0x3d8556);
      tree(middle,339,469,.53,0x437e60);tree(middle,653,468,.58,0x357e61);
      // Tiny forest details behind the hero.
      for(let i=0;i<54;i++){const x=Math.floor(rng()*W),y=345+Math.floor(rng()*104);rect(middle,i%3?0xbde6c9:0xf2eab5,x,y,2,2,.3+.4*rng());}
      this.sunRays=this.add.rectangle(785,96,220,220,0xfff3b6,.07).setDepth(-54);
      this.tweens.add({targets:this.sunRays,alpha:.13,duration:2700,yoyo:true,repeat:-1});
      for(let i=0;i<16;i++){
        const fleck=this.add.rectangle(rng()*W,235+rng()*206,i%3?3:4,3,i%4?0xffe79a:0xe0fbcb,.35+rng()*.3).setDepth(-12);
        this.tweens.add({targets:fleck,y:fleck.y-28-rng()*16,alpha:.04,duration:1600+rng()*2800,yoyo:true,repeat:-1,delay:rng()*2100});
      }
    }
    land(){
      const ground=this.add.graphics().setDepth(-5);
      rect(ground,0x32613e,0,GROUND,W,75);rect(ground,0x69ac5c,0,GROUND,W,7);rect(ground,0x9fd47b,0,GROUND,W,3);
      for(let i=0;i<40;i++){
        const x=i*24,soil=i%3===0?0x785644:i%3===1?0x856047:0x6f5143;
        rect(ground,soil,x,GROUND+8,23,66);
        rect(ground,0x4f433a,x+3,GROUND+26,9,3);rect(ground,0x99775d,x+13,GROUND+45,6,5);
        rect(ground,0x4d7c48,x+7,GROUND+8,3,13);
        if(i%4===0){rect(ground,0x7aca68,x+9,GROUND-7,3,11);rect(ground,0x6bbd6f,x+14,GROUND-10,2,11);}
        if(i%7===2){rect(ground,0xeec76f,x+11,GROUND-16,3,6);rect(ground,0x4b9f61,x+12,GROUND-10,2,9);}
        if(i%10===0){rect(ground,0xb5abb8,x+15,GROUND-5,8,5);}
      }
      // Floating bridges: one-way physics and wooden slats like a platforming arena.
      this.platforms=[];
      for(const p of [{x:206,y:351,w:248},{x:509,y:289,w:192},{x:795,y:352,w:212}]){
        const d=this.add.graphics().setDepth(5);
        rect(d,0x3d443b,p.x-p.w/2-3,p.y,p.w+6,13);rect(d,0xa97c4e,p.x-p.w/2,p.y,p.w,8);rect(d,0xd1a16a,p.x-p.w/2,p.y,p.w,3);
        for(let x=p.x-p.w/2+10;x<p.x+p.w/2;x+=24){rect(d,0x805a3c,x,p.y+3,2,9);rect(d,0xe5b478,x+7,p.y+1,7,2);}
        const z=this.add.zone(p.x,p.y+4,p.w,11);this.physics.add.existing(z,true);
        z.body.checkCollision.down=false;z.body.checkCollision.left=false;z.body.checkCollision.right=false;z.body.checkCollision.up=true;
        this.platforms.push(z);
        for(let i=0;i<4;i++)rect(d,0x486b56,p.x-p.w/2+14+i*62,p.y+13,2,10+i%3*4);
      }
      // Foreground grass and stones have tiny silhouettes, not just a flat ground strip.
      for(let i=0;i<90;i++){
        const xx=8+i*11+Math.floor(Math.sin(i*9)*4);
        if(i%13===0){rect(ground,0x6c7974,xx,GROUND-6,14,7);rect(ground,0xa4b8a7,xx+2,GROUND-6,7,2);}
        else if(i%9===0){rect(ground,0x4c9655,xx,GROUND-11,2,11);rect(ground,0x6ac574,xx+3,GROUND-8,2,8);}
        else {rect(ground,i%2?0x348848:0x62b961,xx,GROUND-6,2,6);}
      }
      // Brighter foreground flower clusters, slowly floating ambient pollen.
      for(let i=0;i<20;i++){
        const x=17+i*49+(i*17)%23;
        if(i%3===0){rect(ground,0xd7f8a4,x,GROUND-14,3,3);rect(ground,0xffd8ae,x+2,GROUND-16,3,3);}
      }
      const earth=this.add.zone(W/2,GROUND+45,W,90);this.physics.add.existing(earth,true);this.earth=earth;
    }
    actors(){
      this.playerShade=this.add.ellipse(240,GROUND+1,41,9,0x1b433b,.35).setDepth(4);
      this.bossShade=this.add.ellipse(734,GROUND+2,125,17,0x224b52,.4).setDepth(4);
      this.player=this.physics.add.sprite(239,GROUND-26,'runner0').setDepth(19);
      this.player.body.setSize(26,45).setOffset(9,6);
      this.player.setCollideWorldBounds(true).setDragX(1750).setMaxVelocity(400,950);
      this.physics.add.collider(this.player,this.earth);
      for(const z of this.platforms)this.physics.add.collider(this.player,z);
      this.boss=this.physics.add.sprite(729,GROUND-54,'sovereign_idle').setDepth(17);
      this.boss.body.setSize(110,88).setOffset(9,17);
      this.boss.setCollideWorldBounds(true).setMaxVelocity(670,1100).setDragX(700);
      this.physics.add.collider(this.boss,this.earth);
      this.physics.add.overlap(this.player,this.boss,()=>this.hitPlayer(1,this.boss.x));
      this.fx=this.add.graphics().setDepth(43);this.marker=this.add.graphics().setDepth(15);
      this.player.setFlipX(false);
    }
    interface(){
      const ui=this.add.graphics().setDepth(90);
      rect(ui,0x173c49,16,14,212,66,.85);rect(ui,0x173c49,291,14,379,70,.86);
      rect(ui,0x90cfca,16,14,212,3);rect(ui,0xd6c28c,291,14,379,3);
      this.add.text(27,22,'ADVENTURER',{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:'#e9f5ec',letterSpacing:1}).setDepth(92);
      this.add.text(307,21,'THE VERDANT CROWN',{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#fff1bc'}).setDepth(92);
      this.hearts=this.add.text(27,45,'', {fontFamily:'monospace',fontSize:'22px',color:'#ff7788'}).setDepth(92);
      this.bossBar=this.add.graphics().setDepth(92);
      this.weaponName=this.add.text(24,88,'', {fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#ffffff',stroke:'#1e374c',strokeThickness:3}).setDepth(92);
      this.timeText=this.add.text(932,22,'00:00',{fontFamily:'monospace',fontSize:'15px',color:'#28546e',stroke:'#c4e6e4',strokeThickness:2}).setDepth(92).setOrigin(1,0);
      this.telegraphText=this.add.text(480,111,'',{fontFamily:'monospace',fontSize:'17px',fontStyle:'bold',color:'#fff6bc',stroke:'#254b5b',strokeThickness:5}).setOrigin(.5).setDepth(96);
      this.manaBar=this.add.graphics().setDepth(92);
      this.dashBar=this.add.graphics().setDepth(92);
      this.tipText=this.add.text(482,508,'MOVE  •  DOUBLE JUMP  •  DASH  •  ATTACK  •  SWITCH',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#faf8d0',stroke:'#1d5252',strokeThickness:3}).setOrigin(.5).setDepth(91);
      if(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)this.tipText.setVisible(false);
      this.later(7000,()=>this.tipText.setVisible(false));
      this.toast=this.add.text(W/2,153,'',{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#f5fff7',stroke:'#315a53',strokeThickness:3}).setOrigin(.5).setDepth(95);
      this.redrawUI();
    }
    redrawUI(){
      this.hearts.setText('♥'.repeat(this.hp)+'♡'.repeat(this.maxHP-this.hp));
      this.weaponName.setText(this.mode==='blade'?'⚔  LEAFBLADE • CLOSE RANGE':'✦  STAR WAND • AUTO AIM');
      this.bossBar.clear();rect(this.bossBar,0x163748,308,53,343,17);rect(this.bossBar,0xa6dbf2,311,56,337*Math.max(0,this.bossHP/this.bossMax),11);
      rect(this.bossBar,0xffffff,312,57,335*Math.max(0,this.bossHP/this.bossMax),2,.55);
      this.manaBar.clear();rect(this.manaBar,0x284968,25,107,150,6,.85);rect(this.manaBar,0xa798f1,26,108,this.mana/100*148,4);
      this.dashBar.clear();rect(this.dashBar,0x285769,25,120,150,7,.8);
      const ready=Math.min(1,Math.max(0,(this.clock-this.lastDash)/1000));
      rect(this.dashBar,0x8eedc7,27,122,146*ready,3);
    }
    overlay(title,eyebrow,description,action){
      this.playing=false;el('shell').classList.add('menu-open');
      if(this.cover)this.cover.destroy();
      const c=this.add.container(W/2,H/2).setDepth(400);this.cover=c;
      const dim=this.add.rectangle(0,0,W,H,0x143149,.56).setInteractive();
      const shadow=this.add.rectangle(6,9,596,330,0x14283d,.5);
      const panel=this.add.rectangle(0,0,596,330,0x1b4956,.96).setStrokeStyle(4,0xb6dfa5);
      const border=this.add.rectangle(0,0,576,310).setStrokeStyle(1,0x6bada2);
      const eyebrowTxt=this.add.text(0,-119,eyebrow,{fontFamily:'monospace',fontSize:'15px',color:'#d5efbe',letterSpacing:2}).setOrigin(.5);
      const titleTxt=this.add.text(0,-64,title,{fontFamily:'monospace',fontSize:title.length>12?'39px':'60px',fontStyle:'bold',color:'#fff2c7',stroke:'#1b5261',strokeThickness:5}).setOrigin(.5);
      const message=this.add.text(0,11,description,{fontFamily:'monospace',fontSize:'16px',color:'#eafcf5',wordWrap:{width:500},align:'center',lineSpacing:8}).setOrigin(.5);
      const button=this.add.rectangle(0,109,330,68,0x7cb270).setStrokeStyle(3,0xdaefa6).setInteractive({useHandCursor:true});
      const text=this.add.text(0,109,action,{fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',color:'#173a44'}).setOrigin(.5);
      button.on('pointerdown',()=>this.closeOverlay());
      c.add([dim,shadow,panel,border,eyebrowTxt,titleTxt,message,button,text]);
    }
    closeOverlay(){
      if(!this.cover)return;
      if(this.done){this.scene.restart();return;}
      this.cover.destroy();this.cover=null;el('shell').classList.remove('menu-open');
      this.playing=true;this.paused=false;this.physics.world.resume();
      pulse.jump=false;down.jump=false;this.nextBoss=Math.max(this.nextBoss,this.clock+650);$audio(630,.1,'triangle');
    }
    pause(){
      if(this.done)return;
      if(this.paused){this.closeOverlay();return;}
      if(!this.playing)return;
      this.paused=true;this.physics.world.pause();this.overlay('PAUSED','THE VERDANT CROWN','Jump onto the bridges. Swap between blade and wand. Avoid the giant slime.','RESUME');
    }
    finish(won){
      if(this.done)return;
      this.done=true;this.playing=false;this.physics.world.pause();
      this.player.setVelocity(0,0);this.boss.setVelocity(0,0);
      if(won){
        this.confetti(this.boss.x,this.boss.y,0xf8da77,28,145);$audio(840,.24,'triangle');
        let best=null;try{best=Number(localStorage.getItem('slimefall-best')||0);if(!best||this.seconds<best)localStorage.setItem('slimefall-best',String(this.seconds));}catch(e){}
        this.overlay('VICTORY!','THE CROWN HAS FALLEN',`Cleared in ${Math.floor(this.seconds)} seconds  •  ${this.hitsTaken} hits taken`,'FIGHT AGAIN');
      }else{$audio(145,.25,'triangle');this.overlay('DEFEATED','KEEP YOUR FEET MOVING','Use the platforms and dodge the landing waves. Try a different weapon.','TRY AGAIN');}
    }
    later(wait,fn){this.tasks.push({at:this.clock+wait,fn});}
    confetti(x,y,color,count=10,spread=44){
      const n=Math.min(count,32);
      for(let i=0;i<n;i++){
        const p=this.add.rectangle(x,y,3+Math.floor(this.rng()*5),3+Math.floor(this.rng()*5),color,.94).setDepth(64);
        const phi=this.rng()*Math.PI*2,dist=8+this.rng()*spread;
        this.tweens.add({targets:p,x:x+Math.cos(phi)*dist,y:y+Math.sin(phi)*dist+23,alpha:0,duration:310+this.rng()*420,onComplete:()=>p.destroy()});
      }
    }
    afterimage(){
      if(this.clock-this.lastTrail<38)return;this.lastTrail=this.clock;
      const body=this.add.image(this.player.x,this.player.y,this.player.texture.key).setFlipX(this.face<0)
        .setAlpha(.33).setTint(this.dashUntil>this.clock?0xa9f9d4:0xc9f4e4).setDepth(15);
      this.tweens.add({targets:body,alpha:0,scaleX:.8,scaleY:.8,duration:220,onComplete:()=>body.destroy()});
    }
    beginDash(now){
      if(now-this.lastDash<1000||!this.playing)return;
      this.lastDash=now;this.dashUntil=now+160;
      const direction=this.face;
      this.player.setVelocityX(direction*690).setVelocityY(Math.min(0,this.player.body.velocity.y));
      this.hitUntil=Math.max(this.hitUntil,now+180);
      this.confetti(this.player.x-direction*9,this.player.y,0xbaf5d6,16,42);
      this.toastNow('WIND DASH',380);$audio(750,.09,'sawtooth',.016);
    }
    number(x,y,n,c='#fdf3b3'){
      const text=this.add.text(x,y,''+n,{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:c,stroke:'#25517b',strokeThickness:4}).setDepth(65).setOrigin(.5);
      this.tweens.add({targets:text,y:y-45,alpha:0,duration:660,onComplete:()=>text.destroy()});
    }
    hitPlayer(damage,fromX){
      if(!this.playing||this.clock<this.hitUntil)return;
      this.hitUntil=this.clock+1150;this.hitsTaken++;
      this.hp=Math.max(0,this.hp-damage);this.player.setVelocityY(-275).setVelocityX(this.player.x<fromX?-250:250);
      this.player.setTintFill(0xffffff);this.confetti(this.player.x,this.player.y,0xff9c94,9,36);
      this.cameras.main.shake(105,.0037);$audio(180,.1,'triangle');this.redrawUI();
      if(!this.hp)this.finish(false);
    }
    hurtBoss(amount,x,y){
      if(!this.playing||this.bossHP<=0)return;
      const previous=this.bossHP;this.bossHP=Math.max(0,this.bossHP-amount);
      this.number(x,y,amount);this.confetti(x,y,0x8bd2ff,9,42);
      this.boss.setTintFill(0xffffff);this.later(95,()=>{if(this.boss.active)this.boss.clearTint();});
      this.cameras.main.shake(57,.0017);$audio(540,.055,'triangle');
      this.bossPhase=Math.floor(4*(1-this.bossHP/this.bossMax));
      for(const threshold of [.76,.52,.28]){
        if(previous>this.bossMax*threshold && this.bossHP<=this.bossMax*threshold){
          this.later(300,()=>{if(this.playing){this.spawnMini(-1);this.spawnMini(1);this.toastNow('THE SLIME SPLITS!',850);}});
        }
      }
      this.redrawUI();if(this.bossHP<=0)this.finish(true);
    }
    hurtMini(m,damage){if(!m.sprite.active)return;m.hp-=damage;this.confetti(m.sprite.x,m.sprite.y,0x79c7eb,5,18);if(m.hp<=0){
      const x=m.sprite.x,y=m.sprite.y;m.sprite.destroy();$audio(610,.055);
      if(this.hp<this.maxHP&&this.rng()<.28)this.spawnHeart(x,y);
    }}
    spawnHeart(x,y){
      const s=this.physics.add.sprite(x,y-8,'heartdrop').setDepth(24);s.body.setAllowGravity(false);
      this.tweens.add({targets:s,y:y-20,duration:650,yoyo:true,repeat:-1});
      this.physics.add.overlap(this.player,s,()=>{if(s.active){this.hp=Math.min(this.maxHP,this.hp+1);s.destroy();this.redrawUI();this.toastNow('+1 HEART',650);$audio(810,.09,'sine');}});
      this.pickups.push({sprite:s,until:this.clock+8500});
    }
    toastNow(message,duration){this.toast.setText(message);this.later(duration,()=>{if(this.toast.text===message)this.toast.setText('');});}
    blast(){
      const delay=this.mode==='blade'?206:310;
      if(!this.playing||this.clock-this.lastAttack<delay)return;
      if(this.mode==='wand'&&this.mana<10){$audio(135,.03);return;}
      this.lastAttack=this.clock;
      // On mobile, attacks turn to face the closest enemy rather than firing off-screen.
      if(Math.abs(this.boss.x-this.player.x)<215)this.face=this.boss.x>=this.player.x?1:-1;
      this.player.setFlipX(this.face<0);
      if(this.mode==='blade'){
        this.combo=(this.combo+1)%3;const power=this.combo===0?75:55;
        const originX=this.player.x+this.face*26,originY=this.player.y-9;
        const flourish=this.add.graphics().setDepth(45);
        const dir=this.face;
        // Blade draws a pixel-stepped diagonal crescent rather than a smooth debug arc.
        for(let k=0;k<13;k++){
          const theta=-1.18+k*.2+this.combo*.1;
          const rr=42+Math.sin(k/12*Math.PI)*11;
          const x=originX+dir*Math.cos(theta)*rr,y=originY+Math.sin(theta)*rr;
          rect(flourish,0x2b718e,x+dir*3,y+4,15,9,.42);
          rect(flourish,0xe5f9df,x,y,13,5,.93);
          rect(flourish,0xffffff,x+dir*2,y,6,2,.96);
        }
        this.tweens.add({targets:flourish,alpha:0,duration:138,onComplete:()=>flourish.destroy()});
        this.player.setTexture('runner4');this.attackPoseUntil=this.clock+125;
        this.confetti(originX+dir*24,originY,0xcdf8e7,6,25);
        $audio(this.combo===0?515:445,.075,'triangle');
        const dx=this.boss.x-this.player.x,dy=this.boss.y-this.player.y;
        const radius=74+48*this.boss.scaleX;
        if(dx*this.face>-35&&Math.abs(dx)<radius+27&&Math.abs(dy)<111)this.hurtBoss(power,this.boss.x-this.face*30,this.boss.y-7);
        for(const m of this.minis){if(m.sprite.active&& (m.sprite.x-this.player.x)*this.face>-24&&Math.abs(m.sprite.x-this.player.x)<92&&Math.abs(m.sprite.y-this.player.y)<57)this.hurtMini(m,72);}
      }else{
        this.mana=Math.max(0,this.mana-10);
        let target=this.boss;let shortest=Math.hypot(this.boss.x-this.player.x,this.boss.y-this.player.y);
        for(const m of this.minis){if(!m.sprite.active)continue;const d=Math.hypot(m.sprite.x-this.player.x,m.sprite.y-this.player.y);if(d<shortest){shortest=d;target=m.sprite;}}
        const dx=target.x-this.player.x,dy=target.y-this.player.y-4,l=Math.max(1,Math.hypot(dx,dy));
        const orb=this.physics.add.sprite(this.player.x+this.face*24,this.player.y-12,'starbolt').setDepth(28);
        orb.body.setAllowGravity(false);orb.body.setSize(18,14).setOffset(1,2);
        orb.setVelocity(dx/l*695,dy/l*695);orb.rotation=Math.atan2(dy,dx);
        this.shots.push({sprite:orb,until:this.clock+1500});$audio(730,.095,'sine');
        this.physics.add.overlap(orb,this.boss,()=>{if(orb.active&&this.playing){orb.destroy();this.hurtBoss(34,this.boss.x,this.boss.y);}});
        for(const m of this.minis)this.physics.add.overlap(orb,m.sprite,()=>{if(orb.active&&m.sprite.active&&this.playing){orb.destroy();this.hurtMini(m,50);}});
      }
    }
    spawnMini(dir){
      if(this.minis.filter(m=>m.sprite.active).length>=6)return;
      const x=Phaser.Math.Clamp(this.boss.x+dir*45,40,W-40),y=GROUND-22;
      const sprite=this.physics.add.sprite(x,y,this.rng()>.5?'minislime':'minislime_green').setDepth(17);
      sprite.body.setSize(29,22).setOffset(3,5);sprite.setBounce(.1).setCollideWorldBounds(true);
      this.physics.add.collider(sprite,this.earth);
      this.physics.add.overlap(sprite,this.player,()=>this.hitPlayer(1,sprite.x));
      this.minis.push({sprite,hp:76,at:this.clock+200+this.rng()*330,born:this.clock});
      sprite.setVelocity(-dir*70,-275);this.confetti(x,y,0x8bd2ed,12,32);
    }
    wave(dir){
      const x=Phaser.Math.Clamp(this.boss.x+dir*58,22,W-22);
      const s=this.physics.add.sprite(x,GROUND-14,'shockwave').setDepth(22);
      s.body.setAllowGravity(false);s.body.setSize(20,18).setOffset(3,5);s.setVelocityX(dir*275);
      this.physics.add.overlap(s,this.player,()=>{if(s.active)this.hitPlayer(1,s.x);});
      this.waves.push({sprite:s,until:this.clock+2200});
    }
    bossWarn(text,ms){
      this.telegraphText.setText(text);this.telegraphText.setAlpha(1);
      this.later(ms,()=>{if(this.telegraphText.text===text)this.telegraphText.setText('');});
    }
    planBossMove(){
      if(!this.playing)return;
      if(Math.abs(this.boss.x-this.player.x)>580&&this.bossJump>1){this.beginTeleport();return;}
      const types=['normal','normal','short','high'];
      this.bossMove=types[this.bossJump%4];this.bossJump++;
      this.bossState='crouch';this.bossWarningAt=this.clock+420-Math.min(150,this.bossPhase*33);
      const warning=this.bossMove==='high'?'HIGH LEAP — MOVE!':this.bossMove==='short'?'QUICK HOP':'SLIME LEAP';
      this.bossWarn(warning,550);
      this.marker.clear();
      rect(this.marker,this.bossMove==='high'?0xf1ca68:0xc2eabb,this.boss.x-55,GROUND-5,110,5,.6);
      this.boss.setTexture('sovereign_alert');$audio(245,.095,'triangle');
    }
    launchBoss(){
      this.marker.clear();this.boss.setTexture('sovereign_idle');
      this.bossState='air';this.bossBorn=this.clock;
      const jump=this.bossMove==='high'?-705:this.bossMove==='short'?-370:-510;
      const pace=this.bossMove==='high'?1.05:this.bossMove==='short'?.65:.90;
      const dx=this.player.x+this.player.body.velocity.x*.17-this.boss.x;
      const vx=Phaser.Math.Clamp(dx*pace,-350-this.bossPhase*20,350+this.bossPhase*20);
      this.boss.setVelocityY(jump).setVelocityX(vx);
      const flight=2*Math.abs(jump)/1340;
      this.impactX=Phaser.Math.Clamp(this.boss.x+vx*flight,76,W-76);
      this.marker.clear();
      rect(this.marker,0xd65d67,this.impactX-69,GROUND-5,138,5,.6);
      rect(this.marker,0xffe5a7,this.impactX-42,GROUND-7,84,3,.95);
      $audio(310,.12,'triangle');this.confetti(this.boss.x,GROUND-8,0x9ad6ed,13,42);
    }
    bossLanded(){
      this.marker.clear();this.bossState='rest';const haste=Math.min(390,this.bossPhase*110);
      this.nextBoss=this.clock+980-haste+(this.bossMove==='high'?150:0);
      this.boss.setVelocityX(0);this.boss.setTexture('sovereign_land');
      this.confetti(this.boss.x,GROUND-12,0xaddcee,18,68);this.cameras.main.shake(90,.003);$audio(165,.12,'triangle');
      if(this.bossMove==='high'||(this.bossPhase>=2&&this.bossJump%4===0)){
        this.bossWarn('JUMP THE GROUND WAVES!',860);
        this.wave(-1);this.wave(1);
      }
      if(this.bossJump%6===0)this.later(260,()=>{if(this.playing)this.beginTeleport();});
    }
    beginTeleport(){
      if(!this.playing||this.bossState==='teleport'||this.bossState==='hidden')return;
      this.bossState='teleport';this.bossBorn=this.clock;
      this.teleportX=Phaser.Math.Clamp(this.player.x+(this.player.x<W/2?210:-210),90,W-90);
      this.boss.setVelocity(0,0).setAllowGravity(false);
      this.marker.clear();rect(this.marker,0x7b468e,this.teleportX-69,GROUND-8,138,8,.52);
      rect(this.marker,0xffc9ee,this.teleportX-53,GROUND-8,106,4,.94);
      this.bossWarn('WATCH THE PURPLE MARK!',950);
      this.tweens.add({targets:this.boss,alpha:0,duration:490});$audio(285,.22,'sine');
    }
    endTeleport(){
      this.boss.x=this.teleportX;this.boss.y=GROUND-54;
      this.boss.setVelocity(0,0).setAllowGravity(true).setAlpha(1);
      this.bossState='rest';this.nextBoss=this.clock+590;this.marker.clear();
      this.confetti(this.boss.x,this.boss.y,0xcdb1ff,23,78);this.cameras.main.shake(80,.002);
    }
    updateHero(now,dt){
      const body=this.player.body;
      const grounded=!!(body.blocked.down||body.touching.down);
      if(grounded){this.lastGround=now;this.airJumps=1;}
      const axis=Number(down.right||this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(down.left||this.keys.A.isDown||this.keys.LEFT.isDown);
      const v=body.velocity.x,target=axis*355;
      if(axis&&now>this.dashUntil){this.face=axis;this.player.setFlipX(axis<0);}
      const dashing=now<this.dashUntil;
      if(!dashing)this.player.setVelocityX(Phaser.Math.Linear(v,target,Math.min(1,dt/1000*(axis?20:30))));
      else {this.player.setVelocityX(this.face*690);this.afterimage();}
      if(pulse.dash||Phaser.Input.Keyboard.JustDown(this.keys.SHIFT))this.beginDash(now);
      pulse.dash=false;
      const jumping=down.jump||this.keys.SPACE.isDown||this.keys.W.isDown||this.keys.UP.isDown;
      if(pulse.jump||(jumping&&!this.wasJump))this.lastPressed=now;
      pulse.jump=false;
      if(now-this.lastPressed<165){
        if(now-this.lastGround<140){
          this.player.setVelocityY(-580);this.airJumps=1;this.lastPressed=-99999;this.lastGround=-99999;
          this.confetti(this.player.x,this.player.y+19,0xe8eed3,9,27);$audio(390,.07,'triangle');
        }else if(this.airJumps>0&&this.clock-this.lastGround>150){
          this.airJumps--;this.lastPressed=-99999;this.player.setVelocityY(-515);
          this.confetti(this.player.x,this.player.y+13,0xe8fffa,16,36);this.afterimage();
          this.toastNow('CLOUD JUMP',380);$audio(640,.13,'sine');
        }
      }
      if(!jumping&&body.velocity.y<-170&&!dashing)this.player.setVelocityY(body.velocity.y*.85);
      this.wasJump=jumping;
      let tex='runner0';
      if(!grounded)tex='runner3';else if(Math.abs(v)>60)tex='runner'+(1+Math.floor(now/100)%2);
      if(now<this.attackPoseUntil)tex='runner4';
      if(this.player.texture.key!==tex)this.player.setTexture(tex);
      // Impact footsteps and launch dust follow the actual platform rather than the ground.
      if(grounded&&Math.abs(v)>120&&now-this.lastStep>165){
        this.lastStep=now;this.confetti(this.player.x,this.player.body.bottom,0xd3e6b3,3,17);
        $audio(160+(Math.floor(now/165)%2)*25,.024,'triangle',.007);
      }
      if(now<this.hitUntil&&now>this.dashUntil){this.player.alpha=Math.floor(now/95)%2?.45:1;}
      else{this.player.alpha=1;this.player.clearTint();}
      this.playerShade.x=this.player.x;
      this.playerShade.scaleX=Phaser.Math.Clamp(1-(GROUND-this.player.body.bottom)/200,.4,1);
    }
    animateBoss(now){
      const base=1-Math.min(.34,(1-this.bossHP/this.bossMax)*.34);
      const wiggle=Math.sin(now/190)*.017;
      if(this.bossState==='crouch'){this.boss.setScale(base*1.15,base*.82);}
      else if(this.bossState==='air'){this.boss.setScale(base*.87,base*1.12);}
      else if(this.bossState==='teleport'){this.boss.setScale(base*.9,base*1.07);}
      else this.boss.setScale(base*(1+wiggle),base*(1-wiggle));
      const key=this.bossState==='crouch'?'sovereign_alert':this.bossState==='air'?'sovereign_air':this.bossState==='rest'?'sovereign_land':'sovereign_idle';
      if(this.boss.texture.key!==key)this.boss.setTexture(key);
      this.bossShade.x=this.boss.x;this.bossShade.scaleX=Math.max(.37,1-(GROUND-this.boss.body.bottom)/250);
    }
    update(_time,dt){
      if(pulse.pause||Phaser.Input.Keyboard.JustDown(this.keys.P)||Phaser.Input.Keyboard.JustDown(this.keys.ESC)){pulse.pause=false;this.pause();}
      if(!this.playing){if(this.cover&&Phaser.Input.Keyboard.JustDown(this.keys.ENTER))this.closeOverlay();pulse.jump=false;pulse.switch=false;return;}
      const delta=Math.max(0,Math.min(45,dt));this.clock+=delta;this.seconds+=delta/1000;
      for(let i=this.tasks.length-1;i>=0;i--)if(this.clock>=this.tasks[i].at){const task=this.tasks.splice(i,1)[0];task.fn();}
      if(!this.playing)return;
      if(pulse.switch||Phaser.Input.Keyboard.JustDown(this.keys.K)){
        pulse.switch=false;this.mode=this.mode==='blade'?'wand':'blade';this.redrawUI();this.toastNow(this.mode==='blade'?'LEAFBLADE EQUIPPED':'STAR WAND EQUIPPED',700);$audio(610,.055,'sine');
      }
      this.mana=Math.min(100,this.mana+delta*.012);
      this.updateHero(this.clock,delta);
      if(down.attack||this.keys.J.isDown)this.blast();
      for(const group of [this.shots,this.waves,this.pickups])for(let i=group.length-1;i>=0;i--){const m=group[i];if(!m.sprite.active||m.until<this.clock||m.sprite.x<-30||m.sprite.x>W+30){if(m.sprite.active)m.sprite.destroy();group.splice(i,1);}}
      for(let i=this.minis.length-1;i>=0;i--){
        const m=this.minis[i];if(!m.sprite.active){this.minis.splice(i,1);continue;}
        if(this.clock-m.born>16000){m.sprite.destroy();this.minis.splice(i,1);continue;}
        if(this.clock>m.at){m.at=this.clock+850+this.rng()*650;const sign=this.player.x>m.sprite.x?1:-1;m.sprite.setVelocity(sign*(70+this.bossPhase*13),-260);}
      }
      if(this.bossState==='idle'&&this.clock>=this.nextBoss)this.planBossMove();
      else if(this.bossState==='rest'&&this.clock>=this.nextBoss)this.planBossMove();
      else if(this.bossState==='crouch'&&this.clock>=this.bossWarningAt)this.launchBoss();
      else if(this.bossState==='air'&&this.clock-this.bossBorn>260&&(this.boss.body.blocked.down||this.boss.body.touching.down))this.bossLanded();
      else if(this.bossState==='teleport'&&this.clock-this.bossBorn>630)this.endTeleport();
      this.animateBoss(this.clock);
      this.timeText.setText(`${String(Math.floor(this.seconds/60)).padStart(2,'0')}:${String(Math.floor(this.seconds)%60).padStart(2,'0')}`);
      if(this.clock%90<delta)this.redrawUI();
    }
  }
  const game=new Phaser.Game({
    type:Phaser.AUTO,parent:'game',width:W,height:H,
    backgroundColor:'#7bbfe3',pixelArt:true,antialias:false,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},
    physics:{default:'arcade',arcade:{gravity:{y:1340},debug:false}},render:{roundPixels:true},
    scene:[VerdantCourt]
  });
  window.slimefall={version:'0.4.0',game};
})();
