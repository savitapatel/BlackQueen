// Game state
let gameState = {
    players: [],
    currentRound: 1,
    roundScores: [],
    totalScores: {},
    gameInProgress: false,
    currentPhase: 'bidding', // 'bidding' or 'points'
    currentBidder: null // Track the current bidder
};

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('blackQueenGame');
    if (savedState) {
        gameState = JSON.parse(savedState);
        updateUI();
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('blackQueenGame', JSON.stringify(gameState));
}

// Handle Enter key press for player name input
function handlePlayerNameKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addPlayer();
    }
}

// Handle Enter key press for bid input
function handleBidKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitBid();
    }
}

// Handle Enter key press for points input
function handlePointsKeyPress(event, playerName) {
    if (event.key === 'Enter') {
        event.preventDefault();
        updatePoints(playerName, event.target.value);
    }
}

// Add a new player
function addPlayer() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    if (playerName && !gameState.players.includes(playerName)) {
        gameState.players.push(playerName);
        gameState.totalScores[playerName] = 0;
        playerNameInput.value = '';
        updatePlayerList();
        document.getElementById('startGame').disabled = gameState.players.length < 2;
        saveGameState();
        playerNameInput.focus();
    }
}

// Remove a player
function removePlayer(playerName) {
    gameState.players = gameState.players.filter(p => p !== playerName);
    delete gameState.totalScores[playerName];
    updatePlayerList();
    document.getElementById('startGame').disabled = gameState.players.length < 2;
    saveGameState();
}

// Update the player list UI
function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = gameState.players.map(player => `
        <div class="player-item">
            <span>${player}</span>
            <button onclick="removePlayer('${player}')">Remove</button>
        </div>
    `).join('');
}

// Start the game
function startGame() {
    if (gameState.players.length >= 2) {
        gameState.gameInProgress = true;
        gameState.currentPhase = 'bidding';
        gameState.currentBidder = gameState.players[0]; // Set first player as bidder
        document.getElementById('playerSetup').classList.add('hidden');
        document.getElementById('gameSection').classList.remove('hidden');
        startNewRound();
        saveGameState();
    }
}

// Start a new round
function startNewRound() {
    gameState.currentRound++;
    gameState.currentPhase = 'bidding';
    gameState.currentBidder = gameState.players[0]; // Set first player as bidder
    document.getElementById('currentRound').textContent = gameState.currentRound;
    document.getElementById('roundResults').classList.add('hidden');
    document.getElementById('biddingSection').classList.remove('hidden');
    
    // Initialize round scores
    gameState.roundScores = gameState.players.map(player => ({
        name: player,
        bid: 0,
        points: 0
    }));
    
    updateBiddingList();
    saveGameState();
}

