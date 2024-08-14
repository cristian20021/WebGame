let game; 


const gameOptions = {
    dudeGravity: 800, 
    dudeSpeed: 300
}

window.onload = function() {
    
    let gameConfig = {
        
        type: Phaser.AUTO, 
        backgroundColor: '#000000', 
        scale: {
            mode: Phaser.Scale.FIT, 
            autoCenter: Phaser.Scale.CENTER_BOTH, 
            width: 800, 
            height: 1000, 
        },
        pixelArt: true, 
        physics: {
            default: "arcade", 
            arcade: {
                gravity: {
                    y: 0 
                }
            }
        },
        scene: PlayGame 
        
    }

    const backgroundColors = ["#ffd580", "#add8e6", "#90ee90"];
    const index = Math.floor(Math.random() * 3);
    const backgroundChoose = backgroundColors[index];

    gameConfig.backgroundColor = backgroundChoose;
    
    game = new Phaser.Game(gameConfig); 
    window.focus(); 
}

class PlayGame extends Phaser.Scene { 

    constructor() {
        super("PlayGame") 
        this.score = 0;
        this.lives = 0; 
        this.air = 30;
    }

    
    preload() {

        this.load.image("ground", "assets/brown platform merged transparen.png") 
        this.load.image("cracked_ground", "assets/brown_platform_cracked.png") 
        this.load.image("orange_star", "assets/orange_star.png")
        this.load.image("star", "assets/star.png") 
        this.load.spritesheet("dude", "assets/dude.png", {frameWidth: 32, frameHeight: 48}) 
        this.load.image("enemy", "assets/enemy.png",{frameWidth: 32, frameHeight: 48});  
        this.load.image("background", "assets/background.jpg");
        this.load.image("protection", "assets/protection.png");
        this.load.image("red_dot", "assets/Basic_red_dot (1).png");
        this.load.image("air", "assets/ClipartKey_1676397 (1).png");
        this.load.audio('jumpSound', 'assets/audio/swing-whoosh-110410.mp3');
        this.load.audio('shoot', 'assets/audio/blaster-2-81267.mp3');
        this.load.audio('coinSound', 'assets/audio/coin_c_02-102844.mp3');
        this.load.audio('deathSound', 'assets/audio/videogame-death-sound-43894.mp3');
        this.load.audio('crackedGroundSound', 'assets/audio/cartoon-jump-6462.mp3');
    } 

    
    create() {
        
        
        this.jumpSound = this.sound.add("jumpSound", {
            volume: 0.7, 
             
        });
        this.shootSound = this.sound.add("shoot", {
            volume: 0.1, 
             
        });
        this.coinSound = this.sound.add("coinSound", {
            volume: 0.3, 
             
        });
        this.deathSound = this.sound.add("deathSound", {
            volume: 0.6, 
             
        });
        this.crackedGroundSound = this.sound.add("crackedGroundSound", {
            volume: 0.7, 
             
        });
       
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        })
        this.fallingGroundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: true,
        });
     
        for (let i = 0; i < 15; i++) {
            const cracked_ground = this.fallingGroundGroup.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "cracked_ground")
            const ground = this.groundGroup.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "ground")
        }
        
        this.redDotsGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });
        
        
        this.decrementPointsTimer = this.time.addEvent({
            delay: 1000, // 1 seconds in milliseconds
            callback: this.decrementPoints,
            callbackScope: this,
            loop: true, 
        });

        this.dude = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, "dude")
        this.dude.body.gravity.y = gameOptions.dudeGravity /1.5
        this.physics.add.collider(this.dude, this.groundGroup) 
        
       
        this.starsGroup = this.physics.add.group({})
        this.physics.add.collider(this.starsGroup, this.groundGroup) 
        this.physics.add.overlap(this.dude, this.starsGroup, this.collectStar, null, this)

        this.enemyGroup = this.physics.add.group({});
        this.physics.add.collider(this.enemyGroup, this.groundGroup) 
        this.physics.add.overlap(this.dude, this.enemyGroup, this.collectStar, null, this)

        
        this.add.image(16, 16, "star")
        this.scoreText = this.add.text(32, 3, "0", {fontSize: "30px", fill: "#ffffff"})

        this.add.image(750, 20, "protection")
        this.livesText = this.add.text(775, 3, "0", {fontSize: "30px", fill: "#ffffff"})

        this.add.image(700, 60, "air")
        this.airText = this.add.text(730, 45, this.air, {fontSize: "30px", fill: "#ffffff"})
       
        this.cursors = this.input.keyboard.createCursorKeys()

        this.physics.add.collider(this.dude, this.cracked_ground) 
        this.physics.add.overlap(this.dude, this.fallingGroundGroup, this.touchFallingGround, null, this);
       
    
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: "turn",
            frames: [{key: "dude", frame: 4}],
            frameRate: 10,
        })

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", {start: 5, end: 9}),
            frameRate: 10,
            repeat: -1
        })

        this.triggerTimer = this.time.addEvent({
            callback: this.addGround,
            callbackScope: this,
            delay: 700,
            loop: true
        })
    }


    decrementPoints() {
        if (this.air >= 1) {
            this.air -= 1;
            this.airText.setText(this.air)
        }else{
            this.score = 0; // Reset the score to the initial value
            this.air = 30; // Update the score display
            this.lives = 0; 
            this.deathSound.play()
            this.scene.start("PlayGame")
          
        }
    }
    
    shootRedDot(pointer) {
        const redDot = this.redDotsGroup.create(this.dude.x, this.dude.y -23, 'red_dot');
        redDot.setVelocity(0,-300); 
        this.physics.add.collider(redDot, this.enemy, this.hitEnemy, null, this);
    }

    hitEnemy(redDot, enemy) {
        redDot.destroy();
        enemy.destroy(); 
    
    }
   
    addGround() {
        console.log("Adding new stuff!")
        this.fallingGroundGroup.setVelocityY(gameOptions.dudeSpeed / 6)
        this.groundGroup.setVelocityY(gameOptions.dudeSpeed / 6)
        
        if (Phaser.Math.Between(0, 3)) {
            this.groundGroup.create(Phaser.Math.Between(0, game.config.width), 0, "ground")
        }else{
            this.fallingGroundGroup.create(Phaser.Math.Between(0, game.config.width), 0, "cracked_ground")
        }
       
        if (Phaser.Math.Between(0, 15)) {
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "star")
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed)
        }else{
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "orange_star")
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed)
        } 

        if (Phaser.Math.Between(0, 10)) {
            console.log('Enemy not added')
        }else{
            this.enemyGroup.create(Phaser.Math.Between(0, game.config.width), 0, "enemy").setScale(2)
            this.enemyGroup.setVelocityY(gameOptions.dudeSpeed)
        }

        if (Phaser.Math.Between(0, 10)) {
            console.log('Air not added')
        }else{
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "air")
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed)
            } 

        if (Phaser.Math.Between(0, 15)) {
        console.log('Protection not added')
        }else{
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "protection")
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed)
        } 
    }
    

    touchFallingGround( dude, cracked_ground) {
        dude.setVelocityY(-gameOptions.dudeGravity / 1.6);
        this.crackedGroundSound.play()
        // console.log('touched')
        cracked_ground.destroy()
       
    }
    

    collectStar(dude, star) {
        star.disableBody(true, true);

        if (star.texture.key === "orange_star") {
        this.score += 5; 
        this.coinSound.play();
    } else if (star.texture.key === "star") {
        this.score += 1; 
        this.coinSound.play();
    }

     else if (star.texture.key === "protection") {
     this.lives += 1; 

    }

     else if (star.texture.key === "air") {
        this.air += 30; 
    }

    else if(star.texture.key == 'enemy'){
        if (this.lives>0){
            console.log('The player is not dead yet')
            this.lives -= 1
        }
        else {
                this.deathSound.play()
                this.scene.start("PlayGame")
                this.lives = 0
                this.score = 0
                this.air = 30
            
                        }
        
    }

    this.scoreText.setText(this.score)
    this.livesText.setText(this.lives)
    this.airText.setText(this.air)

    }

    update() {
        const delay = 20000

        this.physics.overlap(this.redDotsGroup, this.enemyGroup, this.hitEnemy, null, this);

        if (this.cursors.left.isDown) {
            this.dude.body.velocity.x = -gameOptions.dudeSpeed
            this.dude.anims.play("left", true)
        }
        else if(this.cursors.right.isDown) {
            this.dude.body.velocity.x = gameOptions.dudeSpeed
            this.dude.anims.play("right", true)
        }
        else {
            this.dude.body.velocity.x = 0
            this.dude.anims.play("turn", true)
        }

        if(this.cursors.up.isDown ) {
            this.jumpSound.play();
        }

        if(this.cursors.up.isDown && this.dude.body.touching.down) {
            this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6
        }

        if(this.cursors.space.isDown){
            this.shootRedDot()
            this.shootSound.play();
        }

        if(this.dude.y > game.config.height) {
            this.deathSound.play()
            this.scene.start("PlayGame")
            this.lives = 0;
            this.score = 0
            this.air = 30
        }

    }

}

