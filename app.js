// ===== Duolingo-Style Tracing App =====
// This implements guided path tracing where users must follow specific stroke paths

// ===== App State =====
const state = {
    currentSection: 'letters',
    currentIndex: 0,
    currentStrokeIndex: 0,
    currentPointIndex: 0,
    completed: {
        letters: new Set(),
        numbers: new Set(),
        words: new Set()
    },
    isDrawing: false,
    strokeCompleted: [],
    tracePoints: [],
    speechBubbleTimeout: null
};

// ===== Content Data =====
const content = {
    // Uppercase first, then lowercase
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
    numbers: '0123456789'.split(''),
    words: ['CAT', 'DOG', 'SUN', 'MOM', 'DAD', 'RED', 'BIG', 'HAT', 'CUP', 'BUS']
};

// ===== Stroke Path Data =====
// Each character has strokes, each stroke has points to follow
// Points are in normalized coordinates (0-1)
// Strokes follow standard handwriting teaching order
const strokePaths = {
    // === UPPERCASE LETTERS ===
    'A': [
        // Stroke 1: Left slant (bottom to top)
        { points: [[0.5, 0.15], [0.35, 0.5], [0.2, 0.85]] },
        // Stroke 2: Right slant (top to bottom)
        { points: [[0.5, 0.15], [0.65, 0.5], [0.8, 0.85]] },
        // Stroke 3: Horizontal bar
        { points: [[0.32, 0.55], [0.5, 0.55], [0.68, 0.55]] }
    ],
    'B': [
        // Stroke 1: Vertical line down
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Top bump
        { points: [[0.3, 0.15], [0.5, 0.15], [0.6, 0.25], [0.6, 0.4], [0.5, 0.5], [0.3, 0.5]] },
        // Stroke 3: Bottom bump (slightly bigger)
        { points: [[0.3, 0.5], [0.55, 0.5], [0.65, 0.6], [0.65, 0.75], [0.55, 0.85], [0.3, 0.85]] }
    ],
    'C': [
        // Single curved stroke (start top-right, go counterclockwise)
        { points: [[0.7, 0.25], [0.55, 0.15], [0.4, 0.15], [0.25, 0.3], [0.2, 0.5], [0.25, 0.7], [0.4, 0.85], [0.55, 0.85], [0.7, 0.75]] }
    ],
    'D': [
        // Stroke 1: Vertical line
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Curved part
        { points: [[0.3, 0.15], [0.5, 0.15], [0.7, 0.3], [0.75, 0.5], [0.7, 0.7], [0.5, 0.85], [0.3, 0.85]] }
    ],
    'E': [
        // Stroke 1: Vertical line (top to bottom)
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Top horizontal
        { points: [[0.3, 0.15], [0.5, 0.15], [0.7, 0.15]] },
        // Stroke 3: Middle horizontal
        { points: [[0.3, 0.5], [0.45, 0.5], [0.6, 0.5]] },
        // Stroke 4: Bottom horizontal
        { points: [[0.3, 0.85], [0.5, 0.85], [0.7, 0.85]] }
    ],
    'F': [
        // Stroke 1: Vertical line
        { points: [[0.35, 0.15], [0.35, 0.5], [0.35, 0.85]] },
        // Stroke 2: Top horizontal
        { points: [[0.35, 0.15], [0.5, 0.15], [0.7, 0.15]] },
        // Stroke 3: Middle horizontal
        { points: [[0.35, 0.5], [0.5, 0.5], [0.6, 0.5]] }
    ],
    'G': [
        // Stroke 1: C-shape (counterclockwise from top-right)
        { points: [[0.65, 0.22], [0.5, 0.12], [0.35, 0.18], [0.25, 0.35], [0.25, 0.5], [0.25, 0.65], [0.35, 0.82], [0.5, 0.88], [0.65, 0.78], [0.65, 0.55]] },
        // Stroke 2: Horizontal bar inward from right
        { points: [[0.65, 0.55], [0.5, 0.55]] }
    ],
    'H': [
        // Stroke 1: Left vertical (narrower - 0.3 to 0.7)
        { points: [[0.3, 0.12], [0.3, 0.5], [0.3, 0.88]] },
        // Stroke 2: Right vertical
        { points: [[0.7, 0.12], [0.7, 0.5], [0.7, 0.88]] },
        // Stroke 3: Horizontal bar
        { points: [[0.3, 0.5], [0.5, 0.5], [0.7, 0.5]] }
    ],
    'I': [
        // Simple vertical line only (for kids)
        { points: [[0.5, 0.12], [0.5, 0.5], [0.5, 0.88]] }
    ],
    'J': [
        // Stroke 1: Down and hook left
        { points: [[0.55, 0.15], [0.55, 0.5], [0.55, 0.7], [0.45, 0.82], [0.35, 0.85], [0.25, 0.78]] }
    ],
    'K': [
        // Stroke 1: Vertical line
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Upper diagonal (from right to middle)
        { points: [[0.7, 0.15], [0.5, 0.35], [0.3, 0.5]] },
        // Stroke 3: Lower diagonal (from middle to right)
        { points: [[0.3, 0.5], [0.5, 0.68], [0.7, 0.85]] }
    ],
    'L': [
        // Stroke 1: Vertical line
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Bottom horizontal
        { points: [[0.3, 0.85], [0.5, 0.85], [0.7, 0.85]] }
    ],
    'M': [
        // Stroke 1: Left vertical down
        { points: [[0.2, 0.12], [0.2, 0.5], [0.2, 0.88]] },
        // Stroke 2: Left diagonal to center bottom
        { points: [[0.2, 0.12], [0.35, 0.45], [0.5, 0.75]] },
        // Stroke 3: Right diagonal from center to top
        { points: [[0.5, 0.75], [0.65, 0.45], [0.8, 0.12]] },
        // Stroke 4: Right vertical down
        { points: [[0.8, 0.12], [0.8, 0.5], [0.8, 0.88]] }
    ],
    'N': [
        // Stroke 1: Left vertical down
        { points: [[0.25, 0.12], [0.25, 0.5], [0.25, 0.88]] },
        // Stroke 2: Diagonal from top-left to bottom-right
        { points: [[0.25, 0.12], [0.5, 0.5], [0.75, 0.88]] },
        // Stroke 3: Right vertical up
        { points: [[0.75, 0.88], [0.75, 0.5], [0.75, 0.12]] }
    ],
    'O': [
        // Single oval stroke (start at top, go counterclockwise)
        { points: [[0.5, 0.15], [0.3, 0.2], [0.2, 0.4], [0.2, 0.6], [0.3, 0.8], [0.5, 0.85], [0.7, 0.8], [0.8, 0.6], [0.8, 0.4], [0.7, 0.2], [0.5, 0.15]] }
    ],
    'P': [
        // Stroke 1: Vertical line
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Top bump
        { points: [[0.3, 0.15], [0.5, 0.15], [0.65, 0.25], [0.65, 0.42], [0.5, 0.52], [0.3, 0.52]] }
    ],
    'Q': [
        // Stroke 1: Oval
        { points: [[0.5, 0.15], [0.3, 0.2], [0.2, 0.4], [0.2, 0.55], [0.3, 0.72], [0.5, 0.77], [0.7, 0.72], [0.8, 0.55], [0.8, 0.4], [0.7, 0.2], [0.5, 0.15]] },
        // Stroke 2: Tail
        { points: [[0.55, 0.65], [0.68, 0.8], [0.78, 0.9]] }
    ],
    'R': [
        // Stroke 1: Vertical line
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Top bump
        { points: [[0.3, 0.15], [0.5, 0.15], [0.62, 0.25], [0.62, 0.38], [0.5, 0.5], [0.3, 0.5]] },
        // Stroke 3: Leg diagonal
        { points: [[0.42, 0.5], [0.55, 0.67], [0.7, 0.85]] }
    ],
    'S': [
        // Single S-curve (start top-right, snake down)
        { points: [[0.65, 0.2], [0.5, 0.15], [0.35, 0.18], [0.25, 0.28], [0.28, 0.4], [0.45, 0.5], [0.55, 0.5], [0.72, 0.6], [0.75, 0.72], [0.65, 0.83], [0.5, 0.85], [0.35, 0.8]] }
    ],
    'T': [
        // Stroke 1: Top horizontal
        { points: [[0.2, 0.15], [0.5, 0.15], [0.8, 0.15]] },
        // Stroke 2: Vertical line down
        { points: [[0.5, 0.15], [0.5, 0.5], [0.5, 0.85]] }
    ],
    'U': [
        // Single U-shape (down, curve, up)
        { points: [[0.25, 0.15], [0.25, 0.5], [0.25, 0.7], [0.38, 0.83], [0.5, 0.85], [0.62, 0.83], [0.75, 0.7], [0.75, 0.5], [0.75, 0.15]] }
    ],
    'V': [
        // Stroke 1: Left diagonal down
        { points: [[0.2, 0.15], [0.35, 0.5], [0.5, 0.85]] },
        // Stroke 2: Right diagonal up
        { points: [[0.5, 0.85], [0.65, 0.5], [0.8, 0.15]] }
    ],
    'W': [
        // Stroke 1: First down stroke
        { points: [[0.1, 0.15], [0.2, 0.5], [0.28, 0.85]] },
        // Stroke 2: First up stroke
        { points: [[0.28, 0.85], [0.38, 0.5], [0.5, 0.4]] },
        // Stroke 3: Second down stroke
        { points: [[0.5, 0.4], [0.62, 0.5], [0.72, 0.85]] },
        // Stroke 4: Second up stroke
        { points: [[0.72, 0.85], [0.82, 0.5], [0.9, 0.15]] }
    ],
    'X': [
        // Stroke 1: Diagonal down-right
        { points: [[0.2, 0.15], [0.5, 0.5], [0.8, 0.85]] },
        // Stroke 2: Diagonal down-left
        { points: [[0.8, 0.15], [0.5, 0.5], [0.2, 0.85]] }
    ],
    'Y': [
        // Stroke 1: Left diagonal to center
        { points: [[0.2, 0.15], [0.35, 0.35], [0.5, 0.5]] },
        // Stroke 2: Right diagonal to center
        { points: [[0.8, 0.15], [0.65, 0.35], [0.5, 0.5]] },
        // Stroke 3: Vertical down
        { points: [[0.5, 0.5], [0.5, 0.68], [0.5, 0.85]] }
    ],
    'Z': [
        // Stroke 1: Top horizontal
        { points: [[0.2, 0.15], [0.5, 0.15], [0.8, 0.15]] },
        // Stroke 2: Diagonal down
        { points: [[0.8, 0.15], [0.5, 0.5], [0.2, 0.85]] },
        // Stroke 3: Bottom horizontal
        { points: [[0.2, 0.85], [0.5, 0.85], [0.8, 0.85]] }
    ],

    // === LOWERCASE LETTERS ===
    'a': [
        // Stroke 1: Circle (counterclockwise from right)
        { points: [[0.65, 0.4], [0.55, 0.35], [0.4, 0.35], [0.28, 0.45], [0.25, 0.6], [0.3, 0.75], [0.45, 0.85], [0.6, 0.8], [0.65, 0.65]] },
        // Stroke 2: Vertical line down
        { points: [[0.65, 0.35], [0.65, 0.6], [0.65, 0.85]] }
    ],
    'b': [
        // Stroke 1: Tall vertical line
        { points: [[0.35, 0.15], [0.35, 0.5], [0.35, 0.85]] },
        // Stroke 2: Bump (clockwise from middle)
        { points: [[0.35, 0.45], [0.5, 0.35], [0.65, 0.45], [0.7, 0.6], [0.65, 0.78], [0.5, 0.85], [0.35, 0.78]] }
    ],
    'c': [
        // Single curve
        { points: [[0.65, 0.4], [0.5, 0.35], [0.35, 0.42], [0.28, 0.58], [0.35, 0.75], [0.5, 0.85], [0.65, 0.78]] }
    ],
    'd': [
        // Stroke 1: Circle (counterclockwise)
        { points: [[0.6, 0.45], [0.45, 0.35], [0.3, 0.45], [0.25, 0.6], [0.3, 0.78], [0.45, 0.85], [0.6, 0.75]] },
        // Stroke 2: Tall vertical line
        { points: [[0.65, 0.15], [0.65, 0.5], [0.65, 0.85]] }
    ],
    'e': [
        // Stroke 1: Horizontal then curve
        { points: [[0.28, 0.55], [0.5, 0.55], [0.68, 0.55], [0.7, 0.42], [0.55, 0.35], [0.35, 0.4], [0.25, 0.55], [0.3, 0.75], [0.5, 0.85], [0.68, 0.78]] }
    ],
    'f': [
        // Stroke 1: Curve down
        { points: [[0.65, 0.2], [0.55, 0.15], [0.42, 0.2], [0.38, 0.35], [0.38, 0.6], [0.38, 0.85]] },
        // Stroke 2: Crossbar
        { points: [[0.25, 0.5], [0.38, 0.5], [0.55, 0.5]] }
    ],
    'g': [
        // Stroke 1: Circle
        { points: [[0.62, 0.45], [0.5, 0.35], [0.35, 0.42], [0.28, 0.55], [0.35, 0.7], [0.5, 0.75], [0.62, 0.65]] },
        // Stroke 2: Descender with hook
        { points: [[0.62, 0.35], [0.62, 0.7], [0.62, 0.9], [0.5, 0.98], [0.35, 0.95]] }
    ],
    'h': [
        // Stroke 1: Tall vertical
        { points: [[0.3, 0.15], [0.3, 0.5], [0.3, 0.85]] },
        // Stroke 2: Hump
        { points: [[0.3, 0.5], [0.45, 0.38], [0.6, 0.42], [0.68, 0.55], [0.68, 0.7], [0.68, 0.85]] }
    ],
    'i': [
        // Stroke 1: Vertical line
        { points: [[0.5, 0.4], [0.5, 0.62], [0.5, 0.85]] },
        // Stroke 2: Dot (just a point)
        { points: [[0.5, 0.22], [0.5, 0.25]] }
    ],
    'j': [
        // Stroke 1: Down with hook
        { points: [[0.5, 0.4], [0.5, 0.7], [0.5, 0.9], [0.4, 0.98], [0.28, 0.95]] },
        // Stroke 2: Dot
        { points: [[0.5, 0.22], [0.5, 0.25]] }
    ],
    'k': [
        // Stroke 1: Tall vertical
        { points: [[0.32, 0.15], [0.32, 0.5], [0.32, 0.85]] },
        // Stroke 2: Upper diagonal
        { points: [[0.65, 0.38], [0.48, 0.52], [0.32, 0.58]] },
        // Stroke 3: Lower diagonal
        { points: [[0.4, 0.55], [0.52, 0.7], [0.68, 0.85]] }
    ],
    'l': [
        // Single vertical line
        { points: [[0.5, 0.15], [0.5, 0.5], [0.5, 0.85]] }
    ],
    'm': [
        // Stroke 1: Down
        { points: [[0.15, 0.4], [0.15, 0.62], [0.15, 0.85]] },
        // Stroke 2: First hump
        { points: [[0.15, 0.48], [0.28, 0.38], [0.4, 0.45], [0.42, 0.65], [0.42, 0.85]] },
        // Stroke 3: Second hump
        { points: [[0.42, 0.48], [0.58, 0.38], [0.72, 0.45], [0.75, 0.65], [0.75, 0.85]] }
    ],
    'n': [
        // Stroke 1: Down
        { points: [[0.28, 0.4], [0.28, 0.62], [0.28, 0.85]] },
        // Stroke 2: Hump
        { points: [[0.28, 0.5], [0.45, 0.38], [0.62, 0.45], [0.68, 0.6], [0.68, 0.72], [0.68, 0.85]] }
    ],
    'o': [
        // Oval
        { points: [[0.5, 0.35], [0.35, 0.4], [0.25, 0.55], [0.28, 0.72], [0.42, 0.85], [0.58, 0.85], [0.72, 0.72], [0.75, 0.55], [0.65, 0.4], [0.5, 0.35]] }
    ],
    'p': [
        // Stroke 1: Descender
        { points: [[0.32, 0.4], [0.32, 0.7], [0.32, 1.0]] },
        // Stroke 2: Bump
        { points: [[0.32, 0.45], [0.48, 0.35], [0.65, 0.42], [0.7, 0.58], [0.65, 0.75], [0.48, 0.82], [0.32, 0.72]] }
    ],
    'q': [
        // Stroke 1: Circle
        { points: [[0.6, 0.45], [0.48, 0.35], [0.32, 0.42], [0.25, 0.58], [0.32, 0.75], [0.48, 0.82], [0.6, 0.72]] },
        // Stroke 2: Descender
        { points: [[0.65, 0.4], [0.65, 0.7], [0.65, 1.0]] }
    ],
    'r': [
        // Stroke 1: Down
        { points: [[0.35, 0.4], [0.35, 0.62], [0.35, 0.85]] },
        // Stroke 2: Shoulder
        { points: [[0.35, 0.5], [0.48, 0.38], [0.62, 0.42], [0.68, 0.48]] }
    ],
    's': [
        // S-curve
        { points: [[0.62, 0.42], [0.48, 0.35], [0.35, 0.42], [0.32, 0.52], [0.45, 0.6], [0.58, 0.68], [0.62, 0.78], [0.5, 0.85], [0.35, 0.8]] }
    ],
    't': [
        // Stroke 1: Down with hook
        { points: [[0.48, 0.2], [0.48, 0.5], [0.48, 0.75], [0.55, 0.83], [0.65, 0.82]] },
        // Stroke 2: Crossbar
        { points: [[0.3, 0.42], [0.48, 0.42], [0.65, 0.42]] }
    ],
    'u': [
        // Stroke 1: Down, curve, up
        { points: [[0.28, 0.4], [0.28, 0.6], [0.32, 0.78], [0.48, 0.85], [0.62, 0.78], [0.68, 0.6]] },
        // Stroke 2: Down
        { points: [[0.68, 0.4], [0.68, 0.62], [0.68, 0.85]] }
    ],
    'v': [
        // Stroke 1: Down left
        { points: [[0.25, 0.4], [0.38, 0.62], [0.5, 0.85]] },
        // Stroke 2: Up right
        { points: [[0.5, 0.85], [0.62, 0.62], [0.75, 0.4]] }
    ],
    'w': [
        // Stroke 1: Down
        { points: [[0.12, 0.4], [0.2, 0.62], [0.28, 0.85]] },
        // Stroke 2: Up
        { points: [[0.28, 0.85], [0.38, 0.58], [0.45, 0.48]] },
        // Stroke 3: Down
        { points: [[0.45, 0.48], [0.55, 0.68], [0.62, 0.85]] },
        // Stroke 4: Up
        { points: [[0.62, 0.85], [0.75, 0.62], [0.85, 0.4]] }
    ],
    'x': [
        // Stroke 1: Diagonal right
        { points: [[0.25, 0.4], [0.5, 0.62], [0.75, 0.85]] },
        // Stroke 2: Diagonal left
        { points: [[0.75, 0.4], [0.5, 0.62], [0.25, 0.85]] }
    ],
    'y': [
        // Stroke 1: Down left to center
        { points: [[0.28, 0.4], [0.4, 0.6], [0.5, 0.75]] },
        // Stroke 2: Down right with descender
        { points: [[0.72, 0.4], [0.58, 0.65], [0.45, 0.88], [0.35, 0.98], [0.25, 0.95]] }
    ],
    'z': [
        // Stroke 1: Top horizontal
        { points: [[0.28, 0.4], [0.5, 0.4], [0.72, 0.4]] },
        // Stroke 2: Diagonal
        { points: [[0.72, 0.4], [0.5, 0.62], [0.28, 0.85]] },
        // Stroke 3: Bottom horizontal
        { points: [[0.28, 0.85], [0.5, 0.85], [0.72, 0.85]] }
    ],

    // === NUMBERS ===
    '0': [
        { points: [[0.5, 0.15], [0.35, 0.22], [0.25, 0.4], [0.25, 0.6], [0.35, 0.78], [0.5, 0.85], [0.65, 0.78], [0.75, 0.6], [0.75, 0.4], [0.65, 0.22], [0.5, 0.15]] }
    ],
    '1': [
        // Slant to start
        { points: [[0.38, 0.28], [0.5, 0.15]] },
        // Vertical
        { points: [[0.5, 0.15], [0.5, 0.5], [0.5, 0.85]] },
        // Base
        { points: [[0.35, 0.85], [0.5, 0.85], [0.65, 0.85]] }
    ],
    '2': [
        { points: [[0.28, 0.28], [0.4, 0.15], [0.55, 0.15], [0.7, 0.22], [0.72, 0.35], [0.62, 0.5], [0.4, 0.7], [0.25, 0.85], [0.5, 0.85], [0.75, 0.85]] }
    ],
    '3': [
        { points: [[0.28, 0.22], [0.45, 0.15], [0.6, 0.18], [0.7, 0.28], [0.68, 0.4], [0.55, 0.48], [0.45, 0.5]] },
        { points: [[0.55, 0.52], [0.7, 0.6], [0.72, 0.72], [0.6, 0.83], [0.45, 0.85], [0.28, 0.8]] }
    ],
    '4': [
        // Stroke 1: Down-left slant then right
        { points: [[0.55, 0.12], [0.4, 0.35], [0.28, 0.55], [0.5, 0.55], [0.68, 0.55]] },
        // Stroke 2: Vertical line
        { points: [[0.55, 0.12], [0.55, 0.5], [0.55, 0.88]] }
    ],
    '5': [
        // Stroke 1: Top horizontal (right to left)
        { points: [[0.65, 0.12], [0.45, 0.12], [0.3, 0.12]] },
        // Stroke 2: Vertical down
        { points: [[0.3, 0.12], [0.3, 0.32], [0.3, 0.45]] },
        // Stroke 3: Curved bottom
        { points: [[0.3, 0.45], [0.45, 0.42], [0.58, 0.52], [0.62, 0.68], [0.52, 0.82], [0.4, 0.88], [0.28, 0.8]] }
    ],
    '6': [
        { points: [[0.62, 0.2], [0.48, 0.15], [0.35, 0.2], [0.25, 0.35], [0.25, 0.55], [0.3, 0.72], [0.45, 0.85], [0.6, 0.82], [0.7, 0.68], [0.68, 0.52], [0.52, 0.45], [0.35, 0.5], [0.25, 0.55]] }
    ],
    '7': [
        { points: [[0.25, 0.15], [0.5, 0.15], [0.75, 0.15]] },
        { points: [[0.75, 0.15], [0.58, 0.42], [0.45, 0.65], [0.38, 0.85]] }
    ],
    '8': [
        // Stroke 1: Top loop (start from top, go left-down)
        { points: [[0.5, 0.12], [0.38, 0.18], [0.32, 0.3], [0.38, 0.42], [0.5, 0.48]] },
        // Stroke 2: Bottom loop (continue down-right-up)
        { points: [[0.5, 0.48], [0.65, 0.55], [0.7, 0.7], [0.6, 0.85], [0.5, 0.88], [0.4, 0.85], [0.3, 0.7], [0.35, 0.55], [0.5, 0.48], [0.62, 0.42], [0.68, 0.28], [0.62, 0.15], [0.5, 0.12]] }
    ],
    '9': [
        { points: [[0.65, 0.5], [0.68, 0.35], [0.58, 0.2], [0.45, 0.15], [0.32, 0.2], [0.28, 0.35], [0.35, 0.48], [0.5, 0.52], [0.65, 0.5]] },
        { points: [[0.65, 0.5], [0.6, 0.68], [0.48, 0.85], [0.35, 0.85]] }
    ]
};

