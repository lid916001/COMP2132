class Hangman {
    constructor() {
        this.maxGuesses = 6;
        this.incorrectGuesses = 0;
        this.guessedLetters = new Set();
        this.currentWord = '';
        this.currentHint = '';
        this.words = [];
        this.wordIndex = 0;
        this.gameOver = false;
        this.guessBar = null;
        this.score = 0;
        this.wordDisplay = document.getElementById('word');
        this.hintDisplay = document.getElementById('hintText');
        this.statusDisplay = document.getElementById('statusMessage');
        this.hangmanImg = document.getElementById('hangmanImage');
        this.playAgainBtn = document.getElementById('restartBtn');
        this.lettersContainer = document.querySelector('.hangman__letters');
        this.nextBtn = document.getElementById('nextBtn');
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.nextBtn.addEventListener('click', () => this.startNewGame());
        this.loadWords().then(() => {
            this.shuffleWords();
            this.startNewGame();
        });
    }
    shuffleWords() {
        for (let i = this.words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
        }
    }
    async loadWords() {
        try {
            const res = await fetch('data/words.json');
            const data = await res.json();
            this.words = data.words;
        } catch (e) {
            console.error('Error loading words:', e);
        }
    }
    startNewGame() {
        this.incorrectGuesses = 0;
        this.guessedLetters.clear();
        this.gameOver = false;
        if (this.wordIndex >= this.words.length) {
            this.wordIndex = 0;
            this.shuffleWords();
        }
        const { word, hint } = this.words[this.wordIndex++];
        this.currentWord = word;
        this.currentHint = hint;
        this.updateHangmanImg();
        this.displayHint();
        this.displayWord();
        this.createLetterButtons();
        this.playAgainBtn.classList.add('is-hidden');
        this.statusDisplay.textContent = '';
        this.renderGuessBar();
        this.renderInputBox();
        this.displayScore();
        this.hangmanImg.style.opacity = '0';
        setTimeout(() => { this.hangmanImg.style.opacity = '1'; }, 100);
        const input = document.getElementById('letterInput');
        const guessBtn = document.getElementById('guessBtn');
        if (input) input.disabled = false;
        if (guessBtn) guessBtn.disabled = false;
    }
    renderInputBox() {
        if (!document.getElementById('letterInput')) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'input-area';
            inputDiv.innerHTML = `
                <div class="input-instruction">
                    Type a <b>single letter</b> and press <b>Enter</b> or <b>Guess</b>, or click a letter button below.
                </div>
                <div class="input-row">
                    <input type="text" id="letterInput" maxlength="1" autocomplete="off" aria-label="Type a letter">
                    <button id="guessBtn" aria-label="Guess letter">Guess</button>
                </div>
            `;
            this.lettersContainer.parentNode.insertBefore(inputDiv, this.lettersContainer);
            document.getElementById('guessBtn').addEventListener('click', () => this.handleInputGuess());
            document.getElementById('letterInput').addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this.handleInputGuess();
            });
        } else {
            document.getElementById('letterInput').value = '';
        }
    }
    handleInputGuess() {
        const input = document.getElementById('letterInput');
        let letter = input.value.toUpperCase();
        if (letter.match(/^[A-Z]$/)) {
            this.handleGuess(letter);
            input.value = '';
        } else {
            input.value = '';
        }
    }
    createLetterButtons() {
        this.lettersContainer.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const button = document.createElement('button');
            button.textContent = letter;
            button.setAttribute('aria-label', `Guess letter ${letter}`);
            button.addEventListener('click', () => this.handleGuess(letter));
            this.lettersContainer.appendChild(button);
        }
    }
    handleGuess(letter) {
        if (this.gameOver || this.guessedLetters.has(letter)) return;
        this.guessedLetters.add(letter);
        const button = Array.from(this.lettersContainer.children).find(btn => btn.textContent === letter);
        if (button) button.disabled = true;
        if (!this.currentWord.includes(letter)) {
            if (button) button.classList.add('incorrect');
            this.incorrectGuesses++;
            this.updateHangmanImg();
            this.updateGuessBar();
            if (this.incorrectGuesses >= this.maxGuesses) this.endGame(false);
        } else {
            if (button) button.classList.add('correct');
            this.animateCorrectLetter(letter);
        }
        this.displayWord();
        if (this.checkWin()) this.endGame(true);
    }
    animateCorrectLetter(letter) {
        Array.from(this.wordDisplay.children).forEach((span, idx) => {
            if (this.currentWord[idx] === letter) {
                span.classList.add('reveal');
                setTimeout(() => span.classList.remove('reveal'), 500);
            }
        });
    }
    displayWord() {
        this.wordDisplay.innerHTML = '';
        this.currentWord.split('').forEach(l => {
            const span = document.createElement('span');
            span.className = 'letter';
            if (l === ' ') { span.classList.add('space'); span.textContent = ' '; }
            else if (this.guessedLetters.has(l)) { span.textContent = l; }
            else { span.classList.add('unguessed'); span.textContent = '•'; }
            this.wordDisplay.appendChild(span);
        });
    }
    displayHint() {
        this.hintDisplay.textContent = `Hint: ${this.currentHint}`;
    }
    updateHangmanImg() {
        this.hangmanImg.style.transition = 'opacity 0.3s, transform 0.3s';
        this.hangmanImg.style.opacity = '0';
        this.hangmanImg.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.hangmanImg.src = `images/hangman-${this.incorrectGuesses}.jpg`;
            this.hangmanImg.onload = () => {
                this.hangmanImg.style.opacity = '1';
                this.hangmanImg.style.transform = 'scale(1)';
            };
        }, 200);
    }
    renderGuessBar() {
        if (!this.guessBar) {
            this.guessBar = document.createElement('div');
            this.guessBar.className = 'remaining-guesses-bar';
            this.hangmanImg.parentNode.appendChild(this.guessBar);
        }
        this.updateGuessBar();
    }
    updateGuessBar() {
        const left = this.maxGuesses - this.incorrectGuesses;
        this.guessBar.innerHTML = `<div class="bar" style="width:${(left/this.maxGuesses)*100}%"></div><span>${left} guesses left</span>`;
    }
    displayScore() {
        let scoreDiv = document.getElementById('score');
        if (!scoreDiv) {
            scoreDiv = document.createElement('div');
            scoreDiv.id = 'score';
            scoreDiv.style.margin = '10px 0 0 0';
            scoreDiv.style.fontWeight = 'bold';
            scoreDiv.style.color = '#2c3e50';
            this.hangmanImg.parentNode.insertBefore(scoreDiv, this.hangmanImg.nextSibling);
        }
        scoreDiv.textContent = `Score: ${this.score}`;
    }
    checkWin() {
        return this.currentWord.split('').every(l => this.guessedLetters.has(l));
    }
    endGame(won) {
        this.gameOver = true;
        if (won) this.score++;
        this.displayScore();
        this.playAgainBtn.classList.remove('is-hidden');
        if (won) {
            this.statusDisplay.innerHTML = `<span class="win-message">🎉 Congratulations! You won! 🎉</span>`;
            this.showConfetti();
        } else {
            this.statusDisplay.innerHTML = `<span class="gameover-message">😢 Game Over! Try again!</span>`;
            this.wordDisplay.classList.add('word-shake');
            setTimeout(() => this.wordDisplay.classList.remove('word-shake'), 600);
        }
        Array.from(this.lettersContainer.children).forEach(btn => { btn.disabled = true; });
        document.getElementById('letterInput').disabled = true;
        document.getElementById('guessBtn').disabled = true;
        if (!won) { this.wordDisplay.textContent = this.currentWord; }
    }
    showConfetti() {
        for (let i = 0; i < 30; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.left = Math.random() * 100 + 'vw';
            conf.style.top = '-40px';
            conf.style.width = '12px';
            conf.style.height = '12px';
            conf.style.background = `hsl(${Math.random()*360},90%,60%)`;
            conf.style.borderRadius = '50%';
            conf.style.zIndex = 9999;
            conf.style.pointerEvents = 'none';
            conf.style.animation = `confetti 1.2s cubic-bezier(.4,2,.6,1) forwards`;
            conf.style.animationDelay = (Math.random()*0.7) + 's';
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 1600);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => { new Hangman(); });