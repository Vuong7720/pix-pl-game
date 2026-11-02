// The hero

// --- PLAYER CLASS ---
class Player {
    constructor(x, y, charId = 'wukong') {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 62;
        this.vx = 0;
        this.vy = 0;
        this.jumpForce = -12.5;
        this.isGrounded = false;
        this.jumpCount = 0;
        this.facing = 'right';

        this.hp = 100;
        this.invulnerableTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;

        this.isAttacking = false;
        this.attackCombo = 0;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.comboWindow = 0;
        this.attackBox = { x: 0, y: 0, width: 75, height: 50 };

        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.ghosts = [];

        this.maxMp = 100;
        this.mp = 0;
        this.skill = null;       // skill that takes over movement: 'leap', 'snore', 'wheels' or 'counter'
        this.skillPhase = null;
        this.skillTimer = 0;
        this.leap = null;        // LEAPS entry while leaping
        this.pillarBaseY = 0;
        this.castTimer = 0;      // brief casting pose after an instant skill
        this.healTimer = 0;      // Tụng Kinh heal over time
        this.pulseTimer = 0;     // Ngủ Khò snore pulses
        this.counterUsed = false;
        this.wheelHits = new Set();
        this.form = null;        // 72 Biến Hóa: 'eagle', 'fish' or 'pig'
        this.buff = null;        // timed self-buff: { kind: 'sixarms' | 'bubble' | 'sutra', timer, hits }
        this.castPose = null;    // named pose shown while casting
        this.formTimer = 0;
        this.jumpBuffer = 0;     // a jump pressed slightly too early still fires on landing
        this.swimCooldown = 0;
        this.slowTimer = 0;
        this.slowed = false;
        this.troll = null;       // a quái dị's prank: { kind: 'chicken' | 'flip' | 'shrink' | 'unarmed', timer }

        // Duel support: where the controls come from, an optional sheet override, knockback and freeze
        this.input = keys;
        this.sheet = null;
        this.kbx = 0;
        this.frozen = 0;
        this.hitThisSwing = false;

        this.animState = 'idle';
        this.animTime = 0;
        this.setCharacter(charId);
    }

    setCharacter(id, skills) {
        this.charId = id;
        this.char = CHARACTERS[id];
        this.skills = skills || loadoutOf(id);
        this.speed = this.char.speed * MOVE_SCALE;
        this.maxJumps = this.char.jumps;
        this.maxHp = this.char.hp;
        this.attackDuration = this.char.attack.timings[1];
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = this.maxHp;
        this.facing = 'right';
        this.invulnerableTimer = 0;
        this.isDead = false;
        this.isAttacking = false;
        this.attackCombo = 0;
        this.isDashing = false;
        this.skill = null;
        this.form = null;
        this.buff = null;
        this.castTimer = 0;
        this.healTimer = 0;
        this.jumpBuffer = 0;
        this.ghosts = [];
        this.kbx = 0;
        this.frozen = 0;
        this.slowTimer = 0;
        this.endTroll(true);
        this.animState = 'idle';
        this.animTime = 0;
        updateHUD();
    }

    // Damage multiplier of basic swings (Tam Đầu Lục Tý hits harder; pranks make it feeble)
    attackPower() {
        const prank = this.troll ? TROLL[this.troll.kind].power : 1;
        return this.char.attack.damage * (this.buff && this.buff.kind === 'sixarms' ? 1.6 : 1) * prank;
    }

    // A quái dị's prank: harmless, just silly for a few seconds
    setTroll(kind) {
        if (this.isDead) return;
        this.endTroll(true);
        this.troll = { kind, timer: TROLL[kind].time };
        if (kind !== 'unarmed') transformPuff(this);
    }

    endTroll(quiet = false) {
        const t = this.troll;
        if (!t) return;
        this.troll = null;
        if (t.kind === 'unarmed') {
            for (const e of enemies) e.hasStaff = false;
            if (!quiet) floatingTexts.push(new FloatingText('LẤY LẠI GẬY!', this.x - 30, this.y - 24, '#facc15', 12));
        } else if (!quiet) {
            transformPuff(this);
        }
    }

