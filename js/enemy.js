// Monsters and bosses

// --- ENEMY CLASS ---
// barLift = how far above the hitbox the HP bar sits (clears wings / tall sprites)
// Boss and monster toughness, on top of ENEMY_STATS hp
const MOB_HP_SCALE = 6;
const BOSS_HP_SCALE = 4;

const ENEMY_STATS = {
    slime:  { width: 36,  height: 30, hp: 30,  speed: 1.8, damage: 10, scoreValue: 100,  barLift: 10 },
    goblin: { width: 54,  height: 42, hp: 60,  speed: 2.5, damage: 15, scoreValue: 200,  barLift: 10 },
    demon:  { width: 34,  height: 40, hp: 100, speed: 2.2, damage: 25, scoreValue: 350,  barLift: 28 },
    boss:   { width: 100, height: 84, hp: 350, speed: 2.0, damage: 35, scoreValue: 1000, barLift: 14 },
    fish:   { width: 44,  height: 26, hp: 50,  speed: 2.4, damage: 15, scoreValue: 250,  barLift: 10 },
    crab:   { width: 44,  height: 28, hp: 70,  speed: 1.6, damage: 15, scoreValue: 200,  barLift: 10 },
    jelly:  { width: 32,  height: 32, hp: 40,  speed: 0,   damage: 20, scoreValue: 150,  barLift: 10 },
    spider: { width: 36,  height: 24, hp: 40,  speed: 0,   damage: 15, scoreValue: 200,  barLift: 10 },
    spiderling: { width: 26, height: 16, hp: 25, speed: 3.2, damage: 10, scoreValue: 100, barLift: 10 },
    soldier: { width: 30, height: 46, hp: 80, speed: 2.0, damage: 20, scoreValue: 300, barLift: 10 },
    cloud:   { width: 40, height: 26, hp: 50, speed: 2.0, damage: 15, scoreValue: 250, barLift: 10 }
};
// Lowest point a hanging spider drops to (just above the ground)
const SPIDER_DROP_LIMIT = 480 - ENEMY_STATS.spider.height;
const ENEMY_DEATH_TIME = 0.6;

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        Object.assign(this, ENEMY_STATS[type]);
        this.skin = mobSkin(type);
        if (this.skin) {
            this.width = this.skin.w;
            this.height = this.skin.h;
            this.barLift = this.skin.barLift;
        }
        this.speed *= MOVE_SCALE;
        this.hp =Math.round(this.hp * (type === 'boss' ? BOSS_HP_SCALE : MOB_HP_SCALE));
        if (type === 'boss' && currentLevel.bossPower) {
            this.hp = Math.round(this.hp * currentLevel.bossPower);
            this.damage = Math.round(this.damage * currentLevel.bossPower);
        }
        this.maxHp = this.hp;
        this.chatter = type === 'boss' ? null : newChatter();
        // Monster AI (see updateMob): patrol -> chase -> windup -> strike -> recover, or flee when scared
        this.state = 'patrol';
        this.stateTimer = 0;
        this.homeX = x;
        this.homeY = y;
        this.attackCooldown = 1 + Math.random();
        this.jumpCooldown = 0;
        this.lostTimer = 0;
        this.coward = this.chatter && this.chatter.mood === 'coward';
        this.scared = false; // cowards run once they have been hit
        this.weird = null;      // quái dị kind (see WEIRD), set by makeWeird
        this.weirdTimer = 0;    // cooldown of its prank
        this.carriedBy = null;  // held over the bully's head
        this.grabbed = null;    // the minion a bully is holding
        this.thrown = false;    // flying at the hero after being thrown
        this.throwVx = 0;
        this.hasStaff = false;  // Yêu Trộm Gậy holding the hero's staff

        // Bees (demon) and fish hover around their spawn point and chase; jellyfish just drift up and down
        // Hanging spiders sit on a thread at their spawn height and drop onto the player
        this.flying = type === 'demon' || type === 'fish' || type === 'jelly' || type === 'spider' || type === 'cloud';
        this.shootTimer = 1.5; // storm clouds drop a lightning bolt on this timer
        this.baseY = type === 'jelly' || type === 'spider' ? y : y - 50;
        if (this.flying) this.y = this.baseY;
        this.dropState = 'hang';
        this.dropTimer = 0;

        this.vx = this.speed;
        this.vy = 0;
        this.kvx = 0; // knockback velocity, decays every frame
        this.facing = 'right';
        this.patrolLeft = x - 150;
        this.patrolRight = x + 150;
        this.isGrounded = false;
        this.dead = false;
        this.deathTimer = 0;
        this.isHit = false;
        this.hitTimer = 0;
        this.isLunging = false;
        this.animTime = Math.random() * 2;

        if (type === 'boss') {
            this.awake = false;
            this.phase = 1;
            this.state = 'walk';
            this.stateTimer = 1.5;
            this.fireRain = 0;
            this.fireTimer = 0;
            // The boss never leaves the ground platform it spawns over
            const home = currentLevel.platforms.find(p => p.h >= 40 && x >= p.x && x < p.x + p.w);
            this.homeLeft = home ? home.x + 10 : x - 300;
            this.homeRight = home ? home.x + home.w - this.width - 10 : x + 300;
            const size = THEMES[currentLevel.theme] && THEMES[currentLevel.theme].bossSize;
            if (size) {
                this.y += this.height - size.h;
                this.width = size.w;
                this.height = size.h;
            }
        }
    }

    update(dt, player, platforms) {
        if (this.dead) {
            this.animTime += dt;
            this.deathTimer -= dt;
            return;
        }

        if (this.isHit) {
            this.hitTimer -= dt;
            if (this.hitTimer <= 0) this.isHit = false;
        }

        if (this.chatter) this.chat(dt, player);

        if (this.slowTimer > 0) this.slowTimer -= dt;

        if (this.carriedBy) {
            // Held over the bully's head, legs kicking
            const b = this.carriedBy;
            if (b.dead || b.grabbed !== this) {
                this.carriedBy = null;
            } else {
                this.x = b.x + b.width / 2 - this.width / 2;
                this.y = b.y - this.height - 4 + Math.sin(this.animTime * 30) * 2;
                this.vy = 0;
                this.animTime += dt;
            }
        } else if (this.thrown) {
            this.animTime += dt;
            this.updateThrown(platforms);
            if (overlaps(player, this)) {
                player.takeDamage(THROWN_DAMAGE, sideOf(this, player));
            }
        } else if (this.frozen > 0) {
            // Frozen by Định Thân Pháp: no movement, no contact damage, but can still be hit
            this.frozen -= dt;
            this.kvx = 0;
        } else {
            this.animTime += dt;
            if (this.type === 'boss') this.updateBoss(dt, player, platforms);
            else this.updateMob(dt, player, platforms);

            // Hit Player check: walking and diving monsters only hurt while they strike
            if (overlaps(player, this) && this.harmful()) {
                if (this.weird === 'thief' && !this.hasStaff && !player.troll && !player.isDead && !player.isDashing && !player.skill) {
                    this.stealStaff(player);
                } else {
                    player.takeDamage(this.damage);
                }
            }
        }

        // Attacked by Player
        if (player.isAttacking && overlaps(player.attackBox, this)) {
            const damage = Math.round((25 + player.attackCombo * 10) * damageMultiplier() * player.attackPower());
            if (this.takeDamage(damage, player.facing)) {
                player.gainMp(8 + 3 * upgradeLevel('mp'));
                addImpact(player, this);
            }
        }
    }

    // Contact damage: walkers and divers only while striking; jellies, spiders, clouds and bosses always
    harmful() {
        if (this.weird === 'stream') return false; // too busy filming
        if (this.type === 'boss' || this.type === 'jelly' || this.type === 'spider' || this.type === 'cloud') return true;
        return this.state === 'strike';
    }

    makeWeird(kind) {
        this.weird = kind;
        this.weirdTimer = 1 + Math.random() * 2;
        this.damage = Math.max(1, Math.round(this.damage * WEIRD_DAMAGE));
        this.coward = false;
        this.chatter = { mood: 'weird', kind, timer: 1 + Math.random() * 3 };
    }

    // Would a throw with this launch speed land on a platform (same steps as updateThrown)?
    throwLands(vx, vy, platforms) {
        let x = this.x, y = this.y;
        for (let f = 0; f < 240 && y < GAME_HEIGHT + 60; f++) {
            x += vx;
            vy += 0.65;
            y += vy;
            if (vy > 0 && platforms.some(p => x < p.x + p.w && x + this.width > p.x && y < p.y + p.h && y + this.height > p.y)) return true;
        }
        return false;
    }

    // Flying in an arc after the bully threw it; lands dazed
    updateThrown(platforms) {
        this.x += this.throwVx;
        this.applyGravity(platforms);
        if (this.isGrounded) {
            this.thrown = false;
            this.kvx = 0;
            addShake(3);
            createHitSparks(this.x + this.width / 2, this.y + this.height, '#d6d3d1', 8);
            this.setMobState('recover', 1);
            this.strikeDir = 0;
            if (Math.random() < 0.6) say(this, pickOne(['Ui da... hạ cánh rồi.', 'Đại ca, em nhớ mặt anh đấy!', 'Lần sau anh tự bay đi!']), 'coward', 1.8);
        } else if (this.y > GAME_HEIGHT + 60) {
            this.thrown = false;
            Object.assign(this, { x: this.homeX, y: this.homeY, vy: 0, kvx: 0 });
            this.setMobState('patrol', 0);
        }
    }

    stealStaff(player) {
        this.hasStaff = true;
        player.setTroll('unarmed');
        player.isAttacking = false;
        playSound('slash');
        createHitSparks(player.x + player.width / 2, player.y + 20, '#facc15', 12);
        say(this, nameLine(pickOne(WEIRD.thief.lines), player), 'weird', 2.2);
        this.attackCooldown = 2;
        this.setMobState('flee', 0);
    }

    // The oddballs' tricks. Returns true when it handled this frame's movement itself.
    weirdBrain(dt, player, platforms, dx, dy, dir, sees) {
        this.weirdTimer -= dt;
        const adx = Math.abs(dx);
        const info = WEIRD[this.weird];

        if (this.weird === 'thief') {
            // With the staff it just runs; the hero has to chase it down
            if (this.hasStaff && !['flee', 'windup', 'strike'].includes(this.state)) this.setMobState('flee', 0);
            return false;
        }

        if (this.weird === 'stream') {
            if (!sees) return false;
            // Films from a safe distance and feeds the comment ticker
            this.facing = dir > 0 ? 'right' : 'left';
            const gap = adx - 170;
            const move = Math.abs(gap) > 20 ? Math.sign(gap) * dir * this.speed * 1.3 : 0;
            if (this.weirdTimer <= 0) {
                this.weirdTimer = 0.8 + Math.random() * 0.7;
                streamFeed.push({ text: nameLine(pickOne(STREAM_COMMENTS), player), x: GAME_WIDTH + 10, y: 110 + Math.random() * 120,
                    speed: 110 + Math.random() * 60, color: pickOne(['#ffffff', '#fde68a', '#bae6fd', '#fecaca', '#bbf7d0']), w: 0 });
            }
            this.moveWalker(move, 12, platforms);
            return true;
        }

        if (this.weird === 'bully') {
            if (this.state === 'grab') {
                this.facing = dir > 0 ? 'right' : 'left';
                if (this.stateTimer <= 0) {
                    const m = this.grabbed;
                    this.grabbed = null;
                    if (m && !m.dead) {
                        m.carriedBy = null;
                        // Aim at the hero, but shorten the throw until the arc ends on solid ground
                        const aim = Math.max(-9, Math.min(9, dx / 34));
                        const vx = [1, 0.75, 0.5, 0.25].map(k => aim * k).find(v => m.throwLands(v, -10, platforms));
                        if (vx !== undefined) {
                            m.thrown = true;
                            m.throwVx = vx;
                            m.vy = -10;
                            m.facing = this.facing;
                        } else {
                            // Nowhere safe to throw: just put the minion down
                            m.x = this.x + this.width / 2 - m.width / 2;
                            m.y = this.y + this.height - m.height;
                            m.vy = 0;
                            say(this, 'Thôi, xuống đi em. Ném xuống vực thì ai làm việc.', 'weird', 1.8);
                        }
                    }
                    this.weirdTimer = 6 + Math.random() * 3;
                    this.setMobState('recover', 0.5);
                    this.strikeDir = 0;
                }
                this.moveWalker(0, 12, platforms);
                return true;
            }
            if (sees && this.weirdTimer <= 0 && this.isGrounded && !['windup', 'strike'].includes(this.state)) {
                const m = enemies.find(e => e !== this && !e.dead && !e.weird && !e.flying && e.type !== 'boss' &&
                    !e.carriedBy && !e.thrown && Math.abs(e.x - this.x) < 260 && Math.abs(e.y - this.y) < 80);
                if (!m) {
                    this.weirdTimer = 2;
                    if (Math.random() < 0.3) say(this, 'Đàn em đâu hết rồi? Toàn trốn việc!', 'weird', 1.8);
                    return false;
                }
                this.grabbed = m;
                m.carriedBy = this;
                m.thrown = false;
                m.setMobState('patrol', 0);
                this.setMobState('grab', 0.8);
                say(this, pickOne(info.lines), 'weird', 2);
                say(m, pickOne(THROWN_LINES), 'coward', 2);
                return true;
            }
            return false;
        }

        // Casters (biến hình, đảo ngược, thu nhỏ): stop, glow, then fling a prank orb
        if (this.state === 'cast') {
            this.facing = dir > 0 ? 'right' : 'left';
            if (Math.random() < 0.5) {
                particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height * Math.random(), 0, -1.2, info.color, 3, 0.4));
            }
            if (this.stateTimer <= 0) {
                projectiles.push(new TrollShot(this, player));
                playSound('skill');
                this.weirdTimer = 7 + Math.random() * 3;
                this.setMobState('chase', 0);
            }
            if (!this.flying) this.moveWalker(0, 12, platforms);
            return true;
        }
        if (sees && this.weirdTimer <= 0 && adx < 380 && !player.troll && ['patrol', 'chase'].includes(this.state)) {
            this.setMobState('cast', 0.8);
            say(this, nameLine(pickOne(info.lines), player), 'weird', 2.2);
            return true;
        }
        return false;
    }

    setMobState(state, time) {
        this.state = state;
        this.stateTimer = time;
    }

    // Is there something to stand on just ahead in direction d? A drop onto a lower platform
    // within maxDrop counts; a pit (nothing below) never does.
    canStep(d, platforms, maxDrop, ahead = 6) {
        const probe = d > 0 ? this.x + this.width + ahead : this.x - ahead;
        const feet = this.y + this.height;
        return platforms.some(p => probe >= p.x && probe <= p.x + p.w && p.y >= feet - 6 && p.y <= feet + maxDrop);
    }

    updateMob(dt, player, platforms) {
        if (this.type === 'jelly') {
            this.y = this.baseY + Math.sin(this.animTime * 1.2) * 70;
            this.x += this.kvx;
            this.kvx *= 0.85;
            return;
        }
        if (this.type === 'spider') {
            this.updateHangingSpider(dt, player);
            return;
        }
        if (this.type === 'cloud') {
            this.updateStormCloud(dt, player);
            return;
        }

        this.stateTimer -= dt;
        this.attackCooldown -= dt;
        this.jumpCooldown -= dt;
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const dir = dx < 0 ? -1 : 1;
        const sees = !player.isDead && Math.abs(dx) < 360 && Math.abs(dy) < (this.flying ? 240 : 170);

        if (this.weird && this.weirdBrain(dt, player, platforms, dx, dy, dir, sees)) return;
        if (this.coward && this.scared && sees && this.state !== 'windup' && this.state !== 'strike' && this.state !== 'flee') {
            this.setMobState('flee', 0);
        }
        if (this.flying) this.flyerBrain(dt, player, dx, dy, dir, sees);
        else this.walkerBrain(dt, player, platforms, dx, dy, dir, sees);
    }

    // Ground monsters: keep a fighting distance, wind up, lunge, back off; jump after a hero on a ledge
    walkerBrain(dt, player, platforms, dx, dy, dir, sees) {
        const reach = this.width / 2 + player.width / 2 + 30;
        const adx = Math.abs(dx);
        let move = 0;     // desired speed this frame
        let mayDrop = 12; // how far it is willing to step down
        switch (this.state) {
            case 'patrol':
                if (sees) {
                    this.setMobState('chase', 0);
                    break;
                }
                move = this.facing === 'right' ? this.speed * 0.6 : -this.speed * 0.6;
                if (this.x <= this.patrolLeft) this.facing = 'right';
                else if (this.x >= this.patrolRight) this.facing = 'left';
                break;
            case 'chase':
                this.lostTimer = sees ? 0 : this.lostTimer + dt;
                if (this.lostTimer > 1.5) {
                    this.patrolLeft = this.x - 150;
                    this.patrolRight = this.x + 150;
                    this.setMobState('patrol', 0);
                    break;
                }
                this.facing = dir > 0 ? 'right' : 'left';
                if (adx > reach + 8) move = dir * this.speed * 1.15;
                else if (adx < reach - 22) move = -dir * this.speed * 0.6;
                if (dy > 60) mayDrop = 260; // hero is below: step down off a ledge after him
                if (this.isGrounded && dy < -70 && adx < 170 && this.jumpCooldown <= 0) {
                    this.vy = -14;
                    this.jumpCooldown = 1.6;
                }
                if (adx <= reach + 25 && Math.abs(dy) < 60 && this.attackCooldown <= 0) {
                    this.setMobState('windup', 0.45);
                }
                break;
            case 'windup':
                this.facing = dir > 0 ? 'right' : 'left';
                if (this.stateTimer <= 0) {
                    this.strikeDir = dir;
                    this.setMobState('strike', 0.28);
                    if (Math.random() < 0.25) say(this, pickOne(CHATTER.shout), 'hurt', 0.9);
                }
                break;
            case 'strike':
                move = this.strikeDir * Math.max(6 * MOVE_SCALE, this.speed * 3);
                if (this.stateTimer <= 0) {
                    this.attackCooldown = 1.1 + Math.random() * 0.9;
                    this.setMobState('recover', 0.6);
                }
                break;
            case 'recover':
                move = -this.strikeDir * this.speed * 0.7;
                if (this.stateTimer <= 0) this.setMobState('chase', 0);
                break;
            case 'flee': {
                if (!sees && this.stateTimer < -3) {
                    this.setMobState('patrol', 0);
                    break;
                }
                const away = -dir;
                this.facing = away > 0 ? 'right' : 'left';
                move = away * this.speed * 1.8;
                if (this.isGrounded && this.jumpCooldown <= 0 && Math.random() < dt * 0.8) {
                    this.vy = -12; // panicked hop
                    this.jumpCooldown = 1;
                }
                // Cornered at an edge: turn and fight, or hop off onto a ledge below
                if (this.isGrounded && !this.canStep(away, platforms, 260) && adx < 140) {
                    say(this, pickOne(CHATTER.cornered), 'hurt', 1.4);
                    this.setMobState('windup', 0.35);
                }
                break;
            }
        }
        this.moveWalker(move, mayDrop, platforms);
    }

    // Never walk, hop or get knocked over a pit. On the ground it only steps down as far as
    // mayDrop allows (and turns at edges); in the air anything with a platform below is fine.
    moveWalker(move, mayDrop, platforms) {
        let step = Math.abs(this.kvx) > 1 ? 0 : move * this.slowFactor();
        const drop = this.isGrounded ? mayDrop : 600;
        if (step !== 0 && !this.canStep(Math.sign(step), platforms, drop, Math.abs(step) + 2)) {
            step = 0;
            if (this.state === 'patrol') this.facing = this.facing === 'right' ? 'left' : 'right';
        }
        if (this.kvx !== 0 && !this.canStep(Math.sign(this.kvx), platforms, 600, Math.abs(this.kvx) + 2)) this.kvx = 0;
        this.x += step + this.kvx;
        this.kvx *= 0.85;
        this.applyGravity(platforms);

        // Safety net: one that still ends up in a pit comes back where it started
        if (this.y > GAME_HEIGHT + 60) {
            Object.assign(this, { x: this.homeX, y: this.homeY, vy: 0, kvx: 0 });
            this.setMobState('patrol', 0);
        }
    }

    // Flying monsters: hover off to the side above the hero, wind up, dive at where he was, climb away
    flyerBrain(dt, player, dx, dy, dir, sees) {
        const pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
        let tx = cx, ty = this.baseY + this.height / 2, speed = this.speed;
        switch (this.state) {
            case 'patrol':
                if (sees) {
                    this.setMobState('chase', 0);
                    break;
                }
                if (this.x <= this.patrolLeft) this.facing = 'right';
                else if (this.x >= this.patrolRight) this.facing = 'left';
                tx = cx + (this.facing === 'right' ? 40 : -40);
                ty += Math.sin(this.animTime * 2.5) * 16;
                break;
            case 'chase':
                this.lostTimer = sees ? 0 : this.lostTimer + dt;
                if (this.lostTimer > 2) {
                    this.baseY = this.y;
                    this.setMobState('patrol', 0);
                    break;
                }
                this.facing = dir > 0 ? 'right' : 'left';
                tx = pcx - dir * 110;
                ty = pcy - 70 + Math.sin(this.animTime * 3) * 10;
                speed *= 1.2;
                if (Math.hypot(tx - cx, ty - cy) < 45 && this.attackCooldown <= 0) {
                    this.diveTo = { x: pcx, y: pcy };
                    this.setMobState('windup', 0.5);
                }
                break;
            case 'windup':
                tx = cx;
                ty = cy - 1; // brace in the air
                if (this.stateTimer <= 0) {
                    this.setMobState('strike', 0.45);
                    if (Math.random() < 0.25) say(this, pickOne(CHATTER.shout), 'hurt', 0.9);
                }
                break;
            case 'strike':
                tx = this.diveTo.x;
                ty = this.diveTo.y;
                speed = 7 * MOVE_SCALE;
                if (this.stateTimer <= 0 || Math.hypot(tx - cx, ty - cy) < 8) {
                    this.attackCooldown = 1.2 + Math.random();
                    this.setMobState('recover', 0.7);
                }
                break;
            case 'recover':
                tx = cx - dir * 60;
                ty = cy - 80;
                if (this.stateTimer <= 0) this.setMobState('chase', 0);
                break;
            case 'flee':
                if (!sees && this.stateTimer < -3) {
                    this.baseY = this.y;
                    this.setMobState('patrol', 0);
                    break;
                }
                this.facing = dir > 0 ? 'left' : 'right';
                tx = cx - dir * 120;
                ty = Math.min(cy, pcy) - 60 + Math.sin(this.animTime * 6) * 30; // zig-zag away and up
                speed *= 1.7;
                break;
        }
        this.isLunging = this.state === 'strike';
        const mx = tx - cx, my = ty - cy, d = Math.hypot(mx, my);
        if (d > 1) {
            const v = Math.min(d, speed * this.slowFactor());
            this.x += (mx / d) * v;
            this.y += (my / d) * v * (this.state === 'strike' ? 1 : 0.7);
        }
        this.x += this.kvx;
        this.kvx *= 0.85;
        this.y = Math.max(20, Math.min(470 - this.height, this.y));
    }

    // Storm clouds hover well above the hero and drop lightning bolts
    updateStormCloud(dt, player) {
        const dist = Math.hypot((player.x + player.width / 2) - (this.x + this.width / 2), (player.y + player.height / 2) - (this.y + this.height / 2));
        const chasing = dist < 250 && !player.isDead;
        if (Math.abs(this.kvx) <= 1) {
            if (chasing) this.vx = player.x < this.x ? -this.speed : this.speed;
            else if (this.x <= this.patrolLeft) this.vx = this.speed;
            else if (this.x >= this.patrolRight) this.vx = -this.speed;
            this.facing = this.vx < 0 ? 'left' : 'right';
            this.x += this.vx * this.slowFactor();
        }
        this.x += this.kvx;
        this.kvx *= 0.85;
        const targetY = chasing ? Math.max(30, player.y - 150) : this.baseY + Math.sin(this.animTime * 2) * 12;
        this.y += Math.max(-2, Math.min(2, (targetY - this.y) * 0.05));
        this.shootTimer -= dt;
        if (chasing && this.shootTimer <= 0) {
            this.shootTimer = 2.2;
            projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height, '#fde047'));
        }
    }

    // hang -> drop (player walks underneath) -> wait -> climb back up the thread
    updateHangingSpider(dt, player) {
        const dx = Math.abs(player.x + player.width / 2 - (this.x + this.width / 2));
        if (this.dropState === 'hang') {
            this.y = this.baseY + Math.sin(this.animTime * 2) * 4;
            if (dx < 110 && player.y > this.y && !player.isDead) this.dropState = 'drop';
        } else if (this.dropState === 'drop') {
            this.y += 7;
            const floor = Math.min(player.y + player.height - this.height, SPIDER_DROP_LIMIT);
            if (this.y >= floor) {
                this.y = floor;
                this.dropState = 'wait';
                this.dropTimer = 1.2;
            }
        } else if (this.dropState === 'wait') {
            this.dropTimer -= dt;
            if (this.dropTimer <= 0) this.dropState = 'climb';
        } else {
            this.y -= 2.5;
            if (this.y <= this.baseY) {
                this.y = this.baseY;
                this.dropState = 'hang';
            }
        }
        this.x += this.kvx;
        this.kvx *= 0.85;
    }

    // Now and then says something in its mood, if the hero is near and the screen isn't too chatty
    chat(dt, player) {
        const c = this.chatter;
        c.timer -= dt;
        if (c.timer > 0) return;
        c.timer = 6 + Math.random() * 8;
        const busy = bubbles.filter(b => b.idle).length >= MAX_CHATTING;
        if (busy || Math.abs(this.x - player.x) > 650 || bubbles.some(b => b.owner === this)) return;
        say(this, chatterLine(c, player), c.mood, c.mood === 'poet' ? 5 : 3.5, true);
    }

    // Lưu Sa Hà quicksand drags enemies to a crawl
    slowFactor() {
        return this.slowTimer > 0 ? 0.35 : 1;
    }

    applyGravity(platforms) {
        this.vy += 0.65;
        this.y += this.vy;
        this.isGrounded = false;
        for (let p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.width > p.x &&
                this.y < p.y + p.h &&
                this.y + this.height > p.y) {
                if (this.vy > 0) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            }
        }
    }

    // Boss: walk toward the player, then pick a stomp-telegraphed charge or a leap with a shockwave.
    // Below half HP it enrages: faster, summons boars and calls down fire rain.
    updateBoss(dt, player, platforms) {
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);

        if (!this.awake) {
            if (Math.abs(dx) < 450 && !player.isDead) {
                this.awake = true;
                this.setState('roar', 1.0);
                playSound('roar');
                addShake(6);
                storyBeat(currentLevelIndex, 'boss');
            }
            this.applyGravity(platforms);
            return;
        }

        if (this.phase === 1 && this.hp <= this.maxHp / 2) {
            this.phase = 2;
            this.speed *= 1.4;
            this.setState('roar', 1.0);
            playSound('roar');
            addShake(10);
            floatingTexts.push(new FloatingText('NỔI GIẬN!', this.x, this.y - 30, '#ef4444', 14));
            const minion = THEMES[currentLevel.theme].minion || 'goblin';
            enemies.push(new Enemy(this.homeLeft + 40, this.y, minion), new Enemy(this.homeRight - 40, this.y, minion));
        }

        if (THEMES[currentLevel.theme].bossKit === 'thienMenh') {
            updateTmBoss(this, dt, dx);
            this.x += this.vx * this.slowFactor() + this.kvx;
            this.kvx *= 0.85;
            this.x = Math.max(this.homeLeft, Math.min(this.homeRight, this.x));
            this.applyGravity(platforms);
            return;
        }

        this.stateTimer -= dt;
        switch (this.state) {
            case 'walk':
                this.facing = dx < 0 ? 'left' : 'right';
                this.vx = Math.sign(dx) * this.speed;
                if (this.stateTimer <= 0 && !player.isDead) this.pickAttack(dx);
                break;
            case 'telegraph':
                this.vx = 0;
                if (this.stateTimer <= 0) {
                    this.setState('charge', 1.1);
                    playSound('roar');
                }
                break;
            case 'charge':
                this.vx = (this.facing === 'right' ? 1 : -1) * (this.phase === 2 ? 11 : 9) * MOVE_SCALE;
                if (Math.random() < 0.6) {
                    particles.push(new Particle(this.x + this.width / 2, this.y + this.height, -this.vx * 0.2, -Math.random() * 2, '#a8a29e', 4, 0.4));
                }
                if (this.stateTimer <= 0 || this.x <= this.homeLeft || this.x >= this.homeRight) {
                    addShake(4);
                    this.setState('walk', 1.2 + Math.random());
                }
                break;
            case 'leap':
                if (this.isGrounded && this.stateTimer < 0.9) {
                    addShake(8);
                    playSound('slam');
                    addShockwave(this.x + this.width / 2, this.y + this.height, 230, currentLevel.bossShot);
                    if (player.isGrounded && Math.abs(dx) < 230) player.takeDamage(20);
                    if (this.phase === 2) this.startFireRain();
                    this.setState('walk', 1.0);
                }
                break;
            case 'roar':
                this.vx = 0;
                if (this.stateTimer <= 0) {
                    if (this.phase === 2) this.startFireRain();
                    this.setState('walk', 0.8);
                }
                break;
        }

        if (this.fireRain > 0) {
            this.fireRain -= dt;
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                this.fireTimer = 0.35;
                projectiles.push(new Projectile(player.x + player.width / 2 + (Math.random() - 0.5) * 320, -20, currentLevel.bossShot));
            }
        }

        this.x += this.vx * this.slowFactor() + this.kvx;
        this.kvx *= 0.85;
        this.x = Math.max(this.homeLeft, Math.min(this.homeRight, this.x));
        this.applyGravity(platforms);
    }

    setState(state, time) {
        this.state = state;
        this.stateTimer = time;
    }

    pickAttack(dx) {
        this.facing = dx < 0 ? 'left' : 'right';
        if (Math.random() < 0.5) {
            this.setState('telegraph', this.phase === 2 ? 0.45 : 0.7);
        } else {
            this.vy = -14;
            this.vx = Math.max(-7, Math.min(7, dx / 40));
            this.setState('leap', 1.5);
        }
    }

    startFireRain() {
        this.fireRain = 3;
        this.fireTimer = 0;
    }

    // Returns true if the hit landed
    takeDamage(amount, knockbackDir) {
        if (this.isHit || this.dead) return false;
        if (this.type === 'boss' && THEMES[currentLevel.theme].bossKit === 'thienMenh') {
            amount = tmBossHit(this, amount);
            if (amount === null) return false;
        }

        this.hp -= amount;
        this.isHit = true;
        this.hitTimer = 0.2;

        const dir = knockbackDir === 'right' ? 1 : -1;
        if (this.type === 'boss') {
            this.kvx = dir * 2;
        } else {
            this.kvx = dir * 7;
            if (!this.flying && !this.thrown) this.vy = -4; // a thrown minion keeps its (checked) arc
        }
        playSound('hit');
        hitStop = Math.max(hitStop, 0.045);

        createHitSparks(this.x + this.width / 2, this.y + this.height / 2, '#fef08a', 8);
        floatingTexts.push(new FloatingText(`${amount}`, this.x + 10, this.y - 10, '#fef08a', 14));
        if (this.hasStaff && player.troll && player.troll.kind === 'unarmed') {
            // Hit the thief and the staff flies back
            player.endTroll();
            if (this.hp > 0) say(this, pickOne(['Ối, rơi mất rồi!', 'Thôi trả đấy, nặng gãy lưng!', 'Của đáng tội, cầm cũng không quen tay.']), 'weird', 1.8);
        } else if (this.hp > 0 && this.weird) {
            if (Math.random() < 0.5) say(this, nameLine(pickOne(CHATTER.hurt), player), 'weird', 1.6);
        } else if (this.hp > 0 && this.chatter) {
            if (this.coward) {
                this.scared = true;
                if (Math.random() < 0.6) say(this, pickOne(CHATTER.beg), 'coward', 1.8);
            } else if (Math.random() < 0.35) {
                say(this, pickOne(CHATTER.hurt), 'hurt', 1.8);
            }
        }

        if (this.hp <= 0) {
            this.dead = true;
            this.deathTimer = ENEMY_DEATH_TIME;
            playSound('kill');
            score += this.scoreValue;
            comboCount++;
            comboTimer = 3.0;

            const cx = this.x + this.width / 2;
            createHitSparks(cx, this.y + this.height / 2, '#f59e0b', 20);
            if (this.type === 'boss') {
                hitStop = 0.35;
                addShake(12);
                this.fireRain = 0;
                for (let i = 0; i < 6; i++) pickups.push(new Pickup(cx, this.y + 20, true));
                storyDelay = { part: 'after', t: 1.6 };
            } else {
                hitStop = Math.max(hitStop, 0.08);
                if (this.grabbed) this.grabbed.carriedBy = null;
                if (this.weird) {
                    // Oddballs pay out: the streamer drops its whole donation box
                    const n = this.weird === 'stream' ? 5 : 2;
                    for (let i = 0; i < n; i++) pickups.push(new Pickup(cx, this.y + 10, true));
                    say(this, this.weird === 'stream' ? 'Mất sóng rồi cả nhà ơi...' : pickOne(CHATTER.dying), 'dying', 2.5);
                } else {
                    if (Math.random() < 0.35) pickups.push(new Pickup(cx, this.y + 10, true));
                    if (Math.random() < 0.4) say(this, pickOne(CHATTER.dying), 'dying', 2.5);
                }
            }
            // The last monster down opens the gate
            if (!enemies.some(e => !e.dead)) {
                floatingTexts.push(new FloatingText('CỔNG ĐÃ MỞ!', cx - 60, this.y - 40, '#facc15', 14));
            }
            updateHUD();
        }
        return true;
    }

    sprite() {
        if (this.skin) {
            const A = this.skin.anims;
            const base = { key: this.skin.key, scale: this.skin.scale, facesRight: true };
            if (this.isHit) return { ...base, anim: A.hurt, fps: 1 };
            if (this.state === 'windup' || this.state === 'cast' || this.state === 'grab') return { ...base, anim: A.windup, fps: 6 };
            if (this.state === 'strike' || this.isLunging) return { ...base, anim: A.strike, fps: 12 };
            const still = this.type === 'spider' && this.dropState === 'hang';
            return { ...base, anim: A.walk, fps: still ? 3 : 10 };
        }
        if (this.type === 'slime') return { key: 'snailWalk', anim: ENEMY_ANIMS.snail, fps: 10, scale: ART_SCALE };
        if (this.type === 'goblin') return { key: 'boarRun', anim: ENEMY_ANIMS.boar, fps: 12, scale: ART_SCALE };
        if (this.type === 'fish') return { key: 'fishSwim', anim: ENEMY_ANIMS.fish, fps: this.isLunging ? 12 : 6, scale: 3 };
        if (this.type === 'crab') return { key: 'crabWalk', anim: ENEMY_ANIMS.crab, fps: 6, scale: 3 };
        if (this.type === 'jelly') return { key: 'jellyFloat', anim: ENEMY_ANIMS.jelly, fps: 2, scale: 3 };
        if (this.type === 'spider') return { key: 'spiderCrawl', anim: ENEMY_ANIMS.spider, fps: this.dropState === 'hang' ? 2 : 8, scale: 3 };
        if (this.type === 'spiderling') return { key: 'spiderCrawl', anim: ENEMY_ANIMS.spider, fps: 12, scale: 2 };
        if (this.type === 'soldier') return { key: 'soldierWalk', anim: ENEMY_ANIMS.soldier, fps: 5, scale: 3 };
        if (this.type === 'cloud') return { key: 'stormCloud', anim: ENEMY_ANIMS.stormCloud, fps: 6, scale: 3 };
        if (this.type === 'demon') {
            return this.isLunging
                ? { key: 'beeAttack', anim: ENEMY_ANIMS.beeAttack, fps: 14, scale: ART_SCALE }
                : { key: 'beeFly', anim: ENEMY_ANIMS.beeFly, fps: 14, scale: ART_SCALE };
        }
        const theme = THEMES[currentLevel.theme];
        if (theme.bossKit === 'thienMenh') return tmBossSprite(this);
        if (theme.bossAnims) {
            // A boss with a row per action
            const A = theme.bossAnims;
            const glow = this.phase === 2 ? '#dc2626' : theme.bossGlow;
            const base = { key: theme.boss, scale: theme.bossScale, glow, facesRight: theme.bossFacesRight };
            if (this.isHit) return { ...base, anim: A.hurt, fps: 16 };
            if (this.state === 'telegraph') return { ...base, anim: A.windup, fps: 6 };
            if (this.state === 'charge') return { ...base, anim: A.strike, fps: 14 };
            if (this.state === 'leap') return { ...base, anim: A.jump, fps: 6 };
            if (this.state === 'roar') return { ...base, anim: A.rage, fps: 10 };
            return { ...base, anim: this.phase === 2 ? A.rage : A.walk, fps: 10 };
        }
        const fps = this.state === 'charge' ? 22 : this.state === 'telegraph' || this.state === 'roar' ? 0 : 10;
        return {
            key: theme.boss,
            anim: theme.bossAnim || ENEMY_ANIMS.boar,
            fps: theme.bossAnim ? fps / 2 : fps, // the dragon has only two frames
            scale: theme.bossScale || 3,
            glow: this.phase === 2 ? '#dc2626' : theme.bossGlow
        };
    }

    // Quái dị extras: a crooked crown and its name, plus the stolen staff or the streaming phone
    drawWeirdBits(ctx, cx, color) {
        const top = this.y - this.barLift - 16;
        if (this.weird === 'thief' && this.hasStaff) {
            // The hero's staff held up like a trophy
            ctx.save();
            ctx.translate(cx, this.y - 6);
            ctx.rotate(-0.5 + Math.sin(this.animTime * 10) * 0.15);
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(-3, -34, 6, 56);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-4, -36, 8, 7);
            ctx.fillRect(-4, 17, 8, 7);
            ctx.restore();
        }
        if (this.weird === 'stream') {
            // Phone held out in front, with a blinking LIVE tag
            const fx = cx + (this.facing === 'right' ? 1 : -1) * (this.width / 2 + 4);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(snap(fx - 5), snap(this.y + 4), 10, 16);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(snap(fx - 3), snap(this.y + 6), 6, 11);
            if (Math.floor(this.animTime * 2) % 2 === 0) {
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(snap(cx - 14), snap(top - 26), 28, 11);
                ctx.fillStyle = '#ffffff';
                ctx.font = "700 8px 'Noto Serif', serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('LIVE', cx, top - 20);
            }
        }
        // Crooked crown
        ctx.save();
        ctx.translate(cx + 4, this.y - this.barLift - 2);
        ctx.rotate(0.3);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, -6, 16, 5);
        for (const px of [-8, -2, 4]) ctx.fillRect(px, -10, 4, 4);
        ctx.fillStyle = color;
        ctx.fillRect(-2, -5, 3, 3);
        ctx.restore();
        // Name tag
        ctx.save();
        ctx.font = "700 9px 'Noto Serif', serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
        const name = WEIRD[this.weird].name;
        ctx.strokeText(name, cx, top);
        ctx.fillStyle = color;
        ctx.fillText(name, cx, top);
        ctx.restore();
    }

    draw(ctx, camX) {
        if (this.dead && this.deathTimer <= 0) return;

        let cx = this.x + this.width / 2 - camX;
        if (cx < -150 || cx > GAME_WIDTH + 150) return;
        const feetY = this.y + this.height;
        const { key, anim, fps, scale, glow, facesRight } = this.sprite();
        const flip = facesRight ? this.facing === 'left' : this.facing === 'right'; // mob sheets face left
        const frame = (anim.start || 0) + Math.floor(this.animTime * fps) % anim.frames;

        ctx.save();
        if (this.dead) {
            const elapsed = ENEMY_DEATH_TIME - this.deathTimer;
            const deathAnim = this.skin ? this.skin.anims.death : this.type === 'boss' && THEMES[currentLevel.theme].bossAnims?.death;
            if (this.type === 'slime' && !this.skin) {
                drawSprite(IMG.snailDead, ENEMY_ANIMS.snailDead, Math.min(7, Math.floor(elapsed / 0.075)), cx, feetY, flip);
            } else if (deathAnim) {
                // Its own death frames, fading out as they play
                ctx.globalAlpha = Math.min(1, this.deathTimer / ENEMY_DEATH_TIME * 1.5);
                const f = Math.min(deathAnim.frames - 1, Math.floor(elapsed / ENEMY_DEATH_TIME * deathAnim.frames));
                drawSprite(IMG[key], deathAnim, f, cx, feetY - elapsed * 20, flip, scale);
            } else {
                // Flash white and fade upward
                ctx.globalAlpha = this.deathTimer / ENEMY_DEATH_TIME;
                drawSprite(FLASH[key], anim, frame, cx, feetY - elapsed * 40, flip, scale);
            }
            ctx.restore();
            return;
        }

        // Boss stomps in place before charging
        const winding = (this.type === 'boss' && this.state === 'telegraph') || this.state === 'windup' || this.state === 'cast';
        if (winding) cx += Math.sin(this.animTime * 60) * 3;
        const oddColor = this.weird && WEIRD[this.weird].color;

        if (this.type === 'spider') {
            // silk thread up to where it hangs from
            ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
            ctx.fillRect(snap(cx), this.baseY - 60, 1, this.y - this.baseY + 64);
        }

        if (!this.flying) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(cx, feetY, this.width * 0.45, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (glow || oddColor) {
            ctx.shadowColor = glow || oddColor;
            ctx.shadowBlur = glow ? 18 : 10 + Math.sin(this.animTime * 6) * 4;
        }
        const img = this.type === 'boss' && this.phase === 2 ? FLASH.rage[key] : IMG[key];
        if (this.thrown) {
            // Tumbling through the air
            ctx.save();
            ctx.translate(cx, feetY - this.height / 2);
            ctx.rotate(this.animTime * 14 * (this.throwVx < 0 ? -1 : 1));
            drawSprite(img, anim, frame, 0, this.height / 2, flip, scale);
            ctx.restore();
        } else {
            drawSprite(img, anim, frame, cx, feetY, flip, scale);
        }
        ctx.shadowBlur = 0;
        if (this.weird) this.drawWeirdBits(ctx, cx, oddColor);

        if (this.isHit || (winding && Math.floor(this.animTime * 12) % 2 === 0)) {
            // Painted bosses already play a hurt row, so their flash is lighter
            const painted = this.skin || (this.type === 'boss' && THEMES[currentLevel.theme].bossAnims);
            ctx.globalAlpha = this.isHit ? (painted ? 0.45 : 0.85) : 0.45;
            drawSprite(FLASH[key], anim, frame, cx, feetY, flip, scale);
            ctx.globalAlpha = 1;
        }

        if (this.frozen > 0) {
            // Golden sheen plus a spinning seal above the head
            ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.frozen * 10);
            drawSprite(FLASH.gold[key], anim, frame, cx, feetY, flip, scale);
            ctx.globalAlpha = 1;
            const sealY = this.y - this.barLift - 14;
            ctx.save();
            ctx.translate(cx, sealY);
            ctx.rotate(this.frozen * 3);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.strokeRect(-7, -7, 14, 14);
            ctx.rotate(Math.PI / 4);
            ctx.strokeRect(-7, -7, 14, 14);
            ctx.restore();
        }

        // Bosses get the big bar at the bottom of the screen instead
        if (this.hp < this.maxHp && this.type !== 'boss') {
            const barX = snap(this.x - camX);
            const barY = snap(this.y - this.barLift);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(barX - 1, barY - 1, this.width + 2, 6);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, (this.hp / this.maxHp) * this.width, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(barX, barY, (this.hp / this.maxHp) * this.width, 1);
        }

        ctx.restore();
    }
}

