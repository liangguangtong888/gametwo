// 游戏核心变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameMessage = document.getElementById('gameMessage');
const startBtn = document.getElementById('startBtn');
const startWaveBtn = document.getElementById('startWaveBtn');
const moneyValueEl = document.getElementById('moneyValue');
const waveValueEl = document.getElementById('waveValue');
const livesValueEl = document.getElementById('livesValue');

// 游戏状态
let gameStarted = false;
let gameOver = false;
let waveActive = false;
let money = 100;
let lives = 10;
let wave = 0;
let score = 0;
let selectedTower = null;
let zombiesRemaining = 0;
let zombiesKilled = 0;

// 游戏地图
const gridSize = 40;
const mapRows = 15;
const mapCols = 20;
let map = [];
const path = [];
let towers = [];
let zombies = [];
let projectiles = [];
let effects = [];

// 防御塔属性
const towerTypes = {
    basic: {
        name: 'Basic Tower',
        cost: 10,
        damage: 10,
        range: 3,
        fireRate: 1, // 每秒发射次数
        color: '#4285F4',
        projectileColor: '#4285F4',
        upgradeMultiplier: 1.5
    },
    slow: {
        name: 'Freezing Tower',
        cost: 30,
        damage: 5,
        range: 2.5,
        fireRate: 0.8,
        color: '#0F9D58',
        projectileColor: '#0F9D58',
        slowFactor: 0.5,
        slowDuration: 2,
        upgradeMultiplier: 1.5
    },
    splash: {
        name: 'Splash Tower',
        cost: 50,
        damage: 15,
        range: 2,
        fireRate: 0.6,
        color: '#F4B400',
        projectileColor: '#F4B400',
        splashRadius: 1.5,
        upgradeMultiplier: 1.5
    },
    sniper: {
        name: 'Sniper Tower',
        cost: 70,
        damage: 40,
        range: 5,
        fireRate: 0.3,
        color: '#DB4437',
        projectileColor: '#DB4437',
        upgradeMultiplier: 1.5
    }
};

// 僵尸属性
const zombieTypes = {
    normal: {
        health: 50,
        speed: 1,
        reward: 5,
        damage: 1,
        color: '#8BC34A',
        size: gridSize * 0.7
    },
    fast: {
        health: 30,
        speed: 1.5,
        reward: 8,
        damage: 1,
        color: '#CDDC39',
        size: gridSize * 0.6
    },
    tank: {
        health: 150,
        speed: 0.6,
        reward: 15,
        damage: 2,
        color: '#795548',
        size: gridSize * 0.8
    },
    boss: {
        health: 500,
        speed: 0.4,
        reward: 50,
        damage: 5,
        color: '#F44336',
        size: gridSize * 0.9
    }
};

// 初始化游戏
function initGame() {
    // 调整画布大小
    canvas.width = mapCols * gridSize;
    canvas.height = mapRows * gridSize;
    
    // 创建地图
    createMap();
    generatePath();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI
    updateUI();
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 创建游戏地图
function createMap() {
    map = Array(mapRows).fill().map(() => Array(mapCols).fill(0));
    
    // 设置路径
    // 1表示路径，0表示可放置防御塔的位置
    const pathCoords = [
        {row: 0, col: 5},
        {row: 5, col: 5},
        {row: 5, col: 15},
        {row: 10, col: 15},
        {row: 10, col: 5},
        {row: 14, col: 5}
    ];
    
    for (let i = 0; i < pathCoords.length - 1; i++) {
        const startCell = pathCoords[i];
        const endCell = pathCoords[i + 1];
        
        if (startCell.row === endCell.row) {
            // 水平路径
            const row = startCell.row;
            const startCol = Math.min(startCell.col, endCell.col);
            const endCol = Math.max(startCell.col, endCell.col);
            
            for (let col = startCol; col <= endCol; col++) {
                map[row][col] = 1;
            }
        } else {
            // 垂直路径
            const col = startCell.col;
            const startRow = Math.min(startCell.row, endCell.row);
            const endRow = Math.max(startCell.row, endCell.row);
            
            for (let row = startRow; row <= endRow; row++) {
                map[row][col] = 1;
            }
        }
    }
}

// 生成路径点
function generatePath() {
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            if (map[row][col] === 1) {
                path.push({ x: col * gridSize + gridSize / 2, y: row * gridSize + gridSize / 2 });
            }
        }
    }
    
    // 对路径点进行排序，确保僵尸能正确跟随路径
    path.sort((a, b) => {
        if (a.y < 5 * gridSize) return -1;
        if (b.y < 5 * gridSize) return 1;
        if (a.y < 10 * gridSize && a.x > b.x) return 1;
        if (a.y < 10 * gridSize && a.x < b.x) return -1;
        if (a.y > 10 * gridSize && a.x > b.x) return -1;
        if (a.y > 10 * gridSize && a.x < b.x) return 1;
        return a.y - b.y;
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 开始游戏按钮
    startBtn.addEventListener('click', startGame);
    
    // 开始波次按钮
    startWaveBtn.addEventListener('click', startWave);
    
    // 防御塔选择
    document.querySelectorAll('.tower-option').forEach(towerEl => {
        towerEl.addEventListener('click', () => {
            const towerType = towerEl.getAttribute('data-tower');
            selectTower(towerType);
            
            // 更新选中状态
            document.querySelectorAll('.tower-option').forEach(el => {
                el.classList.remove('selected');
            });
            towerEl.classList.add('selected');
        });
    });
    
    // 画布点击事件处理
    canvas.addEventListener('click', handleCanvasClick);
}

// 更新UI
function updateUI() {
    moneyValueEl.textContent = money;
    waveValueEl.textContent = wave;
    livesValueEl.textContent = lives;
}

// 选择防御塔类型
function selectTower(towerType) {
    selectedTower = towerType;
}

// 处理画布点击
function handleCanvasClick(event) {
    if (!gameStarted || gameOver) return;
    
    // 获取点击位置
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 转换为网格坐标
    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);
    
    // 检查是否可以放置防御塔
    if (selectedTower && row >= 0 && row < mapRows && col >= 0 && col < mapCols) {
        placeTower(row, col);
    }
}

