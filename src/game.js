/* Slimefall — First Contact v0.2: a playable mobile-first boss-fight vertical slice.
 * Original, procedurally drawn pixel art. No build step, account, or backend.
 */
(() => {
  'use strict';
  if (!window.Phaser) return;
  const W = 960, H = 540, FLOOR = 470;
  const $ = id => document.getElementById(id);
  const held = {left: false, right: false, jump: false, attack: false};
  const pulse = {jump: false, switch: false, pause: false};
  let sceneRef = null, muted = true, audio = null;

  function tone(hz, length = .075, shape = 'square', volume = .026) {
    if (muted) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator(), envelope = audio.createGain();
      oscillator.type = shape;
      oscillator.frequency.setValueAtTime(hz, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, hz * .68), audio.currentTime + length);
      envelope.gain.setValueAtTime(volume, audio.currentTime);
      envelope.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
      oscillator.connect(envelope); envelope.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + length);
    } catch (_error) { /* Audio is optional on browsers with restricted playback. */ }
  }
  function bindHold(id, action) {
    const element = $(id), pointerIds = new Set();
    element.addEventListener('pointerdown', event => {
      event.preventDefault();
      pointerIds.add(event.pointerId);
      try { element.setPointerCapture(event.pointerId); } catch (_error) {}
      held[action] = true;
      element.classList.add('pressed');
      if (action === 'jump') pulse.jump = true;
    });
    for (const eventType of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      element.addEventListener(eventType, event => {
        pointerIds.delete(event.pointerId);
        if (!pointerIds.size) { held[action] = false; element.classList.remove('pressed'); }
      });
    }
  }
  bindHold('move-left', 'left'); bindHold('move-right', 'right');
  bindHold('jump', 'jump'); bindHold('attack', 'attack');
  $('switch').addEventListener('pointerdown', event => {event.preventDefault(); pulse.switch = true; tone(540, .055);});
  $('pause').addEventListener('click', () => {pulse.pause = true;});
  $('sound').addEventListener('click', () => {
    muted = !muted;
    $('sound').textContent = muted ? '♫' : '♪';
    $('sound').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    tone(640, .08, 'sine');
  });
  window.addEventListener('blur', () => {Object.keys(held).forEach(k => {held[k] = false;});});
  document.addEventListener('contextmenu', event => event.preventDefault());

  function texture(scene, name, w, h, painter) {
    const g = scene.make.graphics({x: 0, y: 0}, false);
    painter(g);
    g.generateTexture(name, w, h);
    g.destroy();
  }
  function drawHero(g, step) {
    // A small original swordfighter with teal scarf and gold trim. Leg animation is real frames.
    g.fillStyle(0x111a35).fillRect(7, 2, 22, 17).fillRect(5, 10, 26, 17);
    g.fillStyle(0x354b86).fillRect(9, 2, 18, 12).fillRect(6, 12, 24, 17);
    g.fillStyle(0x5379aa).fillRect(11, 3, 15, 5);
    g.fillStyle(0xe8c09f).fillRect(12, 17, 15, 13);
    g.fillStyle(0x1d2c4d).fillRect(22, 20, 3, 4);
    g.fillStyle(0xf7e8c1).fillRect(23, 20, 2, 2);
    g.fillStyle(0x35c6b8).fillRect(10, 28, 20, 5).fillRect(5, 30, 10, 5);
    g.fillStyle(0x1b3761).fillRect(9, 33, 21, 12);
    g.fillStyle(0x527cad).fillRect(11, 35, 17, 3);
    g.fillStyle(0xecc28d).fillRect(26, 35, 6, 10);
    g.fillStyle(0x0b1429).fillRect(10, 44, 8, 9).fillRect(22, 44, 8, 9);
    g.fillStyle(0x385881).fillRect(10, 44 + (step === 1 ? -3 : 0), 8, 7);
    g.fillRect(22, 44 + (step === 2 ? -3 : 0), 8, 7);
    g.fillStyle(0x87e5ce).fillRect(5, 30, 6, 3);
    g.fillStyle(0x7c9bd5).fillRect(7, 12, 3, 7);
  }
  function drawSlime(g, angry = false) {
    // Layered body, specular highlights, pixel silhouette, expressive eyes and crown.
    g.fillStyle(0x102637).fillRoundedRect(4, 15, 120, 92, 35);
    g.fillStyle(0x1d645d).fillRoundedRect(6, 10, 116, 91, 32);
    g.fillStyle(angry ? 0x6fd0a0 : 0x54b8ab).fillRoundedRect(10, 7, 108, 88, 31);
    g.fillStyle(0x8be0b5).fillRoundedRect(17, 10, 92, 63, 26);
    g.fillStyle(0xb6f9da, .78).fillRect(24, 23, 25, 9).fillRect(20, 33, 12, 12);
    g.fillStyle(0x3e998f).fillRect(12, 77, 102, 15);
    g.fillStyle(0x1b3f4c).fillRect(42, 48, 13, 25).fillRect(85, 48, 13, 25);
    g.fillStyle(angry ? 0xfce9b7 : 0xffffff).fillRect(45, 50, 5, 9).fillRect(88, 50, 5, 9);
    if (angry) {g.fillStyle(0x143648).fillRect(37, 42, 19, 6).fillRect(86, 42, 19, 6);}
    g.fillStyle(0x1c505a).fillRect(62, 79, 17, 4);
    g.fillStyle(0x8c632e).fillRect(49, 12, 57, 12);
    g.fillStyle(0xf3c86a).fillRect(49, 9, 58, 13).fillRect(52, 0, 12, 19).fillRect(71, 2, 11, 18).fillRect(94, 0, 11, 19);
    g.fillStyle(0xffe7a3).fillRect(56, 2, 6, 7).fillRect(74, 5, 6, 7).fillRect(97, 2, 6, 7);
    g.fillStyle(0x8bf2e1).fillRect(73, 13, 8, 6);
  }
  function makeArt(scene) {
    ['still', 'step1', 'step2'].forEach((name, index) => texture(scene, 'hero_' + name, 37, 56, g => drawHero(g, index)));
    texture(scene, 'king', 128, 110, g => drawSlime(g, false));
    texture(scene, 'king_angry', 128, 110, g => drawSlime(g, true));
    texture(scene, 'spark', 10, 10, g => {g.fillStyle(0xffffff).fillRect(4, 0, 2, 10).fillRect(0, 4, 10, 2);});
    texture(scene, 'bolt', 28, 18, g => {
      g.fillStyle(0x604b94).fillRect(1, 7, 26, 5);
      g.fillStyle(0xaf7fe9).fillRect(6, 3, 19, 13);
      g.fillStyle(0xf6e5ff).fillRect(12, 6, 13, 6);
    });
    texture(scene, 'wave', 37, 27, g => {
      g.fillStyle(0x904c75).fillTriangle(0, 27, 19, 0, 37, 27);
      g.fillStyle(0xf19b92).fillTriangle(7, 27, 19, 8, 29, 27);
      g.fillStyle(0xffe0ab).fillRect(17, 11, 5, 6);
    });
    texture(scene, 'fall', 24, 26, g => {
      g.fillStyle(0x245365).fillRoundedRect(3, 5, 18, 19, 8);
      g.fillStyle(0x68ceb4).fillRoundedRect(5, 2, 14, 17, 7);
      g.fillStyle(0xccffce).fillRect(8, 5, 4, 5);
    });
  }
  class Battle extends Phaser.Scene {
    constructor() {super('Battle');}
    create() {
      sceneRef = this;
      this.clock = 0; this.playing = false; this.complete = false; this.paused = false;
      this.heroHP = 6; this.maxHeroHP = 6; this.kingHP = 460; this.maxKingHP = 460;
      this.mode = 'sword'; this.attackAt = -9999; this.hitAt = -9999;
      this.lastGround = -9999; this.lastJump = -9999; this.prevJump = false;
      this.pattern = 0; this.bossState = 'idle'; this.until = 2100; this.bossLiftoff = 0;
      this.tasks = []; this.projectiles = []; this.drops = []; this.shockwaves = [];
      this.hitCount = 0; this.runTime = 0; this.lastStep = 0;
      this.cameras.main.setBackgroundColor('#142039');
      this.physics.world.setBounds(20, 0, W - 40, H);
      makeArt(this); this.makeBackdrop(); this.makeStage(); this.makeActors(); this.makeHUD();
      this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,SPACE,UP,W,J,K,P,ESC,ENTER');
      this.input.keyboard.addCapture(['SPACE','UP','LEFT','RIGHT']);
      $('shell').classList.add('menu-open');
      this.panel('SLIMEFALL', 'FIRST CONTACT  •  REBUILT', 'A better fight begins here. Dodge the warnings. Strike between attacks.', 'START FIGHT');
      window.slimefall = {version: '0.2.0', game: this.game, state: () => ({playing:this.playing, paused:this.paused, hp:this.heroHP,bossHP:this.kingHP,bossState:this.bossState,weapon:this.mode,clock:this.clock}), restart: () => this.scene.restart()};
    }
    makeBackdrop() {
      const sky = this.add.graphics().setDepth(-40);
      sky.fillGradientStyle(0x111b32, 0x111b32, 0x324960, 0x324960, 1).fillRect(0, 0, W, H);
      const random = (() => {let seed=873212;return () => ((seed = seed * 16807 % 2147483647) / 2147483647);})();
      for (let i=0; i<100; i++) {
        sky.fillStyle(i % 5 === 0 ? 0xc5e6cb : 0x8ca7c5, .13 + random() * .45);
        sky.fillRect(Math.floor(random()*W), Math.floor(random()*275), i%7?2:3, i%4?2:3);
      }
      this.add.circle(780, 119, 94, 0x8ac7c4, .038).setDepth(-38);
      this.add.circle(780, 119, 70, 0x9dd2ce, .065).setDepth(-37);
      this.add.circle(780, 119, 42, 0xd5eddd, .76).setDepth(-36);
      this.add.circle(792, 107, 10, 0x9ac7bd, .33).setDepth(-35);
      const hills = this.add.graphics().setDepth(-30);
      hills.fillStyle(0x243c50).fillPoints([{x:0,y:411},{x:0,y:355},{x:100,y:380},{x:208,y:274},{x:290,y:376},{x:440,y:310},{x:561,y:382},{x:710,y:295},{x:820,y:385},{x:960,y:286},{x:960,y:468}], true);
      hills.fillStyle(0x1b3345).fillPoints([{x:0,y:468},{x:0,y:410},{x:160,y:356},{x:277,y:432},{x:402,y:340},{x:553,y:419},{x:699,y:360},{x:827,y:419},{x:960,y:350},{x:960,y:468}], true);
      const ruins = this.add.graphics().setDepth(-24);
      for (const [x,w,h] of [[40,45,116],[133,24,80],[390,39,98],[573,31,126],[883,43,133]]) {
        ruins.fillStyle(0x293f4b).fillRect(x, FLOOR-h, w, h);
        ruins.fillStyle(0x3f6164).fillRect(x-9, FLOOR-h-12, w+18, 11);
        ruins.fillStyle(0x172e3c).fillRect(x+7, FLOOR-h+14, 6, 24);
      }
      const fog = this.add.graphics().setDepth(-15);
      fog.fillStyle(0x6bafac,.09).fillRect(0, 407, W, 61);
      fog.fillStyle(0x84b8b2,.04).fillRect(0, 379, W, 25);
      for (let i=0; i<18; i++) {
        const fleck = this.add.rectangle(random()*W, 130+random()*280, 3, 3, i%3?0x9fe1c1:0xf6d59d, .15+random()*.5).setDepth(-10);
        this.tweens.add({targets:fleck, y:fleck.y-15-random()*35, alpha:0, duration:1900+random()*2300, yoyo:true, repeat:-1, delay:random()*1600});
      }
      this.add.text(480, 211, 'THE SUNKEN COURT', {fontFamily:'monospace',fontSize:'12px',color:'#90b5ae',letterSpacing:5}).setOrigin(.5).setAlpha(.44).setDepth(-12);
    }
    makeStage() {
      const g = this.add.graphics().setDepth(-4);
      g.fillStyle(0x121e32).fillRect(0, FLOOR+6, W, H-FLOOR);
      g.fillStyle(0x28434b).fillRect(0, FLOOR, W, 13);
      g.fillStyle(0x70bd9c).fillRect(0, FLOOR, W, 5);
      for (let x=0;x<W;x+=32) {
        g.fillStyle((x/32)%3 ? 0x253a4a:0x304755).fillRect(x,FLOOR+14,30,37);
        g.fillStyle(0x1c2d40).fillRect(x+6,FLOOR+33,14,4);
        if ((x/32)%4===0) {g.fillStyle(0x8ad9b3).fillRect(x+7,FLOOR-6,2,8).fillRect(x+12,FLOOR-11,2,13);}
      }
      // Small pillars are scenery only: the boss fight is visible and unobstructed.
      for (const x of [96,873]) {
        g.fillStyle(0x263f48).fillRect(x,FLOOR-37,26,37);
        g.fillStyle(0x54766b).fillRect(x-5,FLOOR-43,36,7);
        g.fillStyle(0x8dd4b1).fillRect(x+4,FLOOR-44,8,2);
      }
      const ground = this.add.zone(W/2, FLOOR+43, W, 86);
      this.physics.add.existing(ground, true);
      this.ground = ground;
    }
    makeActors() {
      this.heroShadow = this.add.ellipse(222, FLOOR+3, 40, 10, 0x000713,.55).setDepth(1);
      this.kingShadow = this.add.ellipse(705, FLOOR+4, 130, 16, 0x000d18,.58).setDepth(1);
      this.hero = this.physics.add.sprite(230, 423, 'hero_still').setDepth(15);
      this.hero.body.setSize(23, 45).setOffset(8, 8);
      this.hero.setCollideWorldBounds(true).setMaxVelocity(360, 900);
      this.hero.setDragX(1600);
      this.physics.add.collider(this.hero, this.ground);
      this.king = this.physics.add.sprite(715, 405, 'king').setDepth(12);
      this.king.body.setSize(108, 80).setOffset(10, 21);
      this.king.setCollideWorldBounds(true).setMaxVelocity(700, 990).setDragX(1000);
      this.physics.add.collider(this.king, this.ground);
      this.physics.add.overlap(this.hero, this.king, () => {if (this.playing) this.hurtHero(1, this.king.x);});
      this.weaponFx = this.add.graphics().setDepth(21);
      this.warningFx = this.add.graphics().setDepth(8);
    }
    makeHUD() {
      const bg = this.add.graphics().setDepth(50);
      bg.fillStyle(0x09152a,.8).fillRoundedRect(18,14,230,68,10).fillRoundedRect(304,14,352,73,10);
      bg.lineStyle(1,0x6b9ba5,.52).strokeRoundedRect(18,14,230,68,10).strokeRoundedRect(304,14,352,73,10);
      this.add.text(30,22,'WANDERER', {fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#b9dbe1',letterSpacing:2}).setDepth(51);
      this.add.text(324,23,'THE CROWNED OOZE', {fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#d1ffe4',letterSpacing:1}).setDepth(51);
      this.healthText = this.add.text(30,48,'♥ ♥ ♥ ♥ ♥ ♥', {fontFamily:'monospace',fontSize:'19px',color:'#ff9b96'}).setDepth(51);
      this.healthBar = this.add.graphics().setDepth(51);
      this.modeText = this.add.text(25,90,'SWORD  /  PRESS ⇄ TO SWITCH', {fontFamily:'monospace',fontSize:'12px',color:'#b7cadd'}).setDepth(51);
      this.tellText = this.add.text(W/2,110,'', {fontFamily:'monospace',fontStyle:'bold',fontSize:'17px',color:'#ffd3a5',stroke:'#172032',strokeThickness:4}).setOrigin(.5).setDepth(56);
      this.toastText = this.add.text(W/2,164,'', {fontFamily:'monospace',fontStyle:'bold',fontSize:'15px',color:'#dbf5d8',stroke:'#101d2d',strokeThickness:3}).setOrigin(.5).setDepth(56);
      this.updateHUD();
    }
    updateHUD() {
      this.healthText.setText('♥ '.repeat(this.heroHP) + '♡ '.repeat(this.maxHeroHP - this.heroHP));
      this.modeText.setText(this.mode==='sword' ? 'SWORD  •  UP CLOSE' : 'STAR STAFF  •  AUTO-AIM');
      this.healthBar.clear();
      this.healthBar.fillStyle(0x304651).fillRoundedRect(323,55,314,16,5);
      this.healthBar.fillStyle(this.kingHP < this.maxKingHP*.32 ? 0xf5af85 : 0x72dfb6).fillRoundedRect(325,57,Math.max(0,310*this.kingHP/this.maxKingHP),12,4);
      this.healthBar.fillStyle(0xc9f4e2,.55).fillRect(326,58,Math.max(0,306*this.kingHP/this.maxKingHP),2);
    }
    panel(title, eyebrow, message, buttonText) {
      this.playing = false; $('shell').classList.add('menu-open');
      if (this.panelUI) this.panelUI.destroy();
      const c = this.add.container(W/2,H/2).setDepth(200);
      const shade = this.add.rectangle(0,0,W,H,0x071222,.80).setInteractive();
      const cardShadow = this.add.rectangle(5,10,590,324,0x030916,.7);
      const card = this.add.rectangle(0,0,590,324,0x172c44).setStrokeStyle(3,0x75cbb1);
      const small = this.add.text(0,-118,eyebrow,{fontFamily:'monospace',fontSize:'15px',color:'#83dfbc',letterSpacing:3}).setOrigin(.5);
      const head = this.add.text(0,-62,title,{fontFamily:'monospace',fontSize: title.length>12?'42px':'57px',fontStyle:'bold',color:'#f3f5d6'}).setOrigin(.5);
      const detail = this.add.text(0,5,message,{fontFamily:'monospace',fontSize:'15px',color:'#c7e0e7',align:'center',wordWrap:{width:495}}).setOrigin(.5);
      const button = this.add.rectangle(0,103,308,65,0x3a9685).setStrokeStyle(3,0xa5f5d1).setInteractive({useHandCursor:true});
      const label = this.add.text(0,103,buttonText,{fontFamily:'monospace',fontSize:'21px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
      button.on('pointerdown',() => this.dismissPanel());
      c.add([shade,cardShadow,card,small,head,detail,button,label]);
      this.panelUI = c;
    }
    dismissPanel() {
      if (!this.panelUI) return;
      if (this.complete) {this.scene.restart();return;}
      this.panelUI.destroy(); this.panelUI = null;
      $('shell').classList.remove('menu-open');
      this.playing = true; this.paused = false;
      this.physics.world.resume();
      pulse.jump = false; held.jump = false;
      this.until = Math.max(this.until, this.clock + 1150);
      tone(660,.12,'triangle');
    }
    togglePause() {
      if (this.complete) return;
      if (this.paused) {this.dismissPanel();return;}
      if (!this.playing) return;
      this.paused = true; this.physics.world.pause();
      this.panel('PAUSED','SLIMEFALL','Jump over the shockwaves. Tap ⇄ to swap weapons.','CONTINUE');
    }
    finish(win) {
      if (this.complete) return;
      this.complete = true; this.playing = false;
      this.hero.setVelocity(0); this.king.setVelocity(0);
      this.physics.world.pause();
      if (win) {
        this.particles(this.king.x,this.king.y,0xb1f9d9,28,120);
        tone(810,.3,'sine');
        this.panel('VICTORY','THE CROWN IS YOURS', `King defeated • ${Math.floor(this.runTime)}s • ${this.hitCount} hits taken`, 'FIGHT AGAIN');
      } else {
        tone(160,.25,'sawtooth');
        this.panel('DEFEATED','YOU CAN DO THIS','Watch the orange warning. Jump the purple ground waves.','TRY AGAIN');
      }
    }
    particles(x,y,color,count=10,radius=60) {
      const amount = Math.min(count,32);
      for (let i=0;i<amount;i++) {
        const dot = this.add.rectangle(x,y,Phaser.Math.Between(3,7),Phaser.Math.Between(3,7),color,.95).setDepth(28);
        const theta = Math.random() * Math.PI*2, dist = 12 + Math.random()*radius;
        this.tweens.add({targets:dot,x:x+Math.cos(theta)*dist,y:y+Math.sin(theta)*dist+17,alpha:0,angle:Phaser.Math.Between(-180,180),duration:260+Math.random()*300,onComplete:()=>dot.destroy()});
      }
    }
    floatNumber(x,y,amount,color='#f3ffe1') {
      const t = this.add.text(x,y,String(amount),{fontFamily:'monospace',fontSize:'19px',fontStyle:'bold',color,stroke:'#183146',strokeThickness:4}).setOrigin(.5).setDepth(40);
      this.tweens.add({targets:t,y:y-44,alpha:0,duration:630,onComplete:()=>t.destroy()});
    }
    hurtHero(amount, sourceX) {
      if (!this.playing || this.clock-this.hitAt<1150) return;
      this.hitAt = this.clock; this.hitCount++;
      this.heroHP = Math.max(0,this.heroHP-amount);
      this.hero.setVelocityY(-250).setVelocityX(this.hero.x < sourceX ? -290:290);
      this.cameras.main.shake(105,.005);tone(165,.14,'sawtooth');
      this.hero.setTintFill(0xffffff);this.particles(this.hero.x,this.hero.y,0xf5aa9d,8,40);
      this.updateHUD();
      if (!this.heroHP) this.finish(false);
    }
    hurtKing(amount, hitX, hitY) {
      if (!this.playing) return;
      this.kingHP = Math.max(0,this.kingHP-amount);
      this.particles(hitX||this.king.x,hitY||this.king.y,0x9ef3ce,8,46);
      this.floatNumber(this.king.x+Phaser.Math.Between(-25,25),this.king.y-55,amount,amount>=35?'#fff0b3':'#c0fff0');
      this.king.setTintFill(0xffffff);
      this.tweens.add({targets:this.king,alpha:.75,duration:55,yoyo:true,onComplete:()=>this.king?.clearTint()});
      this.cameras.main.shake(50,.0019);tone(520,.057,'triangle');
      this.updateHUD();
      if (!this.kingHP) this.finish(true);
    }
    scheduled(delay,fn) {this.tasks.push({at:this.clock+delay,fn});}
    slash(dir) {
      this.weaponFx.clear();
      const x=this.hero.x+dir*44,y=this.hero.y-8;
      this.weaponFx.lineStyle(12,0x86ffe5,.30);this.weaponFx.beginPath();
      this.weaponFx.arc(x,y,46,dir>0?-.95:2.09,dir>0?1.0:4.18,false);this.weaponFx.strokePath();
      this.weaponFx.lineStyle(5,0xf9f5d3,1);this.weaponFx.beginPath();
      this.weaponFx.arc(x,y,38,dir>0?-1.05:2.09,dir>0?1.0:4.19,false);this.weaponFx.strokePath();
      this.scheduled(100,()=>this.weaponFx.clear());
    }
    strike() {
      const cooldown = this.mode==='sword'?310:345;
      if (!this.playing || this.clock-this.attackAt<cooldown) return;
      this.attackAt=this.clock;
      const dir=this.hero.flipX?-1:1;
      if (this.mode==='sword') {
        this.slash(dir); tone(430,.085,'triangle');
        const inFront=(this.king.x-this.hero.x)*dir > -26;
        const distance=Math.abs(this.king.x-this.hero.x);
        const height=Math.abs(this.king.y-this.hero.y);
        if (inFront && distance<124 && height<100) {
          this.hurtKing(38,this.king.x-dir*35,this.king.y);
          this.hero.setVelocityX(this.hero.body.velocity.x - dir*50);
        }
      } else {
        const dx=this.king.x-this.hero.x,dy=this.king.y-this.hero.y;
        const length=Math.max(1,Math.hypot(dx,dy));
        const orb=this.physics.add.sprite(this.hero.x+dir*22,this.hero.y-8,'bolt').setDepth(25);
        orb.body.setAllowGravity(false);orb.body.setSize(23,12).setOffset(2,3);
        orb.setVelocity(dx/length*690,dy/length*690);orb.rotation=Math.atan2(dy,dx);
        this.projectiles.push({sprite:orb,expiry:this.clock+1000});
        tone(690,.09,'sine');
        this.physics.add.overlap(orb,this.king,()=>{
          if(!orb.active||!this.playing)return;
          orb.destroy();this.hurtKing(19,this.king.x,this.king.y);
        });
      }
    }
    warning(message, duration) {
      this.tellText.setText(message);
      this.tellText.setAlpha(1);
      this.scheduled(duration,()=>{if(this.tellText.text===message)this.tellText.setText('');});
    }
    spawnWave(dir) {
      const wave=this.physics.add.sprite(this.king.x+dir*75,FLOOR-14,'wave').setDepth(20);
      wave.body.setAllowGravity(false);wave.setVelocityX(dir*355);wave.body.setSize(32,19).setOffset(2,6);
      this.shockwaves.push({sprite:wave,expiry:this.clock+1650});
      this.physics.add.overlap(this.hero,wave,()=>{if(this.playing&&wave.active)this.hurtHero(1,wave.x);});
    }
    spawnDrop(x) {
      const drop=this.physics.add.sprite(Phaser.Math.Clamp(x,38,W-38),128,'fall').setDepth(18);
      drop.body.setAllowGravity(true);drop.body.setGravityY(470);drop.setVelocityY(110);
      drop.body.setSize(17,17).setOffset(3,5);
      this.physics.add.overlap(drop,this.hero,()=>{if(drop.active){this.hurtHero(1,drop.x);this.particles(drop.x,drop.y,0x91e6c2,6);drop.destroy();}});
      this.physics.add.collider(drop,this.ground,()=>{if(drop.active){this.particles(drop.x,FLOOR,0x87bca9,7);drop.destroy();}});
      this.drops.push({sprite:drop,expiry:this.clock+2400});
    }
    beginAttack() {
      if(!this.playing)return;
      const moves=['stomp','charge','stomp','rain'];
      const move=moves[this.pattern++%moves.length];
      this.bossState='windup';this.currentMove=move;
      this.until=this.clock+(move==='rain'?800:660);
      this.king.setTexture('king_angry').setTint(move==='charge'?0xfab2ac:0xffdda2);
      const label=move==='stomp'?'▲  GIANT LEAP':move==='charge'?'»  SLIME RUSH':'✦  SLIME RAIN';
      this.warning(label,move==='rain'?1100:850);
      this.warningFx.clear();
      if(move==='charge') {
        this.warningFx.fillStyle(0xfc918c,.25).fillRect(0,FLOOR-58,W,58);
        this.warningFx.lineStyle(3,0xfca08d,.73).lineBetween(0,FLOOR-58,W,FLOOR-58);
      } else if(move==='stomp') {
        this.warningFx.lineStyle(4,0xffd48f,.68).strokeCircle(this.king.x,this.king.y,83);
      }
      tone(move==='rain'?510:230,.14,'sawtooth');
    }
    releaseAttack() {
      this.warningFx.clear();this.king.clearTint().setTexture('king');
      if(this.currentMove==='stomp') {
        this.bossState='air';this.bossLiftoff=this.clock;
        this.king.setVelocityY(-710);
        this.king.setVelocityX(Phaser.Math.Clamp((this.hero.x-this.king.x)*1.35,-435,435));
        this.king.setScale(.95,1.07);tone(270,.10);
      } else if(this.currentMove==='charge') {
        this.bossState='charge';this.until=this.clock+720;
        this.chargeDir=this.hero.x<this.king.x?-1:1;
        this.king.setVelocityX(this.chargeDir*585);
        this.king.setScale(1.13,.87);
        this.particles(this.king.x,FLOOR-6,0x6ed6b6,12,36);
      } else {
        this.bossState='recover';this.until=this.clock+1540;
        const center=this.hero.x;
        for(let i=0;i<6;i++) {
          const spot=Phaser.Math.Clamp(center+(i-2.5)*102,70,W-70);
          this.scheduled(i*135,()=>{
            if(!this.playing)return;
            const mark=this.add.rectangle(spot,FLOOR-4,48,7,0xe8a57a,.62).setDepth(5);
            this.tweens.add({targets:mark,alpha:.18,duration:190,yoyo:true,repeat:1,onComplete:()=>mark.destroy()});
          });
          this.scheduled(350+i*135,()=>{if(this.playing)this.spawnDrop(spot);});
        }
      }
    }
    landed() {
      this.bossState='recover';this.until=this.clock+720;
      this.king.setVelocityX(0).setScale(1.17,.83);
      this.spawnWave(-1);this.spawnWave(1);
      this.particles(this.king.x,FLOOR-8,0xe4d19a,18,100);
      this.cameras.main.shake(125,.005);tone(140,.17,'sawtooth');
      this.warning('JUMP THE SHOCKWAVES!',550);
    }
    animate(now,dt) {
      const onFloor=!!(this.hero.body.blocked.down||this.hero.body.touching.down);
      if(onFloor)this.lastGround=now;
      const dir=Number(held.right||this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(held.left||this.keys.A.isDown||this.keys.LEFT.isDown);
      const target=dir*330;
      const speed=this.hero.body.velocity.x;
      const step=Math.min(1,(dt/1000)*(dir?17:23));
      this.hero.setVelocityX(Phaser.Math.Linear(speed,target,step));
      if(dir)this.hero.setFlipX(dir<0);
      const jumpHeld=held.jump||this.keys.SPACE.isDown||this.keys.UP.isDown||this.keys.W.isDown;
      if(pulse.jump || (jumpHeld && !this.prevJump))this.lastJump=now;
      pulse.jump=false;
      if(now-this.lastJump<=155 && now-this.lastGround<=125) {
        this.hero.setVelocityY(-560);
        this.lastJump=-9999;this.lastGround=-9999;this.particles(this.hero.x,FLOOR-4,0x77cfb6,5,18);
        tone(320,.09,'triangle');
      }
      if(!jumpHeld && this.hero.body.velocity.y < -170) this.hero.setVelocityY(this.hero.body.velocity.y * .87);
      this.prevJump=jumpHeld;
      if(onFloor && Math.abs(this.hero.body.velocity.x)>65) {
        const frame=Math.floor(now/110)%2?'hero_step1':'hero_step2';
        if(this.hero.texture.key!==frame)this.hero.setTexture(frame);
        if(now-this.lastStep>105) {this.lastStep=now;this.particles(this.hero.x,FLOOR-2,0x7ab29c,2,13);}
      } else if(this.hero.texture.key!=='hero_still') this.hero.setTexture('hero_still');
      if(now-this.hitAt<1150) this.hero.alpha=Math.floor(now/90)%2?.32:1;
      else {this.hero.alpha=1;this.hero.clearTint();}
      this.heroShadow.setPosition(this.hero.x,FLOOR+4);
      this.heroShadow.scaleX=Phaser.Math.Clamp(1-(FLOOR-this.hero.body.bottom)/400,.55,1);
      this.kingShadow.setPosition(this.king.x,FLOOR+4);
      this.kingShadow.scaleX=Phaser.Math.Clamp(1-(FLOOR-this.king.body.bottom)/430,.48,1);
      if(this.bossState==='windup')this.king.setScale(1.05 + .035*Math.sin(now/55),.90);
      else if(this.bossState==='idle')this.king.setScale(1 + .018*Math.sin(now/220),1 - .014*Math.sin(now/220));
      if(this.bossState==='air')this.king.angle=Phaser.Math.Clamp(this.king.body.velocity.x*.018,-9,9);
      else this.king.angle=Phaser.Math.Linear(this.king.angle,0,.22);
    }
    update(_t,dt) {
      if(pulse.pause || Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
        pulse.pause=false;this.togglePause();
      }
      if(!this.playing) {
        if(this.panelUI && Phaser.Input.Keyboard.JustDown(this.keys.ENTER))this.dismissPanel();
        pulse.jump=false;pulse.switch=false;return;
      }
      const delta=Math.min(45,Math.max(0,dt));
      this.clock+=delta;this.runTime+=delta/1000;
      for(let i=this.tasks.length-1;i>=0;i--)if(this.clock>=this.tasks[i].at){const task=this.tasks.splice(i,1)[0];task.fn();}
      if(!this.playing)return;
      if(pulse.switch||Phaser.Input.Keyboard.JustDown(this.keys.K)) {
        pulse.switch=false;this.mode=this.mode==='sword'?'staff':'sword';this.updateHUD();tone(650,.065,'sine');
        this.toastText.setText(this.mode==='sword'?'SWORD EQUIPPED':'STAR STAFF EQUIPPED');
        this.scheduled(700,()=>this.toastText.setText(''));
      }
      this.animate(this.clock,delta);
      if(held.attack||this.keys.J.isDown)this.strike();
      // Enemies and projectiles update only while the actual fight runs.
      for(const list of [this.projectiles,this.drops,this.shockwaves]) {
        for(let i=list.length-1;i>=0;i--) {
          const item=list[i];
          if(!item.sprite.active||item.expiry<this.clock||item.sprite.x < -25||item.sprite.x>W+25) {
            if(item.sprite.active)item.sprite.destroy();list.splice(i,1);
          }
        }
      }
      if(this.bossState==='idle'&&this.clock>=this.until)this.beginAttack();
      else if(this.bossState==='windup'&&this.clock>=this.until)this.releaseAttack();
      else if(this.bossState==='air'&&this.clock>this.bossLiftoff+270 && (this.king.body.blocked.down||this.king.body.touching.down))this.landed();
      else if(this.bossState==='charge'&&this.clock>=this.until) {
        this.king.setVelocityX(0).setScale(1);this.bossState='recover';this.until=this.clock+600;
      } else if(this.bossState==='recover'&&this.clock>=this.until) {
        this.king.setScale(1);this.king.setVelocityX(0);
        this.bossState='idle';this.until=this.clock+Phaser.Math.Between(650,1040);
      }
    }
  }
  const game = new Phaser.Game({
    type:Phaser.AUTO, parent:'game', width:W,height:H,
    backgroundColor:'#142139',pixelArt:true, antialias:false,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},
    physics:{default:'arcade',arcade:{gravity:{y:1290},debug:false}},
    render:{roundPixels:true},scene:[Battle],audio:{disableWebAudio:true}
  });
  window.slimefall = {version:'0.2.0',game};
})();
