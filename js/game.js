class Hangman {
    constructor() {
        this.maxGuesses = 6;
        this.incorrect = 0;
        this.guessed = new Set();
        this.word = '';
        this.hint = '';
        this.words = [];
        this.wordIdx = 0;
        this.isOver = false;
        this.guessBar = null;
        this.score = 0;
        this.wordBox = document.getElementById('word');
        this.hintBox = document.getElementById('hintText');
        this.statusBox = document.getElementById('statusMessage');
        this.img = document.getElementById('hangmanImage');
        this.restartBtn = document.getElementById('restartBtn');
        this.lettersBox = document.querySelector('.hangman__letters');
        this.restartBtn.addEventListener('click', () => this.start());
        this.load().then(() => {
            this.shuffle();
            this.start();
        });
    }
    shuffle() {
        for (let i = this.words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
        }
    }
    async load() {
        try {
            const res = await fetch('data/words.json');
            const data = await res.json();
            this.words = data.words;
        } catch (e) {
            console.error('Error loading words:', e);
        }
    }
    start() {
        this.incorrect = 0;
        this.guessed.clear();
        this.isOver = false;
        if (this.wordIdx >= this.words.length) {
            this.wordIdx = 0;
            this.shuffle();
        }
        const { word, hint } = this.words[this.wordIdx++];
        this.word = word;
        this.hint = hint;
        this.updateImg();
        this.showHint();
        this.showWord();
        this.createLetters();
        this.restartBtn.classList.add('is-hidden');
        this.statusBox.textContent = '';
        this.showBar();
        this.showInput();
        this.showScore();
        this.img.style.opacity = '0';
        setTimeout(() => {
            this.img.style.opacity = '1';
        }, 100);
    }
    showInput() {
        if (!document.getElementById('letterInput')) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'input-area';
            inputDiv.innerHTML = `
                <input type="text" id="letterInput" maxlength="1" autocomplete="off" placeholder="Type a letter..." aria-label="Type a letter">
                <button id="guessBtn" aria-label="Guess letter">Guess</button>
            `;
            this.lettersBox.parentNode.insertBefore(inputDiv, this.lettersBox);
            document.getElementById('guessBtn').addEventListener('click', () => this.inputGuess());
            document.getElementById('letterInput').addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this.inputGuess();
            });
        } else {
            document.getElementById('letterInput').value = '';
        }
    }
    inputGuess() {
        const input = document.getElementById('letterInput');
        let letter = input.value.toUpperCase();
        if (letter.match(/^[A-Z]$/)) {
            this.guess(letter);
            input.value = '';
        } else {
            input.value = '';
        }
    }
    createLetters() {
        this.lettersBox.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const btn = document.createElement('button');
            btn.textContent = letter;
            btn.setAttribute('aria-label', `Guess letter ${letter}`);
            btn.addEventListener('click', () => this.guess(letter));
            this.lettersBox.appendChild(btn);
        }
    }
    guess(letter) {
        if (this.isOver || this.guessed.has(letter)) return;
        this.guessed.add(letter);
        const btn = Array.from(this.lettersBox.children).find(b => b.textContent === letter);
        if (btn) btn.disabled = true;
        if (!this.word.includes(letter)) {
            if (btn) btn.classList.add('incorrect');
            this.incorrect++;
            this.updateImg();
            this.updateBar();
            if (this.incorrect >= this.maxGuesses) {
                this.end(false);
            }
        } else {
            if (btn) btn.classList.add('correct');
            this.animateLetter(letter);
        }
        this.showWord();
        if (this.checkWin()) {
            this.end(true);
        }
    }
    animateLetter(letter) {
        Array.from(this.wordBox.children).forEach((span, idx) => {
            if (this.word[idx] === letter) {
                span.classList.add('reveal');
                setTimeout(() => span.classList.remove('reveal'), 500);
            }
        });
    }
    showWord() {
        this.wordBox.innerHTML = '';
        this.word.split('').forEach(l => {
            const span = document.createElement('span');
            span.className = 'letter';
            if (l === ' ') {
                span.classList.add('space');
                span.textContent = ' ';
            } else if (this.guessed.has(l)) {
                span.textContent = l;
            } else {
                span.classList.add('unguessed');
                span.textContent = '•';
            }
            this.wordBox.appendChild(span);
        });
    }
    showHint() {
        this.hintBox.textContent = `Hint: ${this.hint}`;
    }
    updateImg() {
        this.img.style.transition = 'opacity 0.3s, transform 0.3s';
        this.img.style.opacity = '0';
        this.img.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.img.src = `images/hangman-${this.incorrect}.jpg`;
            this.img.onload = () => {
                this.img.style.opacity = '1';
                this.img.style.transform = 'scale(1)';
            };
        }, 200);
    }
    showBar() {
        if (!this.guessBar) {
            this.guessBar = document.createElement('div');
            this.guessBar.className = 'remaining-guesses-bar';
            this.img.parentNode.appendChild(this.guessBar);
        }
        this.updateBar();
    }
    updateBar() {
        const left = this.maxGuesses - this.incorrect;
        this.guessBar.innerHTML = `<div class="bar" style="width:${(left/this.maxGuesses)*100}%"></div><span>${left} guesses left</span>`;
    }
    showScore() {
        let scoreDiv = document.getElementById('score');
        if (!scoreDiv) {
            scoreDiv = document.createElement('div');
            scoreDiv.id = 'score';
            scoreDiv.style.margin = '10px 0 0 0';
            scoreDiv.style.fontWeight = 'bold';
            scoreDiv.style.color = '#2c3e50';
            this.img.parentNode.insertBefore(scoreDiv, this.img.nextSibling);
        }
        scoreDiv.textContent = `Score: ${this.score}`;
    }
    checkWin() {
        return this.word.split('').every(l => this.guessed.has(l));
    }
    end(won) {
        this.isOver = true;
        if (won) this.score++;
        this.showScore();
        this.statusBox.textContent = won ? 'Congratulations! You won!' : 'Game Over! Try again!';
        this.restartBtn.classList.remove('is-hidden');
        Array.from(this.lettersBox.children).forEach(btn => { btn.disabled = true; });
        document.getElementById('letterInput').disabled = true;
        document.getElementById('guessBtn').disabled = true;
        if (!won) {
            this.wordBox.textContent = this.word;
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new Hangman();
});