// "Còn N quái" at the top; when none is on screen, an arrow at the edge points to the nearest one
function drawMonsterCounter(ctx, camX) {
    const alive = enemies.filter(e => !e.dead);
    ctx.save();
    ctx.font = "700 13px 'Noto Serif', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = alive.length ? `Còn ${alive.length} quái` : 'Cổng đã mở!';
    const w = ctx.measureText(text).width + 24;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.strokeStyle = alive.length ? '#f87171' : '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - w / 2, 12, w, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = alive.length ? '#fecaca' : '#fde68a';
    ctx.fillText(text, GAME_WIDTH / 2, 25);

    const onScreen = alive.some(e => e.x + e.width > camX && e.x < camX + GAME_WIDTH);
    if (alive.length && !onScreen) {
        const px = player.x + player.width / 2;
        const near = alive.reduce((a, e) => (Math.abs(e.x - px) < Math.abs(a.x - px) ? e : a));
        const right = near.x > px;
        const ax = right ? GAME_WIDTH - 22 : 22, ay = GAME_HEIGHT / 2;
        const bob = Math.sin(worldTime * 6) * 4 * (right ? 1 : -1);
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.moveTo(ax + bob + (right ? 12 : -12), ay);
        ctx.lineTo(ax + bob + (right ? -6 : 6), ay - 12);
        ctx.lineTo(ax + bob + (right ? -6 : 6), ay + 12);
        ctx.fill();
        ctx.font = "700 11px 'Noto Serif', serif";
        ctx.fillStyle = '#fecaca';
        ctx.fillText(`${Math.round(Math.abs(near.x - px) / 10)}m`, ax, ay + 24);
    }
    ctx.restore();
}

function drawBossBar(ctx) {
    const boss = enemies.find(e => e.type === 'boss' && e.awake && !e.dead);
    if (!boss) return;
    const w = 420, h = 10;
    const x = (GAME_WIDTH - w) / 2, y = GAME_HEIGHT - 34;
    ctx.save();
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = boss.phase === 2 ? '#fca5a5' : '#fde68a';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(currentLevel.bossName, GAME_WIDTH / 2, y - 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = boss.phase === 2 ? '#dc2626' : '#f59e0b';
    ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), 2);
    // mark the enrage threshold
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w / 2 - 1, y, 2, h);
    ctx.restore();
}
