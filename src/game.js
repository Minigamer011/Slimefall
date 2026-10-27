/* Slimefall — first playable vertical slice, original placeholder pixel art.
   Zero build tools, zero account/server dependencies, static GitHub Pages ready.
   Controls: A/D or arrows, Space/Up jump, J attack, K mode, P pause. */
(() => {
  'use strict';
  const W=960,H=540,WORLD=1760,GROUND=498;
  const keysHeld={left:false,right:false,jump:false,attack:false};
  const actions={attackPulse:false,jumpPulse:false,switchPulse:false,pausePulse:false};
  let activeScene=null,muted=true,audioCtx=null;
  const $=id=>document.getElementById(id);
  function chirp(freq=400,dur=.06,wave='square',gain=.025){
    if(muted)return;
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume();
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type=wave;o.frequency.setValueAtTime(freq,audioCtx.currentTime);
      g.gain.setValueAtTime(gain,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
      o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
    }catch(_e){/* audio optional */}
  }
  const pointers=new Set();
  function bindButton(id,key,pulse=false){
    const e=$(id); if(!e)return;
    e.addEventListener('pointerdown',ev=>{
      ev.preventDefault();e.setPointerCapture?.(ev.pointerId);pointers.add(ev.pointerId);
      e.classList.add('pressed');
      if(pulse){actions[key+'Pulse']=true;keysHeld[key]=true;}else keysHeld[key]=true;
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture']){
      e.addEventListener(type,ev=>{pointers.delete(ev.pointerId);e.classList.remove('pressed');keysHeld[key]=false;});
    }
  }
  bindButton('move-left','left');bindButton('move-right','right');
  bindButton('jump','jump',true);bindButton('attack','attack',true);
  bindButton('switch','switch',true);
  $('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'♫':'♪';chirp(530);});
  $('pause').addEventListener('click',()=>actions.pausePulse=true);
  window.addEventListener('blur',()=>{for(const k of Object.keys(keysHeld))keysHeld[k]=false;});
  document.addEventListener('contextmenu',ev=>ev.preventDefault());

  function graphicTexture(scene,name,width,height,draw){
    const g=scene.make.graphics({x:0,y:0},false);draw(g);g.generateTexture(name,width,height);g.destroy();
  }
  function makeTextures(s){
    graphicTexture(s,'hero',34,50,g=>{
      g.fillStyle(0x202742).fillRect(9,5,18,12);g.fillStyle(0x85e8db).fillRect(11,7,15,10);
      g.fillStyle(0xe7c6a4).fillRect(10,12,16,16);g.fillStyle(0x30344e).fillRect(12,14,4,4);
      g.fillStyle(0x3b6599).fillRect(7,28,22,13);g.fillStyle(0xbcd7e9).fillRect(9,29,16,3);
      g.fillStyle(0x222d56).fillRect(8,41,7,8).fillRect(20,41,7,8);
      g.fillStyle(0xc7a47c).fillRect(3,29,6,11).fillRect(29,29,5,11);
    });
    graphicTexture(s,'slime',150,112,g=>{
      g.fillStyle(0x1f4d65).fillRoundedRect(3,16,144,94,42);
      g.fillStyle(0x3c9a95).fillRoundedRect(7,4,136,98,48);
      g.fillStyle(0x6dd4b2).fillRoundedRect(18,9,110,68,36);
      g.fillStyle(0xace9bc).fillRect(25,22,28,10).fillRect(20,33,12,10);
      g.fillStyle(0x194455).fillRect(53,53,12,22).fillRect(101,53,12,22);
      g.fillStyle(0xf4fff2).fillRect(55,54,6,8).fillRect(103,54,6,8);
      g.fillStyle(0x205169).fillRect(72,79,23,5);
      g.fillStyle(0xddb45f).fillRect(68,10,42,9).fillRect(70,0,10,16).fillRect(84,2,10,14).fillRect(99,0,10,16);
      g.fillStyle(0xffe2a3).fillRect(85,5,9,6);
    });
    graphicTexture(s,'bolt',24,14,g=>{g.fillStyle(0x513f7c).fillRect(0,5,24,4);g.fillStyle(0xe3b7ff).fillRect(3,2,18,10);g.fillStyle(0xffffff).fillRect(9,5,12,4);});
    graphicTexture(s,'wave',30,22,g=>{g.fillStyle(0xf1ad7f).fillTriangle(0,22,15,0,30,22);g.fillStyle(0xffdc9a).fillTriangle(8,20,15,6,22,20);});
    graphicTexture(s,'slash',88,64,g=>{g.lineStyle(10,0xd6eaff,.9);g.beginPath();g.arc(42,34,29,-.95,1.05,false);g.strokePath();g.lineStyle(4,0x90f9e9,.8);g.beginPath();g.arc(44,34,37,-1.1,1.2,false);g.strokePath();});
    graphicTexture(s,'ground',64,42,g=>{g.fillStyle(0x364b57).fillRect(0,0,64,42);g.fillStyle(0x568e81).fillRect(0,0,64,9);g.fillStyle(0x8ad1a6).fillRect(0,0,64,3);g.fillStyle(0x223444).fillRect(7,17,15,4).fillRect(33,27,21,4);g.fillStyle(0x477b7a).fillRect(5,12,4,4).fillRect(42,19,4,4);});
  }

  class Arena extends Phaser.Scene{
    constructor(){super('Arena');}
    create(){
      activeScene=this;this.playing=false;this.finished=false;this.pausedOverlay=false;this.mode='blade';
      this.health=100;this.maxHealth=100;this.bossHP=660;this.maxBossHP=660;
      this.lastGrounded=-1000;this.lastJumpPress=-1000;this.attackAt=-1000;this.lastHit=-1000;
      this.bossState='idle';this.bossNext=0;this.waveNext=0;this.bossLandAt=0;
      this.cameras.main.setBackgroundColor('#152541');
      this.physics.world.setBounds(0,0,WORLD,H);
      this.cameras.main.setBounds(0,0,WORLD,H);
      makeTextures(this);this.makeBackground();
      this.platforms=this.physics.add.staticGroup();
      for(let x=0;x<WORLD;x+=64){const p=this.platforms.create(x+32,GROUND+21,'ground');p.refreshBody();}
      for(const [x,y,w] of [[340,387,224],[770,355,186],[1165,392,196],[1515,332,150]]){
        this.add.rectangle(x,y,w,16,0x3b5261).setStrokeStyle(2,0x7acead);
        const p=this.add.zone(x,y,w,15);this.physics.add.existing(p,true);this.platforms.add(p);
      }
      this.hero=this.physics.add.sprite(194,GROUND-30,'hero').setDepth(8);
      this.hero.body.setSize(22,46).setOffset(6,3);
      this.hero.setCollideWorldBounds(true).setMaxVelocity(330,900);
      this.physics.add.collider(this.hero,this.platforms);
      this.boss=this.physics.add.sprite(1240,GROUND-56,'slime').setDepth(7);
      this.boss.body.setSize(133,95).setOffset(9,17);
      this.boss.setCollideWorldBounds(true);
      this.physics.add.collider(this.boss,this.platforms);
      this.boss.setBounce(.04);
      this.physics.add.overlap(this.hero,this.boss,()=>{if(this.playing)this.hurtPlayer(16);});
      this.bolts=this.physics.add.group({allowGravity:false});
      this.waves=this.physics.add.group({allowGravity:false});
      this.physics.add.overlap(this.bolts,this.boss,(boss,bolt)=>{
        if(!bolt.active||!this.playing)return;bolt.destroy();this.damageBoss(24);
      });
      this.physics.add.overlap(this.waves,this.hero,(hero,wave)=>{
        if(!wave.active||!this.playing)return;this.hurtPlayer(14);
      });
      this.cameras.main.startFollow(this.hero,true,.08,.08,150,60);
      this.cameras.main.setZoom(1);
      this.makeHud();
      this.keys=this.input.keyboard.addKeys('A,D,LEFT,RIGHT,SPACE,UP,J,K,P,ESC');
      this.keys.J.on('down',()=>actions.attackPulse=true);
      this.keys.K.on('down',()=>actions.switchPulse=true);
      this.keys.SPACE.on('down',()=>actions.jumpPulse=true);
      this.keys.UP.on('down',()=>actions.jumpPulse=true);
      this.keys.P.on('down',()=>actions.pausePulse=true);
      this.keys.ESC.on('down',()=>actions.pausePulse=true);
      this.showOverlay('SLIMEFALL','FIRST CONTACT','A proper first fight. One boss, one arena, two attacks.','ENTER THE ARENA');
      this.bossNext=this.time.now+2500;
    }
    makeBackground(){
      const sky=this.add.graphics().setScrollFactor(0).setDepth(-20);
      sky.fillGradientStyle(0x132240,0x132240,0x344664,0x344664,1);sky.fillRect(0,0,W,H);
      const rand=(()=>{let n=81923;return ()=>{n=(n*16807)%2147483647;return n/2147483647;};})();
      for(let i=0;i<70;i++){
        sky.fillStyle(i%4===0?0xb7edda:0x7b9ab5,rand()*.48+.13);
        sky.fillRect(rand()*W,rand()*315,1+(rand()*3|0),1+(rand()*2|0));
      }
      const moon=this.add.circle(785,103,46,0xb2d4cf,.13).setScrollFactor(0).setDepth(-19);
      this.add.circle(785,103,29,0xc3dcd2,.32).setScrollFactor(0).setDepth(-19);
      const far=this.add.graphics().setScrollFactor(.18).setDepth(-18);
      far.fillStyle(0x223650);far.fillPoints([{x:-400,y:520},{x:-200,y:365},{x:40,y:430},{x:235,y:305},{x:480,y:440},{x:700,y:335},{x:935,y:445},{x:1200,y:355},{x:1800,y:510}],true);
      const near=this.add.graphics().setScrollFactor(.5).setDepth(-17);
      near.fillStyle(0x263c4d);for(let x=-250;x<WORLD+500;x+=165){const h=65+(rand()*105|0);near.fillRect(x,GROUND-h,46,h);near.fillRect(x-14,GROUND-h-12,75,12);near.fillRect(x+8,GROUND-h-60,24,48);}
      this.add.rectangle(WORLD/2,520,WORLD,44,0x0d1725).setDepth(1);
      const mist=this.add.rectangle(WORLD/2,460,WORLD,82,0x8acdb1,.045).setDepth(-5);
      this.add.text(1520,260,'THE FALLEN KING', {fontFamily:'monospace',fontSize:18,color:'#9ed8ba'}).setAlpha(.32);
    }
    makeHud(){
      const box=this.add.container(0,0).setScrollFactor(0).setDepth(90);
      const g=this.add.graphics();box.add(g);this.hudGraphics=g;
      this.addText=(x,y,txt,size,color)=>{const t=this.add.text(x,y,txt,{fontFamily:'monospace',fontSize:size,color,fontStyle:'bold'}).setScrollFactor(0).setDepth(91);return t;};
      this.hudHealth=this.addText(24,37,'HEALTH  100 / 100',13,'#f4d2cc');
      this.hudMode=this.addText(24,79,'BLADE  •  CLOSE RANGE',12,'#dddef9');
      this.hudBoss=this.addText(W/2-120,33,'CROWN SLIME',15,'#b2ffe0');
      this.hudTip=this.addText(W/2-174,68,'DODGE THE LANDING SHOCKWAVES',10,'#9bb2cf');
      this.hudTip.setAlpha(.8);
      this.hudDraw();
    }
    hudDraw(){
      const g=this.hudGraphics;g.clear();
      g.fillStyle(0x0a1427,.80).fillRoundedRect(14,22,238,80,10).fillRoundedRect(W/2-155,20,310,78,10);
      g.fillStyle(0x2d3e53).fillRoundedRect(23,59,210,13,3);
      g.fillStyle(0xe27c87).fillRoundedRect(23,59,Math.max(0,210*this.health/this.maxHealth),13,3);
      g.fillStyle(0x2d3e53).fillRoundedRect(W/2-135,59,270,10,3);
      g.fillStyle(0x79e9ac).fillRoundedRect(W/2-135,59,Math.max(0,270*this.bossHP/this.maxBossHP),10,3);
      this.hudHealth.setText('HEALTH  '+Math.max(0,this.health)+' / '+this.maxHealth);
      this.hudMode.setText(this.mode==='blade'?'BLADE  •  CLOSE RANGE':'ARC BOLT  •  RANGED');
    }
    showOverlay(title,subtitle,desc,button){
      if(this.overlay)this.overlay.destroy();
      this.playing=false;
      const c=this.add.container(W/2,H/2).setScrollFactor(0).setDepth(200);
      const scr=this.add.rectangle(0,0,W,H,0x081222,.81).setInteractive();
      const pane=this.add.rectangle(0,0,560,320,0x172640).setStrokeStyle(3,0x80b5b5);
      const small=this.add.text(0,-110,subtitle,{fontFamily:'monospace',fontSize:17,color:'#8ff2c9',letterSpacing:4}).setOrigin(.5);
      const head=this.add.text(0,-56,title,{fontFamily:'monospace',fontSize:52,fontStyle:'bold',color:'#f5f3dc'}).setOrigin(.5);
      const caption=this.add.text(0,12,desc,{fontFamily:'monospace',fontSize:13,color:'#afc7d8',align:'center',wordWrap:{width:490}}).setOrigin(.5);
      const btn=this.add.rectangle(0,95,280,60,0x3d8e83).setStrokeStyle(3,0xacf9d2).setInteractive({useHandCursor:true});
      const btnText=this.add.text(0,95,button,{fontFamily:'monospace',fontSize:19,fontStyle:'bold',color:'#f5ffec'}).setOrigin(.5);
      btn.on('pointerdown',()=>{
        chirp(480);this.overlay.destroy();this.overlay=null;
        if(this.finished){this.scene.restart();return;}
        this.playing=true;this.pausedOverlay=false;
        this.bossNext=this.time.now+1700;
      });
      c.add([scr,pane,small,head,caption,btn,btnText]);this.overlay=c;
      // Also allow Enter or Space to start, without requiring a mouse.
      this.input.keyboard.once('keydown-ENTER',()=>{if(this.overlay&&btn.active)btn.emit('pointerdown');});
    }
    end(win){
      if(this.finished)return;this.finished=true;this.playing=false;
      this.hero.setVelocity(0,0);this.boss.setVelocity(0,0);
      if(win){chirp(700,.24,'sine');this.showOverlay('VICTORY','CROWN SHATTERED','You defeated the slime monarch. First prototype complete.','FIGHT AGAIN');}
      else{chirp(140,.35,'sawtooth');this.showOverlay('DEFEATED','TRY AGAIN','Watch the boss windup. Jump the shockwaves.','RETRY');}
    }
    hurtPlayer(n){
      if(this.time.now-this.lastHit<930||this.finished)return;
      this.lastHit=this.time.now;this.health=Math.max(0,this.health-n);
      this.hero.setTintFill(0xffffff);this.time.delayedCall(120,()=>this.hero?.clearTint());
      this.hero.setVelocityY(-260);this.hero.setVelocityX(this.hero.x<this.boss.x?-250:250);
      this.cameras.main.shake(85,.004);chirp(175,.09,'sawtooth');this.hudDraw();
      if(this.health===0)this.end(false);
    }
    damageBoss(n){
      if(this.finished)return;this.bossHP=Math.max(0,this.bossHP-n);
      this.boss.setTintFill(0xffffff);this.time.delayedCall(70,()=>this.boss?.clearTint());
      this.spawnSparks(this.boss.x,this.boss.y,0x87f4cc,14);
      this.cameras.main.shake(55,.003);chirp(490,.055);this.hudDraw();
      if(this.bossHP===0)this.end(true);
    }
    spawnSparks(x,y,color,count=8){
      for(let i=0;i<count;i++){
        const r=this.add.rectangle(x,y,Phaser.Math.Between(3,7),Phaser.Math.Between(3,7),color).setDepth(30);
        const a=Math.random()*6.28,d=Phaser.Math.Between(23,75);
        this.tweens.add({targets:r,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,angle:Phaser.Math.Between(-160,160),duration:Phaser.Math.Between(240,460),onComplete:()=>r.destroy()});
      }
    }
    launchWave(dir){
      const w=this.waves.create(this.boss.x+dir*90,GROUND-13,'wave').setDepth(7);
      w.body.setAllowGravity(false);w.setVelocityX(350*dir);w.body.setSize(26,20);
      this.time.delayedCall(1150,()=>w.active&&w.destroy());
    }
    attack(){
      if(this.time.now-this.attackAt<(this.mode==='blade'?300:250))return;
      this.attackAt=this.time.now;const dir=this.hero.flipX?-1:1;
      if(this.mode==='blade'){
        const x=this.hero.x+dir*52;
        const slash=this.add.image(x,this.hero.y-5,'slash').setFlipX(dir<0).setDepth(11).setAlpha(.95);
        this.tweens.add({targets:slash,alpha:0,scale:1.4,duration:145,onComplete:()=>slash.destroy()});
        const hit=Math.abs(this.boss.x-x)<100 && Math.abs(this.boss.y-this.hero.y)<102;
        if(hit)this.damageBoss(28);
        chirp(hit?600:380,.055);
      }else{
        const b=this.bolts.create(this.hero.x+dir*29,this.hero.y-8,'bolt').setDepth(12).setFlipX(dir<0);
        b.body.setAllowGravity(false);b.body.setSize(20,10);
        b.setVelocityX(dir*800);this.time.delayedCall(800,()=>b.active&&b.destroy());chirp(680,.05,'triangle');
      }
    }
    togglePause(){
      if(this.finished)return;
      if(this.overlay){if(this.pausedOverlay){this.overlay.destroy();this.overlay=null;this.pausedOverlay=false;this.playing=true;}return;}
      this.pausedOverlay=true;this.showOverlay('PAUSED','TAKE YOUR TIME','You can switch attacks with K or ⇄.','RESUME');
    }
    update(t,dt){
      if(actions.pausePulse){actions.pausePulse=false;this.togglePause();}
      if(actions.switchPulse){actions.switchPulse=false;this.mode=this.mode==='blade'?'bolt':'blade';this.hudDraw();chirp(570,.05);}
      if(!this.playing){actions.attackPulse=false;actions.jumpPulse=false;return;}
      const d=Math.min(dt,48)/1000;
      const goLeft=keysHeld.left||this.keys.A.isDown||this.keys.LEFT.isDown;
      const goRight=keysHeld.right||this.keys.D.isDown||this.keys.RIGHT.isDown;
      let target=goLeft===goRight?0:(goLeft?-300:300);
      this.hero.setVelocityX(Phaser.Math.Linear(this.hero.body.velocity.x,target,Math.min(1,d*(target?12:19))));
      if(target)this.hero.setFlipX(target<0);
      const onGround=this.hero.body.blocked.down||this.hero.body.touching.down;
      if(onGround)this.lastGrounded=t;
      const jumpHeld=keysHeld.jump||this.keys.SPACE.isDown||this.keys.UP.isDown;
      if(actions.jumpPulse){this.lastJumpPress=t;actions.jumpPulse=false;}
      if(jumpHeld && !this.prevJumpHeld)this.lastJumpPress=t;
      if(t-this.lastJumpPress<135 && t-this.lastGrounded<105){
        this.hero.setVelocityY(-550);this.lastJumpPress=-9999;this.lastGrounded=-9999;chirp(310,.085,'triangle');
      }
      if(!jumpHeld && this.hero.body.velocity.y<-180)this.hero.setVelocityY(this.hero.body.velocity.y*.86);
      this.prevJumpHeld=jumpHeld;
      if(actions.attackPulse||keysHeld.attack||this.keys.J.isDown){this.attack();actions.attackPulse=false;}
      if(t-this.lastHit<930)this.hero.alpha=Math.sin(t*.04)>0?.5:1;else this.hero.alpha=1;
      // Boss: telegraph -> committed leap -> landing shockwaves.
      if(this.bossState==='idle' && t>this.bossNext){
        this.bossState='windup';this.windupEnd=t+600;this.boss.setTint(0xffd9a3);chirp(220,.20,'triangle');
        this.warning=this.add.text(this.boss.x,this.boss.y-95,'!',{fontFamily:'monospace',fontSize:50,fontStyle:'bold',color:'#ffc78e'}).setOrigin(.5).setDepth(20);
      }
      if(this.bossState==='windup'){
        this.boss.setScale(1+.075*Math.sin(t*.035),.9);
        if(t>=this.windupEnd){
          this.warning?.destroy();this.boss.clearTint().setScale(1);
          this.bossState='air';this.boss.setVelocityY(-680);
          this.boss.setVelocityX(Phaser.Math.Clamp((this.hero.x-this.boss.x)*.85,-390,390));
          this.bossLandAt=t+280;
        }
      }
      if(this.bossState==='air'){
        if(t>this.bossLandAt && (this.boss.body.blocked.down||this.boss.body.touching.down)){
          this.bossState='recover';this.recoverEnd=t+500;
          this.boss.setVelocityX(0);this.launchWave(-1);this.launchWave(1);
          this.spawnSparks(this.boss.x,GROUND-10,0xe7cda0,14);
          this.cameras.main.shake(120,.005);chirp(130,.13,'sawtooth');
        }
      }
      if(this.bossState==='recover'&&t>this.recoverEnd){this.bossState='idle';this.bossNext=t+Phaser.Math.Between(1100,1800);}
      if(this.bossState==='idle')this.boss.setVelocityX(0);
      this.boss.setScale(this.bossState==='windup'?this.boss.scaleX:1,this.bossState==='windup'?.9:1);
    }
  }
  const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#17263d',
    pixelArt:true,antialias:false,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},
    physics:{default:'arcade',arcade:{gravity:{y:1150},debug:false}},
    scene:[Arena],render:{roundPixels:true}});
  window.slimefall={game,version:'0.1.0',reset:()=>activeScene?.scene.restart()};
})();
