// Game elements
const gameBoard = document.getElementById('gameBoard');
const gameMessage = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const subMessageText = document.getElementById('subMessageText');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('scoreValue');
const movesElement = document.getElementById('movesValue');
const timerElement = document.getElementById('timerValue');

// Game variables
const colors = ['blue', 'red', 'green', 'yellow', 'purple'];
let grid = [];
let gridSize = {rows: 8, cols: 8};
let selected = null;
let score = 0;
let moves = 0;
let gameRunning = false;
let timeInterval;
let startTime;

// Initialize game
function init() {
    // Adjust grid size based on screen size
    if (window.innerWidth <= 400) {
        gridSize = {rows: 10, cols: 5};
    } else if (window.innerWidth <= 600) {
        gridSize = {rows: 8, cols: 6};
    } else {
        gridSize = {rows: 8, cols: 8};
    }
    
    // Set grid template
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    
    // Clear board
    gameBoard.innerHTML = '';
    
    // Reset game state
    score = 0;
    moves = 0;
    updateUI();
    
    // Reset grid
    grid = [];
    
    // Show message
    showMessage('Match Stars', 'Match 3 or more stars of the same color', true);
}

// Create game board
function createBoard() {
    // Generate grid
    for (let row = 0; row < gridSize.rows; row++) {
        grid[row] = [];
        for (let col = 0; col < gridSize.cols; col++) {
            // Get random color (avoiding 3 in a row/column of same color)
            let color;
            do {
                color = colors[Math.floor(Math.random() * colors.length)];
            } while (
                // Check horizontal
                (col >= 2 && grid[row][col-1] === color && grid[row][col-2] === color) ||
                // Check vertical
                (row >= 2 && grid[row-1][col] === color && grid[row-2][col] === color)
            );
            
            grid[row][col] = color;
            
            // Create star element
            const star = document.createElement('div');
            star.className = `star ${color}`;
            star.dataset.row = row;
            star.dataset.col = col;
            star.addEventListener('click', () => selectStar(row, col));
            
            gameBoard.appendChild(star);
        }
    }
    
    // Check if there are valid moves available
    if (!hasValidMoves()) {
        createBoard(); // Recreate board if no valid moves
    }
}

// Show message
function showMessage(title, subtitle, showButton) {
    messageText.textContent = title;
    subMessageText.textContent = subtitle;
    startBtn.style.display = showButton ? 'block' : 'none';
    gameMessage.style.display = 'block';
    gameRunning = false;
    
    if (timeInterval) {
        clearInterval(timeInterval);
    }
}

// Hide message
function hideMessage() {
    gameMessage.style.display = 'none';
    gameRunning = true;
    
    // Start timer
    startTime = Date.now();
    timeInterval = setInterval(updateTimer, 1000);
}

// Start game
function startGame() {
    hideMessage();
    createBoard();
}

// Update UI
function updateUI() {
    scoreElement.textContent = score;
    movesElement.textContent = moves;
}

// Update timer
function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;
}

// Select a star
function selectStar(row, col) {
    if (!gameRunning) return;
    
    const star = document.querySelector(`.star[data-row="${row}"][data-col="${col}"]`);
    
    if (selected) {
        // If already selected, check if adjacent
        const selectedRow = parseInt(selected.dataset.row);
        const selectedCol = parseInt(selected.dataset.col);
        
        if (isAdjacent(selectedRow, selectedCol, row, col)) {
            // Swap stars
            swapStars(selectedRow, selectedCol, row, col);
            moves++;
            updateUI();
        }
        
        // Deselect
        selected.classList.remove('selected');
        selected = null;
    } else {
        // Select
        star.classList.add('selected');
        selected = star;
    }
}

