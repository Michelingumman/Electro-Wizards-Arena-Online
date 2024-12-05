interface ErrorScreenProps {
  error: string | null;
  onReturnHome: () => void;
}

export function ErrorScreen({ error, onReturnHome }: ErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
      <div className="text-center">
        <p className="text-xl text-red-400 mb-4">{error || 'Game not found'}</p>
        <button
          onClick={onReturnHome}
          className="text-purple-400 hover:text-purple-300"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}