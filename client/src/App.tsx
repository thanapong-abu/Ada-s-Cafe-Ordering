import React, { useState, useEffect } from 'react';
import CustomerMenu from './pages/CustomerMenu';
import WaiterScreen from './pages/WaiterScreen';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Simple route router
  if (currentPath === '/waiter' || currentPath.startsWith('/waiter/')) {
    return <WaiterScreen />;
  }

  return <CustomerMenu />;
};

export default App;
