// 获取Canvas和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏元素
const gameMessage = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const subMessageText = document.getElementById('subMessageText');
const startBtn = document.getElementById('startBtn');
const inventoryElement = document.getElementById('inventoryValue');
const cluesElement = document.getElementById('cluesValue');

// 移动控制
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const actionBtn = document.getElementById('actionBtn');

// 游戏变量
let gameRunning = false;
let inventory = 0;
let clues = 0;
let currentRoom = 0;

// 玩家变量
const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 80,
    speed: 5,
    isMovingLeft: false,
    isMovingRight: false,
    isInvestigating: false,
    direction: 1, // 1 for right, -1 for left
    animationFrame: 0,
    animationTimer: 0
};

// 房间设置
const rooms = [
    {
        name: 'Main Hall',
        background: '#2C1B2E',
        items: [
            { 
                x: 100, 
                y: 300, 
                width: 30, 
                height: 30, 
                type: 'clue', 
                message: 'A mysterious letter. Seems to be an invitation, but the sender\'s name is unclear.',
                collected: false
            },
            { 
                x: 400, 
                y: 350, 
                width: 50, 
                height: 30, 
                type: 'door', 
                leadsTo: 1, 
                message: 'Door to the Hallway',
                locked: false
            }
        ]
    },
    {
        name: 'Hallway',
        background: '#241626',
        items: [
            { 
                x: 150, 
                y: 320, 
                width: 40, 
                height: 40, 
                type: 'item', 
                message: 'An old key. It looks like it could open a locked door.',
                collected: false
            },
            { 
                x: 50, 
                y: 350, 
                width: 50, 
                height: 30, 
                type: 'door', 
                leadsTo: 0, 
                message: 'Back to the Main Hall',
                locked: false
            },
            { 
                x: 500, 
                y: 350, 
                width: 50, 
                height: 30, 
                type: 'door', 
                leadsTo: 2, 
                message: 'Door to the Study',
                locked: true
            }
        ]
    },
    {
        name: 'Study',
        background: '#1C1320',
        items: [
            { 
                x: 300, 
                y: 300, 
                width: 60, 
                height: 40, 
                type: 'final', 
                message: 'You found a diary on the bookshelf that reveals the mysterious history of the manor! Victory!',
                collected: false
            },
            { 
                x: 50, 
                y: 350, 
                width: 50, 
                height: 30, 
                type: 'door', 
                leadsTo: 1, 
                message: 'Back to the Hallway',
                locked: false
            }
        ]
    }
];

// 对话框
const dialogBox = document.createElement('div');
dialogBox.className = 'dialog-box';
dialogBox.style.display = 'none';
document.querySelector('.game-container').appendChild(dialogBox);

// 初始化游戏
function init() {
    // 设置Canvas大小
    resizeCanvas();
    
    // 重置游戏状态
    inventory = 0;
    clues = 0;
    currentRoom = 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 30;
    
    // 重置房间物品状态
    rooms.forEach(room => {
        room.items.forEach(item => {
            if (item.type === 'item' || item.type === 'clue' || item.type === 'final') {
                item.collected = false;
            }
            if (item.type === 'door' && item.leadsTo === 2) {
                item.locked = true;
            }
        });
    });
    
    // 更新UI
    updateUI();
    
    // 显示开始消息
    showMessage('Mystery Manor', 'Press any key or click to start the game', true);
}

// 调整Canvas大小
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// 更新UI
function updateUI() {
    inventoryElement.textContent = inventory;
    cluesElement.textContent = clues;
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

// 显示对话框
function showDialog(message) {
    dialogBox.textContent = message;
    dialogBox.style.display = 'block';
    setTimeout(() => {
        dialogBox.style.display = 'none';
    }, 3000);
}

// 开始游戏
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
    if (player.isMovingLeft && player.x > 0) {
        player.x -= player.speed;
        player.direction = -1;
    }
    
    if (player.isMovingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
        player.direction = 1;
    }
    
    // 更新动画
    player.animationTimer++;
    if (player.animationTimer > 5) {
        player.animationFrame = (player.animationFrame + 1) % 4;
        player.animationTimer = 0;
    }
    
    // 检查互动
    if (player.isInvestigating) {
        checkInteractions();
        player.isInvestigating = false;
    }
}