// 放置防御塔
function placeTower(row, col) {
    // 确保位置有效且没有塔
    if (row >= 0 && row < mapRows && col >= 0 && col < mapCols && map[row][col] === 0) {
        const towerTypeInfo = towerTypes[selectedTower];
        
        // 检查是否有足够的钱
        if (money >= towerTypeInfo.cost) {
            // 位置有效，创建防御塔
            const newTower = {
                type: selectedTower,
                level: 1,
                x: col * gridSize + gridSize / 2,
                y: row * gridSize + gridSize / 2,
                cooldown: 0,
                damage: towerTypeInfo.damage,
                range: towerTypeInfo.range * gridSize,
                fireRate: towerTypeInfo.fireRate,
                color: towerTypeInfo.color,
                projectileColor: towerTypeInfo.projectileColor,
                target: null,
                row: row,
                col: col
            };
            
            // 为特殊塔添加特殊属性
            if (selectedTower === 'slow') {
                newTower.slowFactor = towerTypeInfo.slowFactor;
                newTower.slowDuration = towerTypeInfo.slowDuration;
            } else if (selectedTower === 'splash') {
                newTower.splashRadius = towerTypeInfo.splashRadius * gridSize;
            }
            
            // 添加到塔数组
            towers.push(newTower);
            
            // 扣减金钱
            money -= towerTypeInfo.cost;
            updateUI();
            
            // 标记地图上的位置为已占用
            map[row][col] = 2;
        }
    }
}

// 开始游戏
function startGame() {
    gameStarted = true;
    gameOver = false;
    wave = 0;
    money = 100;
    lives = 10;
    towers = [];
    zombies = [];
    projectiles = [];
    effects = [];
    
    // 重置地图上的防御塔标记
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            if (map[row][col] === 2) {
                map[row][col] = 0;
            }
        }
    }
    
    // 隐藏开始游戏消息
    gameMessage.classList.add('hidden');
    
    // 更新UI
    updateUI();
}

// 结束游戏
function endGame(victory = false) {
    gameOver = true;
    waveActive = false;
    
    // 显示游戏结束消息
    gameMessage.classList.remove('hidden');
    
    if (victory) {
        document.getElementById('messageTitle').textContent = 'Victory!';
        document.getElementById('messageText').textContent = `You successfully defeated all zombies! Score: ${score}`;
    } else {
        document.getElementById('messageTitle').textContent = 'Game Over';
        document.getElementById('messageText').textContent = `Zombies broke through your defenses! Score: ${score}`;
    }
    
    startBtn.textContent = 'Restart';
}

// 开始僵尸波次
function startWave() {
    if (gameStarted && !gameOver && !waveActive) {
        wave++;
        waveActive = true;
        zombiesRemaining = 10 + wave * 2;
        zombiesKilled = 0;
        
        // 更新UI
        updateUI();
        startWaveBtn.disabled = true;
    }
}

