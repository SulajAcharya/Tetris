const gridElement = document.getElementById('tetrisGrid');
const gridWidth = 20;
const gridHeight = 27;
const grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));
const speedControl = document.getElementById('speedControl');
speedControl.addEventListener('input', () => {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, parseInt(speedControl.value));
});

let activeShape = null;
let gameInterval = null;
let score = 0;
let topScore = parseInt(localStorage.getItem('tetrisTopScore')) || 0;
let nextShape = getNextShape(); // Initialize next shape
let startTime = null;

// Function to update the time
function updateTime() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('gameTime').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Initialize the score board
function initializeScoreboard() {
    score = 0; // Reset the score
    document.getElementById('score').textContent = score;
    document.getElementById('topScore').textContent = topScore;
}

// Create the grid
function createGrid() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${gridWidth}, 20px)`;
    gridElement.style.gridTemplateRows = `repeat(${gridHeight}, 20px)`;
    for (let i = 0; i < gridWidth * gridHeight; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gridElement.appendChild(cell);
    }
}

// Render the grid
function renderGrid() {
    gridElement.querySelectorAll('.cell').forEach((cell, index) => {
        cell.innerHTML = '';
        const row = Math.floor(index / gridWidth);
        const col = index % gridWidth;
        if (grid[row][col]) {
            const block = document.createElement('div');
            block.classList.add('block', grid[row][col].className);
            cell.appendChild(block);
        }
    });

    if (activeShape) {
        activeShape.layout.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell) {
                    const targetRow = activeShape.row + rIdx;
                    const targetCol = activeShape.col + cIdx;
                    const index = targetRow * gridWidth + targetCol;
                    const gridCell = gridElement.children[index];
                    const block = document.createElement('div');
                    block.classList.add('block', activeShape.className);
                    gridCell.appendChild(block);
                }
            });
        });
    }
}

// Check for collisions
function checkCollision(newRow, newCol, layout = activeShape.layout) {
    return layout.some((row, rIdx) =>
        row.some((cell, cIdx) => {
            if (cell) {
                const targetRow = newRow + rIdx;
                const targetCol = newCol + cIdx;
                if (
                    targetRow >= gridHeight ||
                    targetCol < 0 || targetCol >= gridWidth ||
                    (targetRow >= 0 && grid[targetRow][targetCol])
                ) {
                    return true;
                }
            }
            return false;
        })
    );
}

// Place the shape on the grid
function placeShape() {
    activeShape.layout.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            if (cell) {
                const targetRow = activeShape.row + rIdx;
                const targetCol = activeShape.col + cIdx;
                if (targetRow >= 0) {
                    grid[targetRow][targetCol] = { className: activeShape.className };
                }
            }
        });
    });

    // Add 5 points for each shape placed
    updateScore(5);

    // Clear rows and add points for cleared rows
    clearRows();

    // Start the next shape
    activeShape = null;
    startNextShape();
}

// Clear full rows
function clearRows() {
    for (let row = gridHeight - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell)) {
            grid.splice(row, 1);
            grid.unshift(Array(gridWidth).fill(null));
            updateScore(15);  // Add 15 points for clearing a row
        }
    }
}

// Update score
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    if (score > topScore) {
        topScore = score;
        localStorage.setItem('tetrisTopScore', topScore);
        document.getElementById('topScore').textContent = topScore;
    }
}

// Start the next shape
function startNextShape() {
    activeShape = nextShape;
    nextShape = getNextShape();
    renderNextShape();
    activeShape.row = 0;
    activeShape.col = Math.floor(gridWidth / 2) - 2;
    if (checkCollision(activeShape.row, activeShape.col)) {
        clearInterval(gameInterval);
        alert("Game Over!");
    }
}

// Render the next shape
function renderNextShape() {
    const nextShapeGrid = document.getElementById('nextShapeGrid');
    nextShapeGrid.innerHTML = '';  // Clear previous next shape

    const layout = nextShape.layout;
    const rows = layout.length;
    const cols = layout[0].length;

    // Calculate the starting row and column to center the shape
    const startRow = Math.floor((5 - rows) / 2);  // Center vertically in a 5x5 grid
    const startCol = Math.floor((5 - cols) / 2);  // Center horizontally in a 5x5 grid

    // Render the shape at the center of the 5x5 grid
    layout.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            if (cell) {
                const block = document.createElement('div');
                block.classList.add('block', nextShape.className);
                block.style.width = '20px';
                block.style.height = '20px';
                block.style.gridColumnStart = startCol + cIdx + 1; // Offset by startCol
                block.style.gridRowStart = startRow + rIdx + 1; // Offset by startRow
                nextShapeGrid.appendChild(block);
            }
        });
    });
}

// Get the next random shape
function getNextShape() {
    const shapes = [
        { layout: [[1, 1, 1, 1]], className: 'box1' }, // I shape
        { layout: [[1, 1], [1, 1]], className: 'box2' }, // O shape
        { layout: [[0, 1, 0], [1, 1, 1]], className: 'box3' }, // T shape
        { layout: [[0, 1, 1], [1, 1, 0]], className: 'box4' }, // S shape
        { layout: [[1, 1, 0], [0, 1, 1]], className: 'box5' }, // Z shape
        { layout: [[1, 1, 1], [1, 0, 0]], className: 'box6' }, // L shape
        { layout: [[1, 1, 1], [0, 0, 1]], className: 'box7' }, // J shape
        { layout: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], className: 'box8' }, // + shape
        { layout: [[1, 1, 0], [0, 1, 0], [0, 1, 1]], className: 'box9' }, // Unique Z shape
        { layout: [[0, 1, 1], [0, 1, 0], [1, 1, 0]], className: 'box10' }, // Unique S shape
        { layout: [[1, 0, 1], [1, 1, 1], [1, 0, 1]], className: 'box11' }, // H shape
        { layout: [[1, 0, 1], [1, 0, 1], [1, 1, 1]], className: 'box12' }, // U shape
        { layout: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], className: 'box13' }, // V shape
        { layout: [[1, 0, 0], [1, 1, 0], [0, 1, 1]], className: 'box14' }, // W shape
    ];
    const randomIndex = Math.floor(Math.random() * shapes.length);
    return shapes[randomIndex];
}

// Game loop
function gameLoop() {
    if (activeShape) {
        if (!checkCollision(activeShape.row + 1, activeShape.col)) {
            activeShape.row++;
        } else {
            placeShape();
        }
    }
    renderGrid();
    updateTime();
}

// Handle keyboard events
window.addEventListener('keydown', (e) => {
    if (!activeShape) return;

    if (e.key === 'ArrowLeft' && !checkCollision(activeShape.row, activeShape.col - 1)) {
        activeShape.col--;
    } else if (e.key === 'ArrowRight' && !checkCollision(activeShape.row, activeShape.col + 1)) {
        activeShape.col++;
    } else if (e.key === 'ArrowDown') {
        if (!checkCollision(activeShape.row + 1, activeShape.col)) {
            activeShape.row++;
        } else {
            placeShape();
        }
    } else if (e.key === 'ArrowUp') {
        const rotatedLayout = rotateShape(activeShape.layout);
        if (!checkCollision(activeShape.row, activeShape.col, rotatedLayout)) {
            activeShape.layout = rotatedLayout;
        }
    }
    renderGrid();
});

// Rotate the shape
function rotateShape(layout) {
    return layout[0].map((_, index) => layout.map(row => row[index])).reverse();
}

// Start button functionality
document.getElementById('startButton').addEventListener('click', () => {
    console.log('Start Button Clicked');
    
    // Reset the grid, score, and activeShape
    initializeScoreboard();  // Reset the score display
    createGrid();            // Create the game grid
    startTime = Date.now();
    
    // Stop any ongoing game loop if exists
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Reset the grid and the game state
    grid.forEach(row => row.fill(null)); // Clear the grid
    startNextShape();  // Start the next shape
    
    // Start a new game loop with an interval of 500ms
    gameInterval = setInterval(gameLoop, 500);
});
