// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏元素
const gameMessage = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const subMessageText = document.getElementById('subMessageText');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('scoreValue');
const manaElement = document.getElementById('manaValue');
const healthElement = document.getElementById('healthValue');

// 法术按钮
const spellButtons = document.querySelectorAll('.spell-btn');
const fireSpell = document.getElementById('fireSpell');
const iceSpell = document.getElementById('iceSpell');
const lightningSpell = document.getElementById('lightningSpell');
const healSpell = document.getElementById('healSpell');

// 移动控制
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');
const actionBtn = document.getElementById('actionBtn');

// 游戏变量
let gameRunning = false;
let score = 0;
let health = 100;
let mana = 100;
let level = 1;
let currentSpell = 'fire';

// 玩家变量
const player = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 4,
    color: '#9B59B6',
    isMovingUp: false,
    isMovingDown: false,
    isMovingLeft: false,
    isMovingRight: false
};

// 敌人数组
const enemies = [];

// 法术数组
const spells = [];

// 初始化游戏
function init() {
    // 设置画布尺寸
    resizeCanvas();
    
    // 重置游戏状态
    score = 0;
    health = 100;
    mana = 100;
    level = 1;
    
    // 设置玩家位置
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
    
    // 清空数组
    enemies.length = 0;
    spells.length = 0;
    
    // 创建一些敌人
    for(let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: Math.random() * (canvas.height - 40),
            width: 30,
            height: 30,
            speed: 1,
            color: '#27AE60'
        });
    }
    
    // 更新UI
    updateUI();
    
    // 显示开始信息
    showMessage('Magic Quest', 'Embark on a magical adventure through mystical realms', true);
}

// 调整画布大小
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// 更新UI
function updateUI() {
    scoreElement.textContent = score;
    healthElement.textContent = health;
    manaElement.textContent = mana;
}

// 显示消息
function showMessage(title, subtitle, showButton) {
    messageText.textContent = title;
    subMessageText.textContent = subtitle;
    startBtn.style.display = showButton ? 'block' : 'none';
    gameMessage.style.display = 'flex';
    gameRunning = false;
}

// 隐藏消息
function hideMessage() {
    gameMessage.style.display = 'none';
    gameRunning = true;
}

// 启动游戏
function startGame() {
    hideMessage();
    gameLoop();
}

// 游戏循环
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    // 移动玩家
    if (player.isMovingUp && player.y > 0) {
        player.y -= player.speed;
    }
    if (player.isMovingDown && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (player.isMovingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.isMovingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // 移动敌人朝向玩家
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        
        // 检测敌人与玩家的碰撞
        if (isColliding(player, enemy)) {
            health -= 1;
            // 玩家受到伤害时闪烁
            player.color = '#FF0000';
            setTimeout(() => {
                player.color = '#9B59B6';
            }, 200);
            updateUI();
            
            // 游戏结束检查
            if (health <= 0) {
                showMessage('Game Over', `Your Score: ${score}`, true);
            }
        }
    });
    
    // 更新法术
    for (let i = spells.length - 1; i >= 0; i--) {
        const spell = spells[i];
        
        // 移动法术
        spell.x += spell.dx;
        spell.y += spell.dy;
        
        // 检查法术是否超出边界
        if (
            spell.x < 0 ||
            spell.x > canvas.width ||
            spell.y < 0 ||
            spell.y > canvas.height
        ) {
            spells.splice(i, 1);
            continue;
        }
        
        // 检查法术与敌人的碰撞
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (isColliding(spell, enemy)) {
                // 增加分数
                score += 10;
                updateUI();
                
                // 移除敌人和法术
                enemies.splice(j, 1);
                spells.splice(i, 1);
                
                // 如果消灭了所有敌人
                if (enemies.length === 0) {
                    // 关卡结束，进入下一关
                    level++;
                    showMessage(`Level ${level-1} Complete`, 'Get ready for the next level!', true);
                }
                
                break;
            }
        }
    }
}