// ===== Sound Effects =====
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'success':
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        case 'point':
            oscillator.frequency.setValueAtTime(600 + state.currentPointIndex * 50, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'stroke':
            oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'click':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
    }
}

// ===== DOM Elements =====
const elements = {
    guideCanvas: document.getElementById('guideCanvas'),
    tracingCanvas: document.getElementById('tracingCanvas'),
    currentCharacter: document.getElementById('currentCharacter'),
    characterPicker: document.getElementById('characterPicker'),
    progressFill: document.getElementById('progressFill'),
    speechBubble: document.getElementById('speechBubble'),
    mascot: document.getElementById('mascot'),
    celebration: document.getElementById('celebration'),
    starsContainer: document.getElementById('starsContainer'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    clearBtn: document.getElementById('clearBtn'),
    checkBtn: document.getElementById('checkBtn'),
    hintBtn: document.getElementById('hintBtn'),
    lettersTab: document.getElementById('lettersTab'),
    numbersTab: document.getElementById('numbersTab'),
    wordsTab: document.getElementById('wordsTab')
};

const guideCtx = elements.guideCanvas.getContext('2d');
const tracingCtx = elements.tracingCanvas.getContext('2d');

// ===== Speech Bubble with Auto-Hide =====
function showSpeechBubble(message, duration = 3000) {
    // Clear any existing timeout
    if (state.speechBubbleTimeout) {
        clearTimeout(state.speechBubbleTimeout);
    }

    elements.speechBubble.textContent = message;
    elements.speechBubble.style.opacity = '1';
    elements.speechBubble.style.transform = 'scale(1)';

    // Auto-hide after duration
    state.speechBubbleTimeout = setTimeout(() => {
        elements.speechBubble.style.opacity = '0';
        elements.speechBubble.style.transform = 'scale(0.8)';
    }, duration);
}

// ===== Canvas Setup =====
function resizeCanvases() {
    const container = elements.guideCanvas.parentElement;
    const rect = container.getBoundingClientRect();

    elements.guideCanvas.width = rect.width;
    elements.guideCanvas.height = rect.height;
    elements.tracingCanvas.width = rect.width;
    elements.tracingCanvas.height = rect.height;

    drawGuide();
}

function getDrawingArea() {
    const canvas = elements.guideCanvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;

    // Determine target aspect ratio based on content
    let targetRatio = 0.85; // Default slightly tall for letters

    if (state.currentSection === 'words') {
        const word = content.words[state.currentIndex];
        // Words need to be wider. Since they are compressed to 0-1 x coord,
        // we need to draw them on a wide area to restore proportions.
        targetRatio = Math.max(1, word.length * 0.7);
    }

    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const canvasRatio = availableWidth / availableHeight;

    let drawWidth, drawHeight;

    if (canvasRatio > targetRatio) {
        // Canvas is wider than needed
        drawHeight = availableHeight;
        drawWidth = drawHeight * targetRatio;
    } else {
        // Canvas is taller than needed
        drawWidth = availableWidth;
        drawHeight = drawWidth / targetRatio;
    }

    return {
        x: padding + (availableWidth - drawWidth) / 2,
        y: padding + (availableHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
    };
}

// ===== Get Current Strokes =====
function getCurrentStrokes() {
    const currentItem = content[state.currentSection][state.currentIndex];

    if (state.currentSection === 'words') {
        // For words, combine strokes of each letter with proper spacing
        const letters = currentItem.split('');
        const allStrokes = [];
        const letterWidth = 1 / (letters.length + 0.5);

        letters.forEach((letter, i) => {
            const letterStrokes = strokePaths[letter] || [];
            const offsetX = letterWidth * (i + 0.5);

            letterStrokes.forEach(stroke => {
                const adjustedPoints = stroke.points.map(([x, y]) => [
                    offsetX + (x - 0.5) * letterWidth * 0.9,
                    y
                ]);
                allStrokes.push({ points: adjustedPoints });
            });
        });

        return allStrokes;
    }

    return strokePaths[currentItem] || [];
}

// ===== Drawing Functions =====
function drawGuide() {
    const canvas = elements.guideCanvas;
    const ctx = guideCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const strokes = getCurrentStrokes();
    const area = getDrawingArea();

    // Draw debugging box (optional, remove later if clean)
    // ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    // ctx.strokeRect(area.x, area.y, area.width, area.height);

    // Draw all strokes
    strokes.forEach((stroke, strokeIndex) => {
        const isCurrentStroke = strokeIndex === state.currentStrokeIndex;
        const isCompletedStroke = state.strokeCompleted[strokeIndex];
        const isFutureStroke = strokeIndex > state.currentStrokeIndex;

        // Draw the path line
        ctx.beginPath();
        ctx.lineWidth = isCurrentStroke ? 35 : 25;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isCompletedStroke) {
            ctx.strokeStyle = 'rgba(107, 203, 119, 0.4)'; // Green for completed
        } else if (isCurrentStroke) {
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.25)'; // Purple for current
        } else {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'; // Gray for future
        }

        stroke.points.forEach((point, i) => {
            const x = area.x + point[0] * area.width;
            const y = area.y + point[1] * area.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw dashed guide line for current stroke
        if (isCurrentStroke && !isCompletedStroke) {
            ctx.beginPath();
            ctx.setLineDash([12, 8]);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.6)';

            stroke.points.forEach((point, i) => {
                const x = area.x + point[0] * area.width;
                const y = area.y + point[1] * area.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw points for current stroke
        if (isCurrentStroke && !isCompletedStroke) {
            stroke.points.forEach((point, pointIndex) => {
                const x = area.x + point[0] * area.width;
                const y = area.y + point[1] * area.height;
                const isActivePoint = pointIndex === state.currentPointIndex;
                const isCompletedPoint = pointIndex < state.currentPointIndex;

                // Draw point circle
                ctx.beginPath();
                if (isActivePoint) {
                    // Pulsing active point
                    const pulse = 1 + 0.2 * Math.sin(Date.now() / 150);
                    ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = '#6C63FF';
                } else if (isCompletedPoint) {
                    ctx.arc(x, y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = '#6BCB77';
                } else {
                    ctx.arc(x, y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(108, 99, 255, 0.4)';
                }
                ctx.fill();

                // Draw point number or checkmark
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Nunito, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (isCompletedPoint) {
                    ctx.fillText('✓', x, y);
                } else {
                    ctx.fillText(pointIndex + 1, x, y);
                }
            });
        }

        // Draw start indicator for future strokes
        if (isFutureStroke && stroke.points.length > 0) {
            const startPoint = stroke.points[0];
            const x = area.x + startPoint[0] * area.width;
            const y = area.y + startPoint[1] * area.height;

            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(strokeIndex + 1, x, y);
        }
    });
}

// ===== Animation Loop for Pulsing Points =====
let animationId = null;

function startAnimation() {
    function animate() {
        drawGuide();
        animationId = requestAnimationFrame(animate);
    }
    if (!animationId) {
        animate();
    }
}

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ===== Tracing Functions =====
function getCanvasCoordinates(e) {
    const canvas = elements.tracingCanvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function getNormalizedCoords(canvasX, canvasY) {
    const area = getDrawingArea();

    return {
        x: (canvasX - area.x) / area.width,
        y: (canvasY - area.y) / area.height
    };
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function startDrawing(e) {
    e.preventDefault();
    initAudio();

    const coords = getCanvasCoordinates(e);
    const normalized = getNormalizedCoords(coords.x, coords.y);

    const strokes = getCurrentStrokes();
    if (state.currentStrokeIndex >= strokes.length) return;

    const currentStroke = strokes[state.currentStrokeIndex];
    const targetPoint = currentStroke.points[state.currentPointIndex];

    // Check if starting near the first point of current stroke
    const distance = getDistance(normalized.x, normalized.y, targetPoint[0], targetPoint[1]);

    if (distance < 0.12) { // Within range of target point
        state.isDrawing = true;
        state.tracePoints = [coords];

        // Draw starting point
        tracingCtx.beginPath();
        tracingCtx.arc(coords.x, coords.y, 8, 0, Math.PI * 2);
        tracingCtx.fillStyle = '#6C63FF';
        tracingCtx.fill();
    } else {
        // Show hint that they need to start at the right point
        showSpeechBubble("Start at point 1! 👆", 2500);
    }
}

function draw(e) {
    if (!state.isDrawing) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const normalized = getNormalizedCoords(coords.x, coords.y);

    // Draw the trace line
    if (state.tracePoints.length > 0) {
        const lastPoint = state.tracePoints[state.tracePoints.length - 1];

        tracingCtx.beginPath();
        tracingCtx.moveTo(lastPoint.x, lastPoint.y);
        tracingCtx.lineTo(coords.x, coords.y);
        tracingCtx.strokeStyle = '#6C63FF';
        tracingCtx.lineWidth = 10;
        tracingCtx.lineCap = 'round';
        tracingCtx.lineJoin = 'round';
        tracingCtx.stroke();
    }

    state.tracePoints.push(coords);

    // Check if we've reached the next point
    const strokes = getCurrentStrokes();
    const currentStroke = strokes[state.currentStrokeIndex];

    if (state.currentPointIndex < currentStroke.points.length) {
        const targetPoint = currentStroke.points[state.currentPointIndex];
        const distance = getDistance(normalized.x, normalized.y, targetPoint[0], targetPoint[1]);

        if (distance < 0.1) {
            // Hit the target point!
            playSound('point');

            // Draw success circle
            // Draw success circle
            const area = getDrawingArea();
            const tx = area.x + targetPoint[0] * area.width;
            const ty = area.y + targetPoint[1] * area.height;

            tracingCtx.beginPath();
            tracingCtx.arc(tx, ty, 15, 0, Math.PI * 2);
            tracingCtx.fillStyle = '#6BCB77';
            tracingCtx.fill();
            tracingCtx.fillStyle = 'white';
            tracingCtx.font = 'bold 12px Nunito';
            tracingCtx.textAlign = 'center';
            tracingCtx.textBaseline = 'middle';
            tracingCtx.fillText('✓', tx, ty);

            state.currentPointIndex++;

            // Check if stroke is complete
            if (state.currentPointIndex >= currentStroke.points.length) {
                completeStroke();
            }
        }
    }
}

function stopDrawing(e) {
    if (e) e.preventDefault();

    if (state.isDrawing) {
        // Check if stroke was completed
        const strokes = getCurrentStrokes();
        const currentStroke = strokes[state.currentStrokeIndex];

        if (state.currentPointIndex < currentStroke.points.length) {
            // Stroke not completed - reset
            showSpeechBubble("Keep going! Follow the points! 💪", 2500);
            state.currentPointIndex = 0;
            clearCanvas();
        }
    }

    state.isDrawing = false;
    state.tracePoints = [];
}

function completeStroke() {
    playSound('stroke');
    state.strokeCompleted[state.currentStrokeIndex] = true;

    const strokes = getCurrentStrokes();

    if (state.currentStrokeIndex < strokes.length - 1) {
        // Move to next stroke
        state.currentStrokeIndex++;
        state.currentPointIndex = 0;
        showSpeechBubble(`Great! Now stroke ${state.currentStrokeIndex + 1}! ✨`, 2500);

        // Clear canvas for next stroke
        setTimeout(() => {
            clearCanvas();
        }, 300);
    } else {
        // All strokes completed!
        completeCharacter();
    }
}

function completeCharacter() {
    state.completed[state.currentSection].add(state.currentIndex);
    showCelebration();
    playSound('success');
    updateProgress();

    showSpeechBubble("Amazing job! ⭐🎉", 2500);

    // Auto-advance after celebration
    setTimeout(() => {
        goNext();
    }, 2200);
}

// ===== Clear and Reset =====
function clearCanvas() {
    tracingCtx.clearRect(0, 0, elements.tracingCanvas.width, elements.tracingCanvas.height);
}

function resetCurrentCharacter() {
    state.currentStrokeIndex = 0;
    state.currentPointIndex = 0;
    state.strokeCompleted = [];
    state.tracePoints = [];
    state.isDrawing = false;
    clearCanvas();
    drawGuide();
}

// ===== Character Picker =====
function updateCharacterPicker() {
    const items = content[state.currentSection];
    const completed = state.completed[state.currentSection];

    elements.characterPicker.innerHTML = items.map((item, index) => {
        const isActive = index === state.currentIndex;
        const isCompleted = completed.has(index);
        let classes = 'picker-item';
        if (isActive) classes += ' active';
        if (isCompleted) classes += ' completed';

        return `<button class="${classes}" data-index="${index}">${item}</button>`;
    }).join('');

    elements.characterPicker.querySelectorAll('.picker-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            state.currentIndex = index;
            updateDisplay();
            playSound('click');
        });
    });

    // Scroll the active item into view
    const activeItem = elements.characterPicker.querySelector('.picker-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ===== Update Display =====
function updateDisplay() {
    const currentItem = content[state.currentSection][state.currentIndex];
    elements.currentCharacter.textContent = currentItem;
    elements.currentCharacter.style.animation = 'none';
    setTimeout(() => {
        elements.currentCharacter.style.animation = 'characterPop 0.5s ease';
    }, 10);

    resetCurrentCharacter();
    updateCharacterPicker();
    updateProgress();
    updateMascotMessage();
}

function updateProgress() {
    const total = content[state.currentSection].length;
    const completed = state.completed[state.currentSection].size;
    const percentage = (completed / total) * 100;
    elements.progressFill.style.width = `${percentage}%`;
}

function updateMascotMessage() {
    const strokes = getCurrentStrokes();
    if (strokes.length > 0) {
        showSpeechBubble(`Trace from point 1! ${strokes.length} stroke${strokes.length > 1 ? 's' : ''} ✏️`, 4000);
    } else {
        showSpeechBubble("Let's trace together! 🎨", 3000);
    }
}

// ===== Navigation =====
function switchSection(section) {
    state.currentSection = section;
    state.currentIndex = 0;

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === section);
    });

    updateDisplay();
    playSound('click');
}

function goNext() {
    const items = content[state.currentSection];
    state.currentIndex = (state.currentIndex + 1) % items.length;
    updateDisplay();
    playSound('click');
}

function goPrev() {
    const items = content[state.currentSection];
    state.currentIndex = (state.currentIndex - 1 + items.length) % items.length;
    updateDisplay();
    playSound('click');
}

// ===== Actions =====
function handleClear() {
    resetCurrentCharacter();
    playSound('click');
    showSpeechBubble("Try again! Start at point 1! 👆", 2500);
}

function handleCheck() {
    const strokes = getCurrentStrokes();
    const allComplete = state.strokeCompleted.length === strokes.length &&
        state.strokeCompleted.every(s => s);

    if (allComplete) {
        completeCharacter();
    } else {
        showSpeechBubble("Keep tracing! Follow all the points! ✏️", 2500);
        elements.currentCharacter.classList.add('shake');
        setTimeout(() => {
            elements.currentCharacter.classList.remove('shake');
        }, 300);
    }
}

function handleHint() {
    playSound('click');

    const strokes = getCurrentStrokes();
    if (state.currentStrokeIndex < strokes.length) {
        const currentStroke = strokes[state.currentStrokeIndex];
        const targetPoint = currentStroke.points[state.currentPointIndex];

        const area = getDrawingArea();
        const tx = area.x + targetPoint[0] * area.width;
        const ty = area.y + targetPoint[1] * area.height;

        // Flash the target point
        let flashes = 0;
        const flashInterval = setInterval(() => {
            tracingCtx.beginPath();
            tracingCtx.arc(tx, ty, 25 - flashes * 2, 0, Math.PI * 2);
            tracingCtx.strokeStyle = flashes % 2 === 0 ? '#FFD93D' : '#6C63FF';
            tracingCtx.lineWidth = 4;
            tracingCtx.stroke();

            flashes++;
            if (flashes > 5) {
                clearInterval(flashInterval);
                clearCanvas();
            }
        }, 150);

        showSpeechBubble(`Start at point ${state.currentPointIndex + 1}! 💡`, 2500);
    }
}

// ===== Celebration =====
function showCelebration() {
    elements.celebration.classList.remove('hidden');

    elements.starsContainer.innerHTML = '';
    const starEmojis = ['⭐', '🌟', '✨', '💫', '🎉', '🎊', '🏆', '👏'];

    for (let i = 0; i < 25; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 0.5}s`;
        star.style.fontSize = `${1.5 + Math.random() * 2}rem`;
        elements.starsContainer.appendChild(star);
    }

    setTimeout(() => {
        elements.celebration.classList.add('hidden');
    }, 2000);
}

// ===== Event Listeners =====
function initEventListeners() {
    // Canvas events
    elements.tracingCanvas.addEventListener('mousedown', startDrawing);
    elements.tracingCanvas.addEventListener('mousemove', draw);
    elements.tracingCanvas.addEventListener('mouseup', stopDrawing);
    elements.tracingCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    elements.tracingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    elements.tracingCanvas.addEventListener('touchmove', draw, { passive: false });
    elements.tracingCanvas.addEventListener('touchend', stopDrawing, { passive: false });
    elements.tracingCanvas.addEventListener('touchcancel', stopDrawing, { passive: false });

    // Navigation
    elements.prevBtn.addEventListener('click', goPrev);
    elements.nextBtn.addEventListener('click', goNext);

    // Actions
    elements.clearBtn.addEventListener('click', handleClear);
    elements.checkBtn.addEventListener('click', handleCheck);
    elements.hintBtn.addEventListener('click', handleHint);

    // Tab navigation
    elements.lettersTab.addEventListener('click', () => switchSection('letters'));
    elements.numbersTab.addEventListener('click', () => switchSection('numbers'));
    elements.wordsTab.addEventListener('click', () => switchSection('words'));

    // Resize
    window.addEventListener('resize', resizeCanvases);

    // Prevent scrolling on touch
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === elements.tracingCanvas) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ===== Initialize =====
function init() {
    resizeCanvases();
    updateDisplay();
    initEventListeners();
    startAnimation();

    setTimeout(() => {
        showSpeechBubble("Tap point 1 and trace! ✏️", 4000);
    }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', resizeCanvases);
