// 游戏配置
const config = {
    tileSize: 40,
    mapWidth: 20,
    mapHeight: 15,
    treasureCount: 10,
    obstacleCount: 30,
    enemyCount: 5,
    playerSpeed: 5,
    enemySpeed: 2
};

// 游戏状态
const gameState = {
    player: {
        x: 60,
        y: 60,
        width: 30,
        height: 30,
        speed: config.playerSpeed,
        lives: 3,
        treasures: 0,
        hasKey: false
    },
    treasures: [],
    obstacles: [],
    enemies: [],
    keys: [],
    doors: [],
    isGameActive: false,
    score: 0,
    level: 1
};

// DOM元素
let canvas, ctx;
let scoreElement, treasuresElement, livesElement;
let gameMessage, messageText, subMessageText, startBtn;
let mobileControls;
let upBtn, downBtn, leftBtn, rightBtn, actionBtn;

// 控制状态
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false
};

// 初始化游戏
function initGame() {
    // 获取DOM元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    scoreElement = document.getElementById('scoreValue');
    treasuresElement = document.getElementById('treasuresValue');
    livesElement = document.getElementById('livesValue');
    
    gameMessage = document.getElementById('gameMessage');
    messageText = document.getElementById('messageText');
    subMessageText = document.getElementById('subMessageText');
    startBtn = document.getElementById('startBtn');
    
    mobileControls = document.querySelector('.mobile-controls');
    upBtn = document.getElementById('upBtn');
    downBtn = document.getElementById('downBtn');
    leftBtn = document.getElementById('leftBtn');
    rightBtn = document.getElementById('rightBtn');
    actionBtn = document.getElementById('actionBtn');
    
    // 设置画布大小
    canvas.width = config.mapWidth * config.tileSize;
    canvas.height = config.mapHeight * config.tileSize;
    
    // 注册事件监听
    registerEventListeners();
    
    // 显示开始游戏消息
    showMessage('Treasure Hunter', 'Press any key or click Start button to begin');
    
    // 初始渲染
    render();
}

// 注册事件监听
function registerEventListeners() {
    // 键盘控制
    window.addEventListener('keydown', (e) => {
        if (!gameState.isGameActive) {
            startGame();
            return;
        }
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
                keys.down = true;
                break;
            case 'ArrowLeft':
            case 'a':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                keys.right = true;
                break;
            case ' ':
            case 'e':
                keys.action = true;
                break;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
                keys.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                keys.right = false;
                break;
            case ' ':
            case 'e':
                keys.action = false;
                break;
        }
    });
    
    // 移动端控制
    if (upBtn) upBtn.addEventListener('touchstart', () => keys.up = true);
    if (upBtn) upBtn.addEventListener('touchend', () => keys.up = false);
    
    if (downBtn) downBtn.addEventListener('touchstart', () => keys.down = true);
    if (downBtn) downBtn.addEventListener('touchend', () => keys.down = false);
    
    if (leftBtn) leftBtn.addEventListener('touchstart', () => keys.left = true);
    if (leftBtn) leftBtn.addEventListener('touchend', () => keys.left = false);
    
    if (rightBtn) rightBtn.addEventListener('touchstart', () => keys.right = true);
    if (rightBtn) rightBtn.addEventListener('touchend', () => keys.right = false);
    
    if (actionBtn) actionBtn.addEventListener('touchstart', () => keys.action = true);
    if (actionBtn) actionBtn.addEventListener('touchend', () => keys.action = false);
    
    // 开始按钮
    if (startBtn) startBtn.addEventListener('click', startGame);
}

// 显示游戏消息
function showMessage(title, subtitle) {
    messageText.textContent = title;
    subMessageText.textContent = subtitle;
    gameMessage.style.display = 'block';
}

// 隐藏游戏消息
function hideMessage() {
    gameMessage.style.display = 'none';
}

