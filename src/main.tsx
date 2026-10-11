import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CloudWorkspace from './CloudWorkspace';
import './styles.css';
import './cloud.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{window.location.pathname==='/prototype'?<App/>:<CloudWorkspace/>}</React.StrictMode>);
