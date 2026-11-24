import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Sin StrictMode a propósito: el lienzo de Fabric se crea/destruye de forma imperativa
// y la doble ejecución de efectos en desarrollo lo inicializaría dos veces.
createRoot(document.getElementById('root') as HTMLElement).render(<App />);