// Check if two positions are adjacent
function isAdjacent(row1, col1, row2, col2) {
    return (
        (Math.abs(row1 - row2) === 1 && col1 === col2) || 
        (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
}

// Swap two stars
function swapStars(row1, col1, row2, col2) {
    // Swap in grid
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
    
    // Update DOM
    const star1 = document.querySelector(`.star[data-row="${row1}"][data-col="${col1}"]`);
    const star2 = document.querySelector(`.star[data-row="${row2}"][data-col="${col2}"]`);
    
    star1.className = `star ${grid[row1][col1]}`;
    star2.className = `star ${grid[row2][col2]}`;
    
    // Check for matches
    const matches = findMatches();
    
    if (matches.length > 0) {
        removeMatches(matches);
    } else {
        // Swap back if no matches
        setTimeout(() => {
            const tempBack = grid[row1][col1];
            grid[row1][col1] = grid[row2][col2];
            grid[row2][col2] = tempBack;
            
            star1.className = `star ${grid[row1][col1]}`;
            star2.className = `star ${grid[row2][col2]}`;
        }, 300);
    }
}

// Find all matches in the grid
function findMatches() {
    const matches = [];
    
    // Check horizontal matches
    for (let row = 0; row < gridSize.rows; row++) {
        let count = 1;
        let color = grid[row][0];
        
        for (let col = 1; col < gridSize.cols; col++) {
            if (grid[row][col] === color) {
                count++;
            } else {
                if (count >= 3) {
                    // Add horizontal match
                    for (let c = col - count; c < col; c++) {
                        matches.push({row, col: c});
                    }
                }
                count = 1;
                color = grid[row][col];
            }
        }
        
        // Check end of row
        if (count >= 3) {
            for (let c = gridSize.cols - count; c < gridSize.cols; c++) {
                matches.push({row, col: c});
            }
        }
    }
    
    // Check vertical matches
    for (let col = 0; col < gridSize.cols; col++) {
        let count = 1;
        let color = grid[0][col];
        
        for (let row = 1; row < gridSize.rows; row++) {
            if (grid[row][col] === color) {
                count++;
            } else {
                if (count >= 3) {
                    // Add vertical match
                    for (let r = row - count; r < row; r++) {
                        matches.push({row: r, col});
                    }
                }
                count = 1;
                color = grid[row][col];
            }
        }
        
        // Check end of column
        if (count >= 3) {
            for (let r = gridSize.rows - count; r < gridSize.rows; r++) {
                matches.push({row: r, col});
            }
        }
    }
    
    // Remove duplicates
    return matches.filter((match, index, self) => 
        index === self.findIndex(m => m.row === match.row && m.col === match.col)
    );
}

// Remove matches from the grid
function removeMatches(matches) {
    // Add score
    score += matches.length * 10;
    updateUI();
    
    // Animate and remove matches
    matches.forEach(match => {
        const star = document.querySelector(`.star[data-row="${match.row}"][data-col="${match.col}"]`);
        star.classList.add('removing');
    });
    
    // Wait for animation to complete
    setTimeout(() => {
        // Remove stars
        matches.forEach(match => {
            grid[match.row][match.col] = null;
        });
        
        // Drop stars
        dropStars();
        
        // Fill empty spaces
        fillEmptySpaces();
        
        // Check for new matches
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            removeMatches(newMatches);
        } else if (!hasValidMoves()) {
            // Check if no more valid moves
            showMessage('Game Over', `Final Score: ${score}`, true);
        }
    }, 500);
}

// Drop stars down to fill empty spaces
function dropStars() {
    for (let col = 0; col < gridSize.cols; col++) {
        let emptyCount = 0;
        
        // Process from bottom to top
        for (let row = gridSize.rows - 1; row >= 0; row--) {
            if (grid[row][col] === null) {
                emptyCount++;
            } else if (emptyCount > 0) {
                // Move star down
                const newRow = row + emptyCount;
                grid[newRow][col] = grid[row][col];
                grid[row][col] = null;
                
                // Update DOM
                const star = document.querySelector(`.star[data-row="${row}"][data-col="${col}"]`);
                star.dataset.row = newRow;
                star.classList.add('falling');
                
                // Update event listener
                star.addEventListener('click', () => selectStar(newRow, col));
            }
        }
    }
}

// Fill empty spaces with new stars
function fillEmptySpaces() {
    for (let col = 0; col < gridSize.cols; col++) {
        for (let row = 0; row < gridSize.rows; row++) {
            if (grid[row][col] === null) {
                // Generate new color
                const color = colors[Math.floor(Math.random() * colors.length)];
                grid[row][col] = color;
                
                // Create new star
                const star = document.querySelector(`.star[data-row="${row}"][data-col="${col}"]`);
                star.className = `star ${color} falling`;
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    star.classList.remove('removing');
                    star.classList.remove('falling');
                }, 500);
            }
        }
    }
}

// Check if there are any valid moves
function hasValidMoves() {
    // Check each position
    for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
            // Check right swap
            if (col < gridSize.cols - 1) {
                if (checkSwap(row, col, row, col + 1)) {
                    return true;
                }
            }
            
            // Check down swap
            if (row < gridSize.rows - 1) {
                if (checkSwap(row, col, row + 1, col)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Check if swapping two positions would create a match
function checkSwap(row1, col1, row2, col2) {
    // Temporarily swap
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
    
    // Check for matches
    const matches = findMatches();
    
    // Swap back
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
    
    return matches.length > 0;
}

// Window resize event
window.addEventListener('resize', () => {
    init();
    if (gameRunning) {
        createBoard();
    }
});

// Start button
startBtn.addEventListener('click', startGame);

// Initialize game on load
window.addEventListener('load', init); 