    gainMp(amount) {
        this.mp = Math.min(this.maxMp, this.mp + amount * (this.char.mpGain || 1));
        updateHUD();
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        updateHUD();
    }

    queueJump() {
        this.jumpBuffer = 0.12;
    }

    // Skill keys U / I / O map to the character's three skill slots
    useSkillSlot(slot) {
        if (!isSkillLearned(slot)) {
            floatingTexts.push(new FloatingText('CHƯA LĨNH NGỘ', this.x - 30, this.y - 16, '#94a3b8', 9));
            return;
        }
        this.useSkill(this.skills[slot]);
    }

    useSkill(id) {
        if (this.isDead || this.skill || this.frozen > 0) return;
        if (this.troll && this.troll.kind === 'chicken') {
            floatingTexts.push(new FloatingText('GÀ KHÔNG BIẾT PHÉP', this.x - 50, this.y - 16, '#fde68a', 9));
            return;
        }
        const s = SKILLS[id];
        if (this.mp < s.cost) {
            floatingTexts.push(new FloatingText('THIẾU PHÁP LỰC', this.x - 40, this.y - 16, '#7dd3fc', 9));
            return;
        }
        if (s.leap && !this.isGrounded) {
            floatingTexts.push(new FloatingText('CẦN ĐỨNG TRÊN ĐẤT', this.x - 50, this.y - 16, '#7dd3fc', 9));
            return;
        }

        this.mp -= s.cost;
        updateHUD();
        playSound('skill');
        this.isAttacking = false;

        this.castPose = s.pose || null;
        if (s.cutIn) startCutIn(this, s.name);
        if (s.leap) {
            this.startLeap(LEAPS[s.leap]);
        } else {
            s.cast(this);
            if (!this.skill) this.castTimer = 0.35;
        }
    }

    startLeap(leap) {
        this.skill = 'leap';
        this.leap = leap;
        this.skillPhase = 'plant';
        this.skillTimer = 0.18;
        this.pillarBaseY = this.y + this.height;
        this.isDashing = false;
        this.vx = 0;
        this.vy = 0;
    }

    // Leaping skills (Trụ Thiên, Bụng Đè): crouch, launch, dive into a ground slam
    updateLeap(dt, platforms) {
        this.skillTimer -= dt;
        if (this.skillPhase === 'plant') {
            if (this.skillTimer <= 0) {
                this.skillPhase = 'rise';
                // Same launch height whatever the gravity
                this.vy = -Math.sqrt(2 * this.gravity() * this.leap.height);
                this.jumpCount = this.maxJumps;
            }
            return;
        }
        if (this.skillPhase === 'land') {
            if (this.skillTimer <= 0) this.skill = null;
            return;
        }

        if (this.skillPhase === 'rise') {
            this.vy += this.gravity();
            this.vx = this.input.left ? -3 : this.input.right ? 3 : 0;
            if (this.vy >= 0) {
                this.skillPhase = 'slam';
                this.vy = 4;
            }
        } else {
            this.vy = Math.min(this.vy + 1.5, 18);
            this.vx = 0;
        }

        this.moveAndCollide(platforms);

        if (this.skillPhase === 'slam' && this.isGrounded) {
            this.skillPhase = 'land';
            this.skillTimer = 0.3;
            groundSlam(this);
        }
        if (this.y > GAME_HEIGHT + 100) {
            this.skill = null;
            this.die();
        }
    }

    // Ngủ Khò: lie down, heal, and knock back anything nearby with each snore
    updateSnore(dt, platforms) {
        this.skillTimer -= dt;
        this.vx = 0;
        this.vy += this.gravity();
        this.moveAndCollide(platforms);
        this.heal(10 * dt);
        this.pulseTimer -= dt;
        if (this.pulseTimer <= 0) {
            this.pulseTimer = 0.6;
            snorePulse(this);
        }
        if (this.skillTimer <= 0) this.skill = null;
    }

