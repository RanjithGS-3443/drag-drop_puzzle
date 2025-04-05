class PuzzleGame {
    constructor() {
        this.board = document.getElementById('puzzle-board');
        this.piecesContainer = document.getElementById('pieces-container');
        this.movesDisplay = document.getElementById('moves');
        this.resetButton = document.getElementById('reset');
        this.changeImageButton = document.getElementById('change-image');
        this.referenceImage = document.getElementById('reference');
        this.modal = document.getElementById('success-modal');
        this.completionMessage = document.getElementById('completion-message');
        this.playAgainButton = document.getElementById('play-again');
        this.moves = 0;
        this.pieces = [];
        this.currentImageIndex = 0;
        this.images = [
            'https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=300'
        ];
        this.imageUrl = this.images[0];
        this.gridSize = 3;
        this.init();
    }

    async init() {
        await this.loadImage();
        this.createPieces();
        this.setupEventListeners();
        this.shufflePieces();
    }

    async loadImage() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.referenceImage.src = this.imageUrl;
                resolve();
            };
            img.src = this.imageUrl;
        });
    }

    async changeImage() {
        // Move to next image in the array
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.imageUrl = this.images[this.currentImageIndex];

        // Clear existing pieces
        this.pieces = [];
        this.board.innerHTML = '';
        this.piecesContainer.innerHTML = '';
        
        // Load new image
        await this.loadImage();
        this.createPieces();
        this.attachPieceListeners(); // Attach listeners to new pieces
        this.shufflePieces();
        
        // Reset moves
        this.moves = 0;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
    }

    createPieces() {
        const pieceSize = 100; // 300px / 3 grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.draggable = true;
                piece.dataset.correctPosition = `${row}-${col}`;
                piece.style.backgroundImage = `url(${this.imageUrl})`;
                piece.style.backgroundPosition = `-${col * pieceSize}px -${row * pieceSize}px`;
                this.pieces.push(piece);
                this.piecesContainer.appendChild(piece);
            }
        }
    }

    setupEventListeners() {
        this.attachPieceListeners();
        
        this.board.addEventListener('dragover', this.handleDragOver.bind(this));
        this.board.addEventListener('drop', this.handleDrop.bind(this));
        this.piecesContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        this.piecesContainer.addEventListener('drop', this.handleDrop.bind(this));
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.changeImageButton.addEventListener('click', () => this.changeImage());
        this.playAgainButton.addEventListener('click', () => {
            this.modal.classList.remove('show');
            this.resetGame();
        });
    }

    attachPieceListeners() {
        this.pieces.forEach(piece => {
            piece.addEventListener('dragstart', this.handleDragStart.bind(this));
            piece.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.correctPosition);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        const piece = document.querySelector('.dragging');
        const correctPosition = piece.dataset.correctPosition;
        const dropTarget = e.target.closest('.puzzle-piece') || e.target;
        const targetContainer = dropTarget.closest('#puzzle-board, #pieces-container');

        if (targetContainer === this.board) {
            const rect = this.board.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / (rect.width / this.gridSize));
            const row = Math.floor(y / (rect.height / this.gridSize));
            
            const targetPosition = `${row}-${col}`;
            this.movePiece(piece, targetPosition, correctPosition, row, col);
        } else if (targetContainer === this.piecesContainer) {
            // If dropping back to pieces container, just append it
            this.piecesContainer.appendChild(piece);
            piece.classList.remove('correct', 'incorrect');
            piece.style.gridRow = '';
            piece.style.gridColumn = '';
        }
    }

    movePiece(piece, targetPosition, correctPosition, row, col) {
        this.moves++;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;

        // Move the piece to the board
        this.board.appendChild(piece);
        piece.style.gridRow = row + 1;
        piece.style.gridColumn = col + 1;

        if (targetPosition === correctPosition) {
            piece.classList.add('correct');
            piece.classList.remove('incorrect');
        } else {
            piece.classList.add('incorrect');
            piece.classList.remove('correct');
        }

        // Check if puzzle is complete
        this.checkCompletion();
    }

    checkCompletion() {
        const allPiecesOnBoard = this.board.children.length === this.gridSize * this.gridSize;
        const allCorrect = Array.from(this.board.children).every(piece => 
            piece.classList.contains('correct')
        );
        
        if (allPiecesOnBoard && allCorrect) {
            this.showSuccessMessage();
        }
    }

    showSuccessMessage() {
        this.completionMessage.textContent = `You completed the puzzle in ${this.moves} moves!`;
        this.modal.classList.add('show');
    }

    shufflePieces() {
        // Move all pieces back to the pieces container
        this.pieces.forEach(piece => {
            this.piecesContainer.appendChild(piece);
            piece.classList.remove('correct', 'incorrect');
        });

        // Randomize the order in the grid
        const positions = Array.from({ length: this.gridSize * this.gridSize }, (_, i) => {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            return { row: row + 1, col: col + 1 };
        });

        // Fisher-Yates shuffle
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        this.pieces.forEach((piece, index) => {
            piece.style.gridRow = positions[index].row;
            piece.style.gridColumn = positions[index].col;
        });
    }

    resetGame() {
        this.moves = 0;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
        this.shufflePieces();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new PuzzleGame();
}); 