// 渲染游戏
function render() {
    // 清除画布
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制玩家
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制敌人
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // 绘制法术
    spells.forEach(spell => {
        ctx.fillStyle = spell.color;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 碰撞检测
function isColliding(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// 施放法术
function castSpell(x, y) {
    // 法术类型配置
    const spellConfigs = {
        fire: { color: '#E74C3C', radius: 8, speed: 6, manaCost: 10 },
        ice: { color: '#3498DB', radius: 10, speed: 4, manaCost: 8 },
        lightning: { color: '#F1C40F', radius: 6, speed: 8, manaCost: 15 },
        heal: { color: '#2ECC71', radius: 12, speed: 0, manaCost: 20 }
    };
    
    const config = spellConfigs[currentSpell];
    
    // 检查法力值是否足够
    if (mana < config.manaCost) {
        return; // 法力不足
    }
    
    // 消耗法力
    mana -= config.manaCost;
    updateUI();
    
    // 如果是治疗法术
    if (currentSpell === 'heal') {
        health = Math.min(100, health + 20);
        updateUI();
        return;
    }
    
    // 计算法术方向
    const dx = x - player.x - player.width / 2;
    const dy = y - player.y - player.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 创建法术
    spells.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: config.radius,
        color: config.color,
        dx: (dx / distance) * config.speed,
        dy: (dy / distance) * config.speed
    });
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    init();
    
    // 开始按钮点击
    startBtn.addEventListener('click', startGame);
    
    // 键盘按下事件
    document.addEventListener('keydown', e => {
        if (!gameRunning) {
            startGame();
            return;
        }
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                player.isMovingUp = true;
                break;
            case 'ArrowDown':
            case 's':
                player.isMovingDown = true;
                break;
            case 'ArrowLeft':
            case 'a':
                player.isMovingLeft = true;
                break;
            case 'ArrowRight':
            case 'd':
                player.isMovingRight = true;
                break;
            case '1':
                currentSpell = 'fire';
                break;
            case '2':
                currentSpell = 'ice';
                break;
            case '3':
                currentSpell = 'lightning';
                break;
            case '4':
                currentSpell = 'heal';
                break;
            case ' ':
                // 向玩家面向的方向施放法术
                const targetX = player.isMovingRight ? player.x + 100 : 
                               player.isMovingLeft ? player.x - 100 : 
                               player.x;
                const targetY = player.isMovingDown ? player.y + 100 : 
                               player.isMovingUp ? player.y - 100 : 
                               player.y;
                castSpell(targetX, targetY);
                break;
        }
    });
    
    // 键盘抬起事件
    document.addEventListener('keyup', e => {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                player.isMovingUp = false;
                break;
            case 'ArrowDown':
            case 's':
                player.isMovingDown = false;
                break;
            case 'ArrowLeft':
            case 'a':
                player.isMovingLeft = false;
                break;
            case 'ArrowRight':
            case 'd':
                player.isMovingRight = false;
                break;
        }
    });
    
    // 鼠标点击事件
    canvas.addEventListener('click', e => {
        if (!gameRunning) {
            startGame();
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        castSpell(x, y);
    });
    
    // 法术按钮点击
    spellButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentSpell = btn.getAttribute('data-spell');
        });
    });
    
    // 移动按钮事件
    if (upBtn) {
        upBtn.addEventListener('touchstart', () => { player.isMovingUp = true; });
        upBtn.addEventListener('touchend', () => { player.isMovingUp = false; });
    }
    
    if (downBtn) {
        downBtn.addEventListener('touchstart', () => { player.isMovingDown = true; });
        downBtn.addEventListener('touchend', () => { player.isMovingDown = false; });
    }
    
    if (leftBtn) {
        leftBtn.addEventListener('touchstart', () => { player.isMovingLeft = true; });
        leftBtn.addEventListener('touchend', () => { player.isMovingLeft = false; });
    }
    
    if (rightBtn) {
        rightBtn.addEventListener('touchstart', () => { player.isMovingRight = true; });
        rightBtn.addEventListener('touchend', () => { player.isMovingRight = false; });
    }
    
    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            // 向玩家面向的方向施放法术
            const targetX = player.isMovingRight ? player.x + 100 : 
                           player.isMovingLeft ? player.x - 100 : 
                           player.x;
            const targetY = player.isMovingDown ? player.y + 100 : 
                           player.isMovingUp ? player.y - 100 : 
                           player.y;
            castSpell(targetX, targetY);
        });
    }
    
    // 窗口大小改变
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}); 