    // Phong Hỏa Luân: fly forward, burning every foe on the way once
    updateWheels(dt, platforms) {
        this.skillTimer -= dt;
        this.vx = (this.facing === 'right' ? 1 : -1) * 13;
        this.vy = 0;
        this.moveAndCollide(platforms);
        for (const foe of foesOf(this)) {
            if (this.wheelHits.has(foe) || !overlaps(this, foe)) continue;
            this.wheelHits.add(foe);
            foe.takeDamage(skillDamage(30, 12), this.facing);
        }
        particles.push(new Particle(this.x + this.width / 2, this.y + this.height - 6, -this.vx * 0.1, -Math.random() * 2,
            Math.random() < 0.5 ? '#f97316' : '#fde047', 4, 0.35));
        if (this.skillTimer <= 0) this.skill = null;
    }

    // Tịnh Tâm: sit still, untouchable, healing and gathering mana
    updateMeditate(dt, platforms) {
        this.skillTimer -= dt;
        this.vx = 0;
        this.vy += this.gravity();
        this.moveAndCollide(platforms);
        this.heal(8 * dt);
        this.gainMp(30 * dt);
        if (this.skillTimer <= 0) this.skill = null;
    }

    // Nguyệt Nha Phản Đòn: rooted guard stance (getting hit triggers counterBlast in takeDamage)
    updateCounter(dt, platforms) {
        this.skillTimer -= dt;
        this.vx = 0;
        this.vy += this.gravity();
        this.moveAndCollide(platforms);
        if (this.skillTimer <= 0) this.skill = null;
    }

