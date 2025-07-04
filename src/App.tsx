import React, { useEffect, useState, useRef } from 'react';
import './App.css';

export interface Player {
  name: string;
}

export interface Bid {
  [player: string]: number;
}

export interface Points {
  [player: string]: number;
}

export interface GameState {
  players: Player[];
  currentPhase: 'setup' | 'bidding' | 'choose-partner' | 'points';
  currentBidder: string | null;
  currentBid: number;
  points: Points;
  totalScores: { [player: string]: number };
  roundHistory: Points[];
  selectedPartners?: string[];
  bidderResult?: 'win' | 'lose';
}

const initialState: GameState = {
  players: [],
  currentPhase: 'setup',
  currentBidder: null,
  currentBid: 0,
  points: {},
  totalScores: {},
  roundHistory: [],
  selectedPartners: [],
  bidderResult: undefined,
};

const LOCAL_STORAGE_KEY = 'blackQueenGame';

const App: React.FC = () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  const [gameState, setGameState] = useState<GameState>(saved ? JSON.parse(saved) : initialState);
  const [playerInput, setPlayerInput] = useState('');
  const [bidInput, setBidInput] = useState('');
  const [selectedBidder, setSelectedBidder] = useState<string>('');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [bidderResult, setBidderResult] = useState<'win' | 'lose' | ''>('');
  const addPlayerInputRef = useRef<HTMLInputElement>(null);
  const [showTotalPoints, setShowTotalPoints] = useState(false);

  useEffect(() => {
    if (gameState.currentPhase !== 'setup' || !addPlayerInputRef.current) return;
  
    if (gameState.roundHistory?.length > 0) {
      moveTableScroll();
    } else {
      addPlayerInputRef.current.focus();
    }
  }, [gameState.currentPhase, gameState.roundHistory]);
  
  
  useEffect(()=>{
    if(showTotalPoints) moveTableScroll();
  },[showTotalPoints])

  // Save to localStorage only when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    };
  }, [gameState]);

  // Add player
  const addPlayer = () => {
    const name = playerInput.trim();
    if (name && !gameState.players.some(p => p.name === name)) {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, { name }],
        totalScores: { ...prev.totalScores, [name]: 0 },
      }));
      setPlayerInput('');
      if (addPlayerInputRef.current) {
        addPlayerInputRef.current.focus();
      }
    }
  };

  // Remove player
  const removePlayer = (name: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.name !== name),
      totalScores: Object.fromEntries(
        Object.entries(prev.totalScores).filter(([p]) => p !== name)
      ),
    }));
  };

  // Start game
  const startGame = () => {
    if (gameState.players.length >= 2) {
      setGameState(prev => ({
        ...prev,
        currentPhase: 'bidding',
        points: {},
      }));
      setBidInput('');
      setSelectedBidder(gameState.players[0]?.name || '');
    }
  };

  // Submit bid
  const submitBid = () => {
    const bid = parseInt(bidInput, 10);
    if (!isNaN(bid) && selectedBidder) {
      setGameState(prev => ({
        ...prev,
        currentBidder: selectedBidder,
        currentBid: bid,
        currentPhase: 'choose-partner',
        selectedPartners: [],
        bidderResult: undefined,
      }));
      setBidInput('');
      setSelectedPartners([]);
      setBidderResult('');
    }
  };

  // Submit partner and result
  const submitPartnerAndResult = () => {
    if (!selectedPartners.length) {
      alert('Please select at least one partner.');
      return;
    }
    if (!bidderResult) {
      alert('Please select if the bidder won or lost.');
      return;
    }
    // Calculate points for all players
    const bidder = gameState.currentBidder!;
    const bid = gameState.currentBid;
    const allPlayers = gameState.players.map(p => p.name);
    let points: Points = {};
    if (bidderResult === 'win') {
      points[bidder] = bid * 2;
      selectedPartners.forEach(p => { points[p] = bid; });
      allPlayers.forEach(p => {
        if (p !== bidder && !selectedPartners.includes(p)) points[p] = 0;
      });
    } else {
      points[bidder] = -bid;
      selectedPartners.forEach(p => { points[p] = 0; });
      allPlayers.forEach(p => {
        if (p !== bidder && !selectedPartners.includes(p)) points[p] = bid;
      });
    }
    setGameState(prev => ({
      ...prev,
      selectedPartners,
      bidderResult,
      points,
      currentPhase: 'points',
    }));
  };

  // Submit all points at once (now just advances the round)
  const submitAllPoints = () => {
    setGameState(prev => {
      // Add each player's current round points to their total score
      const newTotalScores = { ...prev.totalScores };
      Object.keys(prev.points).forEach(player => {
        newTotalScores[player] = (newTotalScores[player] || 0) + (prev.points[player] ?? 0);
      });
      return {
        ...prev,
        totalScores: newTotalScores,
        roundHistory: [...(prev.roundHistory || []), prev.points],
        currentPhase: 'setup',
        points: {},
        selectedPartners: [],
        bidderResult: undefined,
      };
    });
  };
  
  // Scroll to the last column after a short delay to ensure DOM is updated
  const moveTableScroll =()=>{
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.scrollLeft = tableContainer.scrollWidth;
      }
  }

  // Reset game
  const resetGame = () => {
    setGameState(initialState);
    setPlayerInput('');
    setBidInput('');
    localStorage.clear();
  };

  // Helper to get total points for a player (from totalScores)
  const getTotalPoints = (playerName: string) => {
    return gameState.totalScores[playerName] ?? 0;
  };

  // Find the highest total score
  const maxTotal = Math.max(...gameState.players.map(p => getTotalPoints(p.name)));

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Black Queen ♠️
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={resetGame} className="reset-button" style={{ 
            maxWidth: 80, 
            marginTop: 0,
          }}>
            Reset
          </button>
        </div>
      </div>
      {gameState.currentPhase === 'setup' && (
        <div className="setup-phase">
          <div className="input-group">
            <input
              ref={addPlayerInputRef}
              type="text"
              placeholder="Enter player name"
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
            />
            <button onClick={addPlayer}>Add Player</button>
          </div>

          {gameState.players.length >= 2 && (
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', marginTop: '0.5rem' }}>
              <button onClick={startGame} className="start-button">
                {gameState.roundHistory.length === 0 ?  'Start Game':'Next Round'}
              </button>
              <button onClick={() => setShowTotalPoints(!showTotalPoints)} className="start-button"
                style={{  borderRadius: 8, background: 'none', color: '#263859', border: '1.5px solid #3498db',  }}
                aria-label={showTotalPoints ? 'Hide Total Points' : 'Show Total Points'}
                title={showTotalPoints ? 'Hide Total Points' : 'Show Total Points'}
              >
                { !showTotalPoints ? (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#263859" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="3" stroke="#263859" strokeWidth="2" fill="none"/>
                    </svg>
                    {" "}Total Points
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                      <path d="M17.94 17.94C16.11 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.06M1 1l22 22" stroke="#e74c3c" strokeWidth="2" fill="none"/>
                    </svg>
                    {" "}Total Points
                  </>
                )}
              </button>
            </div>
          )}

          {/* Table UI with Player Name and Total Points columns */}
          {gameState.players.length > 0 && (
            <div className="table-container">
              <table className="score-table">
                <thead>
                  <tr>
                    <th className="sticky-col player-header">Player</th>
                    {gameState.roundHistory?.map((_, idx) => (
                      <th key={`round-${idx}`} className="round-header">{`Round ${idx + 1}`}</th>
                    ))}
                    {showTotalPoints && (
                      <th className="sticky-total-col total-header">Total Points</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...gameState.players]
                    .map(player => (
                      <tr key={player.name} className="player-row">
                        <td className="sticky-cell player-cell">
                          <div className="player-cell-content">
                            <button
                              onClick={() => removePlayer(player.name)}
                              className="remove-btn"
                              title={`Remove ${player.name}`}
                              aria-label={`Remove ${player.name}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24">
                                <path fill="#e74c3c" d="M9 3a3 3 0 0 1 6 0h5a1 1 0 1 1 0 2h-1.07l-1.2 14.39A3 3 0 0 1 14.74 22H9.26a3 3 0 0 1-2.99-2.61L5.07 5H4a1 1 0 1 1 0-2h5Zm2 0a1 1 0 1 0 2 0h-2Zm-4.93 2 .99 13.19A1 1 0 0 0 9.26 20h5.48a1 1 0 0 0 .99-.81L16.93 5H7.07Zm2.43 4a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V9Zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V9Z"/>
                              </svg>
                            </button>
                            <span>{player.name}</span>
                          </div>
                        </td>
                        {gameState.roundHistory?.map((round, idx) => (
                          <td key={`round-${idx}-player-${player.name}`} className="round-cell">
                            {round[player.name] ?? 0}
                          </td>
                        ))}
                        {showTotalPoints && (
                          <td className={`sticky-total-cell total-cell${getTotalPoints(player.name) === maxTotal && maxTotal > 0 ? ' highlight-green' : ''}`}>
                            {getTotalPoints(player.name)}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
      {gameState.currentPhase === 'bidding' && (
        <div className="bidding-phase">
          <h2>Bid the Points</h2>
          <div className="bidding-form">
            <div className="input-group">
              <label htmlFor="bidder-select">Select Bidder:</label>
              <select
                id="bidder-select"
                value={selectedBidder}
                onChange={e => setSelectedBidder(e.target.value)}
              >
                {gameState.players.map(player => (
                  <option key={player.name} value={player.name}>
                    {player.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Enter bid points"
                value={bidInput}
                onChange={e => setBidInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitBid()}
              />
              <button onClick={submitBid}>Submit Bid</button>
            </div>
          </div>
        </div>
      )}
      {gameState.currentPhase === 'choose-partner' && (
        <div className="bidding-phase">
          <h2>Declare Partners and Result</h2>
          <div className="input-group">
            <label htmlFor="partner-select">Select Partner(s) of the bidder:</label>
            <select
              id="partner-select"
              multiple
              value={selectedPartners}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setSelectedPartners(options);
              }}
              style={{ minHeight: '2.5em' }}
            >
              {gameState.players
                .filter(player => player.name !== gameState.currentBidder)
                .map(player => (
                  <option key={player.name} value={player.name}>
                    {player.name}
                  </option>
                ))}
            </select>
          </div>
          {selectedPartners.length > 0 && (
            <div style={{ margin: '0.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {selectedPartners.map(name => (
                <span key={name} style={{
                  display: 'inline-block',
                  background: '#eaf6fb',
                  color: '#263859',
                  borderRadius: '16px',
                  padding: '0.18rem 0.9rem',
                  fontSize: '0.97rem',
                  fontWeight: 500,
                  boxShadow: '0 1px 4px rgba(44,62,80,0.07)',
                  marginBottom: '1.1rem'
                }}>{name}</span>
              ))}
            </div>
          )}
          <div className="input-group" style={{ gap: '0.5rem' }}>
            <label style={{ marginRight: 8 }}>Did the bidder win?</label>
            <button
              type="button"
              onClick={() => setBidderResult('win')}
              style={{
                background: bidderResult === 'win' ? '#f3f3f3' : '#f3f3f3',
                color: bidderResult === 'win' ? '#2ecc71' : '#263859',
                border: '1.5px solid',
                borderColor: bidderResult === 'win' ? '#2ecc71' : '#e0e0e0',
                borderRadius: 6,
                padding: '0.5rem 1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
                outline:'none',
                transition: 'all 0.15s',
                marginRight: 8,
              }}
            >
              Win
            </button>
            <button
              type="button"
              onClick={() => setBidderResult('lose')}
              style={{
                background: bidderResult === 'lose' ? '#f3f3f3' : '#f3f3f3',
                color: bidderResult === 'lose' ? '#e74c3c' : '#263859',
                border: '1.5px solid',
                borderColor: bidderResult === 'lose' ? '#e74c3c' : '#e0e0e0',
                borderRadius: 6,
                padding: '0.5rem 1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
                outline: 'none',
                transition: 'all 0.15s'
              }}
            >
              Lose
            </button>
          </div>
          <button onClick={submitPartnerAndResult} className="start-button">Continue</button>
        </div>
      )}
      {gameState.currentPhase === 'points' && (
        <div className="points-phase">
          <h2> Current Round Result</h2>
          <ul className="points-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {gameState.players.map(player => (
              <li key={player.name} className="points-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', padding: '0.5rem 0.7rem', borderBottom: '1px solid #e0e0e0' }}>
                <span>{player.name}</span>
                <span>
                <span style={{ fontWeight: 600, color: '#3498db' }}>
                   {gameState.points[player.name] ?? 0}{" "}
                  
                  </span>
                  points
                   </span>
              </li>
            ))}
          </ul>
          <button onClick={submitAllPoints} className="start-button">Next Round</button>
        </div>
      )}
    </div>
  );
};

export default App; 