// 开始游戏
function startGame() {
    gameState.isGameActive = true;
    gameState.player.x = 60;
    gameState.player.y = 60;
    gameState.player.lives = 3;
    gameState.player.treasures = 0;
    gameState.player.hasKey = false;
    gameState.score = 0;
    gameState.level = 1;
    
    hideMessage();
    generateLevel();
    updateUI();
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 生成关卡
function generateLevel() {
    gameState.treasures = [];
    gameState.obstacles = [];
    gameState.enemies = [];
    gameState.keys = [];
    gameState.doors = [];
    
    // 生成障碍物
    for (let i = 0; i < config.obstacleCount; i++) {
        const obstacle = {
            x: Math.floor(Math.random() * (config.mapWidth - 2) + 1) * config.tileSize,
            y: Math.floor(Math.random() * (config.mapHeight - 2) + 1) * config.tileSize,
            width: config.tileSize,
            height: config.tileSize
        };
        
        // 确保障碍物不会堵住玩家起始位置
        if (obstacle.x < 120 && obstacle.y < 120) {
            i--;
            continue;
        }
        
        gameState.obstacles.push(obstacle);
    }
    
    // 生成宝藏
    for (let i = 0; i < config.treasureCount; i++) {
        const treasure = {
            x: Math.floor(Math.random() * (config.mapWidth - 2) + 1) * config.tileSize + 8,
            y: Math.floor(Math.random() * (config.mapHeight - 2) + 1) * config.tileSize + 8,
            width: 24,
            height: 24,
            value: Math.floor(Math.random() * 5) + 1 // 1-5分
        };
        
        // 确保宝藏不会出现在障碍物上
        let collision = false;
        for (const obstacle of gameState.obstacles) {
            if (isColliding(treasure, obstacle)) {
                collision = true;
                break;
            }
        }
        
        if (collision) {
            i--;
            continue;
        }
        
        gameState.treasures.push(treasure);
    }
    
    // 生成敌人
    for (let i = 0; i < config.enemyCount; i++) {
        const enemy = {
            x: Math.floor(Math.random() * (config.mapWidth - 5) + 3) * config.tileSize,
            y: Math.floor(Math.random() * (config.mapHeight - 5) + 3) * config.tileSize,
            width: 30,
            height: 30,
            speed: config.enemySpeed,
            direction: Math.floor(Math.random() * 4) // 0:上, 1:右, 2:下, 3:左
        };
        
        // 确保敌人不会出现在障碍物上或玩家起始位置附近
        let collision = false;
        for (const obstacle of gameState.obstacles) {
            if (isColliding(enemy, obstacle) || 
                (enemy.x < 150 && enemy.y < 150)) {
                collision = true;
                break;
            }
        }
        
        if (collision) {
            i--;
            continue;
        }
        
        gameState.enemies.push(enemy);
    }
    
    // 生成钥匙和门
    const key = {
        x: Math.floor(Math.random() * (config.mapWidth - 3) + 1) * config.tileSize + 10,
        y: Math.floor(Math.random() * (config.mapHeight - 3) + 1) * config.tileSize + 10,
        width: 20,
        height: 20
    };
    
    // 确保钥匙不会出现在障碍物上
    let keyCollision = false;
    for (const obstacle of gameState.obstacles) {
        if (isColliding(key, obstacle)) {
            keyCollision = true;
            break;
        }
    }
    
    if (!keyCollision) {
        gameState.keys.push(key);
        
        // 添加对应的门
        const door = {
            x: (config.mapWidth - 2) * config.tileSize,
            y: (config.mapHeight - 2) * config.tileSize,
            width: config.tileSize,
            height: config.tileSize
        };
        gameState.doors.push(door);
    }
}

// 游戏循环
function gameLoop(timestamp) {
    if (!gameState.isGameActive) return;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    // 更新玩家位置
    updatePlayerPosition();
    
    // 更新敌人位置
    updateEnemyPositions();
    
    // 检测碰撞
    checkCollisions();
    
    // 更新UI
    updateUI();
}

// 更新玩家位置
function updatePlayerPosition() {
    let moveX = 0;
    let moveY = 0;
    
    if (keys.up) moveY -= gameState.player.speed;
    if (keys.down) moveY += gameState.player.speed;
    if (keys.left) moveX -= gameState.player.speed;
    if (keys.right) moveX += gameState.player.speed;
    
    // 对角线移动速度调整
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071; // 1/sqrt(2)
        moveY *= 0.7071;
    }
    
    // 尝试水平移动
    gameState.player.x += moveX;
    
    // 检查地图边界
    if (gameState.player.x < 0) {
        gameState.player.x = 0;
    } else if (gameState.player.x + gameState.player.width > canvas.width) {
        gameState.player.x = canvas.width - gameState.player.width;
    }
    
    // 检查与障碍物的碰撞
    for (const obstacle of gameState.obstacles) {
        if (isColliding(gameState.player, obstacle)) {
            // 如果发生碰撞，撤销移动
            gameState.player.x -= moveX;
            break;
        }
    }
    
    // 检查与门的碰撞
    for (const door of gameState.doors) {
        if (isColliding(gameState.player, door) && !gameState.player.hasKey) {
            // 如果没有钥匙，撤销移动
            gameState.player.x -= moveX;
            break;
        }
    }
    
    // 尝试垂直移动
    gameState.player.y += moveY;
    
    // 检查地图边界
    if (gameState.player.y < 0) {
        gameState.player.y = 0;
    } else if (gameState.player.y + gameState.player.height > canvas.height) {
        gameState.player.y = canvas.height - gameState.player.height;
    }
    
    // 检查与障碍物的碰撞
    for (const obstacle of gameState.obstacles) {
        if (isColliding(gameState.player, obstacle)) {
            // 如果发生碰撞，撤销移动
            gameState.player.y -= moveY;
            break;
        }
    }
    
    // 检查与门的碰撞
    for (const door of gameState.doors) {
        if (isColliding(gameState.player, door) && !gameState.player.hasKey) {
            // 如果没有钥匙，撤销移动
            gameState.player.y -= moveY;
            break;
        }
    }
}