// Update the bidding list UI
function updateBiddingList() {
    const biddingList = document.getElementById('biddingList');
    biddingList.innerHTML = `
        <h3>Round ${gameState.currentRound} - Enter Bid</h3>
        <div class="bidding-form">
            <div class="input-group">
                <label for="bidderSelect">Select Bidder:</label>
                <select id="bidderSelect" onchange="updateSelectedBidder(this.value)">
                    ${gameState.players.map(player => `
                        <option value="${player}" ${player === gameState.currentBidder ? 'selected' : ''}>
                            ${player}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="input-group">
                <label for="bidInput">Bid Points:</label>
                <input type="number" id="bidInput" min="0" placeholder="Enter bid points" 
                    onkeypress="handleBidKeyPress(event)">
            </div>
            <button onclick="submitBid()">Submit Bid</button>
        </div>
        <div class="bidding-progress">
            <h4>Bidding Progress:</h4>
            <div class="progress-list">
                ${gameState.roundScores.map(player => `
                    <div class="progress-item ${player.bid > 0 ? 'completed' : ''}">
                        <span>${player.name}</span>
                        <span>${player.bid > 0 ? `Bid: ${player.bid}` : 'Pending'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.getElementById('bidInput').focus();
}

// Add new function to handle bidder selection
function updateSelectedBidder(playerName) {
    gameState.currentBidder = playerName;
    saveGameState();
}

// Submit bid
function submitBid() {
    const bidInput = document.getElementById('bidInput');
    const bid = parseInt(bidInput.value) || 0;
    
    if (bid >= 0 && gameState.currentBidder) {
        const playerScore = gameState.roundScores.find(p => p.name === gameState.currentBidder);
        if (playerScore) {
            playerScore.bid = bid;
            saveGameState();
            
            // Update game state phase
            gameState.currentPhase = 'points';
            
            // Hide bidding section and show points section
            document.getElementById('biddingSection').classList.add('hidden');
            document.getElementById('pointsSection').classList.remove('hidden');
            
            // Update points list
            updatePointsList();
        }
    }
}

// Update points list UI
function updatePointsList() {
    const pointsList = document.getElementById('pointsList');
    pointsList.innerHTML = `
        <h3>Round ${gameState.currentRound} - Enter Points</h3>
        <div class="points-form">
            ${gameState.players.map(player => `
                <div class="points-item">
                    <div class="player-info">
                        <span class="player-name">${player}</span>
                        <span class="player-bid">Bid: ${gameState.roundScores.find(p => p.name === player)?.bid || 0}</span>
                    </div>
                    <div class="input-group">
                        <label for="points-${player}">Points:</label>
                        <input type="number" 
                            id="points-${player}" 
                            min="0" 
                            value="${gameState.roundScores.find(p => p.name === player)?.points || 0}"
                            onchange="updatePoints('${player}', this.value)"
                            onkeypress="handlePointsKeyPress(event, '${player}')"
                            placeholder="Enter points">
                    </div>
                </div>
            `).join('')}
            <div class="round-actions">
                <button onclick="calculateRoundResults()">Calculate Results</button>
            </div>
        </div>
    `;
}

// Update player's points
function updatePoints(playerName, points) {
    const player = gameState.roundScores.find(p => p.name === playerName);
    if (player) {
        player.points = parseInt(points) || 0;
        saveGameState();
    }
}

// Calculate round results
function calculateRoundResults() {
    document.getElementById('pointsSection').classList.add('hidden');
    document.getElementById('roundResults').classList.remove('hidden');
    
    const roundScoresDiv = document.getElementById('roundScores');
    roundScoresDiv.innerHTML = `
        <h3>Round ${gameState.currentRound} Summary</h3>
        <div class="round-scores">
            ${gameState.roundScores.map(player => {
                const score = player.points;
                gameState.totalScores[player.name] += score;
                return `
                    <div class="score-item">
                        <span>${player.name}</span>
                        <span>Bid: ${player.bid} | Points: ${score} | Total: ${gameState.totalScores[player.name]}</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="round-actions">
            <button onclick="startNewRound()">Play Next Round</button>
            <button onclick="calculateWinner()">Calculate Winner</button>
        </div>
    `;
    
    saveGameState();
}

// Calculate and show winner
function calculateWinner() {
    const players = Object.entries(gameState.totalScores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
    
    const gameSummary = document.getElementById('gameSummary');
    gameSummary.classList.remove('hidden');
    gameSummary.innerHTML = `
        <h2>Game Summary</h2>
        <div class="final-scores">
            ${players.map((player, index) => `
                <div class="score-item ${index === 0 ? 'winner' : ''}">
                    <span>#${index + 1} - ${player.name}</span>
                    <span>Total Points: ${player.score}</span>
                </div>
            `).join('')}
        </div>
        <button onclick="resetGame()">Start New Game</button>
    `;
}

// Reset the game
function resetGame() {
    if (confirm('Are you sure you want to start a new game? All current progress will be lost.')) {
        gameState = {
            players: [],
            currentRound: 1,
            roundScores: [],
            totalScores: {},
            gameInProgress: false,
            currentPhase: 'bidding',
            currentBidder: null
        };
        localStorage.removeItem('blackQueenGame');
        updateUI();
        document.getElementById('playerName').focus();
    }
}

// Update all UI elements
function updateUI() {
    updatePlayerList();
    if (gameState.gameInProgress) {
        document.getElementById('playerSetup').classList.add('hidden');
        document.getElementById('gameSection').classList.remove('hidden');
        document.getElementById('currentRound').textContent = gameState.currentRound;
        
        // Show/hide sections based on current phase
        if (gameState.currentPhase === 'bidding') {
            document.getElementById('biddingSection').classList.remove('hidden');
            document.getElementById('pointsSection').classList.add('hidden');
            document.getElementById('roundResults').classList.add('hidden');
            updateBiddingList();
        } else if (gameState.currentPhase === 'points') {
            document.getElementById('biddingSection').classList.add('hidden');
            document.getElementById('pointsSection').classList.remove('hidden');
            document.getElementById('roundResults').classList.add('hidden');
            updatePointsList();
        }
    } else {
        document.getElementById('playerSetup').classList.remove('hidden');
        document.getElementById('gameSection').classList.add('hidden');
        document.getElementById('playerName').focus();
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    updateUI();
}); 