    // 72 Biến Hóa: an eagle flaps freely on land, a fish darts through water; attacking turns back
    updateForm(dt, platforms, input) {
        this.formTimer -= dt;
        if (this.formTimer <= 0 || input.attack) {
            this.endForm();
            return;
        }
        const fish = this.form === 'fish';
        const pig = this.form === 'pig';
        const speed = fish ? 8 : pig ? 8.5 : 7;
        if (input.left) {
            this.vx = -speed;
            this.facing = 'left';
        } else if (input.right) {
            this.vx = speed;
            this.facing = 'right';
        } else {
            this.vx *= 0.8;
        }
        if (pig) {
            // a piglet runs and jumps like normal, just faster
            this.vy += this.gravity();
            if (this.jumpBuffer > 0 && this.isGrounded) {
                this.jumpBuffer = 0;
                this.vy = this.jumpForce;
            }
            this.moveAndCollide(platforms);
            if (this.y > GAME_HEIGHT + 100) {
                this.form = null;
                this.die();
            }
            return;
        }
        this.vy = Math.min(this.vy + (fish ? 0.16 : 0.18), fish ? 3 : 2.5);
        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;
            this.vy = fish ? -7 : -5.5;
            particles.push(new Particle(centreX(this), this.y + this.height / 2, (Math.random() - 0.5) * 2, 1,
                fish ? '#bae6fd' : '#d6d3d1', 3, 0.4));
        }
        this.moveAndCollide(platforms);
        if (this.y > GAME_HEIGHT + 100) {
            this.form = null;
            this.die();
        }
    }

    endForm() {
        this.form = null;
        transformPuff(this);
    }

    moveAndCollide(platforms) {
        this.x += this.vx;
        this.checkHorizontalCollisions(platforms);
        this.y += this.vy;
        this.isGrounded = false;
        this.checkVerticalCollisions(platforms);
    }

    // Underwater stages are floaty
    gravity() {
        return currentLevel.water ? 0.32 : 0.65;
    }

    update(dt, platforms) {
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.comboWindow > 0) this.comboWindow -= dt;
        if (this.swimCooldown > 0) this.swimCooldown -= dt;
        if (this.slowTimer > 0) this.slowTimer -= dt;
        if (this.frozen > 0) this.frozen -= dt;
        if (this.castTimer > 0) this.castTimer -= dt;
        if (this.buff && !this.isDead) {
            this.buff.timer -= dt;
            if (this.buff.kind === 'sutra') sutraTick(this, dt);
            if (this.buff.timer <= 0) this.buff = null;
        }
        if (this.healTimer > 0 && !this.isDead) {
            this.healTimer -= dt;
            this.heal(20 * dt);
            if (Math.random() < 0.3) {
                particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height,
                    0, -1.5 - Math.random(), '#86efac', 3, 0.5));
            }
        }
        // Caught in a web or hit by a web ball: sluggish and sticky
        this.slowed = this.slowTimer > 0 || inWeb(this);
        if (this.troll) {
            this.troll.timer -= dt;
            if (this.troll.timer <= 0 || this.isDead) this.endTroll(this.isDead);
        }
        // Frozen by an opponent's Định Thân Pháp: controls do nothing
        let input = this.frozen > 0 ? NO_INPUT : this.input;
        // Yêu Đảo Ngược: left is right and right is left
        if (this.troll && this.troll.kind === 'flip') input = { ...input, left: input.right, right: input.left };

        if (this.isDead) {
            this.vx *= 0.9;
            this.vy += this.gravity();
            this.x += this.vx;
            this.y += this.vy;
            this.isGrounded = false;
            this.checkVerticalCollisions(platforms);
            this.updateAnimation(dt);
            this.deathTimer -= dt;
            // In a duel the match decides what happens after a K.O.
            if (this.deathTimer <= 0 && !duel.active) onPlayerDeath();
            return;
        }

        if (this.form) {
            this.updateForm(dt, platforms, input);
            this.updateAnimation(dt);
            return;
        }

        if (this.skill) {
            if (this.skill === 'leap') this.updateLeap(dt, platforms);
            else if (this.skill === 'snore') this.updateSnore(dt, platforms);
            else if (this.skill === 'wheels') this.updateWheels(dt, platforms);
            else if (this.skill === 'meditate') this.updateMeditate(dt, platforms);
            else this.updateCounter(dt, platforms);
            this.updateAnimation(dt);
            return;
        }

        if (this.jumpBuffer > 0) {
            this.jumpBuffer -= dt;
            if (this.frozen <= 0 && this.jump()) this.jumpBuffer = 0;
        }

        if (this.isDashing) {
            this.dashTimer -= dt;
            this.vy = 0;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            const chicken = this.troll && this.troll.kind === 'chicken';
            const speed = this.speed * (currentLevel.water ? 0.85 : 1) * (this.slowed ? 0.4 : 1) * (chicken ? 0.6 : 1);
            if (input.left) {
                this.vx = -speed;
                this.facing = 'left';
            } else if (input.right) {
                this.vx = speed;
                this.facing = 'right';
            } else {
                this.vx *= 0.7;
            }
            this.vy += this.gravity();
            if (currentLevel.water) this.vy = Math.min(this.vy, 5);
            if (this.slowed) this.vy = Math.max(-6, Math.min(this.vy, 1.5));
            this.applyCurrents();
        }

        if (input.dash && this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = 0.22;
            this.dashCooldown = 0.8 - 0.15 * upgradeLevel('dash');
            this.vx = (this.facing === 'right' ? 1 : -1) * 16 * MOVE_SCALE;
            playSound('slash');
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2, this.y + this.height / 2,
                    (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4,
                    '#fef08a', 4, 0.3
                ));
            }
        }

        const attack = this.char.attack;
        if (input.attack && this.attackCooldown <= 0 && !this.isAttacking) {
            // Chain into the next swing only if the previous one was recent
            this.attackCombo = this.comboWindow > 0 ? (this.attackCombo % 3) + 1 : 1;
            this.hitThisSwing = false;
            this.attackDuration = attack.timings[this.attackCombo] * (this.buff && this.buff.kind === 'sixarms' ? 0.7 : 1);
            this.isAttacking = true;
            this.attackTimer = this.attackDuration;
            this.attackCooldown = this.attackDuration + 0.08;
            this.comboWindow = this.attackDuration + 0.5;
            playSound('slash');
            slashSparks(this);
            if (this.troll && this.troll.kind === 'chicken' && Math.random() < 0.5) {
                floatingTexts.push(new FloatingText(pickOne(['Ò Ó O!', 'Cục tác!', 'Mổ nè!']), this.x, this.y - 20, '#fde68a', 10));
            }
        }

        if (this.isAttacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        this.x += this.vx + this.kbx;
        this.kbx *= 0.85;
        this.checkHorizontalCollisions(platforms);

        this.y += this.vy;
        this.isGrounded = false;
        this.checkVerticalCollisions(platforms);

        this.attackBox.width = attack.reach[this.attackCombo] || 75;
        this.attackBox.height = 55;
        this.attackBox.y = this.y;
        this.attackBox.x = this.facing === 'right' ? this.x + this.width : this.x - this.attackBox.width;

        if (this.isAttacking) {
            for (const c of chests) {
                if (!c.opened && overlaps(this.attackBox, c)) c.open();
            }
            for (const w of webs) {
                if (w.alive && overlaps(this.attackBox, w)) w.cut();
            }
        }

        this.updateAnimation(dt);

        // Leave a faint afterimage every 0.04s while dashing
        const lastGhost = this.ghosts[this.ghosts.length - 1];
        if (this.isDashing && (!lastGhost || lastGhost.life < 0.21)) {
            const [anim, frame] = this.animFrame();
            this.ghosts.push({
                x: this.x + this.width / 2,
                feetY: this.y + this.height,
                flip: this.facing === 'left',
                anim,
                frame,
                life: 0.25
            });
        }
        for (const g of this.ghosts) g.life -= dt;
        this.ghosts = this.ghosts.filter(g => g.life > 0);

        if (this.y > GAME_HEIGHT + 100) {
            if (DEV && dev.god) {
                this.x = respawnPoint.x;
                this.y = respawnPoint.y;
                this.vy = 0;
            } else {
                this.die();
            }
        }
    }

    updateAnimation(dt) {
        let state = 'idle';
        if (this.isDead) state = 'dead';
        else if (this.form) state = 'form';
        else if (this.skill === 'leap') state = 'leap';
        else if (this.skill === 'snore') state = 'sleep';
        else if (this.skill === 'wheels') state = 'dash';
        else if (this.skill === 'counter' || this.skill === 'meditate' || this.castTimer > 0) state = 'cast';
        else if (this.isDashing) state = 'dash';
        else if (this.isAttacking) state = 'attack';
        else if (!this.isGrounded) state = 'jump';
        else if (Math.abs(this.vx) > 0.8) state = 'run';

        if (state !== this.animState) {
            this.animState = state;
            this.animTime = 0;
        }
        this.animTime += dt;
    }

    // [animation, frame] for the current state, from the character's own sheet layout
    animFrame() {
        return this.char.animFor(this);
    }

    checkHorizontalCollisions(platforms) {
        for (let p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.width > p.x &&
                this.y < p.y + p.h &&
                this.y + this.height > p.y) {
                if (this.vx > 0) this.x = p.x - this.width;
                else if (this.vx < 0) this.x = p.x + p.w;
            }
        }
    }

    checkVerticalCollisions(platforms) {
        for (let p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.width > p.x &&
                this.y < p.y + p.h &&
                this.y + this.height > p.y) {
                if (this.vy > 0) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.groundPlatform = p; // lets moving clouds carry whoever stands on them
                    this.jumpCount = 0;
                } else if (this.vy < 0) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
            }
        }
        // The sea surface acts as a ceiling
        if (currentLevel.water && this.y < 0) {
            this.y = 0;
            if (this.vy < 0) this.vy = 0;
        }
    }

    // Hải lưu: currents push the player while inside their zone
    applyCurrents() {
        for (const c of currentLevel.currents || []) {
            if (overlaps(this, { x: c.x, y: c.y, width: c.w, height: c.h })) {
                this.x += c.fx;
                this.vy += c.fy;
            }
        }
    }

    // Returns true if the jump happened
    jump() {
        if (this.isDead || this.skill) return false;
        if (currentLevel.water) {
            // Swim stroke: unlimited, but with a short cooldown
            if (this.swimCooldown > 0) return false;
            this.vy = -8.5;
            this.swimCooldown = 0.25;
            this.isGrounded = false;
            playSound('jump');
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 20, this.y + this.height,
                    (Math.random() - 0.5) * 2, -Math.random() * 2,
                    '#bae6fd', 3, 0.4
                ));
            }
            return true;
        }
        if (this.isGrounded || this.jumpCount < this.maxJumps) {
            this.vy = this.jumpForce * (this.slowed ? 0.6 : 1) * (this.troll && this.troll.kind === 'chicken' ? 0.75 : 1);
            this.jumpCount++;
            this.isGrounded = false;
            playSound('jump');

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2, this.y + this.height,
                    (Math.random() - 0.5) * 4, Math.random() * -2,
                    '#fef08a', 3, 0.25
                ));
            }
            return true;
        }
        return false;
    }

    // knockbackDir ('left'/'right') pushes the player away; returns true if the hit landed
    takeDamage(amount, knockbackDir) {
        if (this.skill === 'counter' && !this.counterUsed && !this.isDead) {
            this.counterUsed = true;
            counterBlast(this);
            return false;
        }
        if (this.isDead || this.invulnerableTimer > 0 || this.isDashing || this.skill || this.form) return false;
        if (this.buff && this.buff.kind === 'bubble') {
            // Thủy Cầu Hộ Thể soaks the hit
            this.buff.hits--;
            this.invulnerableTimer = 0.3;
            createHitSparks(centreX(this), this.y + this.height / 2, '#7dd3fc', 10);
            if (this.buff.hits <= 0) this.buff = null;
            return false;
        }
        if (DEV && dev.god && !duel.active) return false;
        if (insideOwnCircle(this)) {
            createHitSparks(this.x + this.width / 2, this.y + 20, '#facc15', 6);
            return false;
        }

        // Sa Tăng's passive: standing still shrugs off part of the hit
        if (this.char.passive === 'steady' && this.isGrounded && Math.abs(this.vx) < 0.5) amount = Math.round(amount * 0.6);

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Duels need short invulnerability so combos still connect
        this.invulnerableTimer = duel.active ? 0.35 : 1.0;
        if (knockbackDir) {
            // Bát Giới's passive: too heavy to be pushed around
            const push = (this.char.passive === 'heavy' ? 2 : 7) * (this.troll && this.troll.kind === 'shrink' ? 2 : 1);
            this.kbx = (knockbackDir === 'right' ? 1 : -1) * push;
        }
        playSound('hit');

        createHitSparks(this.x + this.width / 2, this.y + this.height / 2, '#ef4444', 15);
        floatingTexts.push(new FloatingText(`-${amount}`, this.x + 10, this.y - 10, '#ef4444', 16));
        addShake(5);

        updateHUD();

        if (this.hp <= 0) {
            this.die();
        }
        return true;
    }

    // Plays the death animation; respawn (or game over) follows when deathTimer runs out
    die() {
        if (this.isDead) return;
        this.hp = 0;
        this.isDead = true;
        this.isAttacking = false;
        this.isDashing = false;
        this.skill = null;
        this.form = null;
        this.healTimer = 0;
        this.deathTimer = 1.4;
        updateHUD();
    }

    draw(ctx, camX) {
        const cx = this.x + this.width / 2 - camX;
        const feetY = this.y + this.height;
        const sheet = this.sheet || this.char.sheet;

        for (const g of this.ghosts) {
            ctx.save();
            ctx.globalAlpha = (g.life / 0.25) * 0.3;
            drawSprite(this.char.dashSheet, g.anim, g.frame, g.x - camX, g.feetY, g.flip, g.anim.scale || this.char.scale);
            ctx.restore();
        }

        if (!this.isDead && this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;

        if (this.isGrounded) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(cx, feetY, 16, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.troll && !this.isDead) drawTrollTag(ctx, this, cx);

        const flip = this.facing === 'left';
        if (this.troll && this.troll.kind === 'chicken' && !this.isDead) {
            // Turned into a chicken: waddles, flaps when airborne
            const s = CHICKEN_SCALE, w = CHICKEN_SPRITE.width * s, h = CHICKEN_SPRITE.height * s;
            const bob = this.isGrounded && Math.abs(this.vx) > 0.8 ? Math.abs(Math.sin(this.animTime * 14)) * 3 : 0;
            ctx.save();
            ctx.translate(snap(cx), snap(feetY - bob));
            if (flip) ctx.scale(-1, 1);
            if (this.isAttacking) ctx.rotate(0.35); // pecking
            ctx.drawImage(CHICKEN_SPRITE, -w / 2, -h, w, h);
            if (!this.isGrounded && Math.floor(this.animTime * 16) % 2 === 0) {
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(-w * 0.3, -h * 0.55, w * 0.3, 4);
            }
            ctx.restore();
            return;
        }
        const [anim, frame] = this.animFrame();
        const scale = (anim.scale || this.char.scale) * (this.troll && this.troll.kind === 'shrink' && !this.isDead ? 0.5 : 1);
        if (this.charId === 'wukong' && this.animState === 'dash') {
            // Cân Đẩu Vân: a golden cloud carries the somersaulting monkey
            ctx.save();
            ctx.fillStyle = '#fde68a';
            for (const [ox, oy, r] of [[-18, 2, 9], [-6, -2, 11], [8, 0, 10], [20, 3, 8]]) {
                ctx.beginPath();
                ctx.arc(cx + (flip ? -ox : ox), feetY + oy - 4, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#fffbeb';
            ctx.fillRect(snap(cx - 16), snap(feetY - 10), 26, 3);
            ctx.restore();
        }
        if (this.skill === 'leap' && this.skillPhase === 'rise' && this.leap.staff) {
            // The staff reaches from the ground up to the monkey's feet
            const staffX = cx + PILLAR_STAFF_X * scale * (flip ? -1 : 1);
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(snap(staffX - 4), snap(feetY), 8, this.pillarBaseY - feetY);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(snap(staffX - 4), snap(feetY), 2, this.pillarBaseY - feetY);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(snap(staffX - 5), snap(this.pillarBaseY - 8), 10, 8);
            // Hide the part of the sprite's own staff that would poke into the ground
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, GAME_WIDTH, this.pillarBaseY);
            ctx.clip();
            drawSprite(sheet, anim, frame, cx, feetY, flip, scale);
            ctx.restore();
            return;
        }

        drawSprite(sheet, anim, frame, cx, feetY, flip, scale);

        if (this.skill === 'counter') {
            // silver guard arc in front of Sa Tăng
            ctx.save();
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const dir = flip ? Math.PI : 0;
            ctx.arc(cx, this.y + this.height / 2, 38, dir - 1, dir + 1);
            ctx.stroke();
            ctx.restore();
        }
        if (this.buff) drawBuff(ctx, this, cx, feetY);
        if (this.skill === 'snore' && Math.floor(this.animTime * 2) % 2 === 0) {
            ctx.save();
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillStyle = '#e0f2fe';
            ctx.fillText('Z', cx + 14, this.y + 26 - (this.animTime * 20) % 20);
            ctx.restore();
        }

        if (this.frozen > 0 && !this.isDead) {
            // spinning golden seal of Định Thân Pháp above the head
            ctx.save();
            ctx.translate(cx, this.y - 16);
            ctx.rotate(this.frozen * 3);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.strokeRect(-8, -8, 16, 16);
            ctx.rotate(Math.PI / 4);
            ctx.strokeRect(-8, -8, 16, 16);
            ctx.restore();
        }

        if (this.slowed && !this.isDead) {
            // sticky silk strands across the body
            ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(snap(cx - 18), snap(this.y + 14 + i * 16), 36, 2);
            }
        }
    }
}