// 创建僵尸
function spawnZombie() {
    if (zombiesRemaining <= 0) return;
    
    // 根据波次难度决定僵尸类型
    let zombieType = 'normal';
    const random = Math.random();
    
    if (wave >= 10 && random < 0.1) {
        zombieType = 'boss';
    } else if (wave >= 5 && random < 0.3) {
        zombieType = 'tank';
    } else if (random < 0.4) {
        zombieType = 'fast';
    }
    
    const zombieInfo = zombieTypes[zombieType];
    
    // 创建僵尸对象
    const newZombie = {
        type: zombieType,
        x: path[0].x,
        y: path[0].y,
        health: zombieInfo.health * Math.pow(1.1, wave - 1), // 随波次增加生命值
        maxHealth: zombieInfo.health * Math.pow(1.1, wave - 1),
        speed: zombieInfo.speed,
        originalSpeed: zombieInfo.speed,
        reward: zombieInfo.reward,
        damage: zombieInfo.damage,
        color: zombieInfo.color,
        size: zombieInfo.size,
        pathIndex: 0,
        slowEffects: []
    };
    
    zombies.push(newZombie);
    zombiesRemaining--;
}

// 更新僵尸位置
function updateZombies(deltaTime) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        
        // 处理减速效果
        zombie.speed = zombie.originalSpeed;
        for (let j = zombie.slowEffects.length - 1; j >= 0; j--) {
            const effect = zombie.slowEffects[j];
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
                zombie.slowEffects.splice(j, 1);
            } else {
                zombie.speed *= effect.factor;
            }
        }
        
        // 计算到下一个路径点的距离和方向
        const targetPoint = path[zombie.pathIndex];
        const dx = targetPoint.x - zombie.x;
        const dy = targetPoint.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 僵尸向目标点移动
        if (distance > 5) {
            const moveDistance = zombie.speed * gridSize * deltaTime;
            const moveRatio = moveDistance / distance;
            zombie.x += dx * moveRatio;
            zombie.y += dy * moveRatio;
        } else {
            // 到达当前路径点，前往下一个点
            zombie.pathIndex++;
            
            // 如果到达路径终点
            if (zombie.pathIndex >= path.length) {
                // 僵尸到达终点，扣除生命值
                lives -= zombie.damage;
                zombies.splice(i, 1);
                updateUI();
                
                // 检查游戏是否结束
                if (lives <= 0) {
                    endGame(false);
                }
                continue;
            }
        }
        
        // 检查僵尸是否死亡
        if (zombie.health <= 0) {
            // 获得金钱奖励
            money += zombie.reward;
            score += zombie.reward;
            zombies.splice(i, 1);
            zombiesKilled++;
            updateUI();
            
            // 创建死亡效果
            effects.push({
                type: 'explosion',
                x: zombie.x,
                y: zombie.y,
                color: '#FF5722',
                radius: zombie.size / 2,
                duration: 0.3,
                maxDuration: 0.3
            });
            
            // 检查波次是否结束
            if (zombiesRemaining <= 0 && zombies.length === 0) {
                waveActive = false;
                startWaveBtn.disabled = false;
                
                // 波次完成奖励
                const waveBonus = wave * 10;
                money += waveBonus;
                score += waveBonus;
                updateUI();
                
                // 检查游戏胜利条件（这里设定为20波）
                if (wave >= 20) {
                    endGame(true);
                }
            }
        }
    }
}

// 更新防御塔
function updateTowers(deltaTime) {
    towers.forEach(tower => {
        // 减少冷却时间
        if (tower.cooldown > 0) {
            tower.cooldown -= deltaTime;
        }
        
        // 如果冷却结束，可以攻击
        if (tower.cooldown <= 0) {
            // 寻找范围内的目标
            let target = null;
            let minPathIndex = -1;
            
            for (const zombie of zombies) {
                const dx = zombie.x - tower.x;
                const dy = zombie.y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= tower.range) {
                    // 优先攻击走在前面的僵尸
                    if (target === null || zombie.pathIndex > minPathIndex) {
                        target = zombie;
                        minPathIndex = zombie.pathIndex;
                    }
                }
            }
            
            // 如果找到目标，发射子弹
            if (target) {
                const projectile = {
                    x: tower.x,
                    y: tower.y,
                    targetId: zombies.indexOf(target),
                    speed: 300, // 子弹速度
                    damage: tower.damage,
                    color: tower.projectileColor,
                    towerType: tower.type
                };
                
                // 添加特殊效果
                if (tower.type === 'slow') {
                    projectile.slowFactor = tower.slowFactor;
                    projectile.slowDuration = tower.slowDuration;
                } else if (tower.type === 'splash') {
                    projectile.splashRadius = tower.splashRadius;
                }
                
                projectiles.push(projectile);
                
                // 重置冷却时间
                tower.cooldown = 1 / tower.fireRate;
            }
        }
    });
}

