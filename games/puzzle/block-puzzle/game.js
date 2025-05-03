// Game configuration
const config = {
    gridSize: 10,
    blockColors: ['blue', 'red', 'green', 'yellow', 'purple'],
    blockShapes: [
        // I shape
        [[1, 1, 1, 1]],
        // L shape
        [[1, 0], [1, 0], [1, 1]],
        // Reversed L shape
        [[0, 1], [0, 1], [1, 1]],
        // T shape
        [[1, 1, 1], [0, 1, 0]],
        // Square shape
        [[1, 1], [1, 1]],
        // Z shape
        [[1, 1, 0], [0, 1, 1]],
        // Reversed Z shape
        [[0, 1, 1], [1, 1, 0]],
        // Dot
        [[1]],
        // Small L shape
        [[1, 0], [1, 1]]
    ]
};

// Game state
let gameState = {
    board: [],
    score: 0,
    startTime: null,
    timerInterval: null,
    selectedBlockIndex: null,
    gameStarted: false,
    currentBlocks: []
};

// DOM elements
const elements = {
    gameBoard: document.getElementById('gameBoard'),
    gameBlocks: document.getElementById('gameBlocks'),
    gameMessage: document.getElementById('gameMessage'),
    startBtn: document.getElementById('startBtn'),
    scoreValue: document.getElementById('scoreValue'),
    timerValue: document.getElementById('timerValue'),
    messageText: document.getElementById('messageText'),
    subMessageText: document.getElementById('subMessageText')
};

// Initialize game
function initGame() {
    // Initialize game board
    gameState.board = Array(config.gridSize).fill().map(() => Array(config.gridSize).fill(0));
    
    // Create game board DOM
    elements.gameBoard.innerHTML = '';
    for (let row = 0; row < config.gridSize; row++) {
        for (let col = 0; col < config.gridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add cell click event
            cell.addEventListener('click', () => handleCellClick(row, col));
            
            elements.gameBoard.appendChild(cell);
        }
    }
    
    // Initialize score
    gameState.score = 0;
    elements.scoreValue.textContent = gameState.score;
    
    // Generate new block options
    generateNewBlocks();
    
    // Reset timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    elements.timerValue.textContent = '00:00';
}

// Generate new block options
function generateNewBlocks() {
    elements.gameBlocks.innerHTML = '';
    gameState.currentBlocks = [];
    
    // Create 3 random block options
    for (let i = 0; i < 3; i++) {
        const blockOption = document.createElement('div');
        blockOption.className = 'block-option';
        blockOption.dataset.index = i;
        
        // Randomly select shape and color
        const randomShapeIndex = Math.floor(Math.random() * config.blockShapes.length);
        const shape = config.blockShapes[randomShapeIndex];
        const color = config.blockColors[Math.floor(Math.random() * config.blockColors.length)];
        
        // Store block information
        gameState.currentBlocks[i] = {
            shape,
            color
        };
        
        // Create block preview
        const maxRows = Math.max(shape.length, 3);
        const maxCols = Math.max(...shape.map(row => row.length), 3);
        
        blockOption.style.gridTemplateColumns = `repeat(${maxCols}, 15px)`;
        blockOption.style.gridTemplateRows = `repeat(${maxRows}, 15px)`;
        
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < maxCols; c++) {
                const cell = document.createElement('div');
                cell.className = 'block-cell';
                
                if (shape[r] && shape[r][c]) {
                    cell.classList.add('filled', color);
                }
                
                blockOption.appendChild(cell);
            }
        }
        
        // Add selection event
        blockOption.addEventListener('click', () => selectBlock(i));
        
        elements.gameBlocks.appendChild(blockOption);
    }
}

