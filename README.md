# Black Queen Game PWA

A Progressive Web App for tracking scores in the Black Queen card game.

## Features

- Add and remove players
- Track bids and points for each round
- Calculate total scores
- Works offline
- Installable on mobile devices
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

1. Add players by entering their names and clicking "Add Player" or pressing Enter
2. Click "Start Game" when you have at least 2 players
3. For each round:
   - Select a player and enter their bid
   - Enter points for each player
   - View round results
4. Continue to next round or calculate final winner

## Technologies Used

- React
- Vite
- PWA features (Service Worker, Web App Manifest)
- Local Storage for game state persistence

## License

MIT 