// 更新敌人位置
function updateEnemyPositions() {
    for (const enemy of gameState.enemies) {
        // 根据方向移动敌人
        switch(enemy.direction) {
            case 0: // 上
                enemy.y -= enemy.speed;
                break;
            case 1: // 右
                enemy.x += enemy.speed;
                break;
            case 2: // 下
                enemy.y += enemy.speed;
                break;
            case 3: // 左
                enemy.x -= enemy.speed;
                break;
        }
        
        // 检查地图边界或障碍物碰撞
        let changeDirection = false;
        
        // 地图边界检查
        if (enemy.x < 0 || enemy.x + enemy.width > canvas.width ||
            enemy.y < 0 || enemy.y + enemy.height > canvas.height) {
            changeDirection = true;
        }
        
        // 障碍物碰撞检查
        for (const obstacle of gameState.obstacles) {
            if (isColliding(enemy, obstacle)) {
                changeDirection = true;
                break;
            }
        }
        
        // 如果需要改变方向
        if (changeDirection) {
            // 撤销这一步的移动
            switch(enemy.direction) {
                case 0: // 上
                    enemy.y += enemy.speed;
                    break;
                case 1: // 右
                    enemy.x -= enemy.speed;
                    break;
                case 2: // 下
                    enemy.y -= enemy.speed;
                    break;
                case 3: // 左
                    enemy.x += enemy.speed;
                    break;
            }
            
            // 随机选择新方向
            enemy.direction = Math.floor(Math.random() * 4);
        }
        
        // 随机改变方向
        if (Math.random() < 0.01) {
            enemy.direction = Math.floor(Math.random() * 4);
        }
    }
}

// 碰撞检测
function checkCollisions() {
    // 检查与宝藏的碰撞
    for (let i = gameState.treasures.length - 1; i >= 0; i--) {
        if (isColliding(gameState.player, gameState.treasures[i])) {
            // 收集宝藏
            gameState.score += gameState.treasures[i].value * 10;
            gameState.player.treasures++;
            gameState.treasures.splice(i, 1);
            
            // 播放音效（在这里可以添加音效代码）
        }
    }
    
    // 检查与钥匙的碰撞
    for (let i = gameState.keys.length - 1; i >= 0; i--) {
        if (isColliding(gameState.player, gameState.keys[i])) {
            // 收集钥匙
            gameState.player.hasKey = true;
            gameState.keys.splice(i, 1);
            
            // 播放音效（在这里可以添加音效代码）
        }
    }
    
    // 检查与门的碰撞
    for (let i = gameState.doors.length - 1; i >= 0; i--) {
        if (isColliding(gameState.player, gameState.doors[i]) && gameState.player.hasKey) {
            // 如果有钥匙并碰到门，进入下一关
            gameState.level++;
            gameState.player.hasKey = false;
            gameState.score += 50; // 关卡奖励
            
            // 重新生成关卡
            generateLevel();
            
            // 显示关卡消息
            showMessage(`Level ${gameState.level}`, 'Are you ready to explore new area?');
            setTimeout(hideMessage, 2000);
        }
    }
    
    // 检查与敌人的碰撞
    for (const enemy of gameState.enemies) {
        if (isColliding(gameState.player, enemy)) {
            // 玩家受伤
            gameState.player.lives--;
            
            // 将玩家移回起始位置
            gameState.player.x = 60;
            gameState.player.y = 60;
            
            // 如果生命值为0，游戏结束
            if (gameState.player.lives <= 0) {
                gameOver();
            }
            
            // 显示受伤消息
            showMessage('You got caught!', `Lives remaining: ${gameState.player.lives}`);
            setTimeout(hideMessage, 1500);
            
            break;
        }
    }
    
    // 检查是否收集了所有宝藏
    if (gameState.treasures.length === 0 && !gameState.player.hasKey && gameState.keys.length === 0) {
        // 如果收集了所有宝藏且没有钥匙和未开的门，进入下一关
        gameState.level++;
        gameState.score += 100; // 特殊奖励
        
        // 重新生成关卡
        generateLevel();
        
        // 显示关卡消息
        showMessage(`Level ${gameState.level}`, 'All treasures collected! Discovering new treasure spot...');
        setTimeout(hideMessage, 2000);
    }
}