// 检查互动
function checkInteractions() {
    const room = rooms[currentRoom];
    for (let i = 0; i < room.items.length; i++) {
        const item = room.items[i];
        
        // 检查碰撞
        if (isColliding(player, item)) {
            // 显示消息
            showDialog(item.message);
            
            // 处理物品收集
            if ((item.type === 'item' || item.type === 'clue' || item.type === 'final') && !item.collected) {
                item.collected = true;
                
                if (item.type === 'item') {
                    inventory++;
                    // 如果拿到钥匙，解锁书房门
                    rooms[1].items.find(i => i.type === 'door' && i.leadsTo === 2).locked = false;
                } else if (item.type === 'clue') {
                    clues++;
                } else if (item.type === 'final') {
                    setTimeout(() => {
                        showMessage('Congratulations!', 'You solved the mystery of the manor!', true);
                    }, 3000);
                }
                
                updateUI();
            }
            
            // 处理门
            if (item.type === 'door' && !item.locked) {
                currentRoom = item.leadsTo;
                player.x = canvas.width / 2 - player.width / 2;
            } else if (item.type === 'door' && item.locked) {
                showDialog('This door is locked. You need to find a key.');
            }
        }
    }
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

// 渲染游戏
function render() {
    // 清除Canvas
    ctx.fillStyle = rooms[currentRoom].background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制房间名称
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(rooms[currentRoom].name, canvas.width / 2, 40);
    
    // 绘制物品
    rooms[currentRoom].items.forEach(item => {
        if (item.collected) return;
        
        if (item.type === 'clue') {
            ctx.fillStyle = '#ffcc00';
        } else if (item.type === 'item') {
            ctx.fillStyle = '#00aaff';
        } else if (item.type === 'door') {
            ctx.fillStyle = item.locked ? '#ff3333' : '#33cc33';
        } else if (item.type === 'final') {
            ctx.fillStyle = '#aa88ff';
        }
        
        ctx.fillRect(item.x, item.y, item.width, item.height);
    });
    
    // 绘制玩家
    ctx.fillStyle = '#7D3C98';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制玩家头部
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制眼睛方向
    ctx.fillStyle = '#fff';
    if (player.direction === 1) {
        ctx.fillRect(player.x + player.width / 2 + 5, player.y + 12, 5, 5);
    } else {
        ctx.fillRect(player.x + player.width / 2 - 10, player.y + 12, 5, 5);
    }
}

// 事件监听
window.addEventListener('resize', resizeCanvas);

// 键盘控制
window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    if (e.key === 'ArrowLeft') {
        player.isMovingLeft = true;
    } else if (e.key === 'ArrowRight') {
        player.isMovingRight = true;
    } else if (e.key === ' ' || e.key === 'Enter') {
        player.isInvestigating = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
        player.isMovingLeft = false;
    } else if (e.key === 'ArrowRight') {
        player.isMovingRight = false;
    }
});

// 移动端控制
leftBtn.addEventListener('touchstart', () => {
    player.isMovingLeft = true;
});

leftBtn.addEventListener('touchend', () => {
    player.isMovingLeft = false;
});

rightBtn.addEventListener('touchstart', () => {
    player.isMovingRight = true;
});

rightBtn.addEventListener('touchend', () => {
    player.isMovingRight = false;
});

actionBtn.addEventListener('touchstart', () => {
    player.isInvestigating = true;
});

// 鼠标控制
leftBtn.addEventListener('mousedown', () => {
    player.isMovingLeft = true;
});

leftBtn.addEventListener('mouseup', () => {
    player.isMovingLeft = false;
});

rightBtn.addEventListener('mousedown', () => {
    player.isMovingRight = true;
});

rightBtn.addEventListener('mouseup', () => {
    player.isMovingRight = false;
});

actionBtn.addEventListener('mousedown', () => {
    player.isInvestigating = true;
});

// 点击开始按钮
startBtn.addEventListener('click', startGame);

// 按键开始游戏
window.addEventListener('keydown', (e) => {
    if (!gameRunning && gameMessage.style.display !== 'none') {
        startGame();
    }
});

// 初始化游戏
window.addEventListener('load', init); 