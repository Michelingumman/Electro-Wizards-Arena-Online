# Electro Wizards Arena

play by entering:

        https://electroarenagames.web.app/
        
Electro Wizards Arena is a multiplayer card-based game built with TypeScript, React, Firebase, and TailwindCSS. Players join parties, play strategic cards, and compete in challenges. Meant to play over the table with other players.

## Features

- **Multiplayer**: Join parties and play with friends.
- **Dynamic Cards**: Unique cards with special effects.
- **Customizable Settings**: Adjust game parameters like health, mana, and more.
- **Real-Time Gameplay**: Powered by Firebase.

## Tech Stack

- **Frontend**: React, TypeScript
- **Backend**: Firebase Realtime Database
- **Styling**: TailwindCSS
- **Tooling**: Vite, ESLint, Prettier

## Installation

1. Clone the repository:

        git clone https://github.com/Michelingumman/Electro-Wizards-Arena-Online.git

2. Navigate to the project directory:

        cd Electro-Wizards-Arena-Online

3. Install dependicies:

        npm install

4. Start the development server

        npm run dev

    or

        npm run build

----

# Firebase Setup

1. Create a Firebase project in the Firebase Console.
2. Add your Firebase configuration in .env in /src:

        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        VITE_FIREBASE_APP_ID=your_app_id

3. initialize Firebase in firebase.json for emulators or hosting

----

# Scripts
- npm run dev: Start development server.
- npm run build: Build for production.
- npm run lint: Run linter.
- npm run preview: Preview production build.

----

# Folder Structure
        src/
        ├── components/    # React components
        ├── config/        # Game and Firebase configuration
        ├── hooks/         # Custom hooks
        ├── pages/         # Application pages
        ├── store/         # State management
        ├── types/         # TypeScript interfaces
        ├── utils/         # Helper utilities

