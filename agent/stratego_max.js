

/**
 * @file sin_grupo.js
 * @author Luis Alfonso Pedraos Suarez
 * @description Este archivo contiene la implementación del agente StrategoMax. 
 * Fue desarrollado individualmente como parte del grupo "sin grupo".
 * @class StrategoMax
 * @extends Agent
 */
class StrategoMax extends Agent {
    constructor() {
        super();
        this.board = new Board();
        this.maxDepth = 6; // Profundidad máxima inicial
        this.baseSampleSize = 10; // Tamaño de muestra base inicial
    }

    init(color, board, time) {
        super.init(color, board, time);
        this.color = color;
        this.size = board.length;
        this.baseSampleSize = this.calculateSampleSize(this.size);
        this.randomMovesCount = 10; // Número de movimientos aleatorios iniciales
        this.currentRandomMove = 0; // Contador de movimientos aleatorios realizados
    }

    /**
     * Calcula el tamaño de muestra basado en el tamaño del tablero.
     * @param {number} size - Tamaño del tablero.
     * @returns {number} - Tamaño de muestra adecuado.
     */
    calculateSampleSize(size) {
        if (size <= 5) {
            return 30; // Tableros pequeños
            
        } else if (size <= 8) {
            return 20; // Tableros medianos
        } else {
            return 10; // Tableros grandes
        }
    }

    /**
     * Simula un movimiento en el tablero y devuelve el nuevo estado del tablero.
     * @param {Array} board - El estado actual del tablero.
     * @param {Array} move - El movimiento a simular.
     * @param {string} color - El color del jugador.
     * @returns {Array} - El nuevo estado del tablero.
     */
    simulateMove(board, move, color) {
        const [row, col, side] = move;
        let newBoard = this.board.clone(board);
        this.board.move(newBoard, row, col, side, color === 'R' ? -1 : -2);
        return newBoard;
    }

    /**
     * Evalúa el tablero y devuelve una puntuación.
     * @param {Array} board - El estado del tablero a evaluar.
     * @returns {number} - La puntuación del tablero.
     */
    evaluateBoard(board) {
        let score = 0;
        const myAgent = this.color === 'R' ? -1 : -2;
        const opponent = this.color === 'R' ? -2 : -1;

        for (let row of board) {
            for (let cell of row) {
                if (cell === myAgent) score++;
                if (cell === opponent) score--;
            }
        }

        return score;
    }

    /**
     * Selecciona una muestra aleatoria de movimientos válidos.
     * @param {Array} arr - Array de movimientos válidos.
     * @param {number} size - Tamaño de la muestra a seleccionar.
     * @returns {Array} - Subconjunto aleatorio de movimientos.
     */
    getRandomSubset(arr, size) {
        let shuffled = arr.slice(0);
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, size);
    }

    /**
     * Algoritmo Minimax con poda Alfa-Beta.
     * @param {Array} board - Estado del tablero.
     * @param {number} depth - Profundidad actual de búsqueda.
     * @param {number} alpha - Valor alfa para la poda.
     * @param {number} beta - Valor beta para la poda.
     * @param {boolean} maximizingPlayer - Indica si es el jugador maximizador.
     * @returns {number} - Puntuación del tablero.
     */
    minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.board.winner(board) !== ' ') {
            return this.evaluateBoard(board);
        }

        let validMoves = this.board.valid_moves(board);
        validMoves = this.getRandomSubset(validMoves, Math.min(10, validMoves.length));

        if (maximizingPlayer) {
            let maxeval = -Infinity;
            for (const move of validMoves) {
                const newBoard = this.simulateMove(board, move, this.color);
                const evall = this.minimax(newBoard, depth - 1, alpha, beta, false);
                maxeval = Math.max(maxeval, evall);
                alpha = Math.max(alpha, evall);
                if (beta <= alpha) break;
            }
            return maxeval;
        } else {
            let mineval = Infinity;
            for (const move of validMoves) {
                const newBoard = this.simulateMove(board, move, this.color === 'R' ? 'Y' : 'R');
                const evall = this.minimax(newBoard, depth - 1, alpha, beta, true);
                mineval = Math.min(mineval, evall);
                beta = Math.min(beta, evall);
                if (beta <= alpha) break;
            }
            return mineval;
        }
    }

    /**
     * Encuentra el mejor movimiento posible.
     * @param {Array} board - Estado actual del tablero.
     * @returns {Array|null} - El mejor movimiento encontrado.
     */
    findBestMove(board) {
        let validMoves = this.board.valid_moves(board);
        validMoves = this.getRandomSubset(validMoves, Math.min(this.baseSampleSize, validMoves.length));

        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of validMoves) {
            const newBoard = this.simulateMove(board, move, this.color);
            const score = this.minimax(newBoard, this.maxDepth, -Infinity, Infinity, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }
    /**
      * Determina si un movimiento está en una esquina del tablero.
      * @param {Array} move - El movimiento a verificar.
      * @returns {boolean} - Verdadero si el movimiento está en una esquina.
      */
    isCornerMove(move) {
        const [row, col] = move;
        return (row === 0 || row === this.size - 1) && (col === 0 || col === this.size - 1);
    }

    /**
     * Filtra los movimientos válidos para excluir los que están en las esquinas.
     * @param {Array} moves - Lista de movimientos válidos.
     * @returns {Array} - Lista de movimientos válidos sin los movimientos de las esquinas.
     */
    filterCornerMoves(moves) {
        return moves.filter(move => !this.isCornerMove(move));
    }

    compute(board, time) {
        // Realizar movimientos aleatorios iniciales para tableros grandes
        if (this.size >= 11 && this.currentRandomMove < this.randomMovesCount) {
            this.currentRandomMove++;
            let validMoves = this.board.valid_moves(board);
            validMoves = this.filterCornerMoves(validMoves);
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }
        // Ajustar la profundidad según el tiempo restante
        if (time < this.time / 20) {
            this.maxDepth = 0; // Jugar al azar si queda muy poco tiempo
        } else if (time < this.time / 10) {
            this.maxDepth = 1;
        } else if (time < this.time / 4) {
            this.maxDepth = 3;
        } else if (time < this.time / 2) {
            this.maxDepth = 5;
        }

        if (this.maxDepth === 0) {
            // Modo de emergencia, elige un movimiento válido aleatorio
            const validMoves = this.board.valid_moves(board);
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        return this.findBestMove(board);
    }
}
