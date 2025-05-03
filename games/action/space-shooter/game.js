// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game elements
const gameMessage = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const subMessageText = document.getElementById('subMessageText');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('scoreValue');
const livesElement = document.getElementById('livesValue');

// Mobile controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const fireBtn = document.getElementById('fireBtn');

// Game variables
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;

// Player variables
const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 30,
    speed: 5,
    color: '#007aff', // Apple blue
    isMovingLeft: false,
    isMovingRight: false,
    isFiring: false,
    lastFired: 0,
    fireRate: 300 // ms between shots
};

// Enemies variables
const enemies = [];
const enemyTypes = [
    { color: '#ff3b30', width: 40, height: 20, speed: 1, points: 10 }, // Red
    { color: '#ff9500', width: 35, height: 25, speed: 1.5, points: 20 }, // Orange
    { color: '#ffcc00', width: 30, height: 30, speed: 2, points: 30 }  // Yellow
];

// Bullets variables
const bullets = [];
const enemyBullets = [];

// Stars for background
const stars = [];

// Initialize game
function init() {
    // Set canvas size
    resizeCanvas();
    
    // Reset game state
    score = 0;
    lives = 3;
    level = 1;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    
    // Clear arrays
    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    
    // Create stars
    createStars();
    
    // Create enemies
    createEnemies();
    
    // Update UI
    updateUI();
    
    // Show start message
    showMessage('Space Shooter', 'Press any key or tap to start', true);
}

// Resize canvas to fit window
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Create stars for background
function createStars() {
    stars.length = 0;
    const starCount = Math.floor(canvas.width * canvas.height / 2000);
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

// Create enemies
function createEnemies() {
    const rows = 3 + Math.min(2, level - 1);
    const cols = 6 + Math.min(4, level - 1);
    const spacing = 60;
    const startX = (canvas.width - (cols * spacing)) / 2 + spacing / 2;
    const startY = 60;
    
    for (let row = 0; row < rows; row++) {
        const enemyType = enemyTypes[Math.min(row, enemyTypes.length - 1)];
        
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: startX + col * spacing,
                y: startY + row * spacing,
                width: enemyType.width,
                height: enemyType.height,
                speed: enemyType.speed * (1 + level * 0.1),
                color: enemyType.color,
                points: enemyType.points,
                direction: 1, // 1 for right, -1 for left
                fireRate: 0.001 + (level * 0.0005)
            });
        }
    }
}

// Update UI
function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

// Show message
function showMessage(title, subtitle, showButton) {
    messageText.textContent = title;
    subMessageText.textContent = subtitle;
    startBtn.style.display = showButton ? 'block' : 'none';
    gameMessage.style.display = 'block';
    gameRunning = false;
}

// Hide message
function hideMessage() {
    gameMessage.style.display = 'none';
    gameRunning = true;
}

// Start game
function startGame() {
    hideMessage();
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Move player
    if (player.isMovingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.isMovingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Player firing
    if (player.isFiring && Date.now() - player.lastFired > player.fireRate) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 7,
            color: '#5ac8fa' // Light blue
        });
        player.lastFired = Date.now();
    }
    
    // Move stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
    
    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        
        // Remove bullets that are off screen
        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
    
    // Move enemy bullets
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        
        // Remove bullets that are off screen
        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
        
        // Check collision with player
        if (isColliding(bullet, player)) {
            enemyBullets.splice(index, 1);
            lives--;
            updateUI();
            
            if (lives <= 0) {
                showMessage('Game Over', `Final Score: ${score}`, true);
            }
        }
    });
    
    // Move enemies
    let changeDirection = false;
    enemies.forEach(enemy => {
        enemy.x += enemy.speed * enemy.direction;
        
        // Check if enemy hits edge of screen
        if ((enemy.x < 0 && enemy.direction < 0) || 
            (enemy.x + enemy.width > canvas.width && enemy.direction > 0)) {
            changeDirection = true;
        }
        
        // Random enemy firing
        if (Math.random() < enemy.fireRate) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 2,
                y: enemy.y + enemy.height,
                width: 4,
                height: 10,
                speed: 3 + level * 0.2,
                color: enemy.color
            });
        }
    });
    
    // Change enemy direction and move down
    if (changeDirection && enemies.length > 0) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 10;
        });
    }
    
    // Check if enemies have reached the bottom
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height > player.y) {
            lives = 0;
            updateUI();
            showMessage('Game Over', `Final Score: ${score}`, true);
        }
    });
    
    // Check bullet-enemy collisions
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                // Remove bullet and enemy
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                
                // Add score
                score += enemy.points;
                updateUI();
                
                // Check if all enemies are defeated
                if (enemies.length === 0) {
                    level++;
                    showMessage(`Level ${level}`, 'Get ready!', false);
                    setTimeout(() => {
                        createEnemies();
                        hideMessage();
                    }, 2000);
                }
                
                return;
            }
        });
    });
}

// Check collision between two objects
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemy bullets
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
    createStars();
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        startGame();
        return;
    }
    
    switch (e.key) {
        case 'ArrowLeft':
            player.isMovingLeft = true;
            break;
        case 'ArrowRight':
            player.isMovingRight = true;
            break;
        case ' ':
            player.isFiring = true;
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            player.isMovingLeft = false;
            break;
        case 'ArrowRight':
            player.isMovingRight = false;
            break;
        case ' ':
            player.isFiring = false;
            break;
    }
});

// Touch controls
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.isMovingLeft = true;
});

leftBtn.addEventListener('touchend', () => {
    player.isMovingLeft = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.isMovingRight = true;
});

rightBtn.addEventListener('touchend', () => {
    player.isMovingRight = false;
});

fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.isFiring = true;
});

fireBtn.addEventListener('touchend', () => {
    player.isFiring = false;
});

// Mouse/touch controls for canvas
canvas.addEventListener('click', () => {
    if (!gameRunning) {
        startGame();
    }
});

// Start button
startBtn.addEventListener('click', startGame);

// Initialize game on load
window.addEventListener('load', init); 