// Select block
function selectBlock(index) {
    // Clear previous selection
    document.querySelectorAll('.block-option.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Set new selection
    gameState.selectedBlockIndex = index;
    document.querySelector(`.block-option[data-index="${index}"]`).classList.add('selected');
    
    // Clear highlights
    clearHighlights();
}

// Handle cell click
function handleCellClick(row, col) {
    if (!gameState.gameStarted || gameState.selectedBlockIndex === null) return;
    
    const block = gameState.currentBlocks[gameState.selectedBlockIndex];
    if (!block) return;
    
    // Try to place block
    if (canPlaceBlock(row, col, block.shape)) {
        placeBlock(row, col, block.shape, block.color);
        
        // Check if there are lines to clear
        const clearedLines = checkLinesForClearing();
        
        // Update score
        updateScore(clearedLines);
        
        // Remove used block options
        gameState.currentBlocks[gameState.selectedBlockIndex] = null;
        const blockElement = document.querySelector(`.block-option[data-index="${gameState.selectedBlockIndex}"]`);
        blockElement.classList.remove('selected');
        blockElement.style.opacity = '0.3';
        blockElement.style.cursor = 'not-allowed';
        blockElement.removeEventListener('click', selectBlock);
        
        // Reset selection
        gameState.selectedBlockIndex = null;
        
        // Check if new blocks need to be generated
        if (gameState.currentBlocks.every(block => block === null)) {
            generateNewBlocks();
        }
        
        // Check game end condition
        checkGameEnd();
    }
}

// Check if block can be placed
function canPlaceBlock(startRow, startCol, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const row = startRow + r;
                const col = startCol + c;
                
                // Check if out of bounds
                if (row >= config.gridSize || col >= config.gridSize) {
                    return false;
                }
                
                // Check if cell is already occupied
                if (gameState.board[row][col]) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Place block
function placeBlock(startRow, startCol, shape, color) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const row = startRow + r;
                const col = startCol + c;
                
                // Update game board
                gameState.board[row][col] = color;
                
                // Update DOM
                const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('filled', color);
            }
        }
    }
}

// Check rows and columns for clearing
function checkLinesForClearing() {
    const rowsToClear = [];
    const colsToClear = [];
    
    // Check rows
    for (let row = 0; row < config.gridSize; row++) {
        if (gameState.board[row].every(cell => cell)) {
            rowsToClear.push(row);
        }
    }
    
    // Check columns
    for (let col = 0; col < config.gridSize; col++) {
        let columnFull = true;
        for (let row = 0; row < config.gridSize; row++) {
            if (!gameState.board[row][col]) {
                columnFull = false;
                break;
            }
        }
        if (columnFull) {
            colsToClear.push(col);
        }
    }
    
    // Clear rows
    rowsToClear.forEach(row => {
        for (let col = 0; col < config.gridSize; col++) {
            gameState.board[row][col] = 0;
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('row-clear');
            setTimeout(() => {
                cell.classList.remove('filled', 'red', 'green', 'blue', 'yellow', 'purple', 'row-clear');
            }, 300);
        }
    });
    
    // Clear columns
    colsToClear.forEach(col => {
        for (let row = 0; row < config.gridSize; row++) {
            gameState.board[row][col] = 0;
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('row-clear');
            setTimeout(() => {
                cell.classList.remove('filled', 'red', 'green', 'blue', 'yellow', 'purple', 'row-clear');
            }, 300);
        }
    });
    
    return rowsToClear.length + colsToClear.length;
}

// Update score
function updateScore(clearedLines) {
    if (clearedLines === 0) {
        gameState.score += 10; // Basic placement score
    } else {
        gameState.score += clearedLines * 100; // Clear row/column score
    }
    
    elements.scoreValue.textContent = gameState.score;
}

// Clear cell highlights
function clearHighlights() {
    document.querySelectorAll('.grid-cell.highlight').forEach(cell => {
        cell.classList.remove('highlight');
    });
}

// Check game end
function checkGameEnd() {
    // Check if there are blocks that can be placed
    for (const block of gameState.currentBlocks) {
        if (!block) continue;
        
        let canPlace = false;
        
        // Check each position on the game board
        for (let row = 0; row < config.gridSize; row++) {
            for (let col = 0; col < config.gridSize; col++) {
                if (canPlaceBlock(row, col, block.shape)) {
                    canPlace = true;
                    break;
                }
            }
            if (canPlace) break;
        }
        
        // If at least one block can be placed, game continues
        if (canPlace) return;
    }
    
    // Game over
    endGame();
}

// End game
function endGame() {
    // Stop timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Show game over message
    elements.messageText.textContent = 'Game Over';
    elements.subMessageText.textContent = `Final Score: ${gameState.score}`;
    elements.startBtn.textContent = 'Play Again';
    elements.gameMessage.classList.remove('hide');
    
    gameState.gameStarted = false;
}

// Start game
function startGame() {
    initGame();
    
    // Hide start message
    elements.gameMessage.classList.add('hide');
    
    // Set game state
    gameState.gameStarted = true;
    gameState.startTime = Date.now();
    
    // Start timer
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

// Update timer
function updateTimer() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    elements.timerValue.textContent = `${minutes}:${seconds}`;
}

// Event listeners
elements.startBtn.addEventListener('click', startGame);

// Initialize
initGame(); 