// 更新子弹
function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // 检查目标是否还存在
        if (projectile.targetId >= 0 && projectile.targetId < zombies.length) {
            const target = zombies[projectile.targetId];
            
            // 计算方向和距离
            const dx = target.x - projectile.x;
            const dy = target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 移动子弹
            if (distance > 5) {
                const moveDistance = projectile.speed * deltaTime;
                const moveRatio = moveDistance / distance;
                
                projectile.x += dx * moveRatio;
                projectile.y += dy * moveRatio;
            } else {
                // 子弹命中目标
                // 普通攻击或减速攻击
                if (projectile.towerType !== 'splash') {
                    // 造成伤害
                    target.health -= projectile.damage;
                    
                    // 添加减速效果
                    if (projectile.towerType === 'slow') {
                        target.slowEffects.push({
                            factor: projectile.slowFactor,
                            duration: projectile.slowDuration
                        });
                    }
                }
                // 范围攻击
                else {
                    // 对范围内所有僵尸造成伤害
                    for (const zombie of zombies) {
                        const splashDx = zombie.x - target.x;
                        const splashDy = zombie.y - target.y;
                        const splashDistance = Math.sqrt(splashDx * splashDx + splashDy * splashDy);
                        
                        if (splashDistance <= projectile.splashRadius) {
                            zombie.health -= projectile.damage;
                        }
                    }
                    
                    // 创建爆炸效果
                    effects.push({
                        type: 'splash',
                        x: target.x,
                        y: target.y,
                        color: '#FFA000',
                        radius: projectile.splashRadius,
                        duration: 0.3,
                        maxDuration: 0.3
                    });
                }
                
                // 移除子弹
                projectiles.splice(i, 1);
            }
        } else {
            // 目标不存在，移除子弹
            projectiles.splice(i, 1);
        }
    }
}

// 更新特效
function updateEffects(deltaTime) {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.duration -= deltaTime;
        
        if (effect.duration <= 0) {
            effects.splice(i, 1);
        }
    }
}

// 游戏主循环
let lastTimestamp = 0;
function gameLoop(timestamp) {
    // 计算时间差
    const deltaTime = (timestamp - lastTimestamp) / 1000; // 转换为秒
    lastTimestamp = timestamp;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新游戏状态
    if (gameStarted && !gameOver) {
        // 如果有波次正在进行，随机生成僵尸
        if (waveActive && zombiesRemaining > 0 && Math.random() < 0.02) {
            spawnZombie();
        }
        
        // 更新游戏实体
        updateZombies(deltaTime);
        updateTowers(deltaTime);
        updateProjectiles(deltaTime);
        updateEffects(deltaTime);
    }
    
    // 绘制游戏
    drawGame();
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 绘制游戏
function drawGame() {
    // 绘制背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            ctx.strokeRect(col * gridSize, row * gridSize, gridSize, gridSize);
        }
    }
    
    // 绘制路径
    ctx.fillStyle = '#555555';
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            if (map[row][col] === 1) {
                ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
            }
        }
    }
    
    // 绘制可放置区域高亮
    if (selectedTower && gameStarted && !gameOver) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                if (map[row][col] === 0) {
                    ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
                }
            }
        }
    }
    
    // 绘制防御塔
    for (const tower of towers) {
        // 塔身
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, gridSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 塔底座
        ctx.fillStyle = '#555555';
        ctx.fillRect(tower.x - gridSize / 3, tower.y - gridSize / 3, gridSize / 1.5, gridSize / 1.5);
        
        // 显示塔等级
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${tower.level}`, tower.x, tower.y);
        
        // 显示攻击范围
        if (selectedTower) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 绘制僵尸
    for (const zombie of zombies) {
        // 血条背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(zombie.x - zombie.size / 2, zombie.y - zombie.size / 2 - 10, zombie.size, 5);
        
        // 血条
        const healthPercentage = zombie.health / zombie.maxHealth;
        ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(zombie.x - zombie.size / 2, zombie.y - zombie.size / 2 - 10, zombie.size * healthPercentage, 5);
        
        // 僵尸身体
        ctx.fillStyle = zombie.color;
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 僵尸眼睛
        ctx.fillStyle = 'black';
        const eyeOffsetX = zombie.size / 8;
        const eyeOffsetY = -zombie.size / 8;
        const eyeRadius = zombie.size / 12;
        
        // 左眼
        ctx.beginPath();
        ctx.arc(zombie.x - eyeOffsetX, zombie.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.arc(zombie.x + eyeOffsetX, zombie.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制子弹
    for (const projectile of projectiles) {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制特效
    for (const effect of effects) {
        const alpha = effect.duration / effect.maxDuration;
        
        if (effect.type === 'explosion') {
            ctx.fillStyle = `rgba(255, 87, 34, ${alpha})`;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
            ctx.fill();
        } else if (effect.type === 'splash') {
            ctx.strokeStyle = `rgba(255, 160, 0, ${alpha})`;
            ctx.lineWidth = 3 * alpha;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * (1 - alpha * 0.3), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 绘制波次信息
    if (gameStarted && !gameOver && waveActive) {
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Remaining Zombies: ${zombiesRemaining + zombies.length - zombiesKilled}`, canvas.width / 2, 25);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame); 