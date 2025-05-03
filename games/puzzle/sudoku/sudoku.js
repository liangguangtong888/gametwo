document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('sudoku-board');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const hintBtn = document.getElementById('hint-btn');
    const notesBtn = document.getElementById('notes-btn');
    const checkBtn = document.getElementById('check-btn');
    const messageBox = document.getElementById('message-box');
    const numberBtns = document.querySelectorAll('.number-btn');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    let selectedCell = null;
    let isNotesMode = false;
    let gameBoard = [];
    let solution = [];
    let timer = null;
    let seconds = 0;
    let difficulty = 'easy';
    
    // Difficulties (number of cells to reveal)
    const difficulties = {
        easy: 45,
        medium: 35,
        hard: 25,
        expert: 20
    };
    
    // Initialize the game
    function initGame() {
        board.innerHTML = '';
        stopTimer();
        seconds = 0;
        updateTimer();
        
        // Generate the sudoku board cells
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            
            // For notes mode
            const notes = document.createElement('div');
            notes.classList.add('notes');
            notes.style.display = 'none';
            
            for (let j = 1; j <= 9; j++) {
                const note = document.createElement('div');
                note.classList.add('note');
                note.dataset.number = j;
                notes.appendChild(note);
            }
            
            cell.appendChild(notes);
            board.appendChild(cell);
            
            cell.addEventListener('click', () => selectCell(cell));
        }
        
        generateGame();
        startTimer();
    }
    
    // Generate a new Sudoku game
    function generateGame() {
        // Create an empty board
        gameBoard = Array(81).fill(0);
        
        // Generate a solution
        solution = generateSolution();
        
        // Create a puzzle by removing numbers from the solution
        const numToRemove = 81 - difficulties[difficulty];
        const puzzle = [...solution];
        
        // Remove numbers randomly
        const indices = Array.from({length: 81}, (_, i) => i);
        shuffleArray(indices);
        
        for (let i = 0; i < numToRemove; i++) {
            puzzle[indices[i]] = 0;
        }
        
        // Set up the gameBoard and display
        gameBoard = [...puzzle];
        updateBoardDisplay();
    }
    
    // Generate a valid Sudoku solution
    function generateSolution() {
        const board = Array(81).fill(0);
        solveBoard(board);
        return board;
    }
    
    // Solve the board using backtracking
    function solveBoard(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                shuffleArray(numbers);
                
                for (let num of numbers) {
                    if (isValidPlacement(board, i, num)) {
                        board[i] = num;
                        
                        if (solveBoard(board)) {
                            return true;
                        }
                        
                        board[i] = 0;
                    }
                }
                
                return false;
            }
        }
        
        return true;
    }
    
    // Check if a number can be placed at a position
    function isValidPlacement(board, index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        // Check row
        for (let c = 0; c < 9; c++) {
            if (board[row * 9 + c] === num) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (board[r * 9 + col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[(boxRow + r) * 9 + (boxCol + c)] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Update the display of the board
    function updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const value = gameBoard[index];
            const mainDisplay = cell.querySelector('.notes').parentNode;
            
            if (value !== 0) {
                mainDisplay.textContent = value;
                cell.classList.add('fixed');
                cell.querySelector('.notes').style.display = 'none';
            } else {
                mainDisplay.textContent = '';
                cell.classList.remove('fixed');
            }
        });
    }
    
    // Select a cell
    function selectCell(cell) {
        // Clear previously selected cell
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        
        // Clear all highlights
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('highlighted');
        });
        
        cell.classList.add('selected');
        selectedCell = cell;
        
        // Highlight related cells (same row, column, box)
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        // Highlight row
        for (let c = 0; c < 9; c++) {
            const highlightIndex = row * 9 + c;
            if (highlightIndex !== index) {
                document.querySelector(`.cell[data-index="${highlightIndex}"]`).classList.add('highlighted');
            }
        }
        
        // Highlight column
        for (let r = 0; r < 9; r++) {
            const highlightIndex = r * 9 + col;
            if (highlightIndex !== index) {
                document.querySelector(`.cell[data-index="${highlightIndex}"]`).classList.add('highlighted');
            }
        }
        
        // Highlight box
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const highlightIndex = (boxRow + r) * 9 + (boxCol + c);
                if (highlightIndex !== index) {
                    document.querySelector(`.cell[data-index="${highlightIndex}"]`).classList.add('highlighted');
                }
            }
        }
    }
    
    // Place a number in the selected cell
    function placeNumber(number) {
        if (!selectedCell || selectedCell.classList.contains('fixed')) {
            return;
        }
        
        const index = parseInt(selectedCell.dataset.index);
        
        if (isNotesMode) {
            // Handle notes mode
            const notes = selectedCell.querySelector('.notes');
            const note = notes.querySelector(`.note[data-number="${number}"]`);
            
            if (notes.style.display === 'none') {
                // Switch to notes mode
                selectedCell.textContent = '';
                notes.style.display = 'grid';
                gameBoard[index] = 0;
            }
            
            if (note.textContent === String(number)) {
                note.textContent = '';
            } else {
                note.textContent = number;
            }
        } else {
            // Regular mode
            const notes = selectedCell.querySelector('.notes');
            
            if (number === 0) {
                // Erase
                selectedCell.textContent = '';
                notes.style.display = 'none';
                gameBoard[index] = 0;
                selectedCell.classList.remove('error');
                return;
            }
            
            gameBoard[index] = number;
            selectedCell.textContent = number;
            notes.style.display = 'none';
            
            // Check if the placement is valid
            checkCell(selectedCell, number);
            
            // Check if the puzzle is solved
            if (isPuzzleSolved()) {
                gameComplete();
            }
        }
    }
    
    // Check if a cell's value is valid
    function checkCell(cell, number) {
        const index = parseInt(cell.dataset.index);
        
        if (number === solution[index]) {
            cell.classList.remove('error');
            return true;
        } else {
            cell.classList.add('error');
            return false;
        }
    }
    
    // Check if the puzzle is solved
    function isPuzzleSolved() {
        return gameBoard.every((value, index) => value === solution[index]);
    }
    
    // Game complete
    function gameComplete() {
        stopTimer();
        showMessage('Congratulations! You solved the puzzle!', 'success');
    }
    
    // Show a message
    function showMessage(text, type = '') {
        messageBox.textContent = text;
        messageBox.className = 'message';
        
        if (type) {
            messageBox.classList.add(type);
        }
        
        setTimeout(() => {
            messageBox.textContent = '';
            messageBox.className = 'message';
        }, 5000);
    }
    
    // Get a hint
    function getHint() {
        if (!selectedCell || selectedCell.classList.contains('fixed')) {
            showMessage('Select an empty cell first!', 'info');
            return;
        }
        
        const index = parseInt(selectedCell.dataset.index);
        const correctValue = solution[index];
        
        // Clear any notes
        const notes = selectedCell.querySelector('.notes');
        notes.style.display = 'none';
        
        // Set the correct value
        gameBoard[index] = correctValue;
        selectedCell.textContent = correctValue;
        selectedCell.classList.add('hints');
        
        // Check if the puzzle is solved
        if (isPuzzleSolved()) {
            gameComplete();
        }
    }
    
    // Check the board
    function checkBoard() {
        let errors = 0;
        
        document.querySelectorAll('.cell').forEach(cell => {
            const index = parseInt(cell.dataset.index);
            const value = gameBoard[index];
            
            if (value !== 0 && value !== solution[index]) {
                cell.classList.add('error');
                errors++;
            }
        });
        
        if (errors > 0) {
            showMessage(`Found ${errors} mistake${errors > 1 ? 's' : ''}!`, 'error');
        } else {
            showMessage('Looking good so far!', 'success');
        }
    }
    
    // Timer functions
    function startTimer() {
        if (timer) {
            clearInterval(timer);
        }
        
        timer = setInterval(() => {
            seconds++;
            updateTimer();
        }, 1000);
    }
    
    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
    
    function updateTimer() {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        minutesEl.textContent = mins.toString().padStart(2, '0');
        secondsEl.textContent = secs.toString().padStart(2, '0');
    }
    
    // Utility function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Event listeners
    difficultySelect.addEventListener('change', function() {
        difficulty = this.value;
    });
    
    newGameBtn.addEventListener('click', function() {
        difficulty = difficultySelect.value;
        initGame();
    });
    
    hintBtn.addEventListener('click', getHint);
    
    notesBtn.addEventListener('click', function() {
        isNotesMode = !isNotesMode;
        this.classList.toggle('active');
        showMessage(isNotesMode ? 'Notes mode activated' : 'Notes mode deactivated', 'info');
    });
    
    checkBtn.addEventListener('click', checkBoard);
    
    numberBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const number = parseInt(this.dataset.number);
            placeNumber(number);
        });
    });
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (!selectedCell) return;
        
        if (e.key >= '1' && e.key <= '9') {
            placeNumber(parseInt(e.key));
        } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
            placeNumber(0);
        } else if (e.key === 'n') {
            notesBtn.click();
        } else if (e.key === 'h') {
            hintBtn.click();
        } else if (e.key === 'c') {
            checkBtn.click();
        }
    });
    
    // Initialize the game
    initGame();
}); 