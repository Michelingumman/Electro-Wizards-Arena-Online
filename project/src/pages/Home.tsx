import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new main menu
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}