// 游戏结束
function gameOver() {
    gameState.isGameActive = false;
    showMessage('Game Over', `Final Score: ${gameState.score}<br>Click button to restart`);
}

// 更新UI
function updateUI() {
    if (scoreElement) scoreElement.textContent = gameState.score;
    if (treasuresElement) treasuresElement.textContent = gameState.player.treasures;
    if (livesElement) livesElement.textContent = gameState.player.lives;
}

// 渲染游戏
function render() {
    // 清除画布
    ctx.fillStyle = '#83c5be';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制地图网格
    drawGrid();
    
    // 绘制障碍物
    ctx.fillStyle = '#7f5539';
    for (const obstacle of gameState.obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
    
    // 绘制门
    ctx.fillStyle = '#8b4513';
    for (const door of gameState.doors) {
        ctx.fillRect(door.x, door.y, door.width, door.height);
        
        // 绘制门的装饰
        ctx.fillStyle = '#6b3e26';
        ctx.fillRect(door.x + 5, door.y + 10, 10, 20);
        ctx.fillStyle = '#d9a066';
        ctx.fillRect(door.x + 30, door.y + 20, 5, 5);
    }
    
    // 绘制宝藏
    ctx.fillStyle = '#ffd700';
    for (const treasure of gameState.treasures) {
        ctx.fillRect(treasure.x, treasure.y, treasure.width, treasure.height);
        
        // 绘制宝箱装饰
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(treasure.x, treasure.y, treasure.width, 8);
        ctx.fillRect(treasure.x, treasure.y + 16, treasure.width, 8);
    }
    
    // 绘制钥匙
    ctx.fillStyle = '#f1c40f';
    for (const key of gameState.keys) {
        ctx.fillRect(key.x, key.y, key.width, key.height);
        
        // 绘制钥匙装饰
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(key.x + 5, key.y + 5, 10, 10);
    }
    
    // 绘制敌人
    ctx.fillStyle = '#c0392b';
    for (const enemy of gameState.enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // 绘制敌人眼睛
        ctx.fillStyle = 'white';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + 19, enemy.y + 8, 6, 6);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 7, enemy.y + 10, 2, 2);
        ctx.fillRect(enemy.x + 21, enemy.y + 10, 2, 2);
    }
    
    // 绘制玩家
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    
    // 绘制玩家装饰
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.player.x + 5, gameState.player.y + 5, 6, 6);
    ctx.fillRect(gameState.player.x + 19, gameState.player.y + 5, 6, 6);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(gameState.player.x + 7, gameState.player.y + 7, 2, 2);
    ctx.fillRect(gameState.player.x + 21, gameState.player.y + 7, 2, 2);
    
    // 如果玩家有钥匙，显示钥匙图标
    if (gameState.player.hasKey) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(gameState.player.x + 12, gameState.player.y - 10, 6, 12);
    }
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    
    // 垂直线
    for (let x = 0; x <= canvas.width; x += config.tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 水平线
    for (let y = 0; y <= canvas.height; y += config.tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 碰撞检测工具函数
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 当文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame); 